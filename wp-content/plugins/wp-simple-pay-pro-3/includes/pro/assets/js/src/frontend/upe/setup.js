/* global jQuery, Stripe */

/**
 * Internal dependencies
 */
import { doAction } from '@wpsimplepay/hooks';
import { Cart } from '@wpsimplepay/cart';
import { default as setupFormFields } from './form-fields';
import { update as updateAmounts } from './form-fields/field/amount-breakdown.js';
import {
	calculateAutomaticTax,
	convertToCents,
	convertToDollars,
	formatCurrency,
	getDefaultPrice,
	getDefaultPaymentMethod,
	getPaymentMethodTypes,
	getPaymentMethodOptions,
	getElementsConfig,
	getToken,
	setupPaymentFormCart,
	unformatCurrency,
} from './utils';
import { default as error } from './error.js';
import { default as enable } from './enable.js';
import { default as disable } from './disable.js';
import { enableCheckoutButton } from './form-fields/field/checkout-button.js';
import { enablePaymentButton } from './form-fields/field/payment-button.js';

const forms = window.simplePayForms;

/**
 * Sets up the payment form.
 *
 * @since 4.7.0
 *
 * @param {Object} paymentForm Payment form.
 * @param {Object} config Payment form configuration.
 * @return {jQuery} $paymentForm Payment form.
 */
function setup( paymentForm, config = false ) {
	paymentForm.formId = parseInt( paymentForm.dataset.simpayFormId );

	// Bootstrap the config from the page if not provided.
	if ( ! config ) {
		config = forms[ paymentForm.formId ];
	}

	paymentForm = Object.assign( paymentForm, config );

	// Shim for backwards compatibility.
	window.spShared = {
		convertToDollars: paymentForm.convertToDollars,
		convertToCents: paymentForm.convertToCents,
		formatCurrency: paymentForm.formatCurrency,
		unformatCurrency: paymentForm.unformatCurrency,
	};

	// Set the initial state.
	paymentForm.state = {
		price: getDefaultPrice( paymentForm ),
		paymentMethod: getDefaultPaymentMethod( paymentForm ),
		customAmount: null,
		taxAmount: 0,
		couponCode: null,
	};

	// Create a setter for the state.
	paymentForm.setState = function ( updatedState ) {
		paymentForm.state = {
			...paymentForm.state,
			...updatedState,
		};
	};

	// Bind helper methods.
	paymentForm.enable = enable.bind( paymentForm );
	paymentForm.disable = disable.bind( paymentForm );
	paymentForm.error = error.bind( paymentForm );
	paymentForm.convertToCents = convertToCents.bind( paymentForm );
	paymentForm.convertToDollars = convertToDollars.bind( paymentForm );
	paymentForm.formatCurrency = formatCurrency.bind( paymentForm );
	paymentForm.unformatCurrency = unformatCurrency.bind( paymentForm );
	paymentForm.getPaymentMethodTypes = getPaymentMethodTypes.bind(
		paymentForm
	);
	paymentForm.getPaymentMethodOptions = getPaymentMethodOptions.bind(
		paymentForm
	);
	paymentForm.getToken = getToken.bind( paymentForm );

	// Disable while we continue setup.
	paymentForm.disable();

	// Create the cart.
	paymentForm.cart = setupPaymentFormCart(
		new Cart( { paymentForm } ),
		paymentForm
	);

	// Setup Stripe.
	paymentForm.stripejs = Stripe( paymentForm.stripe.apiKey, {
		apiVersion: paymentForm.stripe.apiVersion,
		locale: paymentForm.stripe.elementsLocale,
		betas: [ 'elements_enable_deferred_intent_beta_1' ],
	} );

	// ...and Stripe Elements.
	paymentForm.stripeElements = paymentForm.stripejs.elements( {
		...getElementsConfig( paymentForm.stripe.elements ),
		setupFutureUsage: paymentForm.cart.isRecurring() ? 'off_session' : null,
		mode: paymentForm.cart.isRecurring() ? 'subscription' : 'payment',
		amount:
			0 !== paymentForm.cart.getTotalDueToday()
				? paymentForm.cart.getTotalDueToday()
				: paymentForm.cart.getLineItem( 'base' ).price.unit_amount,
		currency: paymentForm.cart.getCurrency(),
		paymentMethodTypes: paymentForm.getPaymentMethodTypes(),
		paymentMethodOptions: paymentForm.getPaymentMethodOptions(),
	} );

	// Triggers/hooks remain in jQuery for backwards compatibility.
	// Assign the standard paymentForm object to the jQuery object so it can
	// be easily referenced in component callbacks:
	//
	// onChange( $paymentForm )
	//  or
	// onChange( { paymentForm } )
	const $paymentForm = jQuery( paymentForm );
	$paymentForm.paymentForm = paymentForm;
	$paymentForm.cart = paymentForm.cart;
	$paymentForm.state = paymentForm.state;
	$paymentForm.setState = paymentForm.setState;
	$paymentForm.enable = paymentForm.enable;
	$paymentForm.disable = paymentForm.disable;
	$paymentForm.error = paymentForm.error;

	// Bind tax updates early.
	// @todo make better. or not?
	$paymentForm.on( 'totalChanged', () => {
		// Update checkout button text based on price change.
		enableCheckoutButton( paymentForm );
		// Update payment button text based on price change.
		enablePaymentButton( paymentForm );
		calculateAutomaticTax( paymentForm ).then( () =>
			updateAmounts( paymentForm )
		);
	} );

	// Set up the form's custom fields.
	setupFormFields( $paymentForm );

	/**
	 * Allows further setup of a Payment Form.
	 *
	 * @since 4.2.0
	 *
	 * @param {jQuery} $paymentForm Payment form.
	 */
	doAction( 'simpaySetupPaymentForm', $paymentForm );

	jQuery( document.body )
		// These are all the same for backwards compatibility.
		.trigger( 'simpayCoreFormVarsInitialized', [ $paymentForm ] )
		.trigger( 'simpayBindCoreFormEventsAndTriggers', [ $paymentForm ] )
		.trigger( 'simpaySetupCoreForm', [ $paymentForm ] );

	return $paymentForm;
}

export default setup;
