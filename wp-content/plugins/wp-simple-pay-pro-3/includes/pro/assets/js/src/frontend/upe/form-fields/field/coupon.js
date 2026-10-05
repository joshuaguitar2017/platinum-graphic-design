/**
 * WordPress dependencies
 */
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { update as updateAmounts } from './amount-breakdown.js';

/**
 * Displays an inline error under the coupon field.
 *
 * @since 4.7.0
 *
 * @param {Object} paymentForm Payment form.
 * @param {string} errorMessage Error message to dipslay.
 */
export function showError( paymentForm, errorMessage ) {
	const errorEl = paymentForm.querySelector( '.simpay-coupon-error' );

	errorEl.innerText = errorMessage;
	errorEl.style.display = 'block';
	wp.a11y.speak( errorMessage, 'assertive' );
}

/**
 * Hides an inline error under the custom amount.
 *
 * @since 4.7.0
 *
 * @param {Object} paymentForm Payment form.
 */
export function hideError( paymentForm ) {
	const errorEl = paymentForm.querySelector( '.simpay-coupon-error' );

	errorEl.innerText = '';
	errorEl.style.display = 'none';
}

/**
 * Apply a coupon.
 *
 * @param {jQuery} $paymentForm Payment form.
 */
export function apply( $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const { cart, disable, enable, formId, setState } = paymentForm;

	const couponFieldEl = paymentForm.querySelector( '.simpay-coupon-field' );
	const couponCode = couponFieldEl.value;
	const { state } = paymentForm;
	if ( '' === couponCode ) {
		return;
	}

	hideError( paymentForm );
	disable();

	window.wp
		.apiFetch( {
			path: 'wpsp/__internal__/payment/validate-coupon',
			method: 'POST',
			data: {
				coupon_code: couponCode,
				form_id: formId,
				currency: cart.getCurrency(),
				subtotal: cart.getSubtotal(),
				price_id: cart.getLineItem( 'base' ).price.id,
				is_optionally_recurring: state.isOptionallyRecurring,
			},
		} )
		.then( ( { message, coupon } ) => {
			setState( {
				coupon: couponCode,
			} );

			cart.update( {
				coupon,
			} );

			// Show the message/remove link.
			paymentForm.querySelector( '.simpay-coupon-info' ).style.display =
				'block';
			paymentForm.querySelector(
				'.simpay-coupon-message'
			).innerText = decodeEntities( message );

			wp.a11y.speak( message, 'polite' );

			$paymentForm.trigger( 'simpayCouponApplied' );
		} )
		.catch( ( { message } ) => {
			showError( paymentForm, message );
		} )
		.finally( () => {
			couponFieldEl.value = '';
			$paymentForm.trigger( 'totalChanged', [ $paymentForm ] );
			enable();
		} );
}

/**
 * Remove a coupon.
 *
 * @param {jQuery} $paymentForm Payment form.
 */
export function remove( $paymentForm ) {
	const { paymentForm } = $paymentForm;

	// Hide the mesage/remove link.
	paymentForm.querySelector( '.simpay-coupon-info' ).style.display = 'none';
	paymentForm.querySelector( '.simpay-coupon-message' ).innerText = '';

	paymentForm.cart.update( {
		coupon: false,
	} );

	paymentForm.setState( {
		coupon: false,
	} );

	// Trigger custom event when coupon apply done.
	$paymentForm.trigger( 'simpayCouponRemoved' );
	$paymentForm.trigger( 'totalChanged', [ $paymentForm ] );
}

/**
 * Removes the applied coupon if the new subtotal is below the minimum required amount.
 *
 * @param {jQuery} $paymentForm Payment form.
 */
function onChangePrice( $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const { cart } = paymentForm;
	const { subscription } = cart.getLineItem( 'base' );
	const coupon = cart.getCoupon();

	if ( false === coupon ) {
		return;
	}

	const { price } = cart.getLineItem( 'base' );
	const {
		currency_min_amount: currencyMinAmount,
		unit_amount: unitAmount,
	} = price;

	const discountedAmount = cart.getSubtotal() - cart.getDiscount();

	// Allow 100% discount
	if (
		false !== subscription &&
		coupon.percent_off &&
		coupon.percent_off === 100
	) {
		return;
	}

	// Allow fixed amount discount even if the subtotal is below the discount amount.

	if (
		false !== subscription &&
		discountedAmount < currencyMinAmount &&
		0 !== discountedAmount &&
		unitAmount > discountedAmount &&
		discountedAmount > 0
	) {
		remove( $paymentForm );
	}

	if ( discountedAmount < currencyMinAmount && false === subscription ) {
		remove( $paymentForm );
	}
}

/**
 * Binds the coupon field events.
 *
 * @param {jQuery} $paymentForm Payment form.
 */
function bindEvents( $paymentForm ) {
	const { paymentForm } = $paymentForm;

	const applyButtonEl = paymentForm.querySelector( '.simpay-apply-coupon' );
	applyButtonEl.addEventListener( 'click', () => apply( $paymentForm ) );

	const couponFieldEl = paymentForm.querySelector( '.simpay-coupon-field' );

	if ( '' !== couponFieldEl.value ) {
		apply( $paymentForm );
	}

	couponFieldEl.addEventListener( 'keypress', ( keyPress ) => {
		if ( 13 !== keyPress.which ) {
			return;
		}

		keyPress.preventDefault();

		return apply( $paymentForm );
	} );

	const removeButtonEl = paymentForm.querySelector( '.simpay-remove-coupon' );
	removeButtonEl.addEventListener( 'click', ( clickEvent ) => {
		clickEvent.preventDefault();
		remove( $paymentForm );
	} );
}

/**
 * Sets up the "Coupon" custom field.
 *
 * @since 4.7.0
 *
 * @param {jQuery} $paymentForm Payment form
 * @param {Object} $paymentForm.paymentForm Payment form.
 */
function setupCoupon( $paymentForm ) {
	// Only setup if the field exists.
	const { paymentForm } = $paymentForm;
	const couponFieldEl = paymentForm.querySelector( '.simpay-coupon-field' );

	if ( ! couponFieldEl ) {
		return;
	}

	// Bind events.
	bindEvents( $paymentForm );

	// Possibly remove a coupon if the subtotal is below the minimum amount.
	$paymentForm.on( 'totalChanged', () => onChangePrice( $paymentForm ) );
}

export default setupCoupon;
