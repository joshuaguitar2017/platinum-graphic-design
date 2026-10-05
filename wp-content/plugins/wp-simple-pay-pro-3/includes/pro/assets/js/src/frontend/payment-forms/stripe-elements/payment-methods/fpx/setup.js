/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Sets up the FPX Payment Method.
 *
 * @since 4.2.0
 *
 * @param {PaymentForm} paymentForm
 */
function setup( paymentForm ) {
	const fpxEl = paymentForm[ 0 ].querySelector( '.simpay-fpx-wrap' );

	if ( ! fpxEl ) {
		return;
	}

	const {
		stripeInstance: { elements },
		getElementStyle,
	} = paymentForm;

	// Create Element FPX instance.
	elements.fpx = elements().create( 'fpxBank', {
		style: {
			...getElementStyle( paymentForm, fpxEl ),
			base: {
				// Add extra padding for dropdown.
				padding: '10px',
				...getElementStyle( paymentForm, fpxEl ).base,
			},
		},
		accountHolderType: 'individual',
	} );

	// Flag the element as focused.
	elements.fpx.on( 'focus', () => {
		paymentForm.setState( {
			addressFieldSelection: elements.fpx,
		} );
	} );

	// Mount and setup Element iDEAL instance.
	elements.fpx.mount( fpxEl );
}

export default setup;
