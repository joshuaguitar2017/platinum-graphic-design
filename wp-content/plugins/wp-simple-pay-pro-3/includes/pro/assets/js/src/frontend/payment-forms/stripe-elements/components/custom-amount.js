/* global wp, spShared */

const {
	convertToDollars,
	convertToCents,
	formatCurrency,
	unformatCurrency,
	debugLog,
} = spShared;

/**
 * Updates legacy form data.
 *
 * @param {jQuery} spFormElem Form element jQuery object.
 * @param {Object} formData Configured form data.
 */
function __unstableUpdateLegacyFormData( spFormElem, formData ) {
	// eslint-disable-line no-unused-vars
	const { cart } = spFormElem;

	try {
		const { amount } = cart.getLineItem( 'base' );
		const unitAmount = cart.isZeroDecimal()
			? amount
			: convertToDollars( amount );

		if ( formData.isSubscription ) {
			formData.planAmount = unitAmount;
			formData.customPlanAmount = unitAmount;
		}
	} catch {
		// Error has been previously logged.
	}
}

/**
 * Show/hides the Custom Amount field depending on the selected price.
 *
 * @param {Object} price Selected price option.
 * @param {jQuery} spFormElem Form element jQuery object.
 * @param formData
 */
function onChangePrice( price, spFormElem, formData ) {
	const { cart, isDirty } = spFormElem;
	const {
		id,
		unit_amount: unitAmount,
		currency_symbol: currencySymbol,
	} = price;

	const customAmountInputWrapper = spFormElem[ 0 ].querySelector(
		'.simpay-custom-amount-container'
	);

	if ( ! customAmountInputWrapper ) {
		return;
	}

	const customAmountCurrencySymbolEl = customAmountInputWrapper.querySelector(
		'.simpay-currency-symbol'
	);

	const customAmountInput = spFormElem[ 0 ].querySelector(
		'input[name="simpay_custom_price_amount"]'
	);

	// Show/hide element.
	customAmountInputWrapper.style.display = id.startsWith( 'simpay_' )
		? 'block'
		: 'none';

	// Update currency symbol.
	customAmountCurrencySymbolEl.innerHTML = currencySymbol;

	// Update cart.
	const item = cart.getLineItem( 'base' );

	item.update( {
		...item,
		amount: parseInt( unitAmount ),
	} );

	const { prefillDefault } = customAmountInput.dataset;

	// Update prefilled value or placeholder.
	const amount = cart.isZeroDecimal()
		? unitAmount
		: convertToDollars( unitAmount );

	const amountToFill = id.startsWith( 'simpay_' )
		? formatCurrency(
				amount,
				false,
				cart.getCurrencySymbol(),
				cart.isZeroDecimal()
		  )
		: '';

	if ( '' !== prefillDefault ) {
		customAmountInput.value = amountToFill;
	} else {
		customAmountInput.placeholder = amountToFill;
	}

	if ( id.startsWith( 'simpay_' ) && true === isDirty ) {
		customAmountInput.focus();
	}

	// Backwards compatibility.
	__unstableUpdateLegacyFormData( spFormElem, formData );
}

/**
 * Updates the amount when the value of the Custom Amount input changes.
 *
 * @param {string} amount Input value.
 * @param {jQuery} spFormElem Form element jQuery object.
 * @param {Object} formData Configured form data.
 */
function onChangeAmount( amount, spFormElem, formData ) {
	// Save validation for submission.
	if ( '' === amount ) {
		return;
	}

	const { cart, error: onError } = spFormElem;

	try {
		const item = cart.getLineItem( 'base' );
		const { price } = item;
		const { unit_amount_min: unitAmountMin } = price;

		const unitAmount = cart.isZeroDecimal()
			? unformatCurrency( amount )
			: convertToCents( unformatCurrency( amount ) );

		const customAmountInputEl = spFormElem[ 0 ].querySelector(
			'input[name="simpay_custom_price_amount"]'
		);

		const unitAmountMinCurrency = formatCurrency(
			cart.isZeroDecimal()
				? unitAmountMin
				: convertToDollars( unitAmountMin ),
			true,
			cart.getCurrencySymbol(),
			cart.isZeroDecimal()
		);

		// Amount is too low.
		if ( unitAmount < unitAmountMin ) {
			const errorMessage = formData.minCustomAmountError.replace(
				'%s',
				unitAmountMinCurrency
			);

			onError( errorMessage );
			wp.a11y.speak( errorMessage, 'assertive' );

			item.update( {
				...item,
				amount: parseInt( unitAmountMin ),
			} );

			customAmountInputEl.classList.add( 'simpay-input-error' );
			customAmountInputEl.value = '';
			customAmountInputEl.focus();

			// Amount is valid.
		} else {
			onError( '' );
			customAmountInputEl.classList.remove( 'simpay-input-error' );

			item.update( {
				...item,
				amount: parseInt( unitAmount ),
			} );

			customAmountInputEl.value = formatCurrency(
				cart.isZeroDecimal()
					? unitAmount
					: convertToDollars( unitAmount ),
				false,
				cart.getCurrencySymbol(),
				cart.isZeroDecimal()
			);
		}

		spFormElem.setState( {
			customAmount: parseInt( unitAmount ),
		} );

		// Alert the rest of the components they need to update.
		spFormElem.trigger( 'totalChanged', [ spFormElem, formData ] );

		// Backwards compatibility.
		__unstableUpdateLegacyFormData( spFormElem, formData );
	} catch ( error ) {
		debugLog( error );
	}
}

/**
 * Binds events to the Custom Amount input.
 *
 * @param {jQuery} spFormElem Form element jQuery object.
 * @param {Object} formData Configured form data.
 */
function bindAmountInput( spFormElem, formData ) {
	const customAmountInput = spFormElem[ 0 ].querySelector(
		'input[name="simpay_custom_price_amount"]'
	);

	if ( ! customAmountInput ) {
		return;
	}

	customAmountInput.addEventListener( 'blur', ( { target } ) => {
		onChangeAmount( target.value, spFormElem, formData );
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
		bindAmountInput( spFormElem, formData );
	}
);

$( document.body ).on(
	'simpayBeforeStripePayment',
	( e, spFormElem, formData ) => {
		const { cart, error: onError } = spFormElem;
		const { price } = cart.getLineItem( 'base' );

		// Don't validated if selected price option is not custom.
		if ( ! price.id.startsWith( 'simpay_' ) ) {
			return;
		}

		const customAmountInput = spFormElem[ 0 ].querySelector(
			'input[name="simpay_custom_price_amount"]'
		);

		if ( ! customAmountInput ) {
			return;
		}

		try {
			if ( '' === customAmountInput.value ) {
				const { unit_amount_min: unitAmountMin } = price;
				const errorMessage = formData.emptyCustomAmountError.replace(
					'%s',
					formatCurrency(
						cart.isZeroDecimal()
							? unitAmountMin
							: convertToDollars( unitAmountMin ),
						true,
						cart.getCurrencySymbol(),
						cart.isZeroDecimal()
					)
				);

				customAmountInput.focus();
				formData.isValid = false;
				onError( errorMessage );
				customAmountInput.classList.add( 'simpay-input-error' );
			} else {
				formData.isValid = true;
				customAmountInput.classList.remove( 'simpay-input-error' );
			}
		} catch ( error ) {
			formData.isValid = false;
			onError( error );
		}
	}
);
