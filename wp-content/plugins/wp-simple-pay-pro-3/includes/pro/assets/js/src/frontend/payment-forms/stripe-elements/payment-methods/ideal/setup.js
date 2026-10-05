/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Sets up the iDEAL Payment Method.
 *
 * @since 4.2.0
 *
 * @param {PaymentForm} paymentForm
 */
function setup( paymentForm ) {
	const idealEl = paymentForm[ 0 ].querySelector( '.simpay-ideal-wrap' );

	if ( ! idealEl ) {
		return;
	}

	const {
		stripeInstance: { elements },
		getElementStyle,
	} = paymentForm;

	// Create Element iDEAL instance.
	elements.ideal = elements().create( 'idealBank', {
		style: {
			...getElementStyle( paymentForm, idealEl ),
			base: {
				// Add extra padding for dropdown.
				padding: '10px',
				...getElementStyle( paymentForm, idealEl ).base,
			},
		},
	} );

	// Flag the element as focused.
	elements.ideal.on( 'focus', () => {
		paymentForm.setState( {
			addressFieldSelection: elements.ideal,
		} );
	} );

	// Mount and setup Element iDEAL instance.
	elements.ideal.mount( idealEl );
}

export default setup;
