/* global _ */

/**
 * Internal dependencies
 */
const { doAction } = window.wpsp.hooks;

/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Generates Payment Request API displayItems.
 *
 * @param {PaymentForm} paymentForm
 * @return {Array} List of display items.
 */
function getDisplayItems( paymentForm ) {
	const displayItems = [];

	const { cart, __unstableLegacyFormData } = paymentForm;
	const {
		hasPaymentRequestButton: { i18n },
	} = __unstableLegacyFormData;

	// Add subscription plan to list.
	try {
		const plan = cart.getLineItem( 'base' );
		let label = plan.title ? plan.title : i18n.planLabel;

		if ( plan.quantity > 1 ) {
			label += ` × ${ plan.quantity }`;
		}

		displayItems.push( {
			label,
			amount: plan.getSubtotal(),
		} );
	} catch ( error ) {
		// Item couldn't be found, do not add it.
	}

	// Combine setup fees to a single line.
	let setupFeeAmount = 0;

	try {
		const planSetupFee = cart.getLineItem( 'plan-setup-fee' );
		setupFeeAmount += planSetupFee.getSubtotal();
	} catch ( error ) {
		// Item couldn't be found, do not add it.
	}

	try {
		const setupFee = cart.getLineItem( 'setup-fee' );
		setupFeeAmount += setupFee.getSubtotal();
	} catch ( error ) {
		// Item couldn't be found, do not add it.
	}

	if ( setupFeeAmount > 0 ) {
		displayItems.push( {
			label: i18n.setupFeeLabel,
			amount: setupFeeAmount,
		} );
	}

	const taxPercent = cart.getTaxPercent( 'exclusive' );

	// Add tax to list.
	if ( taxPercent > 0 ) {
		displayItems.push( {
			label: i18n.taxLabel.replace( '%s', taxPercent ),
			amount: cart.getTax(),
		} );
	}

	// Add tax to list.
	if ( cart.getDiscount() > 0 ) {
		displayItems.push( {
			label: i18n.couponLabel.replace( '%s', cart.getCoupon().name ),
			amount: cart.getDiscount() * -1,
		} );
	}

	return displayItems;
}

/**
 * Determine if the required "classic" fields have been completed before
 * showing the Payment Request UI.
 *
 * @param {PaymentForm} paymentForm
 * @return {bool} If the Payment Request UI should show.
 */
function paymentRequestIsValid( paymentForm ) {
	/**
	 * Determine if a form control is a "classic" field, meaning it is needed
	 * to submit a standard payment form instead of using the Payment Request API.
	 *
	 * @param {HTMLElement} control Form control.
	 * @return {bool} If the field is classic.
	 */
	function isClassicField( control ) {
		const classicFields = [
			'simpay-customer-name-container',
			'simpay-email-container',
			'simpay-card-container',
			'simpay-address-container',
			'simpay-address-street-container',
			'simpay-address-city-container',
			'simpay-address-state-container',
			'simpay-address-zip-container',
			'simpay-address-country-container',
			'simpay-telephone-container',
			'simpay-plan-select-container',
			'simpay-custom-amount-container',
		];

		const classList = control.classList;
		let is = false;

		classList.forEach( function ( className ) {
			if ( -1 !== classicFields.indexOf( className ) ) {
				is = true;
			}
		} );

		return is;
	}

	let requiredFieldsValid = true;

	_.each(
		paymentForm[ 0 ].querySelectorAll( '.simpay-form-control' ),
		function ( control ) {
			const classicField = isClassicField( control );

			if ( classicField ) {
				return;
			}

			const inputs = control.querySelectorAll( 'input, textarea' );

			_.each( inputs, function ( input ) {
				if ( ! input.required ) {
					return;
				}

				if ( ! input.validity.valid ) {
					requiredFieldsValid = false;
				}
			} );
		}
	);

	return requiredFieldsValid;
}

/**
 * Update Payment Request.
 *
 * @param {PaymentForm} paymentForm
 */
export function update( paymentForm ) {
	const { id, cart, __unstableLegacyFormData } = paymentForm;
	const { formInstance, hasPaymentRequestButton } = __unstableLegacyFormData;

	if ( ! hasPaymentRequestButton ) {
		return;
	}

	const { i18n } = hasPaymentRequestButton;
	const { paymentRequestButtons } = window.simpayAppPro;
	const { price } = cart.getLineItem( 'base' );

	const key = `${ formInstance }-${ id }`;

	// Enable if not previously setup.
	if ( ! paymentRequestButtons.hasOwnProperty( key ) ) {
		setup( paymentForm );
	}

	paymentRequestButtons[ key ].update( {
		currency: price.currency,
		total: {
			label: i18n.totalLabel,
			amount: cart.getTotalDueToday(),
		},
		displayItems: getDisplayItems( paymentForm ),
	} );
}

/**
 * Sets up a Payment Request.
 *
 * @since 4.2.0
 *
 * @param {PaymentForm} paymentForm
 */
function setup( paymentForm ) {
	const {
		id: formId,
		disable: disableForm,
		state,
		setState,
		__unstableLegacyFormData,
		stripeInstance: stripe,
		cart,
	} = paymentForm;

	const { paymentMethods } = state;

	const {
		formInstance,
		formDisplayType,
		stripeParams: { country },
		hasPaymentRequestButton,
	} = __unstableLegacyFormData;

	const { triggerBrowserValidation } = window.simpayApp;
	const { paymentRequestButtons } = window.simpayAppPro;

	if ( ! hasPaymentRequestButton ) {
		return;
	}

	const {
		id,
		i18n,
		requestPayerName,
		requestPayerEmail,
		requestPayerPhone,
		requestShipping,
		shippingOptions,
		type,
		theme,
	} = hasPaymentRequestButton;

	const { price } = cart.getLineItem( 'base' );

	const stripeElements = stripe.elements();
	const key = `${ formInstance }-${ formId }`;

	// Generate initial state of button. Eventually used to generate a request.
	paymentRequestButtons[ key ] = stripe.paymentRequest( {
		country,
		currency: price.currency,
		total: {
			label: i18n.totalLabel,
			amount: cart.getTotalDueToday(),
		},
		displayItems: getDisplayItems( paymentForm ),
		requestPayerName,
		requestPayerEmail,
		requestPayerPhone,
		requestShipping,
	} );

	// Create the button element to render.
	const prButton = stripeElements.create( 'paymentRequestButton', {
		paymentRequest: paymentRequestButtons[ key ],
		style: {
			paymentRequestButton: {
				type,
				theme,
			},
		},
	} );

	// Check the availability of the Payment Request API.
	paymentRequestButtons[ key ].canMakePayment().then( ( result ) => {
		// Hide container if no payment can be made.
		if ( null === result ) {
			const containers = document.querySelectorAll(
				`form[data-simpay-form-id="${ formId }"] #${ id }`
			);

			if ( containers.length > 0 ) {
				_.each(
					containers,
					( container ) => ( container.style.display = 'none' )
				);
			}

			return;
		}

		let toMount;

		/**
		 * Due to lack of formInstance context during Overlay toggles we can reference
		 * the last instance of the NodeList for PRB containers (based on formId) instead.
		 *
		 * This ensures the PRB that appears in the overlays (which is always the last
		 * in the NodeList) is always the one being mounted (or remounted).
		 *
		 * @see https://github.com/wpsimplepay/wp-simple-pay-pro/issues/1002
		 * @see https://github.com/wpsimplepay/wp-simple-pay-pro/issues/610
		 * @see https://github.com/wpsimplepay/wp-simple-pay-pro/issues/645
		 */
		if ( 'overlay' === formDisplayType ) {
			const buttons = document.querySelectorAll(
				`form[data-simpay-form-id="${ formId }"] #${ id } .simpay-payment-request-button-container__button`
			);

			toMount = buttons[ buttons.length - 1 ];
		} else {
			toMount = document.querySelector(
				`form[data-simpay-form-instance="${ formInstance }"] #${ id } .simpay-payment-request-button-container__button`
			);
		}

		if ( toMount ) {
			toMount.innerHTML = '';
			prButton.mount( toMount );
		}

		// Ensure form is valid before continuing.
		prButton.on( 'click', function ( e ) {
			if ( ! paymentRequestIsValid( paymentForm ) ) {
				e.preventDefault();

				// Show browser validation.
				triggerBrowserValidation( paymentForm );
			}

			// Update items for a final time.
			update( paymentForm );

			setState( {
				paymentMethod: _.find(
					paymentMethods,
					( { id: paymentMethodId } ) =>
						paymentMethodId === 'payment-request'
				),
			} );
		} );
	} );

	/**
	 * Update shipping options for request.
	 * There are no defined shipping methods, so this is merely to satisfy the API requirements.
	 *
	 * @todo Populate hidden fields so the values are sent through?
	 *
	 * @param {Object} e Payment Request Button event.
	 */
	paymentRequestButtons[ key ].on( 'shippingaddresschange', function ( e ) {
		e.updateWith( {
			status: 'success',
			shippingOptions,
		} );
	} );

	/**
	 * Handle token once created.
	 *
	 * @param {Object} e Payment Request Button event.
	 */
	paymentRequestButtons[ key ].on( 'paymentmethod', function ( e ) {
		const { complete, paymentMethod } = e;

		// Close UI.
		complete( 'success' );

		// Disable form.
		disableForm();

		// Attach Payment Method to state for access in submission process.
		setState( {
			__unstablePaymentRequestPaymentMethod: paymentMethod,
		} );

		/**
		 * Allows processing during a Payment Form submission.
		 *
		 * @since 4.2.0
		 *
		 * @param {PaymentForm} paymentForm
		 */
		doAction( 'simpaySubmitPaymentForm', paymentForm );
	} );

	/**
	 * Reset the Payment Method if cancelled.
	 */
	paymentRequestButtons[ key ].on( 'cancel', function () {
		setState( {
			paymentMethod: _.find(
				paymentMethods,
				( { id: paymentMethodId } ) => paymentMethodId === 'card'
			),
		} );
	} );
}

export default setup;
