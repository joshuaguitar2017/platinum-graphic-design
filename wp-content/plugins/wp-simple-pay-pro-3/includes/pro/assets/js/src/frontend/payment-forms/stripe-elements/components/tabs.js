/* global jQuery, _ */

/**
 * Internal dependencies
 */
const { hooks } = window.wpsp;

/**
 * DOM loaded.
 */
window.addEventListener( 'DOMContentLoaded', () => {
	const tabs = document.querySelectorAll(
		'.simpay-form-tabs-toggles__toggle[role="tab"]'
	);

	// Add a click event handler to each tab.
	if ( tabs ) {
		_.each( tabs, ( tab ) => {
			tab.addEventListener( 'click', changeTabs );
		} );
	}

	// Enable arrow navigation between tabs in the tab list
	const tabList = document.querySelector(
		'.simpay-form-tabs-toggles[role="tablist"]'
	);

	if ( ! tabList ) {
		return;
	}

	let tabFocus = 0;

	/**
	 * Move focus with arrow keys.
	 *
	 * @since 3.8.0
	 *
	 * @param {Event} e Keydown event.
	 */
	tabList.addEventListener( 'keydown', ( e ) => {
		const { keyCode } = e;

		// Move right.
		if ( keyCode === 39 || keyCode === 37 ) {
			tabs[ tabFocus ].setAttribute( 'tabindex', -1 );

			if ( keyCode === 39 ) {
				tabFocus++;

				// If we're at the end, go to the start.
				if ( tabFocus >= tabs.length ) {
					tabFocus = 0;
				}

				// Move left.
			} else if ( keyCode === 37 ) {
				tabFocus--;

				// If we're at the start, move to the end.
				if ( tabFocus < 0 ) {
					tabFocus = tabs.length - 1;
				}
			}

			tabs[ tabFocus ].setAttribute( 'tabindex', 0 );
			tabs[ tabFocus ].focus();
		}
	} );
} );

/**
 * Change a tab.
 *
 * @param {Event} click Event.
 * @param e
 */
function changeTabs( e ) {
	e.preventDefault();

	const target = e.currentTarget;
	const parent = target.parentNode;
	const grandparent = parent.parentNode;

	// Remove all current selected tabs.
	const tabs = parent.querySelectorAll( '[aria-selected="true"]' );

	jQuery.each( tabs, ( i, el ) => {
		el.classList.remove( 'is-active' );
		el.setAttribute( 'aria-selected', false );
	} );

	// Set this tab as selected.
	target.setAttribute( 'aria-selected', true );
	target.classList.add( 'is-active' );

	// Hide all tab panels.
	const panels = grandparent.querySelectorAll( '[role="tabpanel"]' );

	jQuery.each( panels, ( i, el ) => {
		el.setAttribute( 'hidden', true );
	} );

	const panelId = target.getAttribute( 'aria-controls' );

	// Show the selected panel.
	grandparent.parentNode
		.querySelector( `#${ panelId }` )
		.removeAttribute( 'hidden' );
}
