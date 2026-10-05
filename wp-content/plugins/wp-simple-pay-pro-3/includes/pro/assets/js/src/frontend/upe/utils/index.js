export * from './cart.js';
export * from './currency.js';
export * from './elements.js';
export * from './payment-methods.js';
export * from './prices.js';
export * from './tax.js';
export * from './token.js';

export function debounce( func, timeout ) {
	let timer;
	return ( ...args ) => {
		clearTimeout( timer );
		timer = setTimeout( () => {
			func.apply( this, args );
		}, timeout );
	};
}
