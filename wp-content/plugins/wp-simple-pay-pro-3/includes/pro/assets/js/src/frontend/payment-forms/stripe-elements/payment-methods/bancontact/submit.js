/**
 * Internal dependencies.
 */
import { default as submitBankRedirect } from './../utils/one-time-redirect-submit.js';

/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Submit the Bancontact Payment Method.
 *
 * @param {PaymentForm} paymentForm Payment Form.
 */
function submit( paymentForm ) {
	const { getOwnerData } = paymentForm;
	const { address, email, name, phone } = getOwnerData( paymentForm );

	submitBankRedirect( paymentForm, 'bancontact', 'confirmBancontactPayment', {
		payment_method: {
			billing_details: {
				address,
				email,
				name,
				phone,
			},
		},
	} );
}

export default submit;
