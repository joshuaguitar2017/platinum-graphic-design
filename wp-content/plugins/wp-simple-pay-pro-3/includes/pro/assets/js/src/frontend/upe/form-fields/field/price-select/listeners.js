import { onChangePrice } from '.';
import {
	getQuantity,
	hideCustomAmountError,
	showCustomAmountError,
} from './helpers';
/**
 * Listen for quantity changes.
 *
 * @since 4.11.0
 *
 * @param {jQuery} $paymentForm Payment form.
 * @param {Object} $paymentForm.paymentForm Payment form.
 * @return {void}
 */
export function listenForQuantityChange( $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const quantityFields = paymentForm.querySelectorAll(
		'.simpay-quantity-field-input'
	);

	if ( ! quantityFields ) {
		return;
	}

	quantityFields.forEach( ( quantityField ) => {
		quantityField.addEventListener( 'change', ( { target } ) => {
			const priceEl = target
				.closest( '.simpay-price-selection-label' )
				.querySelector( '[name="simpay_price"]' );
			onChangePrice( priceEl, $paymentForm );
		} );
	} );
}

/**
 * Listen for custom amount changes.
 *
 * @since 4.11.0
 * @param {jQuery} $paymentForm Payment form.
 * @param {Object} $paymentForm.paymentForm Payment form.
 * @return {void}
 */
export function listenForCustomAmountChange( $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const {
		cart,
		i18n,
		unformatCurrency,
		formatCurrency,
		convertToCents,
		convertToDollars,
	} = paymentForm;
	const customAmountFields = paymentForm.querySelectorAll(
		'.simpay-custom-amount-input'
	);

	if ( ! customAmountFields ) {
		return;
	}

	customAmountFields.forEach( ( customAmountField ) => {
		// Get closest price option.
		const priceEl = customAmountField
			.closest( '.simpay-price-selection-label' )
			.querySelector( '[name="simpay_price"]' );

		if ( ! priceEl ) {
			return;
		}

		// Get price data.
		const { id: singlePriceId } = JSON.parse( priceEl.dataset.price );

		if ( ! customAmountField ) {
			return;
		}

		customAmountField.addEventListener( 'input', ( { target } ) => {
			const isBaseItem = cart.getBaseItemPriceId() === singlePriceId;
			const itemId = isBaseItem ? 'base' : singlePriceId;
			const item = cart.getLineItem( itemId );
			const customAmount = item.price.is_zero_decimal
				? unformatCurrency( target.value )
				: convertToCents( unformatCurrency( target.value ) );
			const minAmount = parseInt( item.price.unit_amount_min );
			const unitAmountMinCurrency = formatCurrency(
				item.price.is_zero_decimal
					? minAmount
					: convertToDollars( minAmount ),
				true,
				cart.getCurrencySymbol(),
				item.price.is_zero_decimal
			);
			// If custom amount is less than the minimum amount.
			if ( customAmount < item.price.unit_amount_min ) {
				const errorMessage = i18n.minCustomAmountError.replace(
					'%s',
					unitAmountMinCurrency
				);

				showCustomAmountError( customAmountField, errorMessage );
				return;
			}

			hideCustomAmountError( customAmountField );

			const args = {
				...item,
				id: itemId,
				amount: customAmount,
				quantity: getQuantity( priceEl ),
				checked: true,
			};

			cart.updateLineItem( singlePriceId, args );

			// update dataset.
			priceEl.dataset.price = JSON.stringify( {
				...item.price,
				unit_amount: args.amount,
			} );

			// Alert the rest of the components they need to update.
			$paymentForm.trigger( 'totalChanged', [ $paymentForm ] );
		} );
	} );
}

/**
 * Listen for recurring toggle.
 *
 * @since 4.11.0
 *
 * @param {jQuery} $paymentForm Payment form.
 * @param {Object} $paymentForm.paymentForm Payment form.
 * @return {void}
 */
export function listenForRecurringToggle( $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const recurringToggleEls = paymentForm.querySelectorAll(
		'.simpay-recurring-amount-toggle'
	);

	if ( ! recurringToggleEls ) {
		return;
	}

	recurringToggleEls.forEach( ( recurringToggleEl ) => {
		recurringToggleEl.addEventListener( 'change', ( { target } ) => {
			const priceEl = target
				.closest( '.simpay-price-selection-label' )
				.querySelector( '[name="simpay_price"]' );
			onChangePrice( priceEl, $paymentForm );
		} );
	} );
}
