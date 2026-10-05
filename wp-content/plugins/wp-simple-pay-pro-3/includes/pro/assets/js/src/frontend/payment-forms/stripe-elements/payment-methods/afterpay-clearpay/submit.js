/**
 * Internal dependencies.
 */
import { default as submitBuyNowPayLater } from './../utils/one-time-redirect-submit.js';

/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Submit the Afterpay / Clearpay Payment Method.
 *
 * @param {PaymentForm} paymentForm Payment Form.
 */
function submit( paymentForm ) {
	const { cart, getOwnerData } = paymentForm;
	const {
		name,
		email,
		phone,
		address: billingAddress,
		shippingAddress,
	} = getOwnerData( paymentForm );

	const paymentMethodOptions = {
		payment_method: {
			billing_details: {
				name,
				email,
				phone,
				address: billingAddress,
			},
		},
	};

	if ( 'automatic' !== cart.taxStatus ) {
		paymentMethodOptions.shipping = {
			name,
			phone,
			address: shippingAddress,
		};
	}

	submitBuyNowPayLater(
		paymentForm,
		'afterpay_clearpay',
		'confirmAfterpayClearpayPayment',
		paymentMethodOptions
	);
}

export default submit;
