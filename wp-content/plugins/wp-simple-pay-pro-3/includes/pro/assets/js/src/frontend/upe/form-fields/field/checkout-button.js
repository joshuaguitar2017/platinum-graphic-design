/**
 * Internal dependencies
 */
import { addAction } from '@wpsimplepay/hooks';

/**
 * Enables the Checkout button.
 *
 * @since 4.7.0
 *
 * @param {Object} paymentForm Payment form.
 */
export function enableCheckoutButton( paymentForm ) {
	const { cart, convertToDollars, formatCurrency, i18n } = paymentForm;
	const { checkoutButtonText, checkoutButtonTrialText } = i18n;

	// Do nothing if the button doesn't exist.
	const submitButtonEl = paymentForm.querySelector( '.simpay-checkout-btn' );

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
		buttonText = checkoutButtonTrialText;

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

		buttonText = checkoutButtonText.replace( '{{amount}}', amount );
	}

	submitButtonEl.querySelector( 'span' ).innerHTML = buttonText;
}

/**
 * Disables the Checkout button.
 *
 * @since 4.7.0
 *
 * @param {Object} paymentForm Payment form.
 */
export function disableCheckoutButton( paymentForm ) {
	const { i18n } = paymentForm;
	const { checkoutButtonLoadingText } = i18n;

	// Enable the form submit button.
	const submitButtonEl = paymentForm.querySelector( '.simpay-checkout-btn' );

	// Do nothing if the button doesn't exist.
	if ( ! submitButtonEl ) {
		return;
	}

	// Disable the button.
	submitButtonEl.disabled = true;
	submitButtonEl.classList.add( 'simpay-disabled' );

	// Set the loading text.
	submitButtonEl.querySelector(
		'span'
	).innerText = checkoutButtonLoadingText;
}

/**
 * Sets up the "Checkout Button" custom field.
 *
 * @since 4.7.0
 *
 * @param {jQuery} $paymentForm Payment form
 * @param {Object} $paymentForm.paymentForm Payment form.
 */
function setupCheckoutButton( $paymentForm ) {
	addAction(
		'simpayEnablePaymentForm',
		'wpsp/paymentForm',
		enableCheckoutButton
	);

	addAction(
		'simpayDisablePaymentForm',
		'wpsp/paymentForm',
		disableCheckoutButton
	);
}

export default setupCheckoutButton;
