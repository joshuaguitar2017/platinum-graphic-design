/**
 * Show/hides the Recurring Amount TOggle field depending on the selected price.
 *
 * @param {jQuery} $paymentForm Payment form.
 * @param {Object} $paymentForm.paymentForm Payment form.
 */
function onChangePrice( { paymentForm } ) {
	const { cart, settings } = paymentForm;
	const { price } = cart.getLineItem( 'base' );
	const { can_recur: canRecur } = price;

	const recurringAmountToggleWrapper = paymentForm.querySelector(
		'.simpay-recurring-amount-toggle-container'
	);

	if ( ! recurringAmountToggleWrapper ) {
		return;
	}

	const recurringAmountToggleInput = paymentForm.querySelector(
		'.simpay-recurring-amount-toggle'
	);

	// Uncheck and reset state on each change.
	recurringAmountToggleInput.checked = false;
	paymentForm.setState( {
		isOptionallyRecurring: false,
	} );

	// Show/hide toggle.
	if ( 'yes' !== settings.allowMultipleLineItem ) {
		recurringAmountToggleWrapper.style.display = canRecur
			? 'block'
			: 'none';
	}
}

/**
 * Updates the cart when an item has been toggled to recur.
 *
 * @param {HTMLElement} target Recurring amount toggle input.
 * @param {jQuery} $paymentForm Payment form.
 */
function onToggleRecurring( target, $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const { cart, setState } = paymentForm;

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
		isOptionallyRecurring: target.checked,
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

	setState( {
		isOptionallyRecurring: target.checked,
	} );

	// Alert the rest of the components they need to update.
	$paymentForm.trigger( 'totalChanged', [ $paymentForm ] );
}

/**
 * Binds the "Recurring Amount Toggle" input events.
 *
 * @param {jQuery} $paymentForm Payment form.
 * @param {Object} $paymentForm.paymentForm Payment form.
 */
function bindRecurringCheckbox( $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const recurringAmountToggleInput = paymentForm.querySelector(
		'.simpay-recurring-amount-toggle'
	);

	if ( ! recurringAmountToggleInput ) {
		return;
	}

	recurringAmountToggleInput.addEventListener( 'change', ( { target } ) => {
		onToggleRecurring( target, $paymentForm );
	} );
}

/**
 * Sets up the "Recurring Amount Toggle" custom field.
 *
 * @since 4.7.0
 *
 * @param {jQuery} $paymentForm Payment form
 * @param {Object} $paymentForm.paymentForm Payment form.
 */
function setupRecurringAmountToggle( $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const { settings } = paymentForm;
	// Update the display when a price option selection changes.
	$paymentForm.on( 'simpayMultiPlanChanged', () =>
		onChangePrice( $paymentForm )
	);

	// Update the display on page load.
	onChangePrice( $paymentForm );

	if ( 'yes' !== settings.allowMultipleLineItem ) {
		// Bind display updates to the recurring amount toggle.
		bindRecurringCheckbox( $paymentForm );
	}
}

export default setupRecurringAmountToggle;
