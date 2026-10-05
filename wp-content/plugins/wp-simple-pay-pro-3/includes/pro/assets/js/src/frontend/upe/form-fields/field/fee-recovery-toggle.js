/**
 * Sets the state of the "Fee Recovery Toggle" input.
 *
 * @since 4.6.5
 *
 * @param {jQuery} $paymentForm Payment form.
 * @param {boolean} isCoveringFees Whether the customer is covering fees.
 */
function setIsCoveringFees( $paymentForm, isCoveringFees ) {
	const { paymentForm } = $paymentForm;
	const { setState } = paymentForm;

	setState( {
		isCoveringFees,
	} );

	$paymentForm.trigger( 'totalChanged', [ $paymentForm ] );
}

/**
 * Binds the "Fee Recovery Toggle" input events to update totals when changed.
 *
 * @param {jQuery} $paymentForm Payment form.
 */
function bindToggle( $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const feeRecoveryToggleInput = paymentForm.querySelector(
		'.simpay-fee-recovery-toggle'
	);

	if ( ! feeRecoveryToggleInput ) {
		return;
	}

	feeRecoveryToggleInput.addEventListener( 'change', ( { target } ) => {
		setIsCoveringFees( $paymentForm, target.checked );

		// Show in amount breakdown, if needed.
		const amountBreakdownFeeRecoveryRow = paymentForm.querySelector(
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
 * Sets up the "Fee Recovery Toggle" custom field.
 *
 * @since 4.7.0
 *
 * @param {jQuery} $paymentForm Payment form
 * @param {Object} $paymentForm.paymentForm Payment form.
 */
function setupFeeRecoveryToggle( $paymentForm ) {
	const { paymentForm } = $paymentForm;
	const feeRecoveryToggleInput = paymentForm.querySelector(
		'.simpay-fee-recovery-toggle'
	);

	// Set initial state and bind toggles.
	setIsCoveringFees(
		$paymentForm,
		! feeRecoveryToggleInput ||
			( feeRecoveryToggleInput && feeRecoveryToggleInput.checked )
	);

	bindToggle( $paymentForm );
}

export default setupFeeRecoveryToggle;
