/**
 * Binds the "Tax ID" input events to update amounts when the field changes.
 *
 * @since 4.7.0
 *
 * @param {jQuery} $paymentForm
 */
function bindEvents( $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const typeEl = paymentForm.querySelector( '.simpay-tax-id-type' );
	const numberEl = paymentForm.querySelector( '.simpay-tax-id' );

	typeEl.addEventListener( 'change', () => {
		numberEl.value = '';
		$paymentForm.trigger( 'totalChanged', [ $paymentForm ] );
	} );

	numberEl.addEventListener( 'blur', () => {
		$paymentForm.trigger( 'totalChanged', [ $paymentForm ] );
	} );
}

/**
 * Sets up the "Tax ID" custom field.
 *
 * @since 4.7.0
 *
 * @param {jQuery} $paymentForm Payment form
 * @param {Object} $paymentForm.paymentForm Payment form.
 */
function setupTaxId( $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const taxIdEl = paymentForm.querySelector( '.simpay-tax-id-container' );

	if ( ! taxIdEl ) {
		return;
	}

	bindEvents( $paymentForm );
}

export default setupTaxId;
