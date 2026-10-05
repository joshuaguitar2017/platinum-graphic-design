/* global accounting */

/**
 * Return amount as number value.
 *
 * @param {string} amount Amount to unformat.
 * @return {number}
 */
export function unformatCurrency( amount ) {
	return Math.abs(
		accounting.unformat( amount, this.i18n.decimalSeparator )
	);
}

/**
 * Return amount as formatted string.
 *
 * @param {number} amount Amount to format.
 * @param _includeSymbol
 * @param _currencySymbol
 * @param _isZeroDecimal
 * @return string
 */
export function formatCurrency(
	amount,
	_includeSymbol,
	_currencySymbol,
	_isZeroDecimal
) {
	const includeSymbol = _includeSymbol || false;
	const currencySymbol = _currencySymbol || this.i18n.currencySymbol;
	const isZeroDecimal = _isZeroDecimal || false;

	// Default format is to the left with no space.
	let format = '%s%v';

	if ( includeSymbol ) {
		// Account for other symbol placement formats (besides default left without space).
		switch ( this.i18n.currencyPosition ) {
			case 'left_space':
				format = '%s %v'; // Left side with space
				break;

			case 'right':
				format = '%v%s'; // Right side without space
				break;

			case 'right_space':
				format = '%v %s'; // Right side with space
				break;
		}
	}

	const args = {
		symbol: includeSymbol ? currencySymbol : '',
		decimal: this.i18n.decimalSeparator,
		thousand: this.i18n.thousandSeparator,
		precision: isZeroDecimal ? 0 : this.i18n.decimalPlaces,
		format,
	};

	return accounting.formatMoney( amount, args );
}

/**
 * Converts an amount to "dollars", assuming a non-zero decimal currency.
 *
 * @param {number} amount
 * @return {number} Dollars
 */
export function convertToDollars( amount ) {
	return accounting.toFixed( amount / 100, 2 );
}

/**
 * Convert from dollars to cents (in USD).
 * Uses global zero decimal currency setting.
 * Leaves zero decimal currencies alone.
 *
 * @param {number} amount
 * @return {number} Cents
 */
export function convertToCents( amount ) {
	return Number( accounting.toFixed( amount * 100, 0 ) );
}
