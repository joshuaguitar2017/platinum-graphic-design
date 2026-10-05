/**
 * Returns the Stripe Elements configuration.
 *
 * @since 4.7.0
 *
 * @param {Object} elements Elements default configuration.
 * @return {Object} Elements configuration.
 */
export function getElementsConfig( elements ) {
	const base = {
		loader: 'auto',
		...elements,
	};

	// Use unopinionated styles, and try to base it off the current theme styles.
	if ( elements.appearance ) {
		return base;
	}

	// Inject inline CSS instead of applying to the Element so it can be overwritten.
	const styleTag = document.createElement( 'style' );
	styleTag.id = 'simpay-stripe-element-styles';

	// Try to mimick existing input styles.
	let input, label;

	input = document.querySelector(
		'.simpay-checkout-form input[type="email"]'
	);
	label = document.querySelector( '.simpay-checkout-form label' );

	// Try one more input in the main page content.
	if ( ! input ) {
		input = document.querySelector(
			'body [role="main"] input:not([type="hidden"])'
		);

		label = document.querySelector( 'body [role="main"] label' );
	}

	if ( ! input || ! label ) {
		return base;
	}

	const inputStyles = window.getComputedStyle( input );
	const labelStyles = window.getComputedStyle( label );

	const preFocus = {
		variables: {
			fontSizeBase: labelStyles.getPropertyValue( 'font-size' ),
			fontFamily: labelStyles.getPropertyValue( 'font-family' ),
			borderRadius: inputStyles.getPropertyValue( 'border-radius' ),
		},
		rules: {
			'.Tab': {
				boxShadow: inputStyles.getPropertyValue( 'box-shadow' ),
				border: inputStyles.getPropertyValue( 'border' ),
				borderRadius: inputStyles.getPropertyValue( 'border-radius' ),
				background: inputStyles.getPropertyValue( 'background' ),
			},
			'.Input': {
				color: inputStyles.getPropertyValue( 'color' ),
				fontSize: inputStyles.getPropertyValue( 'font-size' ),
				fontWeight: inputStyles.getPropertyValue( 'font-weight' ),
				lineHeight: inputStyles.getPropertyValue( 'line-height' ),
				padding: inputStyles.getPropertyValue( 'padding' ),
				boxShadow: inputStyles.getPropertyValue( 'box-shadow' ),
				border: inputStyles.getPropertyValue( 'border' ),
				borderRadius: inputStyles.getPropertyValue( 'border-radius' ),
				background: inputStyles.getPropertyValue( 'background' ),
			},
		},
	};

	// Retrieve the computed focus styles by noting the current focused element,
	// then focusing the found input, recording the styles, then returning focus.
	// eslint-disable-next-line @wordpress/no-global-active-element
	const focusedElement = document.activeElement;
	input.focus();
	const inputFocusStyles = window.getComputedStyle( input );
	focusedElement.focus();

	return {
		...base,
		appearance: {
			theme: 'stripe',
			variables: {
				...preFocus.variables,
			},
			rules: {
				...preFocus.rules,
				'.Tab:focus': {
					boxShadow: inputFocusStyles.getPropertyValue(
						'box-shadow'
					),
					border: inputFocusStyles.getPropertyValue( 'border' ),
					borderRadius: inputFocusStyles.getPropertyValue(
						'border-radius'
					),
					background: inputFocusStyles.getPropertyValue(
						'background'
					),
					outline: inputFocusStyles.getPropertyValue( 'outline' ),
					outlineOffset: inputFocusStyles.getPropertyValue(
						'outline-offset'
					),
				},
				'.Tab--selected': {
					boxShadow: inputFocusStyles.getPropertyValue(
						'box-shadow'
					),
					border: inputFocusStyles.getPropertyValue( 'border' ),
					borderRadius: inputFocusStyles.getPropertyValue(
						'border-radius'
					),
					background: inputFocusStyles.getPropertyValue(
						'background'
					),
					outline: inputFocusStyles.getPropertyValue( 'outline' ),
					outlineOffset: inputFocusStyles.getPropertyValue(
						'outline-offset'
					),
				},
				'.Input:focus': {
					color: inputFocusStyles.getPropertyValue( 'color' ),
					fontSize: inputFocusStyles.getPropertyValue( 'font-size' ),
					fontWeight: inputFocusStyles.getPropertyValue(
						'font-weight'
					),
					lineHeight: inputFocusStyles.getPropertyValue(
						'line-height'
					),
					padding: inputFocusStyles.getPropertyValue( 'padding' ),
					boxShadow: inputFocusStyles.getPropertyValue(
						'box-shadow'
					),
					border: inputFocusStyles.getPropertyValue( 'border' ),
					borderRadius: inputFocusStyles.getPropertyValue(
						'border-radius'
					),
					background: inputFocusStyles.getPropertyValue(
						'background'
					),
					outline: inputFocusStyles.getPropertyValue( 'outline' ),
					outlineOffset: inputFocusStyles.getPropertyValue(
						'outline-offset'
					),
				},
			},
		},
	};
}
