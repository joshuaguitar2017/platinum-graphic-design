/* globals jQuery */

/**
 * Internal dependencies
 */
import { toggle as toggleOverlayForm } from './../payment-forms/stripe-elements/overlays.js';

/**
 * Shim object properties for backwards compatibility.
 */
export default {
	/**
	 * Setup Payment Forms.
	 */
	init() {
		jQuery( document.body ).on(
			'simpayFinalizeCoreAmount',
			window.simpayAppPro.updateAmounts
		);
	},

	/**
	 * Toggle `is-focused` class on fields to allow for extra CSS styling.
	 *
	 * @param {jQuery} spFormElem Form element jQuery object.
	 * @param {Object} formData Configured form data.
	 */
	setOnFieldFocus( spFormElem, formData ) {
		const fields = spFormElem.find( '.simpay-form-control' );

		fields.each( function ( i, el ) {
			const field = jQuery( el );

			field.on( 'focusin', setFocus );
			field.on( 'focusout', removeFocus );

			/**
			 * Add `is-focused` class.
			 *
			 * @param {Event} e Event focusin event.
			 */
			function setFocus( e ) {
				spFormElem.isDirty = true;
				jQuery( e.target ).addClass( 'is-focused' );
			}

			/**
			 * Remove `is-focused` class.
			 *
			 * @param {Event} e Event focusout event.
			 */
			function removeFocus( e ) {
				const $el = jQuery( e.target );

				// Wait for DatePicker plugin
				setTimeout( function () {
					$el.removeClass( 'is-focused' );

					if ( field.val() ) {
						$el.addClass( 'is-filled' );
					} else {
						$el.removeClass( 'is-filled' );
					}
				}, 300 );
			}
		} );
	},

	/**
	 * Calculate payment amounts.
	 *
	 * @param {Event} e Mixed events. Not used.
	 * @param {jQuery} spFormElem Form element jQuery object.
	 * @param {Object} formData Configured form data.
	 */
	updateAmounts( e, spFormElem, formData ) {
		const { convertToDollars, debugLog } = window.spShared;

		try {
			const { cart } = spFormElem;

			const total = cart.getTotalDueToday();

			// Backwards compat.
			formData.finalAmount = convertToDollars( total );
			formData.stripeParams.amount = total;

			// Set the same cents value to hidden input for later form submission.
			spFormElem.find( '.simpay-amount' ).val( total );
		} catch ( error ) {
			debugLog( error );
		}
	},

	toggleOverlayForm,
};
