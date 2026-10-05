import { isOnlyOnePriceSelected } from './helpers';

/**
 * Toggle extra fields based on the selected price option.
 *
 * @since 4.11.0
 * @param {HTMLElement} priceEl Selected price option.
 * @param {jQuery} $paymentForm Payment form.
 * @return {void}
 */
export function toggleExtraFields( priceEl, $paymentForm ) {
	if ( priceEl.type === 'radio' ) {
		toggleExtraFieldsForRadio( priceEl, $paymentForm );
	} else {
		const parentLabel = priceEl.closest( '.simpay-price-selection-label' );

		if ( ! parentLabel ) {
			return;
		}

		const additionalFieldsEl = parentLabel.querySelector(
			'.simpay-additional-fields'
		);

		if ( ! additionalFieldsEl ) {
			return;
		}

		additionalFieldsEl.style.display = priceEl.checked ? 'flex' : 'none';
	}
}

export function toggleExtraFieldsForRadio( priceEl, $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const parentLabel = priceEl.closest( '.simpay-price-selection-label' );
	const allQuantityFields = paymentForm.querySelectorAll(
		'.simpay-quantity-field'
	);
	const allRecurringFields = paymentForm.querySelectorAll(
		'.simpay-recurring-amount-toggle-container'
	);

	allQuantityFields.forEach( ( quantityField ) => {
		quantityField.style.display = 'none';
	} );

	allRecurringFields.forEach( ( recurringField ) => {
		recurringField.style.display = 'none';
	} );

	if ( ! parentLabel ) {
		return;
	}

	const quantityField = parentLabel.querySelector( '.simpay-quantity-field' );
	if ( ! quantityField ) {
		return;
	}
	const recurringField = parentLabel.querySelector(
		'.simpay-recurring-amount-toggle-container'
	);

	if ( quantityField ) {
		quantityField.style.display = 'flex';
	}

	if ( recurringField ) {
		recurringField.style.display = 'flex';
	}
}
