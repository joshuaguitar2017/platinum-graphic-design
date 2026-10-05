/**
 * Displays an inline error under the email (Link Authentication Element).
 *
 * @since 4.7.0
 *
 * @param {Object} paymentForm Payment form.
 * @param {string} _errorMessage Error message override.
 */
export function showError( paymentForm, _errorMessage ) {
	const errorEl = paymentForm.querySelector( '.simpay-email-error' );

	if ( ! errorEl ) {
		return;
	}

	const { i18n } = paymentForm;
	const errorMessage = i18n.emptyEmailError;

	errorEl.innerText = _errorMessage || errorMessage;
	errorEl.style.display = 'block';
	wp.a11y.speak( errorMessage, 'assertive' );
}

/**
 * Hides an inline error under the payment method.
 *
 * @since 4.7.0
 *
 * @param {Object} paymentForm Payment form.
 */
export function hideError( paymentForm ) {
	const errorEl = paymentForm.querySelector( '.simpay-email-error' );

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
 * @since 4.7.0
 *
 * @param {Object} paymentForm Payment form.
 */
export function isValid( paymentForm ) {
	const { state } = paymentForm;
	const { linkAuthenticationElement } = state;

	if ( ! linkAuthenticationElement ) {
		return true;
	}

	if ( ! linkAuthenticationElement.complete ) {
		linkAuthenticationElement.focus();

		return false;
	}

	return true;
}

/**
 * Binds input handling of the "Link Authentiation Element" when it's enabled
 * on the "Email" custom field.
 *
 * @since 4.7.4
 *
 * @param {Object} paymentForm Payment form.
 */
function setupLinkAuthentication( paymentForm ) {
	const { setState, state, stripeElements } = paymentForm;
	const { paymentElement } = state;

	const linkAuthenticationEl = paymentForm.querySelector(
		'.simpay-link-authentication-container'
	);

	const linkAuthenticationElement = stripeElements.create(
		'linkAuthentication',
		{
			defaultValues: {
				email: linkAuthenticationEl.dataset.default ?? null,
			},
		}
	);

	setState( {
		linkAuthenticationElement,
	} );

	const hiddenEmailEl = paymentForm.querySelector( '.simpay-email' );

	linkAuthenticationElement.on( 'change', ( { complete, value } ) => {
		hiddenEmailEl.value = value.email;

		setState( {
			email: value.email,
			linkAuthenticationElement: {
				...linkAuthenticationElement,
				complete,
			},
		} );

		if ( complete ) {
			paymentElement.update( {
				defaultValues: {
					billingDetails: {
						email: value.email,
					},
				},
			} );
		}
	} );

	linkAuthenticationElement.mount( linkAuthenticationEl );
}

/**
 * Binds input handling of the "Email" standard field (no Link).
 *
 * @since 4.7.4
 *
 * @param {Object} paymentForm Payment form.
 */
function setupNativeEmail( paymentForm ) {
	const { setState, state } = paymentForm;
	const { paymentElement } = state;
	const emailInputEl = paymentForm.querySelector( '.simpay-email' );

	if ( ! emailInputEl ) {
		return;
	}

	emailInputEl.addEventListener( 'blur', ( { target } ) => {
		setState( {
			email: target.value,
		} );

		if ( paymentElement ) {
			paymentElement.update( {
				defaultValues: {
					billingDetails: {
						email: target.value,
					},
				},
			} );
		}
	} );

	// Trigger an initial update to set the internal state.
	emailInputEl.dispatchEvent( new Event( 'blur' ) );
}

/**
 * Sets up the "Email" custom field.
 *
 * @since 4.7.0
 *
 * @param {jQuery} $paymentForm Payment form
 * @param {Object} $paymentForm.paymentForm Payment form.
 */
function setupEmail( { paymentForm } ) {
	const linkAuthenticationEl = paymentForm.querySelector(
		'.simpay-link-authentication-container'
	);

	if ( linkAuthenticationEl ) {
		setupLinkAuthentication( paymentForm );
		return;
	}

	// ...or track the value of a standard field.
	setupNativeEmail( paymentForm );
}

export default setupEmail;
