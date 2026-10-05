/**
 * Internal dependencies.
 */
import { default as submitBankRedirect } from './../utils/one-time-redirect-submit.js';

/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Submit the Alipay Payment Method.
 *
 * @param {PaymentForm} paymentForm Payment Form.
 */
function submit( paymentForm ) {
	submitBankRedirect( paymentForm, 'alipay', 'confirmAlipayPayment' );
}

export default submit;
