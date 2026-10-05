/**
 * Internal dependencies
 */
import { doAction } from '@wpsimplepay/hooks';

/**
 * Enable the Payment Form.
 *
 * @since 4.2.0
 */
function enable() {
	// Remove a loading class indicator.
	this.classList.remove( 'simpay-checkout-form--loading' );

	// Reenable fields.
	const inputs = this.querySelectorAll( 'input, select, textarea' );
	inputs.forEach( ( input ) => ( input.readOnly = false ) );

	/**
	 * Allows further actions when a payment form is enabled.
	 *
	 * @since 4.7.0
	 *
	 * @param {Object} paymentForm Payment form.
	 */
	doAction( 'simpayEnablePaymentForm', this );
}

export default enable;
