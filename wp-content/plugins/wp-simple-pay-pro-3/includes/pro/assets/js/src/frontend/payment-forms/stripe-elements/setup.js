/* global _ */

/**
 * Internal dependencies
 */
import { Cart } from './cart';
import './components';

const { hooks, paymentForms } = window.wpsp;
const { doAction } = hooks;
const { __unstableUpdatePaymentFormCart, getPaymentMethod } = paymentForms;

/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Setup Stripe Elements Payment Form.
 *
 * @since 4.2.0
 *
 * @param {PaymentForm} paymentForm
 */
function setup( paymentForm ) {
	const {
		enable: enableForm,
		disable: disableForm,
		error: clearError,
		state,
		__unstableLegacyFormData,
	} = paymentForm;
	const { paymentMethods } = state;

	// Disable while setting up.
	disableForm();

	// Ensure there is an active item selected.
	// If the default price option is out of stock, select the first available.
	const priceOptions = paymentForm[ 0 ].querySelector(
		'.simpay-plan-select-container'
	);

	if ( priceOptions ) {
		const { displayType } = priceOptions.dataset;
		const activeItemSelector =
			'dropdown' === displayType ? ':selected' : ':checked';

		let activeItem = paymentForm.find(
			`.simpay-plan-wrapper ${ activeItemSelector }`
		)[ 0 ];

		if ( ! activeItem ) {
			if ( 'dropdown' === displayType ) {
				activeItem = priceOptions.querySelector(
					'option:not([disabled])'
				);
				activeItem.selected = true;
			} else {
				activeItem = priceOptions.querySelector(
					'input:not([disabled])'
				);
				activeItem.checked = true;
			}
		}
	}

	// Bind cart to PaymentForm.
	paymentForm.cart = __unstableUpdatePaymentFormCart(
		paymentForm,
		new Cart( { paymentForm } )
	);

	// Find the submit button.
	const submitButtonEl = paymentForm.find( '.simpay-checkout-btn' )[ 0 ];

	if ( ! submitButtonEl ) {
		return;
	}

	// Setup the form's Payment Methods.
	paymentMethods.forEach( ( { id } ) => {
		// Call the setup method.
		getPaymentMethod( id ).setup( paymentForm );

		// Bind UI toggles to update the internal state.
		const paymentMethodToggleEl = paymentForm[ 0 ].querySelector(
			`.simpay-payment-method-toggle[data-payment-method="${ id }"]`
		);

		if ( ! paymentMethodToggleEl ) {
			return;
		}

		// Udpate the state when the payment method is changed.
		paymentMethodToggleEl.addEventListener( 'click', () => {
			paymentForm.setState( {
				paymentMethod: _.findWhere( paymentMethods, { id } ),
			} );

			paymentForm.trigger( 'totalChanged', [
				paymentForm,
				__unstableLegacyFormData,
			] );

			clearError( '' );
		} );
	} );

	// Bind the submit button.
	submitButtonEl.addEventListener( 'click', ( e ) => {
		e.preventDefault();

		// HTML5 validation check.
		const { triggerBrowserValidation } = window.simpayApp;

		if ( ! paymentForm[ 0 ].checkValidity() ) {
			triggerBrowserValidation( paymentForm );

			return;
		}

		/**
		 * Allows processing during a Payment Form submission.
		 *
		 * @since 4.2.0
		 *
		 * @param {PaymentForm} paymentForm
		 */
		doAction( 'simpaySubmitPaymentForm', paymentForm );
	} );

	enableForm();
}

export default setup;
