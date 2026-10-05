/* eslint-disable camelcase */

/**
 * External dependencies.
 */
import serialize from 'form-serialize';

/**
 * Internal dependencies.
 */
import { default as confirmPayment } from './confirm.js';
import {
	isValid as hasValidAddress,
	showError as showAddressError,
	hideError as hideAddressError,
} from './form-fields/field/address.js';
import {
	isValid as hasValidCustomAmount,
	showError as showCustomAmountError,
	hideError as hideCustomAmountError,
} from './form-fields/field/custom-amount.js';
import {
	isValid as hasValidEmail,
	showError as showEmailError,
	hideError as hideEmailError,
} from './form-fields/field/email.js';
import {
	isValid as hasValidPhone,
	showError as showPhoneError,
	hideError as hidePhoneError,
} from './form-fields/field/phone.js';
import { showError as showPaymentMethodError } from './form-fields/field/payment-method.js';

/**
 * Creates a payment and attempts to confirm it.
 *
 * @since 4.7.3
 *
 * @param {jQuery} $paymentForm Payment form.
 * @param {Object} $paymentForm.paymentForm Paymetn form.
 */
function createPayment( $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const {
		cart,
		error,
		enable,
		formId,
		getToken,
		setState,
		state,
	} = paymentForm;
	const {
		billingAddress,
		coupon,
		customAmount,
		isCoveringFees,
		isOptionallyRecurring,
		paymentMethod,
		shippingAddress,
		taxCalculationId,
		taxAmount,
	} = state;

	const baseLineItem = cart.getLineItem( 'base' );

	// ...submit.
	return getToken( paymentForm ).then( ( token ) => {
		const data = {
			token,
			payment_method_type: paymentMethod.id,
			form_id: formId,
			price_id: baseLineItem.price.id,
			price_ids: cart.getPriceIds(),
			quantity: baseLineItem.quantity,
			custom_amount: customAmount,
			tax_amount: taxAmount,
			is_optionally_recurring: isOptionallyRecurring,
			is_covering_fees: isCoveringFees,
			coupon_code: coupon !== false ? coupon : null,
			tax_calc_id: taxCalculationId,
			billing_address: billingAddress
				? {
						name: billingAddress.name,
						address: billingAddress.address,
				  }
				: null,
			shipping_address: shippingAddress
				? {
						name: shippingAddress.name,
						address: shippingAddress.address,
				  }
				: null,
			form_values: serialize( paymentForm, { hash: true } ),
		};

		// Use the global wp.apiFetch so the middlewares are used.
		// Our current webpack config is not setup to extract the dependencies automatically.
		return window.wp
			.apiFetch( {
				path: 'wpsp/__internal__/payment/create',
				method: 'POST',
				data,
			} )
			.then( ( response ) => {
				const {
					client_secret,
					customer_id,
					object_id,
					redirect,
					return_url,
				} = response;

				// Redirect, if needed.
				if ( redirect ) {
					window.location.href = redirect;
					return;
				}

				// Track the intent/object data for continuied processing, such as
				// updating the payment method for fee recovery.
				//
				// Calling the submit() function again will attempt to confirm the payment.
				// with stripe.js and the Elements instance.
				setState( {
					clientSecret: client_secret,
					objectId: object_id,
					customerId: customer_id,
					returnUrl: return_url,
				} );

				return confirmPayment( $paymentForm );
			} )
			.catch( ( requestError ) => {
				// If the error is a rest_invalid_param, we need to modify the data structure for the error function to handle it properly.
				if (
					requestError.code &&
					requestError.code === 'rest_invalid_param'
				) {
					if (
						requestError.data &&
						requestError.data.details &&
						requestError.data.details.form_values
					) {
						error( requestError.data.details.form_values );
					} else {
						error( requestError );
					}
				} else {
					error( requestError );
				}
				enable();
			} );
	} );
}

/**
 * Submits the payment form.
 *
 * @since 4.7.0
 *
 * @param {jQuery} $paymentForm Payment form.
 */
function submit( $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const {
		disable,
		enable,
		error,
		setState,
		state,
		stripejs,
		stripeElements,
		settings,
	} = paymentForm;
	const { clientSecret, isApplePay, paymentElement } = state;
	const isMultipleLineItemsEnabled = 'yes' === settings.allowMultipleLineItem;
	// Clear existing errors.
	error( '' );

	// We have a client secret and the payment element is complete.
	// Update the intent, if needed, and confirm again.
	if ( clientSecret && paymentElement?.complete ) {
		disable();
		return confirmPayment( $paymentForm );
	}

	// Validate the "Payment Method" custom field before proceeding.
	if ( paymentElement && ! paymentElement.complete ) {
		showPaymentMethodError( paymentForm );
		return enable();
	}

	// Validate the "Link Authentication Element" custom field before proceeding.
	const isValidEmail = hasValidEmail( paymentForm );

	if ( ! isValidEmail ) {
		showEmailError( paymentForm );
		return enable();
	}
	hideEmailError( paymentForm );

	// Validate the "Phone" custom field before proceeding.
	const isValidPhone = hasValidPhone( paymentForm );

	if ( ! isValidPhone ) {
		showPhoneError( paymentForm );
		return enable();
	}
	hidePhoneError( paymentForm );

	// Validate the "Address" custom field before proceeding.
	const isValidAddress = hasValidAddress( paymentForm );

	if ( ! isValidAddress ) {
		showAddressError( paymentForm );
		return enable();
	}
	hideAddressError( paymentForm );

	// Validate the "Custom Amount" field before proceeding.
	const isValidCustomAmount = hasValidCustomAmount(
		paymentForm,
		isMultipleLineItemsEnabled
	);

	if ( ! isValidCustomAmount ) {
		// We are showing custom error message for each custom price element if multiple line items are enabled.
		// So we will not show the default error message.
		if ( ! isMultipleLineItemsEnabled ) {
			showCustomAmountError( paymentForm );
		}
		return enable();
	}
	hideCustomAmountError( paymentForm );

	// Allow further validation. Use jQuery for backwards compatibility.
	const legacyFormData = {
		isValid: isValidAddress && isValidCustomAmount,
	};

	$paymentForm.trigger( 'simpayBeforeStripePayment', [
		$paymentForm,
		legacyFormData,
	] );

	if ( ! legacyFormData.isValid ) {
		return enable();
	}

	disable();

	// If we are using Apple Pay, we need to create a payment method first
	// to avoid issues with Safari's security settings that prevent confirmation
	// after a delay (creating the intent on the server).
	if ( isApplePay ) {
		const { email, phone, name } = state;

		const applePayConfirmArgs = {
			elements: stripeElements,
			params: {
				billing_details: {
					email: email || null,
					name: name || null,
					phone: phone || null,
				},
			},
		};

		return stripejs
			.createPaymentMethod( applePayConfirmArgs )
			.then( function ( {
				error: applePayError,
				paymentMethod: applePayPaymentMethod,
			} ) {
				if ( applePayError ) {
					throw applePayError;
				}

				setState( {
					applePayPaymentMethod,
				} );

				return createPayment( $paymentForm );
			} )
			.catch( ( applePayError ) => {
				error( applePayError );
				enable();
			} );
	}

	// Otherwise the payment method will be created upon confirmation.
	return createPayment( $paymentForm );
}

export default submit;
