/**
 * Internal dependencies
 */
import { doAction } from '@wpsimplepay/hooks';

/**
 * Disables the payment form.
 *
 * @since 4.2.0
 */
function disable() {
	// Add a loading class indicator.
	this.classList.add( 'simpay-checkout-form--loading' );

	// Set fields to readonly, so they are still sent to the server.
	const inputs = this.querySelectorAll( 'input, select, textarea' );
	inputs.forEach( ( input ) => ( input.readOnly = true ) );

	/**
	 * Allows further actions when a payment form is disabled.
	 *
	 * @since 4.7.0
	 *
	 * @param {Object} paymentForm Payment form.
	 */
	doAction( 'simpayDisablePaymentForm', this );
}

export default disable;
