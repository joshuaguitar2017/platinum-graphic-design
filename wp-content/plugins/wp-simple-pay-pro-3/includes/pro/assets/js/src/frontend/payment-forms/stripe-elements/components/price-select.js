/* global $, _, spShared */

const { debugLog } = spShared;

/**
 * Clears previously set errors.
 *
 * @param {jQuery} spFormElem Form element jQuery object.
 */
function clearErrors( spFormElem ) {
	const errorEl = spFormElem[ 0 ].querySelector( '.simpay-errors' );
	errorEl.innerHTML = '';

	const customAmountInputEl = spFormElem[ 0 ].querySelector(
		'input[name="simpay_custom_price_amount"]'
	);

	if ( ! customAmountInputEl ) {
		return;
	}

	customAmountInputEl.classList.remove( 'simpay-input-error' );
}

/**
 * Updates legacy form data and DOM elements.
 *
 * @param {Object} price Selected price option.
 * @param {jQuery} spFormElem Form element jQuery object.
 * @param {Object} formData Configured form data.
 */
function __unstableUpdateLegacyFormData( price, spFormElem, formData ) {
	const {
		id = '',
		can_recur: canRecur,
		unit_amount: unitAmount,
		recurring,
		line_items: lineItems,
	} = price;

	const { convertToDollars } = window.spShared;

	const {
		interval = '',
		interval_count: intervalCount = 1,
		trial_period_days: trialPeriodDays = false,
		invoice_limit: invoiceLimit = 0,
	} = recurring || {};

	const planSetupFee =
		lineItems && lineItems[ 1 ]
			? convertToDollars( lineItems[ 1 ].unit_amount )
			: 0;

	spFormElem.find( '.simpay-multi-plan-id' ).val( id );
	spFormElem.find( '.simpay-multi-plan-setup-fee' ).val( planSetupFee );
	spFormElem.find( '.simpay-max-charges' ).val( invoiceLimit );
	spFormElem.find( '.simpay-has-custom-plan' ).val( '' === id ? 'true' : '' );

	formData.planId = id;
	formData.planSetupFee = planSetupFee;
	formData.planAmount = convertToDollars( unitAmount );
	formData.planInterval = interval;
	formData.planIntervalCount = intervalCount;
	formData.amount = trialPeriodDays ? 0 : formData.amount;
	formData.useCustomPlan = '' === id;
}

/**
 * Updates the cart when a price option changes.
 *
 * @param {HTMLElement} priceEl Selected price option.
 * @param {jQuery} spFormElem Form element jQuery object.
 * @param {Object} formData Configured form data.
 */
function onChangePrice( priceEl, spFormElem, formData ) {
	const { cart, state } = spFormElem;
	const price = JSON.parse( priceEl.dataset.price );

	const {
		id,
		can_recur: canRecur,
		unit_amount: unitAmount,
		recurring,
		line_items: lineItems,
	} = price;
	const { trial_period_days: trialPeriodDays = false } = recurring || {};

	// Clear previous errors.
	clearErrors( spFormElem );

	// Update cart base item.
	const item = cart.getLineItem( 'base' );
	const args = {
		...item,
		amount: parseInt( unitAmount ),
		title: price.label || price.generated_label,
		price,
	};

	if ( recurring && false === canRecur ) {
		args.subscription = {
			isTrial: recurring.trial_period_days
				? parseInt( recurring.trial_period_days )
				: false,
			interval: recurring.interval,
			intervalCount: parseInt( recurring.interval_count ),
		};
	} else {
		args.subscription = false;
	}

	item.update( args );

	// Update fees.
	const setupFeeItem = cart.getLineItem( 'setup-fee' );
	const planSetupFeeItem = cart.getLineItem( 'plan-setup-fee' );

	setupFeeItem.update( {
		...setupFeeItem,
		amount:
			lineItems && lineItems[ 0 ] && false === canRecur
				? parseInt( lineItems[ 0 ].unit_amount )
				: 0,
	} );

	planSetupFeeItem.update( {
		...planSetupFeeItem,
		amount:
			lineItems && lineItems[ 1 ] && false === canRecur
				? parseInt( lineItems[ 1 ].unit_amount )
				: 0,
	} );

	spFormElem.setState( {
		price,
		isTrial: trialPeriodDays,
		isSubscription: false === canRecur && ! _.isEmpty( recurring ),
		isCustomAmount: id.startsWith( 'simpay_' ),
		customAmount: unitAmount,
	} );

	// Alert the rest of components a price has changed.
	spFormElem.trigger( 'simpayMultiPlanChanged', [ price ] );

	// Alert the rest of the components they need to update.
	spFormElem.trigger( 'totalChanged', [ spFormElem, formData ] );

	// Update legacy formData.
	__unstableUpdateLegacyFormData( price, spFormElem, formData );
}

/**
 * Bind events to Payment Form.
 */
$( document.body ).on(
	'simpayBindCoreFormEventsAndTriggers',
	// eslint-disable-line no-unused-vars
	( e, spFormElem, formData ) => {
		const priceOptions = spFormElem[ 0 ].querySelector(
			'.simpay-plan-select-container'
		);

		if ( ! priceOptions ) {
			return;
		}

		const { displayType } = priceOptions.dataset;
		let activeItemSelector;

		const priceListEls = spFormElem[ 0 ].querySelectorAll(
			'[name="simpay_price"]'
		);

		if ( 'dropdown' === displayType ) {
			activeItemSelector = ':selected';
		} else {
			activeItemSelector = ':checked';
		}

		// Set on change.
		_.each( priceListEls, ( priceEl ) => {
			priceEl.addEventListener( 'change', ( { target } ) => {
				spFormElem.isDirty = true;

				let _target;

				if ( 'dropdown' === displayType ) {
					_target = target.options[ target.selectedIndex ];
				} else {
					_target = target;
				}

				onChangePrice( _target, spFormElem, formData );
			} );
		} );

		// Set on page load.
		onChangePrice(
			// Use a jQuery selector for better :checked and :selected support.
			spFormElem.find(
				`.simpay-plan-wrapper ${ activeItemSelector }`
			)[ 0 ],
			spFormElem,
			formData
		);
	}
);
