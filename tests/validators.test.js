import { validateRegister, validateLogin } from '../src/validators/auth.validator';
import { validateProduct, validateProductUpdate } from '../src/validators/products.validator';
import { validateCoupon, validateCouponApply } from '../src/validators/coupons.validator';
describe('Auth Validators', () => {
    describe('validateRegister', () => {
        it('should pass with valid data', () => {
            const req = { body: { email: 'test@example.com', password: 'Password123!', full_name: 'Test' } };
            const res = { status: () => ({ json: () => { } }) };
            const next = jest.fn();
            validateRegister(req, res, next);
            expect(next).toHaveBeenCalled();
            // No errors passed to next
        });
        it('should reject invalid email', () => {
            const req = { body: { email: 'invalid', password: '123', full_name: '' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const next = jest.fn();
            validateRegister(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
    describe('validateLogin', () => {
        it('should pass with valid credentials', () => {
            const req = { body: { email: 'test@example.com', password: 'Password123!' } };
            const next = jest.fn();
            validateLogin(req, {}, next);
            expect(next).toHaveBeenCalled();
        });
        it('should reject missing fields', () => {
            const req = { body: {} };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            validateLogin(req, res, jest.fn());
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
describe('Products Validators', () => {
    describe('validateProduct', () => {
        it('should pass with valid product data', () => {
            const req = { body: { name: 'Product', base_price: 100000, category_id: '1', brand_id: '1' } };
            const next = jest.fn();
            validateProduct(req, {}, next);
            expect(next).toHaveBeenCalled();
        });
        it('should reject missing required fields', () => {
            const req = { body: { name: '' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            validateProduct(req, res, jest.fn());
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
    describe('validateProductUpdate', () => {
        it('should allow partial update', () => {
            const req = { body: { base_price: 200000 } };
            const next = jest.fn();
            validateProductUpdate(req, {}, next);
            expect(next).toHaveBeenCalled();
        });
    });
});
describe('Coupons Validator', () => {
    describe('validateCoupon', () => {
        it('should pass with valid coupon data', () => {
            const req = { body: { code: 'TEST10', discount_type: 'percentage', discount_value: 10 } };
            const next = jest.fn();
            validateCoupon(req, {}, next);
            expect(next).toHaveBeenCalled();
        });
        it('should reject invalid discount type', () => {
            const req = { body: { discount_type: 'invalid' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            validateCoupon(req, res, jest.fn());
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
    describe('validateCouponValidate', () => {
        it('should pass with order_amount', () => {
            const req = { body: { code: 'TEST', order_amount: 100000 } };
            const next = jest.fn();
            validateCouponApply(req, {}, next);
            expect(next).toHaveBeenCalled();
        });
        it('should reject missing order_amount', () => {
            const req = { body: { code: 'TEST' } };
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            validateCouponApply(req, res, jest.fn());
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
