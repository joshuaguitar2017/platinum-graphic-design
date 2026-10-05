document.addEventListener( 'DOMContentLoaded', function () {
	var submitForm = document.getElementById(
		'simpay-manage-subscription-form'
	);

	function updateMessage( status, message ) {
		const messageContainer = document.getElementById( 'messageContainer' );

		// Show the container
		messageContainer.style.display = 'block';

		// Clear existing classes
		messageContainer.className = 'form-message';

		// Update classes based on the provided status
		if ( status === 'error' ) {
			messageContainer.classList.add( 'form-error-container' );
		} else if ( status === 'success' ) {
			messageContainer.classList.add( 'form-success-container' );
		} else if ( status === 'warning' ) {
			messageContainer.classList.add( 'form-warning-container' );
		}

		// Update the message text
		messageContainer.querySelector( '.form-message' ).textContent = message;
	}

	function getToken( manageForm ) {
		// reCAPTCHA v3.
		if ( window.simpayGoogleRecaptcha ) {
			const { siteKey } = window.simpayGoogleRecaptcha;

			return new Promise( ( resolve ) => {
				grecaptcha
					.execute( siteKey, {
						action: 'simpay_payment',
					} )
					.then( ( reCaptchaToken ) => resolve( reCaptchaToken ) )
					.catch( () => resolve( null ) );
			} );
		}

		// hCaptcha.
		const hCaptchaTokenEl = manageForm.querySelector(
			'[name="h-captcha-response"]'
		);

		if ( hCaptchaTokenEl ) {
			return Promise.resolve( hCaptchaTokenEl.value );
		}

		// Cloudflare Turnstile.
		const cloudflareTurnstileTokenEl = manageForm.querySelector(
			'[name="cf-turnstile-response"]'
		);

		if ( cloudflareTurnstileTokenEl ) {
			return Promise.resolve( cloudflareTurnstileTokenEl.value );
		}

		return Promise.resolve( null );
	}

	submitForm.addEventListener( 'submit', function ( event ) {
		event.preventDefault();
		const { target: manageForm } = event;

		var emailInput = document.getElementById( 'simpay-ms-email' );
		var email = emailInput.value;

		// Basic validation
		if ( email.indexOf( '@' ) < 0 ) {
			updateMessage(
				'error',
				simpayManageSubscription.messages.valid_email_warning
			);
			// alert('Please enter a valid email address.');
			return;
		}

		updateMessage(
			'warning',
			simpayManageSubscription.messages.wait_message
		);

		getToken( manageForm )
			.then( ( token ) => {
				// Use wp.apiFetch to make the AJAX request
				wp.apiFetch( {
					path: simpayManageSubscription.rest_url,
					method: 'POST',
					data: {
						email,
						token,
					},
				} )
					.then( ( data ) => {
						if ( data.status === 'error' ) {
							updateMessage( 'error', data.message );
						}
						if ( data.status === 'success' ) {
							updateMessage( 'success', data.message );
						}
					} )
					.catch( ( error ) => {
						updateMessage(
							'error',
							simpayManageSubscription.messages
								.request_error_message
						);
						if ( window.console ) {
							console.error( 'Request failed:', error );
						}
					} );
			} )
			.catch( ( { message } ) => {
				updateMessage(
					'error',
					simpayManageSubscription.messages.captcha_error_message
				);
				if ( window.console ) {
					console.error( 'CAPTCHA error:', message );
				}
			} );
	} );
} );
