import express from 'express';
const router = express.Router();
import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview
} from '../controllers/reviews.controller';
import { param, body, query } from 'express-validator';
import { authenticate } from '../middleware/auth';

// Public route – get product reviews
router.get('/product/:productId', [
  param('productId').isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], getProductReviews);

// Authenticated routes – user create/update/delete own reviews
router.use(authenticate);

router.post('/', [
  body('product_id').isString().notEmpty(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().isString(),
  body('order_item_id').optional().isString()
], createReview);

router.put('/:id', [
  param('id').isString(),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('comment').optional().isString()
], updateReview);

router.delete('/:id', [param('id').isString()], deleteReview);

export default router;