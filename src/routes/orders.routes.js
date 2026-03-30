import express from 'express';
const router = express.Router();
import { createOrder, getOrders, getOrder, cancelOrder, updateOrderStatus } from '../controllers/orders.controller';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { checkoutLimiter } from '../middleware/rateLimit';
// Validation
const checkoutValidation = [
    body('shipping_address').isObject(),
    body('shipping_address.recipient_name').isString().notEmpty(),
    body('shipping_address.phone').isString().notEmpty(),
    body('shipping_address.province').isString().notEmpty(),
    body('shipping_address.district').isString().notEmpty(),
    body('shipping_address.ward').isString().notEmpty(),
    body('shipping_address.street_address').isString().notEmpty(),
    body('shipping_method').isString(),
    body('payment_method').isIn(['momo', 'vnpay', 'cod']),
    body('coupon_code').optional().isString(),
    body('notes').optional().isString(),
    body('email').optional().isEmail()
];
const orderIdValidation = [
    param('id').isString()
];
const orderListValidation = [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isString()
];
// Routes
router.post('/', checkoutLimiter, checkoutValidation, createOrder);
router.get('/', authenticate, orderListValidation, getOrders);
router.get('/:id', authenticate, orderIdValidation, getOrder);
router.put('/:id/cancel', authenticate, orderIdValidation, cancelOrder);
router.put('/:id/status', authenticate, [
    param('id').isString(),
    body('status').isString(),
    body('tracking_number').optional().isString()
], updateOrderStatus);
export default router;
