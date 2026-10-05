/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Submit the ACH Debit Payment Method.
 *
 * @param {PaymentForm} paymentForm
 */
async function submit( paymentForm ) {
	const achDebitEl = paymentForm[ 0 ].querySelector(
		'.simpay-ach-debit-wrap'
	);

	if ( ! achDebitEl ) {
		return;
	}

	const {
		stripeInstance: stripe,
		state,
		error: onError,
		__unstableLegacyFormData,
	} = paymentForm;
	const { clientSecret, customerId, setupIntent: pendingSetupIntent } = state;

	// Determine the collection method based on the SetupIntent or PaymentIntent.
	const confirmFunc = pendingSetupIntent
		? 'confirmUsBankAccountSetup'
		: 'confirmUsBankAccountPayment';

	const { paymentIntent, setupIntent, error } = await stripe[ confirmFunc ](
		clientSecret
	);

	if ( error ) {
		// Remove email verification that has been previously added.
		paymentForm
			.find( '.simpay-email-verification-code-container' )
			.remove();

		return onError( error );
	}

	const {
		stripeParams: { success_url: successUrlBase },
	} = __unstableLegacyFormData;

	const successUrl = addQueryArgs( successUrlBase, {
		customer_id: customerId,
	} );

	// Success.
	if (
		setupIntent?.status === 'succeeded' ||
		paymentIntent?.status === 'processing'
	) {
		window.location.href = successUrl;

		// Still requires payment method, show a generic error.
	} else if ( paymentIntent?.status === 'requires_payment_method' ) {
		onError();

		// Verifying with micro deposits, which is not supported.
	} else if (
		paymentIntent.next_action?.type === 'verify_with_microdeposits'
	) {
		onError();
	}
}

export default submit;
