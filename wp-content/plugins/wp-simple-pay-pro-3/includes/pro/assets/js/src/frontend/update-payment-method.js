/* global simpayUpdatePaymentMethod, Stripe */

/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { getElementsConfig } from './upe/utils';

const { id, i18n, payment, stripe } = simpayUpdatePaymentMethod;

/**
 * Shows an error message before the update payment method form.
 *
 * @since 4.7.0
 *
 * @param {string} errorMessage
 */
function showError( errorMessage ) {
	const errorEl = document.querySelector( '.simpay-errors' );

	if ( ! errorEl ) {
		return;
	}

	const submitButtonEl = document.querySelector( '.simpay-checkout-btn' );
	submitButtonEl.disabled = false;
	submitButtonEl.innerHTML = decodeEntities( i18n.submit );

	errorEl.innerText = errorMessage;
	errorEl.style.display = 'block';
	wp.a11y.speak( errorMessage, 'assertive' );
}

/**
 * Confirms a SetupIntent to update a subscription's payment method.
 *
 * @since 4.7.0
 */
function updatePaymentMethod() {
	const formEl = document.getElementById(
		'simpay-form-update-payment-method'
	);

	if ( ! formEl ) {
		return;
	}

	// Setup Stripe.
	const stripejs = Stripe( stripe.api_key, {
		apiVersion: stripe.api_version,
		locale: stripe.elements_locale,
	} );

	// ...and Stripe Elements.
	const elements = stripejs.elements( {
		clientSecret: stripe.client_secret,
		...getElementsConfig( stripe.elements ),
	} );

	const paymentElement = elements.create( 'payment', {
		wallets: {
			applePay: 'auto',
			googlePay: 'auto',
		},
		business: {
			name: i18n.site_title || '',
		},
		layout: {
			type: 'tabs',
			defaultCollapsed: false,
		},
	} );

	// Mount the Payment Element.
	paymentElement.mount( document.querySelector( '.simpay-upe-wrap' ) );

	const submitButtonEl = document.querySelector( '.simpay-checkout-btn' );

	// Attach submission handler.
	formEl.addEventListener( 'submit', ( e ) => {
		e.preventDefault();

		submitButtonEl.disabled = true;
		submitButtonEl.innerText = decodeEntities( i18n.loading );

		stripejs
			.confirmSetup( {
				elements,
				confirmParams: {
					return_url: window.location.href,
				},
				redirect: 'if_required',
			} )
			.then( ( { error, setupIntent } ) => {
				if ( error ) {
					showError( error.message );
					return;
				}

				window.wp
					.apiFetch( {
						path: 'wpsp/__internal__/payment/update-payment-method',
						method: 'POST',
						data: {
							form_id: id,
							customer_id: payment.customer,
							setup_intent_id: setupIntent.id,
							payment_method_id: setupIntent.payment_method,
							subscription_id: payment.subscription,
							subscription_key: payment.subscription_key,
						},
					} )
					.then( () => {
						window.location.replace( window.location.href );
					} )
					.catch( ( response ) => {
						showError( response.message );
					} );
			} );
	} );
}

// DOM Ready.
domReady( updatePaymentMethod );
