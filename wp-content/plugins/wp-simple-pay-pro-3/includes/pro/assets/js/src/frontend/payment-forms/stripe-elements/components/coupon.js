/* global jQuery */

const { formatCurrency } = window.spShared;
const { debugLog, convertToDollars } = window.spShared;

/**
 * Apply a coupon.
 *
 * @param {jQuery} spFormElem Form element jQuery object.
 * @param {Object} formData Configured form data.
 */
export function apply( spFormElem, formData ) {
	const $ = jQuery;
	const couponField = spFormElem.find( '.simpay-coupon-field' );
	const responseContainer = spFormElem.find( '.simpay-coupon-message' );
	const loadingImage = spFormElem.find( '.simpay-coupon-loading' );
	const removeCoupon = spFormElem.find( '.simpay-remove-coupon' );
	const hiddenCouponElem = spFormElem.find( '.simpay-coupon' );

	let coupon = '';
	let couponMessage = '';

	if ( ! couponField.val() && ! formData.couponCode ) {
		return;
	} else if ( formData.couponCode ) {
		coupon = formData.couponCode;
	} else {
		coupon = couponField.val();
	}

	const { cart } = spFormElem;
	const item = cart.getLineItem( 'base' );
	const { price } = item;

	// AJAX params
	const data = {
		coupon,
		price,
		amount: spFormElem.cart.getSubtotal(),
		action: 'simpay_get_coupon',
		form_id: formData.formId,
		couponNonce: spFormElem.find( '[id^="simpay-coupon-nonce"]' ).val(),
	};

	// Clear the response container and hide the remove coupon link
	responseContainer.text( '' );
	removeCoupon.hide();

	// Clear textbox
	couponField.val( '' );

	// Show the loading image
	loadingImage.show();

	$.ajax( {
		url: window.spGeneral.strings.ajaxurl,
		method: 'POST',
		data,
		dataType: 'json',
		success( response ) {
			if ( response.success ) {
				// Backwards compatibility.
				formData.couponCode = coupon;
				formData.discount = response.discount;

				// Update the cart.
				try {
					spFormElem.setState( {
						coupon,
					} );

					spFormElem.cart.update( {
						coupon: response.stripeCoupon,
					} );
				} catch ( error ) {
					debugLog( error );
				}

				// Coupon message for frontend
				couponMessage = response.coupon.code + ': ';

				// Output different text based on the type of coupon it is - amount off or a percentage
				if ( 'percent' === response.coupon.type ) {
					couponMessage += spGeneral.i18n.couponPercentOffText.replace(
						'%s',
						`${ response.coupon.amountOff }%`
					);
				} else if ( 'amount' === response.coupon.type ) {
					const amount = formatCurrency(
						cart.isZeroDecimal()
							? response.stripeCoupon.amount_off
							: convertToDollars(
									response.stripeCoupon.amount_off
							  ),
						true,
						cart.getCurrencySymbol(),
						cart.isZeroDecimal()
					);

					couponMessage += spGeneral.i18n.couponAmountOffText.replace(
						'%s',
						amount
					);
				}

				$( '.coupon-details' ).remove();

				// Update the coupon message text
				responseContainer.append( couponMessage ).show();

				wp.a11y.speak( couponMessage, 'polite' );

				// Create a hidden input to send our coupon details for Stripe metadata purposes
				$( '<input />', {
					name: 'simpay_coupon_details',
					type: 'hidden',
					value: couponMessage,
					class: 'simpay-coupon-details',
				} ).appendTo( responseContainer );

				// Show remove coupon link
				removeCoupon.show();

				// Add the coupon to our hidden element for processing
				hiddenCouponElem.val( coupon );

				// Hide the loading image
				loadingImage.hide();

				// Trigger custom event when coupon apply done.
				spFormElem.trigger( 'simpayCouponApplied' );
			} else {
				spFormElem.setState( {
					coupon: false,
				} );

				// Show invalid coupon message
				responseContainer
					.show()
					.append(
						$( '<p />' )
							.addClass( 'simpay-field-error' )
							.text( response.data.error )
					);

				wp.a11y.speak( response.data.error, 'polite' );

				// Hide loading image
				loadingImage.hide();
			}
		},
		error( response ) {
			spFormElem.setState( {
				coupon: false,
			} );

			let errorMessage = '';

			const { debugLog } = window.spShared;

			debugLog( 'Coupon error', response.responseText );

			if ( response.responseText ) {
				errorMessage = response.responseText;
			}

			// Show invalid coupon message
			responseContainer
				.show()
				.append(
					$( '<p />' )
						.addClass( 'simpay-field-error' )
						.text( errorMessage )
				);

			wp.a11y.speak( errorMessage, 'polite' );

			// Hide loading image
			loadingImage.hide();
		},
		complete( response ) {
			// Alert the rest of the components they need to update.
			// Tell main totalChanged handler not to do anything with coupons.
			spFormElem.trigger( 'totalChanged', [
				spFormElem,
				formData,
				false,
			] );
		},
	} );
}

/**
 * Remove a coupon.
 *
 * @param {jQuery} spFormElem Form element jQuery object.
 * @param {Object} formData Configured form data.
 */
export function remove( spFormElem, formData ) {
	const { debugLog } = window.spShared;

	try {
		spFormElem.cart.update( {
			coupon: false,
		} );

		spFormElem.setState( {
			coupon: false,
		} );

		// Trigger custom event when coupon apply done.
		spFormElem.trigger( 'simpayCouponRemoved' );

		// Alert the rest of the components they need to update.
		// Tell main totalChanged handler not to do anything with coupons.
		spFormElem.trigger( 'totalChanged', [ spFormElem, formData, false ] );
	} catch ( error ) {
		debugLog( error );
	}

	// Backwards compatibility.
	spFormElem.find( '.simpay-coupon-loading' ).hide();
	spFormElem.find( '.simpay-remove-coupon' ).hide();
	spFormElem.find( '.simpay-coupon-message' ).text( '' ).hide();
	spFormElem.find( '.simpay-coupon' ).val( '' );

	formData.couponCode = '';
	formData.discount = 0;
}

/**
 * Removes the applied coupon if the new subtotal is below the minimum required amount.
 *
 * @param {Object} price Selected price option.
 * @param {jQuery} spFormElem Form element jQuery object.
 * @param {Object} formData Configured form data.
 */
function onChangePrice( price, spFormElem, formData ) {
	const { cart } = spFormElem;
	const { currency_min_amount: currencyMinAmount } = price;
	const discountedAmount = cart.getSubtotal() - cart.getDiscount();

	if ( discountedAmount < currencyMinAmount ) {
		remove( spFormElem, formData );
	}
}

/**
 * Bind events to Payment Form.
 */
$( document.body ).on(
	'simpayBindCoreFormEventsAndTriggers',
	// eslint-disable-line no-unused-vars
	( e, spFormElem, formData ) => {
		/**
		 * Apply a coupon when the "Apply" button is clicked.
		 *
		 * @param {Event} e Click event.
		 */
		spFormElem.find( '.simpay-apply-coupon' ).on( 'click', ( e ) => {
			e.preventDefault();

			return apply( spFormElem, formData );
		} );

		/**
		 * Apply a coupon when the "Enter" key is pressed while focusing on the input field.
		 *
		 * @param {Event} e Click event.
		 */
		spFormElem.find( '.simpay-coupon-field' ).on( 'keypress', ( e ) => {
			if ( 13 !== e.which ) {
				return;
			}

			e.preventDefault();

			return apply( spFormElem, formData );
		} );

		/**
		 * Remove a coupon when the "Remove" button is clicked.
		 *
		 * @param {Event} e Click event.
		 */
		spFormElem.find( '.simpay-remove-coupon' ).on( 'click', ( e ) => {
			e.preventDefault();

			return remove( spFormElem, formData );
		} );

		// Possibly remove a coupon if the subtotal is below the minimum amount.
		// eslint-disable-line no-unused-vars
		spFormElem.on( 'simpayMultiPlanChanged', ( e, price ) => {
			onChangePrice( price, spFormElem, formData );
		} );
	}
);
