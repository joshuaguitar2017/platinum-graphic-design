/**
 * Remove a line item from the cart.
 *
 * @since 4.11.0
 *
 * @param {string} singlePriceId Line item ID.
 * @param {string} singlePriceLabel Line item label.
 * @param {Object} sp Line item price object.
 * @param {Object} cart Cart object.
 * @param {boolean} isBaseItem Whether the line item is the base item.
 * @param {Array} fees Line item fees.
 * @param {boolean} isOptionallyRecurring Whether the line item is optionally recurring.
 * @return {void}
 */
export function removeItem(
	singlePriceId,
	singlePriceLabel,
	sp,
	cart,
	isBaseItem,
	fees,
	isOptionallyRecurring
) {
	if ( isBaseItem ) {
		const singleItem = {
			id: 'base',
			title: singlePriceLabel,
			amount: 0,
			quantity: 1,
			price: sp,
			checked: false,
			fees,
			isOptionallyRecurring,
		};
		cart.updateLineItem( singlePriceId, singleItem );
	} else {
		cart.removeLineItem( singlePriceId );
	}
}

/**
 * Get the quantity of a price option.
 *
 * @since 4.11.0
 *
 * @param {HTMLElement} singlePriceEl Price option element.
 * @return {number} Quantity.
 */
export function getQuantity( singlePriceEl ) {
	const parentLabel = singlePriceEl.closest(
		'.simpay-price-selection-label'
	);
	const quantityField = parentLabel.querySelector(
		'.simpay-quantity-field-input'
	);

	if ( quantityField ) {
		return parseInt( quantityField.value, 10 );
	}

	return 1;
}

/**
 * Check if recurring is enabled for a price option.
 *
 * @since 4.11.0
 * @param {HTMLElement} priceEl Price option element.
 * @return {boolean} Whether recurring is enabled.
 */
export function isRecurringEnabled( priceEl ) {
	const parentLabel = priceEl.closest( '.simpay-price-selection-label' );

	const recurringToggle = parentLabel.querySelector(
		'.simpay-recurring-amount-toggle'
	);

	if ( recurringToggle ) {
		return recurringToggle.checked;
	}

	return false;
}

/**
 * Ensures at least one price is checked.
 *
 * @since 4.11.0
 *
 * @param {HTMLElement} priceEl
 * @param {Array} priceListEls
 */
export function ensureOnePriceChecked( priceEl, priceListEls ) {
	const hasAnother = [ ...priceListEls ].find( ( el ) => el.checked );

	if ( ! hasAnother ) {
		priceEl.checked = true;
	}
}

/**
 * Check if only one price is selected.
 *
 * @since 4.11.0
 * @param {jQuery} $paymentForm Payment form.
 * @return {boolean} True if onle one price is selected.
 */
export function isOnlyOnePriceSelected( $paymentForm ) {
	const { paymentForm } = $paymentForm;

	const priceListEls = paymentForm.querySelectorAll(
		'[name="simpay_price"]'
	);

	return [ ...priceListEls ].find( ( el ) => el.checked );
}

/**
 * Show an error message for a custom amount field.
 *
 * @since 4.11.0
 * @param {HTMLElement} customAmountField Custom amount field element.
 * @param {string} errorMessage Error message.
 *
 * @return {void}
 */
export function showCustomAmountError( customAmountField, errorMessage ) {
	const parentLabel = customAmountField.closest(
		'.simpay-price-selection-label'
	);
	const errorEl = parentLabel.querySelector( '.simpay-custom-amount-error' );
	if ( errorEl ) {
		errorEl.innerHTML = errorMessage;
		errorEl.style.display = 'block';
	}
}

/**
 * Hide an error message for a custom amount field.
 *
 * @since 4.11.0
 *
 * @param {HTMLElement} customAmountField Custom amount field element.
 * @return {void}
 */
export function hideCustomAmountError( customAmountField ) {
	const parentLabel = customAmountField.closest(
		'.simpay-price-selection-label'
	);
	const errorEl = parentLabel.querySelector( '.simpay-custom-amount-error' );
	if ( errorEl ) {
		errorEl.innerHTML = '';
		errorEl.style.display = 'none';
	}
}

/**
 * Uncheck other prices if the selected price currency is different.
 *
 * @since 4.11.0
 *
 * @param {HTMLElement} priceEl Selected price element.
 * @param {HTMLElement[]} priceListEls Price list elements.
 *
 * @return {void}
 */
export function uncheckMixedCurrencyPrices( priceEl, priceListEls ) {
	const selectedPrice = JSON.parse( priceEl.dataset.price );

	priceListEls.forEach( ( el ) => {
		if (
			JSON.parse( el.dataset.price ).currency !== selectedPrice.currency
		) {
			el.checked = false;
		}
	} );
}

/**
 * Uncheck other recurring prices if the selected recurring price interval is different.
 *
 * @since 4.11.0
 *
 * @param {HTMLElement} priceEl Selected price element.
 * @param {HTMLElement[]} priceListEls Price list elements.
 * @return {void}
 */
export function uncheckMixedRecurringPrices( priceEl, priceListEls ) {
	const selectedPrice = JSON.parse( priceEl.dataset.price );

	/**
	 * Check if a price is recurring.
	 *
	 * @since 4.11.0
	 *
	 * @param {Object} price Price object.
	 * @return {boolean} Whether the price is recurring.
	 */
	function isRecurring( price ) {
		return price.recurring && price.recurring.interval;
	}

	if ( ! isRecurring( selectedPrice ) ) {
		return;
	}

	priceListEls.forEach( ( el ) => {
		if ( ! isRecurring( JSON.parse( el.dataset.price ) ) ) {
			return;
		}

		const otherPrice = JSON.parse( el.dataset.price );

		if ( otherPrice.id !== selectedPrice.id ) {
			if (
				selectedPrice.recurring.interval !==
					otherPrice.recurring.interval ||
				selectedPrice.recurring.interval_count !==
					otherPrice.recurring.interval_count
			) {
				el.checked = false;
			}
		}
	} );
}
