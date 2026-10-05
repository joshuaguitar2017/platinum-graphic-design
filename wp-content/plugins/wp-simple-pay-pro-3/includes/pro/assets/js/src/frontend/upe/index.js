/* global jQuery */

/**
 * Internal dependencies.
 */
import { default as setup } from './setup.js';
import { default as submit } from './submit.js';
import { default as setupOverlays } from './overlays.js';

/**
 * Initializes a payment form.
 *
 * @since 4.7.0
 *
 * @param {Object} paymentForm Payment form.
 * @param {Object} config Payment form configuration.
 */
function initPaymentForm( paymentForm, config ) {
	// When setting up, this is transformed in to a jQuery object for
	// backwards compatibility of triggers.
	const $paymentForm = setup( paymentForm, config );

	// Bind submission.
	paymentForm.addEventListener( 'submit', ( e ) => {
		e.preventDefault();
		submit( $paymentForm );
	} );
}

/**
 * Initializes Payment Forms on the current page.
 *
 * @since 4.7.0
 */
function initPaymentForms() {
	// Find all payment forms on the page.
	const paymentFormEls = document.querySelectorAll( '.simpay-checkout-form' );

	if ( 0 === paymentFormEls.length ) {
		return;
	}

	// Setup each payment form.
	paymentFormEls.forEach( ( paymentForm ) => {
		initPaymentForm( paymentForm );
	} );

	setupOverlays();
}

window.wpsp = {
	initPaymentForm,
};

jQuery( initPaymentForms );
