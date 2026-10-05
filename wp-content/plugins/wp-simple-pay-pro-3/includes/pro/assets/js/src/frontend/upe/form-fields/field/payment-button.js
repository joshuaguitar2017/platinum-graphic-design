/**
 * Internal dependencies
 */
import { addAction } from '@wpsimplepay/hooks';

/**
 * Enables the Payment button.
 *
 * @since 4.7.0
 *
 * @param {Object} paymentForm Payment form.
 */
export function enablePaymentButton( paymentForm ) {
	const { cart, convertToDollars, formatCurrency, i18n } = paymentForm;
	const { paymentButtonText, paymentButtonTrialText } = i18n;
	const submitButtonEl = paymentForm.querySelector( '.simpay-payment-btn' );

	// Do nothing if the button doesn't exist.
	if ( ! submitButtonEl ) {
		return;
	}

	// Enable the button.
	submitButtonEl.disabled = false;
	submitButtonEl.classList.remove( 'simpay-disabled' );

	// Set the button text.
	let buttonText;

	// If no payment is due today, show the "Start Trial" text.
	if ( cart.hasFreeTrial() ) {
		buttonText = paymentButtonTrialText;

		// Otherwise show the "Checkout" text, and replace the {{amount}} tag, if needed.
	} else {
		const formatted = formatCurrency(
			cart.isZeroDecimal()
				? cart.getTotalDueToday()
				: convertToDollars( cart.getTotalDueToday() ),
			true,
			cart.getCurrencySymbol(),
			cart.isZeroDecimal()
		);

		const amount = `<em class="simpay-total-amount-value">${ formatted }</em>`;

		buttonText = paymentButtonText.replace( '{{amount}}', amount );
	}

	submitButtonEl.querySelector( 'span' ).innerHTML = buttonText;
}

/**
 * Disables the Payment button.
 *
 * @since 4.7.0
 *
 * @param {Object} paymentForm Payment form.
 */
function disablePaymentButton( paymentForm ) {
	const { i18n } = paymentForm;
	const { paymentButtonLoadingText } = i18n;
	const submitButtonEl = paymentForm.querySelector( '.simpay-payment-btn' );

	// Do nothing if the button doesn't exist.
	if ( ! submitButtonEl ) {
		return;
	}

	// Disable the button.
	submitButtonEl.disabled = true;
	submitButtonEl.classList.add( 'simpay-disabled' );

	// Set the loading text.
	submitButtonEl.querySelector( 'span' ).innerText = paymentButtonLoadingText;
}

/**
 * Sets up the "Checkout Button" custom field.
 *
 * @since 4.7.0
 *
 * @param {jQuery} $paymentForm Payment form
 * @param {Object} $paymentForm.paymentForm Payment form.
 */
function setupPaymentButton( $paymentForm ) {
	addAction(
		'simpayEnablePaymentForm',
		'wpsp/paymentForm',
		enablePaymentButton
	);

	addAction(
		'simpayDisablePaymentForm',
		'wpsp/paymentForm',
		disablePaymentButton
	);
}

export default setupPaymentButton;
