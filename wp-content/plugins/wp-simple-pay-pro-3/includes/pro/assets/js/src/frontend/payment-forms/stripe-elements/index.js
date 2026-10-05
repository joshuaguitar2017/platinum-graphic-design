/**
 * Internal dependencies
 */
import './components';
import './payment-methods';
import './overlays.js';

import { default as setup } from './setup.js';
import { default as submit } from './submit.js';
import { default as enable } from './enable.js';
import { default as disable } from './disable.js';
import { default as error } from './error.js';
import { getElementStyle, getOwnerData } from './utils.js';

const { registerPaymentFormType } = window.wpsp.paymentForms;
const type = 'stripe-elements';

registerPaymentFormType( type, {
	type,
	setup,
	submit,
	enable,
	disable,
	error,
	getElementStyle,
	getOwnerData,
} );
