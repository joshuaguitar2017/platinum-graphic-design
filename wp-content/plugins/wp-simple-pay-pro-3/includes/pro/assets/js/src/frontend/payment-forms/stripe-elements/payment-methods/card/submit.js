/**
 * External dependencies.
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
	subscriptions,
	orders,
	paymentintents,
} from '@wpsimplepay/api';

/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Creates a Subscription.
 *
 * @param {Object} customerResponse Customer REST API response.
 * @param {Object} paymentMethod Payment Method object.
 * @param {PaymentForm} paymentForm
 */
export async function createSubscription(
	customerResponse,
	paymentMethod,
	paymentForm
) {
	const {
		error: onError,
		stripeInstance: stripe,
		__unstableLegacyFormData,
	} = paymentForm;
	const {
		stripeParams: { success_url: successUrlBase },
	} = __unstableLegacyFormData;
	const { nonce, customer } = customerResponse;

	// Create a Subscription.
	const subscription = await subscriptions
		.create(
			{
				customer_id: customer.id,
				customer_nonce: nonce,
				payment_method_type: 'card',
			},
			paymentForm
		)
		.catch( onError );

	if ( ! subscription ) {
		return;
	}

	const {
		latest_invoice: { payment_intent: paymentIntent },
		pending_setup_intent: setupIntent,
	} = subscription;

	// Determine next steps based on the Intent.
	const { client_secret: clientSecret } = setupIntent || paymentIntent;

	// Confirm Card payment or setup.
	const confirmFunc = setupIntent ? 'confirmCardSetup' : 'confirmCardPayment';

	const { error } = await stripe[ confirmFunc ]( clientSecret, {
		payment_method: paymentMethod,
	} );

	if ( error ) {
		// Remove email verification that has been previously added.
		paymentForm
			.find( '.simpay-email-verification-code-container' )
			.remove();

		return onError( error );
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
 * @param {Object} paymentMethod Payment Method object.
 * @param {PaymentForm} paymentForm Payment Form.
 */
export async function createPayment(
	customerResponse,
	paymentMethod,
	paymentForm
) {
	const {
		cart,
		error: onError,
		getFormData,
		getOwnerData,
		state,
		stripeInstance: stripe,
		__unstableLegacyFormData,
	} = paymentForm;
	const {
		stripeParams: { success_url: successUrlBase },
	} = __unstableLegacyFormData;
	const { order } = state;
	const { nonce, customer } = customerResponse;
	let pi;

	// Create a PaymentIntent via an Order, or directly, depending on tax status.
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
					payment_method_type: 'card',
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
					payment_method_type: 'card',
				},
				paymentForm
			)
			.catch( onError );
	}

	// Bail if PaymentIntent was not created.
	if ( ! pi ) {
		return;
	}

	// Confirm Card payment.
	const { error } = await stripe.confirmCardPayment( pi.client_secret, {
		payment_method: paymentMethod,
	} );

	if ( error ) {
		// Remove email verification that has been previously added.
		paymentForm
			.find( '.simpay-email-verification-code-container' )
			.remove();

		return onError( error );
	}

	// Redirect if nothing else needs to be done, and there is no error.
	const successUrl = addQueryArgs( successUrlBase, {
		customer_id: customerResponse.customer.id,
	} );

	window.location.href = successUrl;
}

/**
 * Submit the Card Payment Method.
 *
 * @param {PaymentForm} paymentForm
 */
async function submit( paymentForm ) {
	const {
		error: onError,
		getOwnerData,
		state,
		setState,
		stripeInstance: { elements },
	} = paymentForm;
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

	// Retrieve the Card Payment Method.
	const { address, email, name, phone } = getOwnerData( paymentForm );
	const { customerNonce } = paymentForm.state;

	const paymentMethod = {
		card: elements.card,
		billing_details: {
			address,
			email,
			name,
			phone,
		},
	};

	// Create a Subscription.
	if ( isSubscription || isRecurring ) {
		await createSubscription(
			{
				customer: customerResponse.customer,
				nonce: customerNonce,
			},
			paymentMethod,
			paymentForm
		);

		// Create a PaymentIntent.
	} else {
		await createPayment(
			{
				customer: customerResponse.customer,
				nonce: customerNonce,
			},
			paymentMethod,
			paymentForm
		);
	}
}

export default submit;
