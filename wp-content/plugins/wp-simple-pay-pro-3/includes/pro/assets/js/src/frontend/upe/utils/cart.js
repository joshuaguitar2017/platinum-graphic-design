/**
 * Primes a cart based on Payment Form data.
 *
 * @param {Cart} cart Payment Form cart.
 * @param paymentForm
 */
export function setupPaymentFormCart( cart, paymentForm ) {
	const {
		settings: { taxRates, taxStatus },
		state: { price },
	} = paymentForm;

	// Create a cart from the default price.
	const {
		unit_amount: unitAmount,
		currency,
		can_recur: canRecur,
		recurring,
	} = price;

	cart.update( {
		currency,
		taxRates,
		taxStatus,
	} );

	cart.addLineItem( {
		id: 'setup-fee',
		title: 'Initial Setup Fee',
		amount: 0,
		quantity: 1,
		subscription: false,
	} );

	cart.addLineItem( {
		id: 'plan-setup-fee',
		title: 'Plan Setup Fee',
		amount: 0,
		quantity: 1,
		subscription: false,
	} );

	cart.addLineItem( {
		id: 'base',
		price,
		title: recurring && false === canRecur ? 'Subscription' : 'One Time',
		amount: unitAmount,
		quantity: 1,
		subscription:
			recurring && false === canRecur
				? {
						isTrial: !! recurring.trial_period_days,
						interval: recurring.interval,
						intervalCount: recurring.interval_count,
				  }
				: false,
	} );

	return cart;
}
