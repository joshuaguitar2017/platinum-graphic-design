/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

const { convertToDollars, formatCurrency } = window.spShared;

/**
 * Enable the Payment Form.
 *
 * @since 4.2.0
 *
 * @param {PaymentForm} paymentForm
 */
function enable( paymentForm ) {
	const { cart, __unstableLegacyFormData, state } = paymentForm;
	const { paymentMethod } = state;
	const {
		checkoutButtonText,
		checkoutButtonTrialText,
		checkoutButtonBnplText,
	} = __unstableLegacyFormData;

	// Remove a loading class indicator.
	paymentForm.removeClass( 'simpay-checkout-form--loading' );

	// Reenable fields.
	paymentForm.find( 'input, select, textarea' ).prop( 'readonly', false );

	// Enable the form submit button.
	let submitButtonEl;

	if ( 'embedded' === state.displayType ) {
		submitButtonEl = paymentForm.find( '.simpay-checkout-btn' );
	} else {
		submitButtonEl = paymentForm.find(
			'.simpay-payment-btn, .simpay-checkout-btn'
		);
	}

	submitButtonEl.prop( 'disabled', false ).removeClass( 'simpay-disabled' );

	if ( 0 === cart.getTotalDueToday() ) {
		submitButtonEl.find( 'span' ).text( checkoutButtonTrialText );
	} else if ( paymentMethod.bnpl ) {
		submitButtonEl.find( 'span' ).text( checkoutButtonBnplText );
	} else {
		const formatted = formatCurrency(
			cart.isZeroDecimal()
				? cart.getTotalDueToday()
				: convertToDollars( cart.getTotalDueToday() ),
			true,
			cart.getCurrencySymbol(),
			cart.isZeroDecimal()
		);

		const amount = `<em class="simpay-total-amount-value">${ formatted }</span>`;

		submitButtonEl
			.find( 'span' )
			.html( checkoutButtonText.replace( '{{amount}}', amount ) );
	}
}

export default enable;
