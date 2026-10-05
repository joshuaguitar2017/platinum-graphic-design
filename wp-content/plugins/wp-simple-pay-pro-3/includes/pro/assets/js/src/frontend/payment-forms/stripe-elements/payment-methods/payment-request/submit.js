/* global jQuery */

/**
 * Internal dependencies.
 */
import { createPayment, createSubscription } from './../card/submit.js';
import { customers } from '@wpsimplepay/api';

/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Submit Payment Request.
 *
 * @param {PaymentForm} paymentForm
 */
async function submit( paymentForm ) {
	const { error: onError, state, setState } = paymentForm;
	const {
		customer,
		isSubscription,
		isRecurring,
		__unstablePaymentRequestPaymentMethod,
	} = state;
	const {
		billing_details: billingDetails,
	} = __unstablePaymentRequestPaymentMethod;

	const { name, email, phone, address } = billingDetails;

	// Append hidden fields to send to server.
	if ( email && '' !== email ) {
		jQuery( '[name="simpay_email"]' ).val( '' );

		jQuery( '<input>' )
			.attr( {
				type: 'hidden',
				name: 'simpay_email',
				value: email,
			} )
			.appendTo( paymentForm );
	}

	if ( name && '' !== name ) {
		jQuery( '[name="simpay_customer_name"]' ).val( '' );

		jQuery( '<input>' )
			.attr( {
				type: 'hidden',
				name: 'simpay_customer_name',
				value: name,
			} )
			.appendTo( paymentForm );
	}

	if ( phone && '' !== phone ) {
		jQuery( '[name="simpay_telephone"]' ).val( '' );

		jQuery( '<input>' )
			.attr( {
				type: 'hidden',
				name: 'simpay_telephone',
				value: phone,
			} )
			.appendTo( paymentForm );
	}

	if ( address ) {
		const addressParts = [ 'line1', 'city', 'state', 'postal_code' ];

		addressParts.forEach( ( part ) => {
			const value =
				'line1' === part
					? address.line1 +
					  ' ' +
					  ( address.line2 ? address.line2 : '' )
					: address[ part ];

			jQuery( `[name="simpay_billing_address_${ part }"]` ).val( '' );

			jQuery( '<input>' )
				.attr( {
					type: 'hidden',
					name: 'simpay_billing_address_' + part,
					value,
				} )
				.appendTo( paymentForm );
		} );
	}

	// Create or update a Customer.
	const customerResponse = await customers
		.create(
			{
				object_id: customer ? customer.id : null,
			},
			paymentForm
		)
		.catch( onError );

	// Bail if there was an error.
	if ( ! customerResponse ) {
		return;
	}

	// Set the customer state.
	setState( {
		customer: customerResponse.customer,
	} );

	// Create a Subscription.
	if ( isSubscription || isRecurring ) {
		await createSubscription(
			customerResponse,
			__unstablePaymentRequestPaymentMethod.id,
			paymentForm
		);

		// Create a PaymentIntent.
	} else {
		await createPayment(
			customerResponse,
			__unstablePaymentRequestPaymentMethod.id,
			paymentForm
		);
	}
}

export default submit;
