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
	if ( false === elements.ideal._complete ) {
		const paymentMethodConfig = _.find( paymentMethods, ( { id } ) => {
			return 'ideal' === id;
		} );

		const { i18n } = paymentMethodConfig;

		throw {
			message: i18n.empty,
		};
	}

	// ... or submit.
	const { address, email, name, phone } = getOwnerData( paymentForm );

	submitBankRedirect( paymentForm, 'ideal', 'confirmIdealPayment', {
		payment_method: {
			ideal: elements.ideal,
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
