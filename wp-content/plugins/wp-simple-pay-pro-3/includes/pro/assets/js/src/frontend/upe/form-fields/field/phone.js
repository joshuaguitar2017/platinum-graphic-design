/**
 * Displays an inline error under the phone field.
 *
 * @since 4.7.4
 *
 * @param {Object} paymentForm Payment form.
 * @param {string} _errorMessage Error message override.
 */
export function showError( paymentForm, _errorMessage ) {
	const errorEl = paymentForm.querySelector( '.simpay-phone-error' );

	if ( ! errorEl ) {
		return;
	}

	const { i18n } = paymentForm;
	const errorMessage = i18n.invalidPhoneError;

	errorEl.innerText = _errorMessage || errorMessage;
	errorEl.style.display = 'block';
	wp.a11y.speak( errorMessage, 'assertive' );
}

/**
 * Hides an inline error under the payment method.
 *
 * @since 4.7.4
 *
 * @param {Object} paymentForm Payment form.
 */
export function hideError( paymentForm ) {
	const errorEl = paymentForm.querySelector( '.simpay-phone-error' );

	if ( ! errorEl ) {
		return;
	}

	errorEl.innerText = '';
	errorEl.style.display = 'none';
}

/**
 * Determines if the payment form has valid payment method data to attempt to
 * confirm a payment.
 *
 * @since 4.7.4
 *
 * @param {Object} paymentForm Payment form.
 */
export function isValid( paymentForm ) {
	const { state } = paymentForm;
	const { intlTelInput } = state;

	// Not a "smart" field, let the browser handle it.
	if ( ! intlTelInput ) {
		return true;
	}

	const phoneInputEl = paymentForm.querySelector( '.simpay-telephone' );

	// If the field is not required, and empty, it's valid.
	if ( ! phoneInputEl.required && ! phoneInputEl.value ) {
		return true;
	}

	return intlTelInput.isValidNumber();
}

/**
 * Sets up the "Phone" custom field.
 *
 * @since 4.7.0
 *
 * @param {jQuery} $paymentForm Payment form
 * @param {Object} $paymentForm.paymentForm Payment form.
 */
function setupPhone( { paymentForm } ) {
	const { setState } = paymentForm;
	const phoneInputEl = paymentForm.querySelector( '.simpay-telephone' );

	if ( ! phoneInputEl ) {
		return;
	}

	// Keep internal state up to date.
	phoneInputEl.addEventListener( 'blur', ( { target } ) => {
		setState( {
			phone: target.value,
		} );

		if ( ! target.value || isValid( paymentForm ) ) {
			hideError( paymentForm );
		}
	} );

	// Initialize intlTelInput if being used.
	if ( window.simpayIntlTelInput ) {
		const intlTelInput = window.intlTelInput( phoneInputEl, {
			...window.simpayIntlTelInput,
			hiddenInput: 'simpay_telephone',
		} );

		setState( {
			intlTelInput,
		} );
	}

	// Trigger an initial update to set the internal state.
	phoneInputEl.dispatchEvent( new Event( 'blur' ) );
}

export default setupPhone;
