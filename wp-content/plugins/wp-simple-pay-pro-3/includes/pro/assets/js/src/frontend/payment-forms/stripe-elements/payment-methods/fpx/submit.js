/* global _ */

/**
 * Internal dependencies.
 */
import { default as submitBankRedirect } from './../utils/one-time-redirect-submit.js';

/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Submit the FPX Payment Method.
 *
 * @param {PaymentForm} paymentForm Payment Form.
 */
function submit( paymentForm ) {
	// Bail if no Bank has been chosen.
	const {
		state,
		stripeInstance: { elements },
	} = paymentForm;
	const { paymentMethods } = state;

	if ( false === elements.fpx._complete ) {
		const paymentMethodConfig = _.find( paymentMethods, ( { id } ) => {
			return 'fpx' === id;
		} );

		throw {
			message: paymentMethodConfig.i18n.empty,
		};
	}

	// ... or submit.
	submitBankRedirect( paymentForm, 'fpx', 'confirmFpxPayment', {
		payment_method: {
			fpx: elements.fpx,
		},
	} );
}

export default submit;
