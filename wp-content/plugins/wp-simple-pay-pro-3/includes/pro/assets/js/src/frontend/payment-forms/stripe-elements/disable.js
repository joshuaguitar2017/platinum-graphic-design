/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Disable the Payment Form.
 *
 * @since 4.2.0
 *
 * @param {PaymentForm} paymentForm
 */
function disable( paymentForm ) {
	const { __unstableLegacyFormData } = paymentForm;
	const { checkoutButtonLoadingText } = __unstableLegacyFormData;

	// Add a loading class indicator.
	paymentForm.addClass( 'simpay-checkout-form--loading' );

	// Disable the form submit button.
	paymentForm
		.find( '.simpay-checkout-btn' )
		.prop( 'disabled', true )
		.addClass( 'simpay-disabled' )
		.find( 'span' )
		.html( checkoutButtonLoadingText );

	// Set fields to readonly, so they are still sent to the server.
	paymentForm.find( 'input, select, textarea' ).prop( 'readonly', true );
}

export default disable;
