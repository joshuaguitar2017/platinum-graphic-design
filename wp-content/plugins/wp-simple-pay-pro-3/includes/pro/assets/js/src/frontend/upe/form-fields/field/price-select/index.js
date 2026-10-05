import {
	listenForQuantityChange,
	listenForCustomAmountChange,
	listenForRecurringToggle,
} from './listeners';

import {
	getQuantity,
	removeItem,
	isRecurringEnabled,
	uncheckMixedRecurringPrices,
	uncheckMixedCurrencyPrices,
	ensureOnePriceChecked,
} from './helpers';
import { toggleExtraFields } from './fields';
/**
 * Updates the cart when a price option changes.
 *
 * @param {HTMLElement} priceEl Selected price option.
 * @param {jQuery} $paymentForm Form element jQuery object.
 */
export function onChangePrice( priceEl, $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const { cart, error, setState, settings } = paymentForm;
	const price = JSON.parse( priceEl.dataset.price );
	// Clear any previous error associated with the price.
	error( '' );

	const {
		id,
		can_recur: canRecur,
		recurring,
		line_items: lineItems,
		unit_amount: unitAmount,
	} = price;
	const { trial_period_days: trialPeriodDays = false } = recurring || {};

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

	// Update cart line items.
	if ( 'yes' !== settings.allowMultipleLineItem ) {
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

		const isCustomAmount = id.startsWith( 'simpay_' );

		setState( {
			price,
			isCustomAmount,
			customAmount: isCustomAmount ? unitAmount : null,
			isTrial: trialPeriodDays,
		} );

		// Alert the rest of components a price has changed.
		$paymentForm.trigger( 'simpayMultiPlanChanged', [
			price,
			$paymentForm,
		] );
	} else {
		// If multiple line items are allowed.
		const priceListEls = paymentForm.querySelectorAll(
			'[name="simpay_price"]'
		);

		uncheckMixedRecurringPrices( priceEl, priceListEls );
		uncheckMixedCurrencyPrices( priceEl, priceListEls );
		ensureOnePriceChecked( priceEl, priceListEls );

		let singleItem = {};

		priceListEls.forEach( ( singlePriceEl ) => {
			// Update cart line items.
			const singlePrice = JSON.parse( singlePriceEl.dataset.price );
			const {
				id: singlePriceId,
				generated_label: singlePriceLabel,
				unit_amount: singlePriceUnitAmount,
			} = singlePrice;

			const sp = singlePrice;
			const isChecked = singlePriceEl.checked;
			const isBaseItem = cart.getBaseItemPriceId() === singlePriceId;
			const parsedAmount =
				Number.parseInt( singlePriceUnitAmount, 10 ) || 0;
			const fees = singlePrice.line_items || [];
			const quantity = getQuantity( singlePriceEl );

			if ( isChecked ) {
				singleItem = {
					id: isBaseItem ? 'base' : singlePriceId,
					title: singlePriceLabel,
					amount: parsedAmount,
					quantity,
					price: sp,
					checked: true,
					fees,
					isOptionallyRecurring: isRecurringEnabled( singlePriceEl ),
				};

				if ( isBaseItem ) {
					cart.updateLineItem( singlePriceId, singleItem );
				} else {
					cart.addLineItem( singleItem );
				}
			} else {
				removeItem(
					singlePriceId,
					singlePriceLabel,
					sp,
					cart,
					isBaseItem,
					fees,
					isRecurringEnabled( singlePriceEl )
				);
			}
			cart.removeDuplicateLineItems();
		} );
	}

	// Alert the rest of the components they need to update.
	$paymentForm.trigger( 'totalChanged', [ $paymentForm ] );
}

/**
 * Sets up the "Price Select" custom field.
 *
 * @since 4.7.0
 *
 * @param {jQuery} $paymentForm Payment form
 * @param {Object} $paymentForm.paymentForm Payment form.
 */
function setupPriceSelect( $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const { settings } = paymentForm;
	const priceOptions = paymentForm.querySelector(
		'.simpay-plan-select-container'
	);

	if ( ! priceOptions ) {
		return;
	}

	let { displayType } = priceOptions.dataset;
	let activeItemSelector;

	const priceListEls = paymentForm.querySelectorAll(
		'[name="simpay_price"]'
	);

	// if multiple line items are allowed, we need to use basic style.
	if ( 'yes' === settings.allowMultipleLineItem ) {
		displayType = 'radio';
	}

	if ( 'dropdown' === displayType ) {
		activeItemSelector = ':selected';
	} else {
		activeItemSelector = ':checked';
	}

	// Use a jQuery selector for better :checked and :selected support.
	let activeItem = $paymentForm.find(
		`.simpay-plan-wrapper ${ activeItemSelector }`
	)[ 0 ];

	if ( ! activeItem ) {
		if ( 'dropdown' === displayType ) {
			activeItem = priceOptions.querySelector( 'option:not([disabled])' );
			activeItem.selected = true;
		} else {
			activeItem = priceOptions.querySelector(
				'input:not([disabled]):not([type="number"])'
			);
			activeItem.checked = true;
		}
	}

	// Set on change.
	priceListEls.forEach( ( priceEl ) => {
		toggleExtraFields( priceEl, $paymentForm );
		priceEl.addEventListener( 'change', ( { target } ) => {
			let _target;

			if ( 'dropdown' === displayType ) {
				_target = target.options[ target.selectedIndex ];
			} else {
				_target = target;
			}

			onChangePrice( _target, $paymentForm );
		} );
	} );

	// Set on page load.
	onChangePrice( activeItem, $paymentForm );

	if ( 'yes' === settings.allowMultipleLineItem ) {
		// Listen for quantity changes.
		listenForQuantityChange( $paymentForm );

		// Listen for custom amount changes
		listenForCustomAmountChange( $paymentForm );

		// Listen for recurring toggle changes
		listenForRecurringToggle( $paymentForm );

		// Listen for total changes to toggle extra fields.
		$paymentForm.on( 'totalChanged', () => {
			priceListEls.forEach( ( priceEl ) => {
				toggleExtraFields( priceEl, $paymentForm );
			} );
		} );
	}
}

export default setupPriceSelect;
