/**
 * Internal dependencies
 */
const {
	paymentForms: { getPaymentMethod },
} = window.wpsp;

/**
 * Submits a Stripe Elements payment form.
 *
 * @since 4.2.0
 *
 * @param {PaymentForm} paymentForm
 */
function submit( paymentForm ) {
	const { state, error: onError, disable: disableForm } = paymentForm;
	const {
		paymentMethod: { id },
	} = state;

	onError( '' );
	disableForm();

	try {
		getPaymentMethod( id ).submit( paymentForm );
	} catch ( error ) {
		onError( error );
	}
}

export default submit;
