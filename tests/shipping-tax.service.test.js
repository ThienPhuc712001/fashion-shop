import { calculateShippingFee, getShippingMethods, calculateTax, } from '../src/services/shipping-tax.service';
describe('Shipping & Tax Service', () => {
    const mockOrder = {
        subtotal: 1000000,
        shipping_address: {
            province: 'Hanoi',
            district: 'Hoan Kiem',
        },
    };
    describe('calculateShippingFee', () => {
        it('should calculate shipping fee for standard method', async () => {
            const fee = await calculateShippingFee(mockOrder, 'standard');
            expect(typeof fee).toBe('number');
            expect(fee).toBeGreaterThanOrEqual(0);
        });
        it('should calculate shipping fee for express method', async () => {
            const fee = await calculateShippingFee(mockOrder, 'express');
            expect(typeof fee).toBe('number');
            // express usually more expensive
        });
        it('should return 0 for free shipping if applicable', async () => {
            // If order total above threshold
            const bigOrder = Object.assign(Object.assign({}, mockOrder), { subtotal: 2000000 });
            const fee = await calculateShippingFee(bigOrder, 'standard');
            expect(fee).toBe(0);
        });
    });
    describe('getShippingMethods', () => {
        it('should list available shipping methods', async () => {
            const methods = await getShippingMethods(mockOrder.shipping_address);
            expect(Array.isArray(methods)).toBe(true);
            expect(methods.length).toBeGreaterThan(0);
            methods.forEach(m => {
                expect(m).toHaveProperty('code');
                expect(m).toHaveProperty('name');
                expect(m).toHaveProperty('estimated_days');
                expect(m).toHaveProperty('fee');
            });
        });
    });
    describe('calculateTax', () => {
        it('should calculate VAT for Vietnam (10%)', async () => {
            const tax = await calculateTax(mockOrder.subtotal, 'VND');
            expect(tax).toBe(100000); // 10% of 1,000,000
        });
        it('should calculate tax for different rates', async () => {
            // If configurable
            // expect(calculateTax(1000, 'VND', 5)).toBe(50);
        });
        it('should return 0 for tax exempt', async () => {
            const tax = await calculateTax(mockOrder.subtotal, 'VND', 0);
            expect(tax).toBe(0);
        });
    });
});
