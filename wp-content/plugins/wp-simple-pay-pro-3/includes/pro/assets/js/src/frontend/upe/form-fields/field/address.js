/**
 * Internal dependencies
 */
import { debounce } from '../../utils';

/**
 * Displays an inline error under the address.
 *
 * @since 4.7.0
 *
 * @param {Object} paymentForm Payment form.
 * @param {string} _errorMessage Error message override.
 */
export function showError( paymentForm, _errorMessage = null ) {
	const errorEl = paymentForm.querySelector( '.simpay-address-error' );

	if ( ! errorEl ) {
		return;
	}

	const { i18n } = paymentForm;
	const errorMessage = i18n.emptyAddressError;

	errorEl.style.display = 'block';
	errorEl.innerText = _errorMessage || errorMessage;
	wp.a11y.speak( errorMessage, 'assertive' );
}

/**
 * Hides an inline error under the address.
 *
 * @since 4.7.0
 *
 * @param {Object} paymentForm Payment form.
 */
export function hideError( paymentForm ) {
	const errorEl = paymentForm.querySelector( '.simpay-address-error' );

	if ( ! errorEl ) {
		return;
	}

	errorEl.style.display = 'none';
	errorEl.innerText = '';
}

/**
 * Determines if the payment form's "Address" custom field is complete/valid.
 *
 * @param {Object} paymentForm Payment form.
 */
export function isValid( paymentForm ) {
	const { settings, state } = paymentForm;
	const { addressType } = settings;
	const element = state[ `${ addressType }AddressElement` ];
	const { paymentMethod } = state;

	if (
		// If there is no Element, the address is not required.
		! element ||
		// If the payment method is Klarna, the address is not required.
		( 'billing' === addressType && paymentMethod.id === 'klarna' )
	) {
		return true;
	}

	// If the Element isn't complete let it show it's own error.
	const hasCompleteAddress =
		! state[ `${ addressType }Address` ] ||
		state[ `${ addressType }Address` ].complete;

	if ( ! hasCompleteAddress ) {
		element.focus();
	}

	return hasCompleteAddress;
}

/**
 * Sets up the "Address" field.
 *
 * @since 4.7.0
 *
 * @param {jQuery} $paymentForm Payment form.
 * @param {Object} $paymentForm.paymentForm Payment form.
 */
function setupAddress( $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const { settings, setState, state, stripeElements } = paymentForm;
	const { addressType } = settings;
	const addressEl = paymentForm.querySelector(
		`.simpay-${ addressType }-address-container .simpay-address-element`
	);

	if ( ! addressEl ) {
		return;
	}

	const defaultAddress = {
		line1: addressEl.dataset.defaultLine1 ?? null,
		line2: addressEl.dataset.defaultLine2 ?? null,
		city: addressEl.dataset.defaultCity ?? null,
		state: addressEl.dataset.defaultState ?? null,
		postal_code: addressEl.dataset.defaultPostalCode ?? null,
		country: addressEl.dataset.defaultCountry ?? null,
	};

	Object.keys( defaultAddress ).forEach( ( key ) => {
		if ( ! defaultAddress[ key ] ) {
			delete defaultAddress[ key ];
		}
	} );

	const addressElement = stripeElements.create( 'address', {
		mode: addressType,
		fields: {
			phone: 'never',
		},
		defaultValues: {
			address: defaultAddress,
		},
		allowedCountries: addressEl.dataset.allowedCountries
			? JSON.parse( addressEl.dataset.allowedCountries )
			: [],
	} );

	addressElement.mount( addressEl );

	// Track the Element in the state.
	setState( {
		[ `${ addressType }AddressElement` ]: addressElement,
	} );

	const debouncedChange = debounce( ( addressChange ) => {
		setState( {
			[ `${ addressType }Address` ]: {
				complete: addressChange.complete,
				...state[ `${ addressType }Address` ],
				...addressChange.value,
			},
		} );

		if ( addressChange.complete ) {
			$paymentForm.trigger( 'totalChanged', [ $paymentForm ] );
		}
	}, 500 );

	// Track the address information in the state.
	addressElement.on( 'change', ( addressChange ) => {
		hideError( paymentForm );
		debouncedChange( addressChange );
	} );
}

export default setupAddress;
