/**
 * WordPress dependencies
 */
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import {
	enablePaymentMethodOnly,
	showError as showPaymentMethodError,
} from './form-fields/field/payment-method.js';

/**
 * Confirms an payment.
 *
 * @since 4.7.0
 *
 * @param {jQuery} $paymentForm Payment form.
 * @param {Object} $paymentForm.paymentForm Payment form.
 */
function confirm( $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const { cart, state, stripejs, stripeElements } = paymentForm;
	const {
		applePayPaymentMethod,
		clientSecret,
		email,
		isApplePay,
		name,
		phone,
		returnUrl,
	} = state;

	// Disable editing of non-Element fields once in the Payment stage.
	// They are no longer sent to the server.
	const controlEls = paymentForm.querySelectorAll(
		'.simpay-form-control:not(.simpay-amounts-container):not(.simpay-card-container):not(.simpay-checkout-btn-container):not(.simpay-payment-btn-container):not(.simpay-link-authentication-container):not(.simpay-address-container-upe)'
	);

	controlEls.forEach( ( controlEl ) => {
		const inputEls = controlEl.querySelectorAll(
			'input, textarea, select'
		);

		controlEl.classList.add( 'simpay-disabled' );
		inputEls.forEach( ( inputEl ) => {
			inputEl.disabled = true;
			inputEl.tabIndex = -1;
		} );
	} );

	// Perform any remaining actions.
	const confirmFunc =
		0 === cart.getTotalDueToday() ? 'confirmSetup' : 'confirmPayment';

	const confirmArgs = {
		clientSecret,
		confirmParams: {
			return_url: decodeEntities( returnUrl ),
		},
	};

	// If we are using Apple Pay, send in the previously created payment method.
	if ( isApplePay ) {
		confirmArgs.confirmParams.payment_method = applePayPaymentMethod.id;

		// Otherwise use data from the Elements group.
	} else {
		confirmArgs.elements = stripeElements;
		confirmArgs.confirmParams.payment_method_data = {
			billing_details: {
				email,
				name,
				phone,
			},
		};
	}

	stripejs[ confirmFunc ]( confirmArgs )
		// Show an error and reenable, if needed.
		.then( ( { error: confirmError } ) => {
			if ( confirmError ) {
				showPaymentMethodError( paymentForm, confirmError.message );
				enablePaymentMethodOnly( paymentForm );
			}
		} );
}

export default confirm;
