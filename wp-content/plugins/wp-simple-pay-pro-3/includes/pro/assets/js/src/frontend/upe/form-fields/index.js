import setupPaymentMethod from './field/payment-method.js';
import setupPriceSelect from './field/price-select/index.js';
import setupCustomAmount from './field/custom-amount.js';
import setupRecurringToggle from './field/recurring-amount-toggle.js';
import setupAmountBreakdown from './field/amount-breakdown.js';
import setupQuantity from './field/quantity.js';
import setupFeeRecovery from './field/fee-recovery-toggle.js';
import setupAddress from './field/address.js';
import setupCoupon from './field/coupon.js';
import setupEmail from './field/email.js';
import setupName from './field/name.js';
import setupPhone from './field/phone.js';
import setupTaxId from './field/tax-id.js';
import setupCheckoutButton from './field/checkout-button.js';
import setupPaymentButton from './field/payment-button.js';

/**
 * Sets up the form's custom fields.
 *
 * @since 4.7.0
 *
 * @param {jQuery} $paymentForm Payment form.
 */
function setupFormFields( $paymentForm ) {
	setupCustomAmount( $paymentForm );
	setupPriceSelect( $paymentForm );
	setupRecurringToggle( $paymentForm );
	setupAmountBreakdown( $paymentForm );
	setupQuantity( $paymentForm );
	setupFeeRecovery( $paymentForm );
	setupAddress( $paymentForm );
	setupCoupon( $paymentForm );
	setupTaxId( $paymentForm );

	setupPaymentMethod( $paymentForm );
	setupCheckoutButton( $paymentForm );
	setupPaymentButton( $paymentForm );

	// These pass information to the Payment Element, so they need to be last.
	setupPhone( $paymentForm );
	setupName( $paymentForm );
	setupEmail( $paymentForm );
}

export default setupFormFields;
