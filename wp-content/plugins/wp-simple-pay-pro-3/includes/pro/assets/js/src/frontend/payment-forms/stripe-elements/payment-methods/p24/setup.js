/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Sets up the P24 Payment Method.
 *
 * @since 4.2.0
 *
 * @param {PaymentForm} paymentForm
 */
function setup( paymentForm ) {
	const p24El = paymentForm[ 0 ].querySelector( '.simpay-p24-wrap' );

	if ( ! p24El ) {
		return;
	}

	const {
		stripeInstance: { elements },
		getElementStyle,
	} = paymentForm;

	// Create Element FPX instance.
	elements.p24 = elements().create( 'p24Bank', {
		style: {
			...getElementStyle( paymentForm, p24El ),
			base: {
				// Add extra padding for dropdown.
				padding: '10px',
				...getElementStyle( paymentForm, p24El ).base,
			},
		},
	} );

	// Flag the element as focused.
	elements.p24.on( 'focus', () => {
		paymentForm.setState( {
			addressFieldSelection: elements.p24,
		} );
	} );

	// Mount Element instance.
	elements.p24.mount( p24El );
}

export default setup;
