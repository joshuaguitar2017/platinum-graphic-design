/**
 * External dependencies
 */
import serialize from 'form-serialize';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies.
 */
import {
	customers,
	paymentintents,
	orders,
	setupintents,
	subscriptions,
} from '@wpsimplepay/api';

/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Creates a Subscription
 *
 * @param {Object} customerResponse Customer.
 * @param {PaymentForm} paymentForm
 */
export async function createSubscription( customerResponse, paymentForm ) {
	const {
		error: onError,
		getOwnerData,
		stripeInstance: stripe,
		stripeInstance: { elements },
		__unstableLegacyFormData,
	} = paymentForm;
	const {
		stripeParams: { success_url: successUrlBase },
	} = __unstableLegacyFormData;
	const { customer, nonce } = customerResponse;

	// Create a SetupIntent for the Payment Method.
	const setupIntent = await setupintents
		.create(
			{
				customer_id: customer.id,
				customer_nonce: nonce,
				payment_method_types: [ 'sepa_debit' ],
			},
			paymentForm
		)
		.catch( onError );

	// Bail if there was an error.
	if ( ! setupIntent ) {
		return;
	}

	// Confirm the Payment Method's information against the SetupIntent.
	const { client_secret: clientSecret } = setupIntent;
	const { address, email, name, phone } = getOwnerData( paymentForm );

	const { error, setupIntent: confirmedSepaDebitSetupIntent } =
		await stripe.confirmSepaDebitSetup( clientSecret, {
			payment_method: {
				sepa_debit: elements.sepaDebit,
				billing_details: {
					address,
					email,
					name,
					phone,
				},
			},
		} );

	if ( error ) {
		// Remove email verification that has been previously added.
		paymentForm
			.find( '.simpay-email-verification-code-container' )
			.remove();

		return onError( error );
	}

	const { payment_method: paymentMethodId } = confirmedSepaDebitSetupIntent;

	// Create a Subscription using the confirmed Payment Method as the default.
	const subscription = await subscriptions
		.create(
			{
				customer_id: customer.id,
				customer_nonce: nonce,
				payment_method_id: paymentMethodId,
				payment_method_type: 'sepa_debit',
			},
			paymentForm
		)
		.catch( onError );

	// Bail if there was an error.
	if ( ! subscription ) {
		return;
	}

	// Redirect if nothing else needs to be done, and there is no error.
	const successUrl = addQueryArgs( successUrlBase, {
		customer_id: customerResponse.customer.id,
	} );

	window.location.href = successUrl;
}

/**
 * Creates a Payment.
 *
 * @param {Object} customerResponse Customer REST API response.
 * @param {PaymentForm} paymentForm
 */
export async function createPayment( customerResponse, paymentForm ) {
	const {
		cart,
		error: onError,
		getFormData,
		getOwnerData,
		state,
		stripeInstance: stripe,
		stripeInstance: { elements },
		__unstableLegacyFormData,
	} = paymentForm;
	const {
		stripeParams: { success_url: successUrlBase },
	} = __unstableLegacyFormData;
	const { order } = state;
	const { customer, nonce } = customerResponse;
	let pi;

	if ( 'automatic' === cart.taxStatus && order ) {
		const { address, email, name, shippingAddress } =
			getOwnerData( paymentForm );
		const shippingToggleFieldEl = paymentForm[ 0 ].querySelector(
			'.simpay-same-address-toggle'
		);
		const addressType =
			shippingToggleFieldEl && ! shippingToggleFieldEl.checked
				? 'shipping'
				: 'billing';
		const { isSubscription, isRecurring } = state;

		const orderData = await orders
			.submit(
				{
					form_id: paymentForm.id,
					order_id: order.id,
					payment_method_type: 'sepa_debit',
					customer_id: customer.id,
					customer_nonce: nonce,
					billing_details: {
						name,
						email,
						address,
					},
					shipping_details: {
						name,
						address: shippingAddress,
					},
					automatic_tax: {
						address_type: addressType,
						current_address_country: order
							? order[ `${ addressType }_details` ]?.address
									.country
							: '',
						next_address_country:
							'shipping' === addressType
								? shippingAddress.country
								: address.country,
						is_shipping_address_same_as_billing:
							shippingToggleFieldEl &&
							shippingToggleFieldEl.checked === true,
					},
					// Helper to determine if the order is a subscription. This saves us from
					// needing to loop through line items in the REST API. This might change.
					__unstable_is_recurring: isSubscription || isRecurring,
					form_values: serialize( paymentForm[ 0 ], { hash: true } ),
					form_data: getFormData(),
				},
				paymentForm
			)
			.catch( onError );

		if ( ! orderData ) {
			return;
		}

		const {
			payment: { payment_intent: paymentIntent },
		} = orderData;

		pi = paymentIntent;
	} else {
		pi = await paymentintents
			.create(
				{
					customer_id: customer.id,
					customer_nonce: nonce,
					payment_method_type: 'sepa_debit',
				},
				paymentForm
			)
			.catch( onError );
	}

	// Bail if PaymentIntent was not created.
	if ( ! pi ) {
		return;
	}

	// Confirm SEPA Direct Debit payment.
	const { address, email, name, phone } = getOwnerData( paymentForm );

	const { error } = await stripe.confirmSepaDebitPayment( pi.client_secret, {
		payment_method: {
			sepa_debit: elements.sepaDebit,
			billing_details: {
				address,
				email,
				name,
				phone,
			},
		},
		setup_future_usage: 'off_session',
	} );

	if ( error ) {
		return onError( error );
	}

	// Redirect if nothing else needs to be done, and there is no error.
	const successUrl = addQueryArgs( successUrlBase, {
		customer_id: customerResponse.customer.id,
	} );

	window.location.href = successUrl;
}

/**
 * Submit the SEPA Direct Debit Payment Method.
 *
 * @param {PaymentForm} paymentForm
 */
async function submit( paymentForm ) {
	const { error: onError, state, setState } = paymentForm;
	const { customer, isSubscription, isRecurring } = state;

	// Create or update a Customer.
	const customerResponse = await customers
		.create(
			{
				object_id: customer ? customer.id : null,
			},
			paymentForm
		)
		.catch( onError );

	// Bail if there was an error.
	if ( ! customerResponse ) {
		return;
	}

	setState( {
		customer: customerResponse.customer,
	} );

	if ( '' !== customerResponse.nonce ) {
		setState( {
			customerNonce: customerResponse.nonce,
		} );
	}

	// Hide the email verification form, if needed.
	const emailVerificationForm = paymentForm[ 0 ].querySelector(
		'.simpay-email-verification-code-container'
	);

	if ( emailVerificationForm ) {
		emailVerificationForm.style.display = 'none';
	}

	const { customerNonce } = paymentForm.state;

	// Create a Subscription.
	if ( isSubscription || isRecurring ) {
		await createSubscription(
			{
				customer: customerResponse.customer,
				nonce: customerNonce,
			},
			paymentForm
		);

		// Create a PaymentIntent.
	} else {
		await createPayment(
			{
				customer: customerResponse.customer,
				nonce: customerNonce,
			},
			paymentForm
		);
	}
}

export default submit;
