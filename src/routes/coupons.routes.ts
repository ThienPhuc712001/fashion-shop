import express from 'express';
const router = express.Router();
import {
  listCoupons,
  getCoupon,
  getCouponByCode,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCoupon
} from '../controllers/coupons.controller';
import { authenticate, authorize } from '../middleware/auth';
import { body, param, query } from 'express-validator';

// Public validation
router.post('/validate', validateCoupon);

// Public get by code (if needed in future)
router.get('/code/:code', getCouponByCode);

// Admin CRUD routes
router.get('/', authenticate, authorize('admin'), listCoupons);
router.get('/:id', authenticate, authorize('admin'), getCoupon);
router.post('/', authenticate, authorize('admin'), createCoupon);
router.put('/:id', authenticate, authorize('admin'), updateCoupon);
router.delete('/:id', authenticate, authorize('admin'), deleteCoupon);

// Apply coupon to order (authenticated user)
router.post('/:id/apply', authenticate, [
  param('id').isString(),
  body('order_id').isString()
], applyCoupon);

export default router;
