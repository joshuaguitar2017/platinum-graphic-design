/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Sets up the SEPA Direct Debit Payment Method.
 *
 * @since 4.2.0
 *
 * @param {PaymentForm} paymentForm
 */
function setup( paymentForm ) {
	const sepaDebitEl = paymentForm[ 0 ].querySelector(
		'.simpay-sepa-debit-wrap'
	);

	if ( ! sepaDebitEl ) {
		return;
	}

	const {
		__unstableLegacyFormData,
		error: onError,
		stripeInstance: { elements },
		getElementStyle,
	} = paymentForm;

	const {
		stripeParams: { country },
	} = __unstableLegacyFormData;

	// Create Element SEPA Direct Debit instance.
	elements.sepaDebit = elements().create( 'iban', {
		supportedCountries: [ 'SEPA' ],
		placeholderCountry: country,
		style: getElementStyle( paymentForm, sepaDebitEl ),
	} );

	// Live feedback when IBAN element updates.
	elements.sepaDebit.on( 'change', ( { error } ) => {
		onError( error || '' );
	} );

	// Flag the element as focused.
	elements.sepaDebit.on( 'focus', () => {
		paymentForm.setState( {
			addressFieldSelection: elements.sepaDebit,
		} );
	} );

	// Mount Element instance.
	elements.sepaDebit.mount( sepaDebitEl );
}

export default setup;
