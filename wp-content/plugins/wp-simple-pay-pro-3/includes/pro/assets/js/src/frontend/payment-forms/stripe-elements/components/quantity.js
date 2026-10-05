/* global jQuery */

/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Update the quantity.
 *
 * @param {PaymentForm} paymentForm Payment Form.
 * @param {Object} formData Unstable legacy form data.
 */
export function update( paymentForm, formData ) {
	let quantity = 1;

	if ( 0 !== paymentForm.find( '.simpay-quantity-dropdown' ).length ) {
		quantity = parseFloat(
			paymentForm
				.find( '.simpay-quantity-dropdown' )
				.find( 'option:selected' )
				.data( 'quantity' )
		);

		paymentForm.trigger( 'simpayDropdownQuantityChange' );
	} else if ( 0 !== paymentForm.find( '.simpay-quantity-radio' ).length ) {
		quantity = parseFloat(
			paymentForm
				.find( '.simpay-quantity-radio' )
				.find( 'input[type="radio"]:checked' )
				.data( 'quantity' )
		);

		paymentForm.trigger( 'simpayRadioQuantityChange' );
	} else if ( 0 !== paymentForm.find( '.simpay-quantity-input' ).length ) {
		quantity = parseFloat(
			paymentForm.find( '.simpay-quantity-input' ).val()
		);

		paymentForm.trigger( 'simpayNumberQuantityChange' );
	}

	if ( quantity < 1 ) {
		quantity = 1;
	}

	// Backwards compatibility.
	formData.quantity = quantity;

	// Set cart base item quantity.
	try {
		const item = paymentForm.cart.getLineItem( 'base' );

		item.update( {
			quantity,
		} );

		// Update hidden quantity field.
		paymentForm.find( '.simpay-quantity' ).val( quantity );

		// Alert the rest of the components they need to update.
		paymentForm.trigger( 'totalChanged', [ paymentForm, formData ] );
	} catch ( error ) {
		// Error is logged, UI does not need updating.
	}
}

/**
 * Sets the quantity input max, when using input[type="number"], based on the
 * price option's available inventory.
 *
 * @since 4.6.4
 *
 * @param {PaymentForm} paymentForm Payment Form.
 */
function setNumberQuantityMax( paymentForm ) {
	const quantityInputEl = paymentForm[ 0 ].querySelector(
		'input.simpay-quantity-input[type="number"]'
	);

	if ( ! quantityInputEl ) {
		return;
	}

	const {
		state: { price },
	} = paymentForm;

	if ( ! price.inventory ) {
		return;
	}

	quantityInputEl.max = price.inventory;
}

/**
 * DOM ready.
 *
 * @param {jQuery} $ jQuery.
 */
( function ( $ ) {
	/**
	 * Bind when Payment Form is ready.
	 *
	 * @param {Object} e Event
	 * @param {Object} spFormElem Form element.
	 * @param {Object} formData Form data.
	 */
	$( document.body ).on(
		'simpayBindCoreFormEventsAndTriggers',
		( e, paymentForm, formData ) => {
			// Update amounts on load.
			update( paymentForm, formData );

			/**
			 * Update amounts when a "Quantity" input changes.
			 *
			 * @param {Event} e Change event.
			 */
			paymentForm
				.find(
					'.simpay-quantity-radio input, .simpay-quantity-dropdown, .simpay-quantity-input'
				)
				.on( 'change', () => update( paymentForm, formData ) );

			// Update maximum amount allowed based on inventory when using a number input.
			paymentForm.on( 'totalChanged', () =>
				setNumberQuantityMax( paymentForm )
			);
		}
	);
} )( jQuery );
