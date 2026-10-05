/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Sets up the Card Payment Method.
 *
 * @since 4.2.0
 *
 * @param {PaymentForm} paymentForm
 */
function setup( paymentForm ) {
	const cardEl = paymentForm[ 0 ].querySelector( '.simpay-card-wrap' );

	if ( ! cardEl ) {
		return;
	}

	const {
		stripeInstance: { elements },
		error: onError,
		getElementStyle,
		__unstableLegacyFormData,
		state,
		setState,
	} = paymentForm;

	// If a billing address field exists (overrides Card field setting).
	const hidePostalCode =
		!! paymentForm[ 0 ].querySelector( '.simpay-address-zip' ) ||
		'no' === cardEl.dataset.showPostalCode;

	// Create Element Card instance.
	elements.card = elements().create( 'card', {
		style: getElementStyle( paymentForm, cardEl ),
		hidePostalCode,
	} );

	// Mount and setup Element card instance.
	elements.card.mount( cardEl );

	// Mark the card Element as empty when it is initially mounted.
	elements.card.on( 'ready', () => {
		setState( {
			cardElement: {
				isEmpty: true,
			},
		} );
	} );

	// Live feedback when card updates.
	elements.card.on( 'change', ( { error, complete } ) => {
		setState( {
			cardElement: {
				isEmpty: ! complete,
				isError: !! error,
			},
		} );

		onError( error || '' );
	} );

	// Flag the element as focused.
	elements.card.on( 'focus', () => {
		paymentForm.setState( {
			addressFieldSelection: elements.card,
		} );
	} );

	// Potentially block submission based on Element status.
	paymentForm.on(
		'simpayBeforeStripePayment',
		( e, { state: formState } ) => {
			const { cardElement, paymentMethod } = formState;
			const { isEmpty, isError } = cardElement;

			// Only proceed if "card" is the selected Payment Method.
			if ( 'card' !== paymentMethod.id ) {
				return;
			}

			const isValid = ! isEmpty && ! isError;

			// Block submission if invalid.
			__unstableLegacyFormData.isValid = isValid;

			// Focus element if invalid.
			if ( ! isValid ) {
				elements.card.focus();
			}
		}
	);
}

export default setup;
