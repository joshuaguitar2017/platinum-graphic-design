/**
 * Toggle an overlay form's visibility.
 *
 * Attach to any type of link. Useful when the form number is known.
 *
 * document.querySelector( '.my-link' ).addEventListener( 'click', function( e ) {
 *   e.preventDefault();
 *   simpayAppPro.toggleOverlayForm( 13 );
 * } );
 *
 * Attach to a button that has an associated form ID. Useful when the form number is dynamic.
 * This functionality is added by default to [simpay id="13"] shortcode usage.
 *
 * <button data-form-id="13">Launch</button>
 * document.querySelector( '.my-button' ).addEventListener( 'click', simpayAppPro.toggleOverlayForm );
 *
 * @param {mixed} Click or change event, or an ID of a form.
 * @param formData
 */
export function toggle( e ) {
	let formId = false;

	if ( 'object' === typeof e ) {
		e.preventDefault();
		formId = e.target.dataset.formId;
	} else {
		formId = e;
	}

	// Find the modal.
	let modal = document.querySelectorAll(
		'.simpay-modal[data-form-id="' + formId + '"]'
	);

	if ( 0 === modal.length ) {
		return;
	}

	// Always get the last instance of the modal markup since the markup
	// is moved to the end of the DOM.
	//
	// @link https://github.com/wpsimplepay/WP-Simple-Pay-Pro-3/issues/738
	modal = modal[ modal.length - 1 ];

	// Move Modal markup to end of the document.
	document.body.appendChild( modal );

	const modalStyles = getComputedStyle( modal );
	const isVisible = '0' !== modalStyles.getPropertyValue( 'opacity' );

	if ( isVisible ) {
		modal.style.opacity = 0;
		modal.style.height = 0;
	} else {
		modal.style.opacity = 1;
		modal.style.height = '100%';

		// Focus first field.
		focusFirstField( modal );
	}
}

/**
 * Focus first field in an overlay form's modal.
 *
 * @param {HTMLElement} modal Modal being shown.
 */
function focusFirstField( modal ) {
	/**
	 * Selectable elements.
	 */
	const SELECTOR = [
		'button:not([disabled])',
		'input:not([type="hidden"]):not([aria-hidden]):not([disabled])',
		'select:not([disabled])',
		'textarea:not([disabled])',
	].join( ',' );

	const firstModalField = modal.querySelector( SELECTOR );

	if ( firstModalField ) {
		firstModalField.focus();
		firstModalField.parentElement.classList.add( 'is-focused' );
	}
}

let OVERLAYS_SETUP = false;

/**
 * Manage modal toggling for "Overlay" form display types.
 *
 * Initial HTML markup for the modal is output as a sibling to the toggle
 * control but is moved to the end of the document to combat issues with z-index.
 *
 * @link https://github.com/wpsimplepay/WP-Simple-Pay-Pro-3/issues/610
 * @link https://github.com/wpsimplepay/WP-Simple-Pay-Pro-3/issues/645
 *
 * @param {jQuery} $paymentForm Payment form.
 */
function setupOverlays() {
	// This function can be called multiple times with the
	// `simpayBindCoreFormEventsAndTriggers` trigger.
	//
	// Because we need to allow custom controls outside of the form context
	// we must query from the document level, not the <form>.
	//
	// Anonymous functions or functions created in this scope will stack
	// when attached to an element. To avoid keep access to the initial
	// form context we ensure nothing continues after this function is run once.
	//
	// @link https://github.com/wpsimplepay/WP-Simple-Pay-Pro-3/issues/958
	if ( true === OVERLAYS_SETUP ) {
		return;
	}

	OVERLAYS_SETUP = true;

	const inputControls = document.querySelectorAll(
		'input.simpay-modal-control'
	);
	const controls = document.querySelectorAll(
		'*:not(input).simpay-modal-control'
	);

	// Bind each control to toggle a modal.
	inputControls.forEach( ( control ) => {
		control.addEventListener( 'change', toggle );
	} );

	controls.forEach( ( control ) => {
		control.addEventListener( 'click', toggle );
	} );
}

export default setupOverlays;
