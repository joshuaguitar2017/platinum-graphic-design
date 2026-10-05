/**
 * Internal dependencies
 */
import { default as updatePayment } from './../../update.js';
import { enableCheckoutButton } from './checkout-button.js';

/**
 * Displays an inline error under the payment method.
 *
 * @since 4.7.0
 *
 * @param {Object} paymentForm Payment form.
 * @param {string} _errorMessage Error message override.
 */
export function showError( paymentForm, _errorMessage ) {
	const errorEl = paymentForm.querySelector( '.simpay-payment-method-error' );

	if ( ! errorEl ) {
		return;
	}

	const { i18n } = paymentForm;
	const errorMessage = i18n.emptyPaymentMethodError;

	errorEl.innerText = _errorMessage || errorMessage;
	errorEl.style.display = 'block';
	wp.a11y.speak( errorMessage, 'assertive' );
}

/**
 * Hides an inline error under the payment method.
 *
 * @since 4.7.0
 *
 * @param {Object} paymentForm Payment form.
 */
export function hideError( paymentForm ) {
	const errorEl = paymentForm.querySelector( '.simpay-payment-method-error' );

	if ( ! errorEl ) {
		return;
	}

	errorEl.innerText = '';
	errorEl.style.display = 'none';
}

/**
 * Determines if the payment form has valid payment method data to attempt to
 * confirm a payment.
 *
 * @since 4.7.0
 *
 * @param {Object} paymentForm Payment form.
 */
export function isValid( paymentForm ) {
	const { state } = paymentForm;
	const { paymentElement } = state;

	if ( ! paymentElement ) {
		return true;
	}

	if ( ! paymentElement.complete ) {
		paymentElement.focus();

		return false;
	}

	return true;
}

/**
 * Enables the form so only the Payment Element can be interacted with.
 *
 * @since 4.7.0
 *
 * @param {Object} paymentForm Payment form.
 */
export function enablePaymentMethodOnly( paymentForm ) {
	// Remove a loading class indicator.
	paymentForm.classList.remove( 'simpay-checkout-form--loading' );

	// Add set the current status of the form.
	paymentForm.classList.add(
		'simpay-checkout-form--requires_payment_method'
	);

	// Disable all fields.
	const inputs = paymentForm.querySelectorAll( 'input, select, textarea' );
	inputs.forEach( ( inputEl ) => {
		inputEl.disabled = true;
		inputEl.tabIndex = -1;
	} );

	// Enable the checkout button.
	enableCheckoutButton( paymentForm );
}

/**
 * Updates the deferred intent data.
 *
 * @since 4.7.0
 *
 * @param {Event} _e Event.
 * @param {jQuery} $paymentForm Payment form.
 */
export function updateDeferredIntent( _e, { paymentForm } ) {
	const { cart, getPaymentMethodTypes, stripeElements } = paymentForm;

	stripeElements.update( {
		currency: cart.getCurrency(),
		captureMethod: 'automatic',
		amount:
			0 !== cart.getTotalDueToday()
				? cart.getTotalDueToday()
				: cart.getLineItem( 'base' ).price.unit_amount,
		setupFutureUsage: cart.isRecurring() ? 'off_session' : null,
		mode: cart.isRecurring() ? 'subscription' : 'payment',
		paymentMethodTypes: getPaymentMethodTypes( paymentForm ),
	} );
}

/**
 * Mounts the Payment Element.
 *
 * @since 4.7.0
 *
 * @param {jQuery} $paymentForm Payment form.
 */
export function mountPaymentElement( $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const { stripe } = paymentForm;
	const { paymentElement: paymentElementConfig } = stripe;
	const {
		getPaymentMethodTypes,
		enable,
		i18n,
		setState,
		settings,
		stripeElements,
	} = paymentForm;
	const {
		hasPhoneField,
		hasNameField,
		hasWallets,
		paymentMethods,
	} = settings;

	const paymentElement = stripeElements.create( 'payment', {
		wallets: {
			applePay: hasWallets ? 'auto' : 'never',
			googlePay: hasWallets ? 'auto' : 'never',
		},
		business: {
			name: i18n.siteTitle || '',
		},
		layout: {
			type: 'tabs',
			defaultCollapsed: false,
		},
		defaultValues: {
			billingDetails: {
				email: paymentForm.state.email,
				name: paymentForm.state.name,
				phone: paymentForm.state.phone,
			},
		},
		fields: {
			billingDetails: {
				email: 'never',
				name: hasNameField ? 'never' : 'auto',
				phone: hasPhoneField ? 'never' : 'auto',
				address: 'auto',
			},
		},
		paymentMethodOrder: getPaymentMethodTypes( paymentForm ),
		...paymentElementConfig,
	} );

	// Mount the Payment Element.
	paymentElement.mount( paymentForm.querySelector( '.simpay-upe-wrap' ) );

	// Track the Payment Element in the state.
	setState( {
		paymentElement,
	} );

	// Enable the form when the Payment Element is ready.
	paymentElement.on( 'ready', enable );

	// Handle changes to the Payment Element.
	paymentElement.on( 'change', ( { complete, value } ) => {
		// Track if Apple Pay is selected.
		//
		// We need to do this because Apple Pay does not work with deferred intents.
		// Instead, we must show a separate button to initiate the intent creation,
		// then allow the user to confirm the intent with Apple Pay immediately on submission.
		const isApplePay = value.type === 'apple_pay';

		setState( {
			isApplePay,
		} );

		// Wallets and Link use the same payment method configuration as cards.
		switch ( value.type ) {
			case 'link':
			case 'apple_pay':
			case 'google_pay':
				value.type = 'card';
				break;
		}

		const newPaymentMethod = paymentMethods.filter(
			( { id } ) => id === value.type
		)[ 0 ];
		const isNewPaymentMethod =
			paymentForm.state.paymentMethod !== newPaymentMethod;

		if ( isNewPaymentMethod || complete ) {
			hideError( paymentForm );
		}

		setState( {
			paymentElement: {
				...paymentElement,
				complete,
			},
			paymentMethod: newPaymentMethod,
		} );

		// Update amounts when the payment method changes to account for fee recovery.
		if ( isNewPaymentMethod ) {
			if ( paymentForm.state.clientSecret ) {
				updatePayment( $paymentForm )
					.catch( ( requestError ) => {
						showError( requestError );
					} )
					.finally( () => {
						enablePaymentMethodOnly( paymentForm );
						$paymentForm.trigger( 'totalChanged', [
							$paymentForm,
						] );
					} );
			} else {
				$paymentForm.trigger( 'totalChanged', [ $paymentForm ] );
			}
		}

		$paymentForm.on( 'totalChanged', updateDeferredIntent );
	} );
}

/**
 * Sets up the "Payment Method" custom field.
 *
 * @since 4.7.0
 *
 * @param {jQuery} $paymentForm Payment form
 * @param {Object} $paymentForm.paymentForm Payment form.
 */
function setupPaymentMethod( $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const { type, enable } = paymentForm;

	// Immediately enable the form if the payment method is off-site.
	if ( 'off-site' === type ) {
		enable();
		return;
	}

	mountPaymentElement( $paymentForm );
	enable();
}

export default setupPaymentMethod;
