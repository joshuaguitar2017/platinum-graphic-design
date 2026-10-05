/* global jQuery */

/** @typedef {import('@wpsimplepay/payment-forms').PaymentForm} PaymentForm */

/**
 * Sets the state of the "Fee Recovery Toggle" input.
 *
 * @since 4.6.5
 *
 * @param {PaymentForm} paymentForm Payment form.
 * @param {boolean} isCoveringFees Whether the customer is covering fees.
 */
function setIsCoveringFees( paymentForm, isCoveringFees ) {
	const { setState, __unstableLegacyFormData } = paymentForm;

	setState( {
		isCoveringFees,
	} );

	paymentForm.trigger( 'totalChanged', [
		paymentForm,
		__unstableLegacyFormData,
	] );
}

/**
 * Binds the "Fee Recovery Toggle" input events to update totals when changed.
 *
 * @param {PaymentForm} paymentForm Payment form.
 */
function bindToggle( paymentForm ) {
	const feeRecoveryToggleInput = paymentForm[ 0 ].querySelector(
		'.simpay-fee-recovery-toggle'
	);

	if ( ! feeRecoveryToggleInput ) {
		return;
	}

	feeRecoveryToggleInput.addEventListener( 'change', ( { target } ) => {
		setIsCoveringFees( paymentForm, target.checked );

		// Show in amount breakdown, if needed.
		const amountBreakdownFeeRecoveryRow = paymentForm[ 0 ].querySelector(
			'.simpay-fee-recovery-container'
		);

		if ( amountBreakdownFeeRecoveryRow ) {
			amountBreakdownFeeRecoveryRow.style.display = target.checked
				? 'block'
				: 'none';
		}
	} );
}

/**
 * Bind events to Payment Form.
 */
jQuery( document.body ).on(
	'simpaySetupCoreForm',
	// eslint-disable-line no-unused-vars
	( e, paymentForm ) => {
		const feeRecoveryToggleInput = paymentForm[ 0 ].querySelector(
			'.simpay-fee-recovery-toggle'
		);

		// Set initial state and bind toggles.
		setIsCoveringFees(
			paymentForm,
			! feeRecoveryToggleInput ||
				( feeRecoveryToggleInput && feeRecoveryToggleInput.checked )
		);

		bindToggle( paymentForm );
	}
);
