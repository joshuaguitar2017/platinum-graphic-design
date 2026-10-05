/**
 * Internal dependencies
 */
import { Cart } from './../';

describe( 'Card', () => {
	let cart;

	beforeEach( () => {
		cart = new Cart( {
			taxPercent: 5.575,
		} );

		cart.addLineItem( {
			id: 'foo',
			title: 'Foo',
			amount: 1200,
			quantity: 4,
		} );

		cart.addLineItem( {
			id: 'bar',
			title: 'Bar',
			amount: 7600,
			quantity: 1,
		} );
	} );

	/**
	 * LineItem
	 */
	describe( 'LineItem', () => {
		describe( 'getTax', () => {
			it( 'should return tax amount', () => {
				const item = cart.getLineItem( 'foo' );

				expect( item.getTax() ).toEqual( 1072 );
			} );
		} );

		describe( 'getTotal', () => {
			it( 'should include tax amount', () => {
				const item = cart.getLineItem( 'foo' );

				expect( item.getTotal() ).toEqual( 5872 );
			} );
		} );
	} );

	/**
	 * Cart
	 */
	describe( 'Cart', () => {
		// Taxes.
		describe( 'getTax', () => {
			it( 'should be a summation of tax applied to each line item', () => {
				expect( cart.getTax() ).toEqual( 692 );
			} );

			it( 'should subtract a percentage amount from each line before calculating tax', () => {
				cart.update( {
					coupon: {
						percent_off: 12,
					},
				} );

				expect( cart.getTax() ).toEqual( 608 );
			} );

			it( 'should subtract a flat amount from the cart subtotal before calculating tax', () => {
				cart.update( {
					coupon: {
						amount_off: 785,
					},
				} );

				expect( cart.getTax() ).toEqual( 648 );
			} );
		} );

		// Discounts.
		describe( 'getDiscount', () => {
			it( 'should return 0 with no coupon applied', () => {
				cart.update( {
					coupon: false,
				} );

				expect( cart.getDiscount() ).toEqual( 0 );
			} );

			// Flat discounts.
			describe( 'flat amount', () => {
				it( 'should return amount off', () => {
					cart.update( {
						coupon: {
							amount_off: 1200,
						},
					} );

					expect( cart.getDiscount() ).toEqual( 1200 );
				} );
			} );

			// Percent discounts.
			describe( 'percentage', () => {
				it( 'should return amount off', () => {
					cart.update( {
						coupon: {
							percent_off: 12,
						},
					} );

					expect( cart.getDiscount() ).toEqual( 1488 );
				} );
			} );
		} );

		// Total
		describe( 'getTotal', () => {
			it( 'should remove discount from subtotal', () => {
				expect( cart.getTotal() ).toEqual( 13092 );
			} );
		} );
	} );
} );
