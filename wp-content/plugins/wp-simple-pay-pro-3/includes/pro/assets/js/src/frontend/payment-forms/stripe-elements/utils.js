/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

const ELEMENTS_DEFAULT_STYLE = {
	base: {
		color: '#32325d',
		fontFamily:
			'-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji',
		fontSize: '15px',
		fontSmoothing: 'antialiased',
		fontWeight: 'normal',

		'::placeholder': {
			color: '#aab7c4',
		},
	},
	invalid: {
		color: '#fa755a',
		iconColor: '#fa755a',
	},
};

/**
 * Gets Element styles based on an existing form input.
 *
 * Injects supplementary styles for the wrapper element.
 *
 * @param {jQuery} spFormElem Form element jQuery object.
 * @param cardEl
 * @return {Object} Element style information.
 */
export function getElementStyle( spFormElem, cardEl ) {
	// Do nothing if an Element has already been styled;
	if ( document.getElementById( 'simpay-stripe-element-styles' ) ) {
		return ELEMENTS_DEFAULT_STYLE;
	}

	// Inject inline CSS instead of applying to the Element so it can be overwritten.
	const styleTag = document.createElement( 'style' );
	styleTag.id = 'simpay-stripe-element-styles';

	// Try to mimick existing input styles.
	let input;

	input = document.querySelector( 'input.simpay-email' );

	// Try one more input in the main page content.
	if ( ! input ) {
		input = document.querySelector(
			'body [role="main"] input:not([type="hidden"])'
		);
	}

	// Use default styles if no other input exists.
	if ( ! input ) {
		styleTag.innerHTML = `.StripeElement.simpay-field-wrap {
			background: #fff;
			border: 1px solid #d1d1d1;
			border-radius: 4px;
			padding: 0.4375em;
			height: 36px;
			min-height: 36px;
		}`;

		document.body.appendChild( styleTag );

		return ELEMENTS_DEFAULT_STYLE;
	}
	const inputStyles = window.getComputedStyle( input );
	const placeholderStyles = window.getComputedStyle( input, '::placeholder' );

	const trbl = [ 'top', 'right', 'bottom', 'left' ].map(
		( dir ) =>
			`border-${ dir }-color: ${ inputStyles.getPropertyValue(
				`border-${ dir }-color`
			) };
			border-${ dir }-width: ${ inputStyles.getPropertyValue(
				`border-${ dir }-width`
			) };
			border-${ dir }-style: ${ inputStyles.getPropertyValue(
				`border-${ dir }-style`
			) };
			padding-${ dir }: ${ inputStyles.getPropertyValue( `padding-${ dir }` ) };`
	);

	const corners = [
		'top-right',
		'bottom-right',
		'bottom-left',
		'top-left',
	].map(
		( corner ) =>
			`border-${ corner }-radius: ${ inputStyles.getPropertyValue(
				`border-${ corner }-radius`
			) };`
	);

	// Generate longhand properties.
	styleTag.innerHTML = `.StripeElement.simpay-field-wrap {
			background-color: ${ inputStyles.getPropertyValue( 'background-color' ) };
			${ trbl.join( '' ) }
			${ corners.join( '' ) }
		}`;

	document.body.appendChild( styleTag );

	return {
		base: {
			color: inputStyles.getPropertyValue( 'color' ),
			fontFamily: inputStyles.getPropertyValue( 'font-family' ),
			fontSize: inputStyles.getPropertyValue( 'font-size' ),
			fontWeight: inputStyles.getPropertyValue( 'font-weight' ),
			fontSmoothing: inputStyles.getPropertyValue(
				'-webkit-font-smoothing'
			),
			// This can't be fetched dynamically, unfortunately.
			'::placeholder': {
				color: '#c7c7c7',
			},
		},
	};
}

/**
 * Returns address data for a given address container element.
 *
 * @param {HTMLElement} addressContainer Address container to find the form elements in.
 * @return {Object} Address data.
 */
function getAddressData( addressContainer ) {
	const map = {
		line1: 'street',
		city: 'city',
		state: 'state',
		postal_code: 'zip',
		country: 'country',
	};

	return Object.keys( map ).reduce( ( address, key ) => {
		return {
			...address,
			[ key ]:
				addressContainer.querySelector(
					`.simpay-address-${ map[ key ] }`
				)?.value || null,
		};
	}, {} );
}

/**
 * Finds the Payment Method's owner data in the Payment Form.
 *
 * @param {PaymentForm} paymentForm
 */
export function getOwnerData( paymentForm ) {
	const form = paymentForm[ 0 ];

	const name = form.querySelector( '.simpay-customer-name' )?.value || null;
	const email = form.querySelector( '.simpay-email' )?.value || null;
	const phone = form.querySelector( '.simpay-telephone' )?.value || null;

	let billingAddress = null;
	let shippingAddress = null;

	const billingAddressContainer = form.querySelector(
		'.simpay-billing-address-container'
	);

	if ( billingAddressContainer ) {
		billingAddress = getAddressData( billingAddressContainer );
	}

	const sharedAddresses = form.querySelector( '.simpay-same-address-toggle' );

	if ( sharedAddresses && true === sharedAddresses.checked ) {
		shippingAddress = billingAddress;
	} else {
		const shippingAddressContainer = form.querySelector(
			'.simpay-shipping-address-container'
		);

		if ( shippingAddressContainer ) {
			shippingAddress = getAddressData( shippingAddressContainer );
		}
	}

	return {
		name,
		email,
		phone,
		address: billingAddress,
		shippingAddress,
	};
}
