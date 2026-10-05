/* global _, jQuery */

/**
 * Show/hides the relevant payment methods depending on the selected price.
 *
 * @param {Object} price Selected price option.
 * @param {jQuery} spFormElem Form element jQuery object.
 * @param {Object} formData Configured form data.
 */
export function onChangePrice( price, spFormElem, formData ) {
	const { currency: priceCurrency, recurring, can_recur: canRecur } = price;
	const { paymentMethods } = formData;

	const supportedCurrencyPaymentMethods = paymentMethods.filter(
		( { currencies } ) => {
			return currencies.includes( priceCurrency );
		}
	);

	const supportedCurrencyPaymentMethodIds = _.map(
		supportedCurrencyPaymentMethods,
		'id'
	);

	const supportedRecurringPaymentMethods = paymentMethods.filter(
		( { recurring: supportsRecurring } ) => {
			return true === supportsRecurring;
		}
	);

	const supportedRecurringPaymentMethodIds = _.map(
		supportedRecurringPaymentMethods,
		'id'
	);

	const paymentMethodToggles = spFormElem[ 0 ].querySelectorAll(
		'.simpay-payment-method-toggle'
	);

	const selectedPaymentMethod = spFormElem[ 0 ].querySelector(
		'.simpay-payment-method-toggle.is-active'
	);

	let visiblePaymentMethods = 0;

	// Show/hide relevant methods.
	[ ...paymentMethodToggles ].forEach( ( paymentMethodToggle ) => {
		const paymentMethodId = paymentMethodToggle.dataset.paymentMethod;

		const supportsCurrency = supportedCurrencyPaymentMethodIds.includes(
			paymentMethodId
		);

		const supportsRecurring = supportedRecurringPaymentMethodIds.includes(
			paymentMethodId
		);

		if ( supportsCurrency ) {
			paymentMethodToggle.style.display = 'block';

			// Check for Subscriptions.
			if (
				null !== recurring &&
				false === canRecur &&
				false === supportsRecurring
			) {
				paymentMethodToggle.style.display = 'none';
			}

			// On the fly check for Recurring Toggle.
			const recurringAmountToggleInput = spFormElem[ 0 ].querySelector(
				'.simpay-recurring-amount-toggle'
			);

			if (
				recurringAmountToggleInput &&
				true === recurringAmountToggleInput.checked &&
				false === supportsRecurring
			) {
				paymentMethodToggle.style.display = 'none';
			}
		} else {
			paymentMethodToggle.style.display = 'none';
		}

		if ( 'block' === paymentMethodToggle.style.display ) {
			visiblePaymentMethods = visiblePaymentMethods + 1;
		}
	} );

	// If the previously selected method is no longer visible, select the first method.
	if ( 'none' === selectedPaymentMethod.style.display ) {
		spFormElem
			.find( '.simpay-payment-method-toggle:visible' )
			.first()
			.click();
	}

	// If only one item is showing, hide the selector.
	const tabToggles = spFormElem[ 0 ].querySelector(
		'.simpay-form-tabs-toggles'
	);

	tabToggles.style.display = 1 === visiblePaymentMethods ? 'none' : 'flex';
}

/**
 * Bind events to Payment Form.
 */
jQuery( document.body ).on(
	'simpayBindCoreFormEventsAndTriggers',
	// eslint-disable-line no-unused-vars
	( e, spFormElem, formData ) => {
		if ( ! spFormElem[ 0 ].querySelector( '.simpay-card-container' ) ) {
			return;
		}

		// Update amount when a price option selection changes.
		// eslint-disable-line no-unused-vars
		spFormElem.on( 'simpayMultiPlanChanged', ( _e, price ) => {
			onChangePrice( price, spFormElem, formData );
		} );
	}
);
