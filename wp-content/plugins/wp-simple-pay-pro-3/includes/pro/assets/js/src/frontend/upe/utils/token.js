/* global grecaptcha */

/**
 * Returns a Promise that resolves to the token for the given payment form.
 *
 * @since 4.7.0
 *
 * @return {Promise<string>} Promise that resolves to the token.
 */
export function getToken() {
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
	const hCaptchaTokenEl = this.querySelector( '[name="h-captcha-response"]' );

	if ( hCaptchaTokenEl ) {
		return Promise.resolve( hCaptchaTokenEl.value );
	}

	// Cloudflare Turnstile.
	const cloudflareTurnstileTokenEl = this.querySelector(
		'[name="cf-turnstile-response"]'
	);

	if ( cloudflareTurnstileTokenEl ) {
		return Promise.resolve( cloudflareTurnstileTokenEl.value );
	}

	return Promise.resolve( null );
}
