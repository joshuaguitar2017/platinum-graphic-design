/* global _ */

/**
 * Internal dependencies
 */
import { customers, paymentintents, subscriptions } from '@wpsimplepay/api';
import { createToken } from '../../../../../../../../../../includes/core/assets/js/src/frontend/utils/recaptcha.js';
const { triggerBrowserValidation } = window.simpayApp;

/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Shows the confirmation/mandate message and toggles checkout button.
 *
 * @param {PaymentForm} paymentForm Payment form.
 * @param {Object} intent PaymentIntent or SetupIntent.
 */
function showConfirmation( paymentForm, intent ) {
	const { state, setState, enable: enableForm } = paymentForm;

	// Enable form.
	enableForm();

	// Store client secret for confirmation in submit step.
	setState( {
		clientSecret: intent.client_secret,
	} );

	// Hide button.
	paymentForm[ 0 ].querySelector(
		'.simpay-ach-debit-wrap button'
	).style.display = 'none';

	const { isSubscription, isRecurring } = state;

	// Show terms.
	paymentForm[ 0 ].querySelector( '#simpay-ach-debit-terms' ).style.display =
		'block';

	if ( isSubscription || isRecurring ) {
		paymentForm[ 0 ].querySelector(
			'#simpay-ach-debit-terms-recurring'
		).style.display = 'block';
	}

	// Show checkout button.
	paymentForm[ 0 ].querySelector(
		'.simpay-checkout-btn-container'
	).style.display = 'block';

	// Hide the email verification form, if needed.
	const emailVerificationForm = paymentForm[ 0 ].querySelector(
		'.simpay-email-verification-code-container'
	);

	if ( emailVerificationForm ) {
		emailVerificationForm.style.display = 'none';
	}
}

/**
 * Handles a payment intent.
 *
 * @param {PaymentForm} paymentForm Payment form.
 * @param {string} clientSecret Client secret.
 */
async function handleIntent( paymentForm, clientSecret ) {
	const {
		getOwnerData,
		stripeInstance: stripe,
		enable: enableForm,
		state,
	} = paymentForm;
	const { setupIntent } = state;

	// Determine the collection method based on the SetupIntent or PaymentIntent.
	const collectionFunc = setupIntent
		? 'collectBankAccountForSetup'
		: 'collectBankAccountForPayment';

	// Create a Payment Method.
	const { name, email } = getOwnerData( paymentForm );

	const { paymentIntent, error } = await stripe[ collectionFunc ]( {
		clientSecret,
		params: {
			payment_method_type: 'us_bank_account',
			payment_method_data: {
				billing_details: {
					name,
					email,
				},
			},
		},
		expand: [ 'payment_method' ],
	} );

	if ( error ) {
		throw error;
	}

	// SetupIntent is always confirmed.
	if ( setupIntent ) {
		showConfirmation( paymentForm, setupIntent );
		return;
	}

	// Customer canceled the hosted verification modal.
	if ( paymentIntent.status === 'requires_payment_method' ) {
		return enableForm();
	}

	// Confirm mandates.
	if ( paymentIntent.status === 'requires_confirmation' ) {
		showConfirmation( paymentForm, paymentIntent );
	}
}

/**
 * Creates a Payment.
 *
 * @param {PaymentForm} paymentForm
 * @param {Object} customerResponse Customer REST API response.
 */
async function createPayment( paymentForm, customerResponse ) {
	const { error: onError } = paymentForm;
	const { customer, nonce } = customerResponse;

	// Create a PaymentIntent.
	const { client_secret: clientSecret } = await paymentintents
		.create(
			{
				customer_id: customer.id,
				customer_nonce: nonce,
				payment_method_type: 'us_bank_account',
			},
			paymentForm
		)
		.catch( ( error ) => {
			onError( error );
		} );

	// Handle PaymentIntent.
	handleIntent( paymentForm, clientSecret );
}

/**
 * Creates a Subscription.
 *
 * @param {PaymentForm} paymentForm
 * @param {Object} customerResponse Customer REST API response.
 */
async function createSubscription( paymentForm, customerResponse ) {
	const { error: onError, setState } = paymentForm;
	const { customer, nonce } = customerResponse;

	const subscription = await subscriptions
		.create(
			{
				customer_id: customer.id,
				customer_nonce: nonce,
				payment_method_type: 'us_bank_account',
			},
			paymentForm
		)
		.catch( ( error ) => {
			onError( error );
		} );

	const {
		latest_invoice: { payment_intent: paymentIntent },
		pending_setup_intent: setupIntent,
	} = subscription;

	// Store the SetupIntent to the state to adjust final confirmation steps.
	setState( {
		setupIntent,
	} );

	// Handle Intent.
	handleIntent(
		paymentForm,
		setupIntent?.client_secret || paymentIntent?.client_secret
	);
}

/**
 * Sets up the ACH Debit Payment Method.
 *
 * @since 4.2.0
 *
 * @param {PaymentForm} paymentForm
 * @param {boolean} __unstableIsUpdate If this setup is for updating a payment method.
 */
function setup( paymentForm, __unstableIsUpdate ) {
	const achDebitEl = paymentForm[ 0 ].querySelector(
		'.simpay-ach-debit-wrap'
	);

	if ( ! achDebitEl ) {
		return;
	}

	const checkoutButtonEl = paymentForm[ 0 ].querySelector(
		'.simpay-checkout-btn-container'
	);

	// Handle toggling Checkout and ACH buttons.
	const tabs = paymentForm[ 0 ].querySelectorAll(
		'.simpay-form-tabs-toggles__toggle'
	);

	/**
	 * @param {Object} e Tab toggle click event.
	 * @param {Object} e.target Click event target.
	 */
	const maybeHideCheckoutButton = ( { target } ) => {
		const { state } = paymentForm;
		const { clientSecret } = state;

		// When the ACH Debit payment method is used move the hCaptcha to the ACH Debit tab.
		const hcaptcha = paymentForm[ 0 ].querySelector(
			'.simpay-form-control.h-captcha'
		);

		if ( hcaptcha ) {
			const hCaptchaEl = paymentForm.find(
				'.simpay-form-control.h-captcha'
			);

			if ( 'simpay-payment-method-toggle-ach-debit' === target.id ) {
				const hCaptchElRemoved = hCaptchaEl.detach();

				hCaptchElRemoved.prependTo(
					paymentForm.find(
						'.simpay-ach-debit-wrap.simpay-field-wrap'
					)
				);
			} else {
				const hCaptchElRemoved = hCaptchaEl.detach();

				paymentForm
					.find(
						'.simpay-form-control.simpay-checkout-btn-container'
					)
					.before( hCaptchElRemoved );
			}
		}

		if ( clientSecret ) {
			return;
		}

		checkoutButtonEl.style.display =
			'simpay-payment-method-toggle-ach-debit' === target.id
				? 'none'
				: 'block';
	};

	if ( tabs ) {
		// Add a click event handler to each tab.
		_.each( tabs, ( tab ) =>
			tab.addEventListener( 'click', maybeHideCheckoutButton )
		);

		// On load.
		maybeHideCheckoutButton( {
			target: tabs[ 0 ],
		} );
	}

	// Stop setup if this is for the "Update Payment Method" form.
	if ( true === __unstableIsUpdate ) {
		return;
	}

	const submitEl = achDebitEl.querySelector( 'button' );

	if ( ! submitEl ) {
		return;
	}

	const { error: onError, disable: disableForm } = paymentForm;

	/**
	 * "Select Bank" button click handler.
	 *
	 * @param {Object} e Click event.
	 */
	submitEl.addEventListener( 'click', async ( e ) => {
		e.preventDefault();

		// HTML5 validation check.
		// Must be called manually because we are still in the "setup" step.
		if ( ! paymentForm[ 0 ].checkValidity() ) {
			triggerBrowserValidation( paymentForm );

			return;
		}

		disableForm();

		// Create a Customer.
		try {
			const { state, setState } = paymentForm;
			const { isSubscription, isRecurring } = state;

			// Generate reCAPTCHA tokens before proceeding.
			//
			// Due to the way ACH Direct Debit has to be setup, this must be called
			// manually.
			await createToken(
				`simple_pay_form_${ paymentForm.id }_customer`
			).then( ( token ) => {
				setState( {
					customerCaptchaToken: token,
				} );
			} );

			await createToken(
				`simple_pay_form_${ paymentForm.id }_payment`
			).then( ( token ) => {
				setState( {
					paymentCaptchaToken: token,
				} );
			} );

			const customer = await customers
				.create( {}, paymentForm )
				.catch( ( error ) => {
					throw error;
				} );

			// Store customer ID for access in submit step.
			setState( {
				customerId: customer.customer.id,
			} );

			// Create a Subscription.
			if ( isSubscription || isRecurring ) {
				createSubscription( paymentForm, customer );

				// Create a Payment.
			} else {
				createPayment( paymentForm, customer );
			}
		} catch ( error ) {
			onError( error );
		}
	} );
}

export default setup;
