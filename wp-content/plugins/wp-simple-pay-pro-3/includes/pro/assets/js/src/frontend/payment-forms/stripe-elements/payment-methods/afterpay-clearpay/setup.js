/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Mounts the Afterpay / Clearpay site messaging element.
 *
 * @param {PaymentForm} paymentForm Payment form.
 */
function mountMessageElement( paymentForm ) {
	const afterpayClearpayEl = paymentForm[ 0 ].querySelector(
		'.simpay-afterpay-clearpay-wrap'
	);

	afterpayClearpayEl.innerHTML = '';

	const {
		stripeInstance: { elements },
		__unstableLegacyFormData,
		cart,
	} = paymentForm;

	const {
		stripeParams: { afterpayClearpayLocale },
	} = __unstableLegacyFormData;

	// Create Element instance.
	elements.afterpayClearpay = elements( {
		locale: afterpayClearpayLocale,
	} ).create( 'afterpayClearpayMessage', {
		amount: cart.getTotalDueToday(),
		currency: cart.getCurrency().toUpperCase(),
		introText: 'Pay',
		modalLinkStyle: 'learn-more-text',
	} );

	elements.afterpayClearpay.mount( afterpayClearpayEl );
}

/**
 * Sets up the Afterpay / Clearpay Payment Method.
 *
 * @param {PaymentForm} paymentForm Payment form.
 */
function setup( paymentForm ) {
	const afterpayClearpayEl = paymentForm[ 0 ].querySelector(
		'.simpay-afterpay-clearpay-wrap'
	);

	if ( ! afterpayClearpayEl ) {
		return;
	}

	// Initial mount.
	mountMessageElement( paymentForm );

	// Update when total changes.
	paymentForm.on( 'totalChanged', () => mountMessageElement( paymentForm ) );
}

export default setup;
