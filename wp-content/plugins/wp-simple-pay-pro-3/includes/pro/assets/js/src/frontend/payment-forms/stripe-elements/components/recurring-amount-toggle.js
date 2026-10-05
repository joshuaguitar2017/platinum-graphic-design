/**
 * Internal dependencies
 */
import { onChangePrice as updatePaymentMethods } from './payment-methods.js';

/**
 * Show/hides the Recurring Amount TOggle field depending on the selected price.
 *
 * @param {Object} price Selected price option.
 * @param {jQuery} spFormElem Form element jQuery object.
 */
function onChangePrice( price, spFormElem ) {
	const { can_recur: canRecur } = price;

	const recurringAmountToggleWrapper = spFormElem[ 0 ].querySelector(
		'.simpay-recurring-amount-toggle-container'
	);

	if ( ! recurringAmountToggleWrapper ) {
		return;
	}

	const recurringAmountToggleInput = spFormElem[ 0 ].querySelector(
		'.simpay-recurring-amount-toggle'
	);

	// Uncheck and reset state on each change.
	recurringAmountToggleInput.checked = false;
	spFormElem.setState( {
		isRecurring: false,
	} );

	// Show/hide toggle.
	recurringAmountToggleWrapper.style.display = canRecur ? 'block' : 'none';
}

/**
 * Updates the cart when an item has been toggled to recur.
 *
 * @param {HTMLElement} target Recurring amount toggle input.
 * @param {jQuery} spFormElem Form element jQuery object.
 * @param {Object} formData Configured form data.
 */
function onToggleRecurring( target, spFormElem, formData ) {
	const { cart } = spFormElem;

	try {
		// Update cart base item.
		const item = cart.getLineItem( 'base' );
		const { price } = item;
		const { recurring, line_items: lineItems } = price;

		const subscription =
			true === target.checked
				? {
						isTrial: recurring.trial_period_days
							? parseInt( recurring.trial_period_days )
							: false,
						interval: recurring.interval,
						intervalCount: parseInt( recurring.interval_count ),
				  }
				: false;

		item.update( {
			...item,
			subscription,
		} );

		// Update fees.
		const setupFeeItem = cart.getLineItem( 'setup-fee' );
		const planSetupFeeItem = cart.getLineItem( 'plan-setup-fee' );

		setupFeeItem.update( {
			...setupFeeItem,
			amount:
				true === target.checked && lineItems && lineItems[ 0 ]
					? parseInt( lineItems[ 0 ].unit_amount )
					: 0,
		} );

		planSetupFeeItem.update( {
			...planSetupFeeItem,
			amount:
				true === target.checked && lineItems && lineItems[ 1 ]
					? parseInt( lineItems[ 1 ].unit_amount )
					: 0,
		} );

		spFormElem.setState( {
			isRecurring: target.checked,
		} );

		// Alert the rest of the components they need to update.
		spFormElem.trigger( 'totalChanged', [ spFormElem, formData ] );

		// On the fly update of available Payment Methods.
		updatePaymentMethods( price, spFormElem, formData );
	} catch {
		// Error has been previously displayed.
	}
}

/**
 * Binds the "Recurring Amount Toggle" input events.
 *
 * @param {jQuery} spFormElem Form element jQuery object.
 * @param {Object} formData Configured form data.
 */
function bindRecurringCheckbox( spFormElem, formData ) {
	const recurringAmountToggleInput = spFormElem[ 0 ].querySelector(
		'.simpay-recurring-amount-toggle'
	);

	if ( ! recurringAmountToggleInput ) {
		return;
	}

	recurringAmountToggleInput.addEventListener( 'change', ( { target } ) => {
		onToggleRecurring( target, spFormElem, formData );
	} );
}

/**
 * Bind events to Payment Form.
 */
$( document.body ).on(
	'simpayBindCoreFormEventsAndTriggers',
	// eslint-disable-line no-unused-vars
	( e, spFormElem, formData ) => {
		// Update amount when a price option selection changes.
		// eslint-disable-line no-unused-vars
		spFormElem.on( 'simpayMultiPlanChanged', ( e, price ) => {
			onChangePrice( price, spFormElem, formData );
		} );

		// Update amount when the input changes.
		bindRecurringCheckbox( spFormElem, formData );
	}
);
