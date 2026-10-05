/* global _ */

/**
 * Internal dependencies.
 */
import { default as submitBankRedirect } from './../utils/one-time-redirect-submit.js';

/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Submit the iDEAL Payment Method.
 *
 * @param {PaymentForm} paymentForm
 */
function submit( paymentForm ) {
	const {
		getOwnerData,
		state,
		stripeInstance: { elements },
	} = paymentForm;
	const { paymentMethods } = state;

	// Bail if no Bank has been chosen.
	if ( false === elements.p24._complete ) {
		const paymentMethodConfig = _.find( paymentMethods, ( { id } ) => {
			return 'p24' === id;
		} );

		throw {
			message: paymentMethodConfig.i18n.empty,
		};
	}

	// ... or submit.
	const { address, email, name, phone } = getOwnerData( paymentForm );

	submitBankRedirect( paymentForm, 'p24', 'confirmP24Payment', {
		payment_method: {
			p24: elements.p24,
			billing_details: {
				address,
				email,
				name,
				phone,
			},
		},
		payment_method_options: {
			p24: {
				tos_shown_and_accepted: true,
			},
		},
	} );
}

export default submit;
