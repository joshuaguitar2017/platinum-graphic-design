/**
 * Toggle shipping address fields.
 *
 * When hiding, disable fields so the values are not sent.
 *
 * @param {jQuery} spFormElem Form element jQuery object.
 * @param {Object} formData Configured form data.
 */
export function toggleShippingAddressFields( spFormElem, formData ) {
	const shippingAddressContainer = spFormElem.find(
		'.simpay-shipping-address-container'
	);
	const isChecked = spFormElem
		.find( '.simpay-same-address-toggle' )
		.is( ':checked' );

	shippingAddressContainer
		.toggle( ! isChecked )
		.find( 'input, select' )
		.prop( 'disabled', isChecked );
}

/**
 * Bind events to Payment Form.
 */
$( document.body ).on(
	'simpayBindCoreFormEventsAndTriggers',
	// eslint-disable-line no-unused-vars
	( e, spFormElem, formData ) => {
		/**
		 * Toggle shipping fields when "Same billing & shipping info" is toggled.
		 *
		 * @param {Event} e Change event.
		 */
		spFormElem
			.find( '.simpay-same-address-toggle' )
			.on( 'change', () =>
				toggleShippingAddressFields( spFormElem, formData )
			);

		toggleShippingAddressFields( spFormElem, formData );
	}
);
