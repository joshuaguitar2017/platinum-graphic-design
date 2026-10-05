/**
 * Internal dependencies.
 */
import { default as submitBuyNowPayLater } from './../utils/one-time-redirect-submit.js';

/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Submit the Klarna Payment Method.
 *
 * @param {PaymentForm} paymentForm Payment Form.
 */
function submit( paymentForm ) {
	const { getOwnerData } = paymentForm;
	const { name, email, phone, address: billingAddress } = getOwnerData(
		paymentForm
	);

	submitBuyNowPayLater( paymentForm, 'klarna', 'confirmKlarnaPayment', {
		payment_method: {
			billing_details: {
				name,
				email,
				phone,
				address: billingAddress,
			},
		},
	} );
}

export default submit;
