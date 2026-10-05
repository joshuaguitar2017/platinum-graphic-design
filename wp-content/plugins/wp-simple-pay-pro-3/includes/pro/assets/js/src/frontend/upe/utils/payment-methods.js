export function getDefaultPaymentMethod( paymentMethod ) {
	return paymentMethod.settings.paymentMethods[ 0 ];
}

/**
 * Returns the payment method types for the current price.
 *
 * @since 4.7.0
 */
export function getPaymentMethodTypes() {
	const { settings, cart } = this;
	const { allowMultipleLineItem, paymentMethods } = settings;

	const priceCurrency = cart.getCurrency();
	let isRecurring = cart.isRecurring();

	// Multiple line items should always be considered "recurring" when determining
	// which payment methods to display. This is because the Invoices API does not
	// support non-recurring payment methods.
	if ( 'yes' === allowMultipleLineItem ) {
		isRecurring = true;
	}

	const supportedCurrencyPaymentMethods = paymentMethods
		.filter( ( { currencies } ) => {
			return currencies.includes( priceCurrency );
		} )
		.map( ( { id } ) => id );

	const supportedRecurringPaymentMethods = paymentMethods
		.filter( ( { recurring: supportsRecurring } ) => {
			return true === supportsRecurring;
		} )
		.map( ( { id } ) => id );

	let filteredPaymentMethods = paymentMethods
		.filter( ( { id } ) => {
			const supportsCurrency = supportedCurrencyPaymentMethods.includes(
				id
			);

			if ( supportsCurrency ) {
				if ( isRecurring ) {
					return supportedRecurringPaymentMethods.includes( id );
				}

				return true;
			}

			return false;
		} )
		.map( ( { id } ) => id );

	// Adds `link` as a payment method if the card payment method is enabled.
	const linkAuthEl = this.querySelector(
		'.simpay-link-authentication-container'
	);

	if ( linkAuthEl ) {
		filteredPaymentMethods.push( 'link' );
	}

	// Remove `affirm` if the amount due today is less than $100.
	if ( cart.getTotalDueToday() < 10000 ) {
		filteredPaymentMethods = filteredPaymentMethods.filter( ( method ) => {
			return 'affirm' !== method;
		} );
	}

	return filteredPaymentMethods;
}

/**
 * Returns the payment method options used to create a payment intent.
 *
 * @since 4.7.0
 *
 * @return {Object} Payment method options.
 */
export function getPaymentMethodOptions() {
	const { settings } = this;
	const { paymentMethods } = settings;
	const config = {};

	// Determine if this.settings.paymentMethods includes an item with an id of us_bank_account.
	// If it does, determine if the config for that item has an option called verification_method.instant.
	// If the flag does not exist (previous behavior), only offer instant.
	const usBankAccount = paymentMethods.find(
		( { id } ) => 'us_bank_account' === id
	);

	if ( usBankAccount ) {
		config.us_bank_account = {
			verification_method: ! usBankAccount.config?.verification_method
				? 'instant'
				: 'automatic',
		};
	}

	return config;
}
