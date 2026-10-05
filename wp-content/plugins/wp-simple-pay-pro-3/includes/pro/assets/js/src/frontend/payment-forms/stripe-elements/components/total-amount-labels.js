/* global _ */

const { convertToDollars, formatCurrency } = window.spShared;

/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Update all labels.
 *
 * @param {Event} e Change event.
 * @param {jQuery} spFormElem Form element jQuery object.
 * @param {Object} formData Configured form data.
 */
export function update( e, spFormElem, formData ) {
	subtotalAmount( spFormElem, formData );
	couponAmount( spFormElem, formData );
	taxAmount( spFormElem, formData );
	totalAmount( spFormElem, formData );
	feeRecoveryAmount( spFormElem, formData );
	recurringAmount( spFormElem, formData );
}

/**
 * Update "Subtotal Amount" display amount.
 *
 * @since 4.1.0
 *
 * @param {jQuery} spFormElem Form element jQuery object.
 */
function subtotalAmount( spFormElem ) {
	const { cart } = spFormElem;

	const subtotalAmount = formatCurrency(
		cart.isZeroDecimal()
			? cart.getSubtotal()
			: convertToDollars( cart.getSubtotal() ),
		true,
		cart.getCurrencySymbol(),
		cart.isZeroDecimal()
	);

	spFormElem.find( '.simpay-subtotal-amount-value' ).text( subtotalAmount );

	// Toggle visibility. Hide if subtotal and total are the same.
	spFormElem
		.find( '.simpay-subtotal-amount-container' )
		.toggle(
			cart.getTotal() !== cart.getSubtotal() ||
				'automatic' === cart.taxStatus
		);
}

/**
 * Updates the "Coupon" amount.
 *
 * @since 4.1.0
 *
 * @param {jQuery} spFormElem Form element jQuery object.
 */
function couponAmount( spFormElem ) {
	const { cart } = spFormElem;
	const coupon = cart.getCoupon();

	// Toggle container.
	spFormElem
		.find( '.simpay-coupon-amount-container' )
		.toggle( typeof coupon === 'object' );

	if ( 'object' === typeof coupon ) {
		const discountAmount = formatCurrency(
			cart.isZeroDecimal()
				? cart.getDiscount()
				: convertToDollars( cart.getDiscount() ),
			true,
			cart.getCurrencySymbol(),
			cart.isZeroDecimal()
		);

		spFormElem.find( '.simpay-coupon-amount-name' ).text( coupon.id );
		spFormElem
			.find( '.simpay-coupon-amount-value' )
			.text( `-${ discountAmount }` );
	}
}

/**
 * Update "Total Amount" label, and Submit Button label.
 *
 * @param {jQuery} spFormElem Form element jQuery object.
 * @param {Object} formData Configured form data.
 */
function totalAmount( spFormElem, formData ) {
	const { cart } = spFormElem;

	const totalAmount = formatCurrency(
		cart.isZeroDecimal()
			? cart.getTotalDueToday()
			: convertToDollars( cart.getTotalDueToday() ),
		true,
		cart.getCurrencySymbol(),
		cart.isZeroDecimal()
	);

	spFormElem.find( '.simpay-total-amount-value' ).text( totalAmount );

	// @todo Remove and run elsewhere.
	window.simpayApp.setCoreFinalAmount( spFormElem, formData );
}

/**
 * Update "Recurring Amount" label.
 *
 * @since 3.7.0
 *
 * @param {jQuery} spFormElem Form element jQuery object.
 */
function recurringAmount( spFormElem ) {
	const recurringAmountWrapper = spFormElem[ 0 ].querySelector(
		'.simpay-total-amount-recurring-container'
	);

	if ( ! recurringAmountWrapper ) {
		return;
	}

	try {
		const { cart } = spFormElem;
		const { subscription } = cart.getLineItem( 'base' );

		if ( false === subscription ) {
			recurringAmountWrapper.style.display = 'none';
		} else {
			const recurringAmountDisplay = getRecurringAmountDisplay(
				spFormElem
			);

			spFormElem
				.find( '.simpay-total-amount-recurring-value' )
				.text( recurringAmountDisplay );

			recurringAmountWrapper.style.display = 'block';
		}
	} catch ( error ) {
		console.log( error );
		recurringAmountWrapper.style.display = 'none';
	}
}

/**
 * Update "Tax Amount" label.
 *
 * @since 3.7.0
 *
 * @param {jQuery} spFormElem Form element jQuery object.
 */
function taxAmount( spFormElem ) {
	const { cart, enable: enableForm } = spFormElem;

	// Updated separately in automatic-tax.js
	if ( 'automatic' === cart.taxStatus || 'none' === cart.taxStatus ) {
		enableForm();
		return;
	}

	let totalTaxAmount = 0;
	const appliedTaxRates = cart.getAppliedTaxRates();

	_.forEach( appliedTaxRates, ( taxAmounts, taxRateId ) => {
		const taxRateAmount = taxAmounts.reduce( ( carryTaxAmount, amount ) => {
			return ( carryTaxAmount += amount );
		}, 0 );

		totalTaxAmount += taxRateAmount;

		const taxAmountDisplay = formatCurrency(
			cart.isZeroDecimal()
				? taxRateAmount
				: convertToDollars( taxRateAmount ),
			true,
			cart.getCurrencySymbol(),
			cart.isZeroDecimal()
		);

		spFormElem
			.find( `.simpay-tax-amount-value-${ taxRateId }` )
			.text( taxAmountDisplay );
	} );

	// Track total amount in DOM for backwards compatibility.
	spFormElem.find( '.simpay-tax-amount' ).val( totalTaxAmount );

	enableForm();
}

/**
 * Update "Fee recovery" amount.
 *
 * @param {PaymentForm} paymentForm Payment form.
 */
function feeRecoveryAmount( paymentForm ) {
	const { cart } = paymentForm;
	const totalDueToday = cart.getTotalDueToday( {
		includeFeeRecovery: false,
	} );

	// If there is a trial, show the fee recovery amount for recurring amount.
	let feeAmount =
		0 === totalDueToday
			? cart.getNextInvoiceTotal( { includeFeeRecoveryFe: false } )
			: totalDueToday;

	feeAmount = formatCurrency(
		cart.isZeroDecimal()
			? cart.getFeeRecoveryForAmount( feeAmount )
			: convertToDollars( cart.getFeeRecoveryForAmount( feeAmount ) ),
		true,
		cart.getCurrencySymbol(),
		cart.isZeroDecimal()
	);

	paymentForm.find( '.simpay-fee-recovery-amount-value' ).text( feeAmount );
}

/**
 * Generates a string explaining the recurring charges.
 *
 * $100 every month
 * $100 every 30 days
 * $100 every month then $150 every month
 * $100 every 30 days then $150 every 30 days
 *
 * @param {jQuery} paymentForm Payment form.
 * @return {string} Generated recurring amount string.
 */
function getRecurringAmountDisplay( paymentForm ) {
	const {
		strings: {
			recurringIntervals,
			recurringIntervalDisplay,
			recurringIntervalDisplayLimitedDiscount,
			recurringIntervalDisplayAutomaticTaxDiscount,
			recurringIntervalDisplayInvoiceLimit,
			recurringIntervalDisplayInvoiceLimitWithCoupon,
		},
	} = window.spGeneral;

	const { cart } = paymentForm;
	const { coupon: couponObj, taxStatus } = cart;

	const lineItem = cart.getLineItem( 'base' );
	const {
		price: {
			recurring: { invoice_limit: invoiceLimit },
		},
		subscription: { interval, intervalCount },
	} = lineItem;

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
	placeholderString = placeholderString.replace(
		'%4$s',
		couponObj.duration_in_months
	);

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
 * Bind events to Payment Form.
 *
 * @since 4.1.0
 */
$( document.body ).on(
	'simpayBindCoreFormEventsAndTriggers',
	// eslint-disable-line no-unused-vars
	( e, spFormElem, formData ) => {
		spFormElem.on(
			'totalChanged',
			/**
			 * Runs when the total amount has changed.
			 *
			 * @param {Event} evt Event.
			 */
			( evt ) => {
				update( evt, spFormElem, formData );
			}
		);

		update( null, spFormElem, formData );
	}
);
