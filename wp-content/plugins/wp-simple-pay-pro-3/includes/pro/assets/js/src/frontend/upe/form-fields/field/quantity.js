/* global jQuery */

/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Update the quantity.
 *
 * @param {jQuery} $paymentForm Payment form.
 */
export function update( $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const { settings } = paymentForm;

	if ( 'yes' === settings.allowMultipleLineItem ) {
		return;
	}

	let quantity = 1;

	if ( paymentForm.querySelector( '.simpay-quantity-dropdown' ) ) {
		quantity = parseFloat(
			$paymentForm
				.find( '.simpay-quantity-dropdown' )
				.find( 'option:selected' )
				.data( 'quantity' )
		);

		$paymentForm.trigger( 'simpayDropdownQuantityChange' );
	} else if ( paymentForm.querySelector( '.simpay-quantity-radio' ) ) {
		quantity = parseFloat(
			$paymentForm
				.find( '.simpay-quantity-radio' )
				.find( 'input[type="radio"]:checked' )
				.data( 'quantity' )
		);

		$paymentForm.trigger( 'simpayRadioQuantityChange' );
	} else if ( paymentForm.querySelector( '.simpay-quantity-input' ) ) {
		quantity = parseFloat(
			$paymentForm.find( '.simpay-quantity-input' ).val()
		);

		$paymentForm.trigger( 'simpayNumberQuantityChange' );
	}

	if ( quantity < 1 ) {
		quantity = 1;
	}

	// Set cart base item quantity.
	try {
		const item = paymentForm.cart.getLineItem( 'base' );

		item.update( {
			quantity,
		} );

		// Update hidden quantity field.
		paymentForm.querySelector( '.simpay-quantity' ).value = quantity;

		// Alert the rest of the components they need to update.
		$paymentForm.trigger( 'totalChanged', [ $paymentForm ] );
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
function setNumberQuantityMax( { paymentForm } ) {
	const quantityInputEl = paymentForm.querySelector(
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
 * Sets up the "Quantity" custom field.
 *
 * @since 4.7.0
 *
 * @param {jQuery} $paymentForm Payment form
 * @param {Object} $paymentForm.paymentForm Payment form.
 */
function setupQuantity( $paymentForm ) {
	// Update amounts on load.
	update( $paymentForm );

	/**
	 * Update amounts when a "Quantity" input changes.
	 *
	 * @param {Event} e Change event.
	 */
	$paymentForm
		.find(
			'.simpay-quantity-radio input, .simpay-quantity-dropdown, .simpay-quantity-input'
		)
		.on( 'input', () => update( $paymentForm ) );

	// Update maximum amount allowed based on inventory when using a number input.
	$paymentForm.on( 'totalChanged', () =>
		setNumberQuantityMax( $paymentForm )
	);
}

export default setupQuantity;
