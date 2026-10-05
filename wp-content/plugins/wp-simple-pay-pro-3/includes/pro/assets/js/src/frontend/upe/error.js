/* global jQuery */

/**
 * Display an error message below the Payment Form.
 *
 * @since 4.2.0
 *
 * @param {Object|string} _error Error message or object.
 */
function error( _error ) {
	const { i18n } = this;
	const { stripeErrorMessages, unknownError } = i18n;

	let errorMessage;

	// Passed empty to clear the error.
	if ( _error && '' === _error ) {
		errorMessage = '';

		// Error is not undefined.
	} else if ( undefined !== _error ) {
		const { message, code } = _error;
		errorMessage = message ? message : _error;

		// Use localized message if code exists.
		if ( code && stripeErrorMessages[ code ] ) {
			errorMessage = stripeErrorMessages[ code ];
		}

		// Unable to determine error.
	} else {
		errorMessage = unknownError;
	}

	// Show message in UI.
	const errorEl = this.querySelector( '.simpay-generic-error' );
	errorEl.style.display = 'block';
	// Use jQuery to set the HTML so it is automatically parsed.
	jQuery( errorEl ).html( errorMessage );
	wp.a11y.speak( errorMessage, 'assertive' );
}

export default error;
