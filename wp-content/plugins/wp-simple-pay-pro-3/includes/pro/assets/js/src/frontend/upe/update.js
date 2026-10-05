/**
 * WordPress dependencies
 */
import {
	enablePaymentMethodOnly,
	hideError as hidePaymentMethodError,
} from './form-fields/field/payment-method';

/**
 * Updates a payment object.
 *
 * Currently a payment object is only updated if the form has fee recovery enabled.
 *
 * @since 4.7.0
 *
 * @param {jQuery} $paymentForm Payment form.
 * @param {Object} $paymentForm.paymetnForm Payment form.
 * @return {Promise} Promise that resolves when the payment object is updated.
 */
function update( $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const {
		disable,
		error,
		formId,
		settings,
		setState,
		state,
		stripeElements,
	} = paymentForm;
	const { hasFeeRecovery } = settings;
	const {
		clientSecret,
		customAmount,
		customerId,
		isCoveringFees,
		objectId,
		paymentMethod,
		price,
	} = state;

	// No secret available, do nothing.
	if ( ! clientSecret ) {
		return Promise.resolve( null );
	}

	// Not using fee recovery, do nothing.
	if ( ! hasFeeRecovery ) {
		return Promise.resolve( null );
	}

	disable();
	error( '' );
	hidePaymentMethodError( paymentForm );

	const data = {
		customer_id: customerId,
		form_id: formId,
		object_id: objectId,
		price_id: price.id,
		custom_amount: customAmount,
		payment_method_type: paymentMethod.id,
		is_covering_fees: isCoveringFees,
	};

	return window.wp
		.apiFetch( {
			path: 'wpsp/__internal__/payment/update',
			method: 'POST',
			data,
		} )
		.then( ( response ) => {
			setState( {
				clientSecret: response.client_secret,
				objectId: response.object_id,
				objectPaymentMethodType: paymentMethod.id,
			} );

			// Update the client secret if the object has changed.
			if ( response.changed ) {
				stripeElements.update( {
					clientSecret: response.client_secret,
				} );
			}
		} )
		.catch( ( requestError ) => {
			error( requestError );
			enablePaymentMethodOnly( paymentForm );
		} );
}

export default update;
