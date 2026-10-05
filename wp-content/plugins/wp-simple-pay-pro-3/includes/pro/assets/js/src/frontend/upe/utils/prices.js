/**
 * Returns the default price option for the payment form.
 *
 * @param paymentForm
 * @since 4.7.0
 */
export function getDefaultPrice( paymentForm ) {
	const defaultPrice = Object.values( paymentForm.settings.prices ).filter(
		( { default: isDefault } ) => {
			return true === isDefault;
		}
	);

	return defaultPrice[ 0 ];
}
