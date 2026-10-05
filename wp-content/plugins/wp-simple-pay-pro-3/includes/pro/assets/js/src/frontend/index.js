/**
 * Internal dependencies.
 */
import './payment-forms';
import { default as legacyHelpers } from './utils/legacy.js';

/**
 * Legacy API.
 */
window.simpayAppPro = {
	paymentRequestButtons: {},
	...legacyHelpers,
};
