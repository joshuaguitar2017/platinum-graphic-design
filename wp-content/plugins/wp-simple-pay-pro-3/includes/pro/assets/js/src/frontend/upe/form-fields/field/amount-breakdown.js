/**
 * Update all labels.
 *
 * @param {Object} paymentForm Payment form.
 */
export function update( paymentForm ) {
	subtotalAmount( paymentForm );
	couponAmount( paymentForm );
	taxAmount( paymentForm );
	totalAmount( paymentForm );
	feeRecoveryAmount( paymentForm );
	recurringAmount( paymentForm );
}

/**
 * Update "Subtotal Amount" display amount.
 *
 * @since 4.1.0
 *
 * @param {Object} paymentForm Payment form.
 */
function subtotalAmount( paymentForm ) {
	const valueEl = paymentForm.querySelector(
		'.simpay-subtotal-amount-value'
	);

	if ( ! valueEl ) {
		return;
	}

	const { cart, convertToDollars, formatCurrency } = paymentForm;

	const subtotalAmountFormatted = formatCurrency(
		cart.isZeroDecimal()
			? cart.getSubtotal()
			: convertToDollars( cart.getSubtotal() ),
		true,
		cart.getCurrencySymbol(),
		cart.isZeroDecimal()
	);

	valueEl.innerText = subtotalAmountFormatted;

	// Toggle the visibility based on the total vs. subtotal.
	const subtotalContainerEl = paymentForm.querySelector(
		'.simpay-subtotal-amount-container'
	);

	subtotalContainerEl.style.display =
		cart.getTotal() !== cart.getSubtotal() || 'automatic' === cart.taxStatus
			? 'block'
			: 'none';
}

/**
 * Updates the "Coupon" amount.
 *
 * @since 4.1.0
 * @param paymentForm
 * @param {Object} $paymentForm Payment form.
 */
function couponAmount( paymentForm ) {
	// Toggle the visibility based on state.
	const couponContainerEl = paymentForm.querySelector(
		'.simpay-coupon-amount-container'
	);

	if ( ! couponContainerEl ) {
		return;
	}

	const { cart, convertToDollars, formatCurrency } = paymentForm;
	const coupon = cart.getCoupon();

	if ( 'object' === typeof coupon ) {
		couponContainerEl.style.display = 'block';

		const discountAmountFormatted = formatCurrency(
			cart.isZeroDecimal()
				? cart.getDiscount()
				: convertToDollars( cart.getDiscount() ),
			true,
			cart.getCurrencySymbol(),
			cart.isZeroDecimal()
		);

		const amountEl = paymentForm.querySelector(
			'.simpay-coupon-amount-name'
		);
		amountEl.innerText = coupon.id;

		const valueEl = paymentForm.querySelector(
			'.simpay-coupon-amount-value'
		);
		valueEl.innerText = `-${ discountAmountFormatted }`;
	} else {
		couponContainerEl.style.display = 'none';
	}
}

/**
 * Update "Total Amount" label, and Submit Button label.
 *
 * @param {Object} $paymentForm Payment form.
 * @param paymentForm
 */
function totalAmount( paymentForm ) {
	const valueEls = paymentForm.querySelectorAll(
		'.simpay-total-amount-value'
	);

	if ( 0 === valueEls.length ) {
		return;
	}

	const { cart, convertToDollars, formatCurrency } = paymentForm;

	const totalAmountFormatted = formatCurrency(
		cart.isZeroDecimal()
			? cart.getTotalDueToday()
			: convertToDollars( cart.getTotalDueToday() ),
		true,
		cart.getCurrencySymbol(),
		cart.isZeroDecimal()
	);

	valueEls.forEach(
		( valueEl ) => ( valueEl.innerHTML = totalAmountFormatted )
	);
}

/**
 * Update "Recurring Amount" label.
 *
 * @since 3.7.0
 * @param paymentForm
 * @param {Object} $paymentForm Payment form.
 */
function recurringAmount( paymentForm ) {
	const recurringAmountWrapper = paymentForm.querySelector(
		'.simpay-total-amount-recurring-container'
	);

	if ( ! recurringAmountWrapper ) {
		return;
	}

	const { cart } = paymentForm;
	

	if ( ! cart.isRecurring() ) {
		recurringAmountWrapper.style.display = 'none';
	} else {
		const recurringAmountDisplay = getRecurringAmountDisplay( paymentForm );

		const valueEl = paymentForm.querySelector(
			'.simpay-total-amount-recurring-value'
		);
		valueEl.innerText = recurringAmountDisplay;

		recurringAmountWrapper.style.display = 'block';
	}
}

/**
 * Update "Tax Amount" label.
 *
 * @since 3.7.0
 *
 * @param {Object} paymentForm Payment form.
 */
function taxAmount( paymentForm ) {
	const { cart, convertToDollars, formatCurrency, state } = paymentForm;
	const { automaticTax } = cart;

	const taxAmountWrapper = paymentForm.querySelector(
		'.simpay-tax-amount-container'
	);

	if ( ! taxAmountWrapper ) {
		return;
	}

	switch ( cart.taxStatus ) {
		case 'none':
			return;
		case 'automatic':
			const { settings } = paymentForm;
			const { addressType } = settings;
			const addressElement = state[ `${ addressType }Address` ];

			// If the address is complete, calculate the tax.
			if ( addressElement && addressElement.complete ) {
				paymentForm.querySelector(
					'.simpay-automatic-tax-label .simpay-tax-amount-value'
				).innerText = formatCurrency(
					cart.isZeroDecimal()
						? automaticTax.amount_tax
						: convertToDollars( automaticTax.amount_tax ),
					true,
					cart.getCurrencySymbol(),
					cart.isZeroDecimal()
				);
			}

			break;
		default:
			const appliedTaxRates = cart.getAppliedTaxRates();

			Object.values( appliedTaxRates ).forEach( ( taxAmounts, i ) => {
				const taxRateAmount = taxAmounts.reduce(
					( carryTaxAmount, amount ) => {
						return ( carryTaxAmount += amount );
					},
					0
				);

				const taxAmountDisplay = formatCurrency(
					cart.isZeroDecimal()
						? taxRateAmount
						: convertToDollars( taxRateAmount ),
					true,
					cart.getCurrencySymbol(),
					cart.isZeroDecimal()
				);

				const valueEl = paymentForm.querySelector(
					`.simpay-tax-amount-value-${
						Object.keys( appliedTaxRates )[ i ]
					}`
				);
				valueEl.innerText = taxAmountDisplay;
			} );
	}
}

/**
 * Update "Fee recovery" amount.
 *
 * @param {Object} paymentForm Payment form.
 */
function feeRecoveryAmount( paymentForm ) {
	const containerEl = paymentForm.querySelector(
		'.simpay-fee-recovery-container'
	);

	if ( ! containerEl ) {
		return;
	}

	const valueEl = paymentForm.querySelector(
		'.simpay-fee-recovery-amount-value'
	);

	const { cart, convertToDollars, formatCurrency, state } = paymentForm;
	const { paymentMethod } = state;
	const totalDueToday = cart.getTotalDueToday( {
		includeFeeRecovery: false,
	} );

	// If there is a trial, show the fee recovery amount for recurring amount.
	let feeAmount =
		0 === totalDueToday
			? cart.getNextInvoiceTotal( { includeFeeRecoveryFee: false } )
			: totalDueToday;

	containerEl.style.display = paymentMethod.config?.fee_recovery
		? 'block'
		: 'none';

	feeAmount = formatCurrency(
		cart.isZeroDecimal()
			? cart.getFeeRecoveryForAmount( feeAmount )
			: convertToDollars( cart.getFeeRecoveryForAmount( feeAmount ) ),
		true,
		cart.getCurrencySymbol(),
		cart.isZeroDecimal()
	);

	valueEl.innerText = feeAmount;
}

/**
 * Generates a string explaining the recurring charges.
 *
 * $100 every month
 * $100 every 30 days
 * $100 every month then $150 every month
 * $100 every 30 days then $150 every 30 days
 *
 * @param {Object} paymentForm
 * @return {string} Generated recurring amount string.
 */
function getRecurringAmountDisplay( paymentForm ) {
	const {
		cart,
		convertToDollars,
		formatCurrency,
		i18n: {
			recurringIntervals,
			recurringIntervalDisplay,
			recurringIntervalDisplayLimitedDiscount,
			recurringIntervalDisplayAutomaticTaxDiscount,
			recurringIntervalDisplayInvoiceLimit,
			recurringIntervalDisplayInvoiceLimitWithCoupon,
		},
		settings,
	} = paymentForm;

	const { coupon: couponObj, taxStatus } = cart;

	let lineItem;

	if ( 'no' === settings.allowMultipleLineItem ) {
		lineItem = cart.getLineItem( 'base' );

		// Find the first line item with a subscription interval, and use that.
		// They all have the same interval.
	} else {
		const lineItems = cart.getLineItems();

		lineItem =
			lineItems.find(
				( item ) => item.checked && item.price?.recurring?.interval
			) ?? cart.getLineItem( 'base' );
	}

	const invoiceLimit = lineItem.subscription?.invoice_limit ?? undefined;
	const interval = lineItem.price.recurring.interval;
	const intervalCount = lineItem.price.recurring.interval_count;

	// Find the nouns for the subscription interval, i.e "month" and "months".
	const recurringIntervalDisplayNouns = recurringIntervals[ interval ];

	const recurringNextInvoice = formatCurrency(
		cart.isZeroDecimal()
			? cart.getNextInvoiceTotal()
			: convertToDollars( cart.getNextInvoiceTotal() ),
		true,
		cart.getCurrencySymbol(),
		cart.isZeroDecimal()
	);

	let placeholderString;

	// If there is an Invoice Limit show the number of payments.
	// This uses a simplified label when a coupon is applied to avoid needing
	// to show the number of invoices that are discounted, and the number that
	// are not discounted.
	if ( invoiceLimit ) {
		const hasLimitedCoupon = couponObj && 'forever' !== couponObj.duration;

		placeholderString = hasLimitedCoupon
			? recurringIntervalDisplayInvoiceLimitWithCoupon
			: recurringIntervalDisplayInvoiceLimit;

		placeholderString = placeholderString
			.replace( '%1$d', invoiceLimit )
			.replace( '%2$s', recurringNextInvoice )
			.replace( '%3$s', intervalCount === 1 ? '' : intervalCount )
			.replace(
				'%4$s',
				intervalCount === 1
					? recurringIntervalDisplayNouns[ 0 ]
					: recurringIntervalDisplayNouns[ 1 ]
			);

		return placeholderString;
	}

	const recurringNoDiscount = formatCurrency(
		cart.isZeroDecimal()
			? cart.getRecurringNoDiscountTotal()
			: convertToDollars( cart.getRecurringNoDiscountTotal() ),
		true,
		cart.getCurrencySymbol(),
		cart.isZeroDecimal()
	);

	// Repeating coupon duration is larger than the subscription interval.
	// Replace initial recurring amount with the discounted amount.
	if (
		couponObj &&
		'repeating' === couponObj.duration &&
		couponObj.duration_in_months >=
			getIntervalCountInMonths( interval, intervalCount )
	) {
		// %1$s every %2$s %3$s for %4$s %5$s then %6$s
		if ( 'automatic' === taxStatus ) {
			placeholderString = recurringIntervalDisplayAutomaticTaxDiscount.replace(
				'%1$s',
				recurringNextInvoice
			);
		} else {
			placeholderString = recurringIntervalDisplayLimitedDiscount.replace(
				'%1$s',
				recurringNextInvoice
			);
		}

		// One time coupon.
		// Replace the initial recurring amount with the non-discounted amount.
	} else if ( couponObj && 'once' === couponObj.duration ) {
		// %1$s every %2$s %3$s
		placeholderString = recurringIntervalDisplay.replace(
			'%1$s',
			recurringNoDiscount
		);

		// Forever repeating coupon.
		// Replace the recurring amount with the discounted amount.
	} else if ( couponObj && 'forever' === couponObj.duration ) {
		// %1$s every %2$s %3$s
		placeholderString = recurringIntervalDisplay.replace(
			'%1$s',
			recurringNextInvoice
		);

		// No coupon.
		// Replace the recurring amount with the discounted amount.
	} else {
		// %1$s every %2$s %3$s
		placeholderString = recurringIntervalDisplay.replace(
			'%1$s',
			recurringNoDiscount
		);
	}

	// $100 every 30 days %4$s (...)
	placeholderString = placeholderString.replace(
		'%2$s',
		intervalCount === 1 ? '' : intervalCount
	);

	placeholderString = placeholderString.replace(
		'%3$s',
		intervalCount === 1
			? recurringIntervalDisplayNouns[ 0 ]
			: recurringIntervalDisplayNouns[ 1 ]
	);

	// $100 every 30 days for 2 months then %6$s
	if ( couponObj && couponObj.duration_in_months ) {
		placeholderString = placeholderString.replace(
			'%4$s',
			couponObj.duration_in_months
		);
	}

	// $100 every 30 days for %4$s %5$s then $150 every 30 days
	placeholderString = placeholderString.replace(
		'%5$s',
		recurringIntervalDisplay
			.replace( '%1$s', recurringNoDiscount )
			.replace( '%2$s', intervalCount === 1 ? '' : intervalCount )
			.replace(
				'%3$s',
				intervalCount === 1
					? recurringIntervalDisplayNouns[ 0 ]
					: recurringIntervalDisplayNouns[ 1 ]
			)
	);

	return placeholderString;
}

/**
 * Returns the number of months for a given interval and interval count.
 *
 * @since 4.4.6
 *
 * @param {'day'|'week'|'month'|'year'} interval Billing interval.
 * @param {int} intervalCount Billing interval count.
 * @return {int} Number of months in the billing interval.
 */
function getIntervalCountInMonths( interval, intervalCount ) {
	switch ( interval ) {
		case 'day':
			return intervalCount / 30;
		case 'week':
			return intervalCount / 4;
		case 'month':
			return intervalCount;
		case 'year':
			return 12;
	}
}

/**
 * Sets up the "Amount Breakdown" custom field.
 *
 * @since 4.7.0
 *
 * @param {jQuery} $paymentForm Payment form
 * @param {Object} $paymentForm.paymentForm Payment form.
 */
function setupAmountBreakdown( $paymentForm ) {
	const { paymentForm } = $paymentForm;

	$paymentForm.on( 'totalChanged', () => {
		update( paymentForm );
	} );

	update( paymentForm );
}

export default setupAmountBreakdown;
