/**
 * Helper function to manage all "Bank Redirect" payment methods.
 */

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
import { customers, orders, paymentintents } from '@wpsimplepay/api';

/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Submit the Bancontact Payment Method.
 *
 * @param {PaymentForm} paymentForm Payment Form.
 * @param {string} paymentMethodType Payment Method ID.
 * @param {string} confirmFunction Confirm function name. https://stripe.com/docs/js/payment_intents/payment_method
 * @param {Object} confirmOptions Additional options passed to the confirm function.
 */
async function submit(
	paymentForm,
	paymentMethodType,
	confirmFunction,
	confirmOptions = {}
) {
	const {
		cart,
		error: onError,
		getFormData,
		getOwnerData,
		setState,
		state,
		stripeInstance: stripe,
		__unstableLegacyFormData,
	} = paymentForm;

	// Retrieve Customer and Order from state.
	const { customer, order } = state;

	// Create a Customer.
	const customerData = await customers
		.create(
			{
				object_id: customer ? customer.id : null,
			},
			paymentForm
		)
		.catch( onError );

	// Bail if there was an error.
	if ( ! customerData ) {
		return;
	}

	// Set the customer state.
	setState( {
		customer: customerData.customer,
	} );

	if ( '' !== customerData.nonce ) {
		setState( {
			customerNonce: customerData.nonce,
		} );
	}

	const { customerNonce } = paymentForm.state;

	// Create a PaymentIntent via an Order or a directly, depending on tax status.
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
					payment_method_type: paymentMethodType,
					customer_id: customerData.customer.id,
					customer_nonce: customerNonce,
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

		// Bail if there was an error.
		if ( ! orderData ) {
			return;
		}

		const {
			payment: { payment_intent: paymentIntent },
		} = orderData;

		// Set PaymentIntent from the Order's payment.
		pi = paymentIntent;
	} else {
		// Create a PaymentIntent directly.
		pi = await paymentintents
			.create(
				{
					customer_id: customerData.customer.id,
					customer_nonce: customerNonce,
					payment_method_type: paymentMethodType,
				},
				paymentForm
			)
			.catch( onError );
	}

	// Bail if PaymentIntent was not created/could not be retrieved.
	if ( ! pi ) {
		return;
	}

	// Build return URL.
	const {
		stripeParams: { success_url: successUrlBase },
	} = __unstableLegacyFormData;

	const returnUrl = addQueryArgs( successUrlBase, {
		customer_id: customerData.customer.id,
	} );

	// Confirm the PaymentIntent with the Payment Method's confirmation function.
	const { error } = await stripe[ confirmFunction ]( pi.client_secret, {
		return_url: returnUrl,
		...confirmOptions,
	} );

	if ( error ) {
		// Remove email verification that has been previously added.
		paymentForm
			.find( '.simpay-email-verification-code-container' )
			.remove();

		return onError( error );
	}

	// Hide the email verification form, if needed.
	const emailVerificationForm = paymentForm[ 0 ].querySelector(
		'.simpay-email-verification-code-container'
	);

	if ( emailVerificationForm ) {
		emailVerificationForm.style.display = 'none';
	}
}

export default submit;
