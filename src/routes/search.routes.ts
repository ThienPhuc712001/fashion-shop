import express from 'express';
const router = express.Router();
import {
  searchProducts,
  getSuggestions,
  rebuildIndex
} from '../controllers/search.controller';
import { query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';

// Validation
const searchValidation = [
  query('q').isString().isLength({ min: 2, max: 100 }).withMessage('Query must be 2-100 characters'),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('category_id').optional().isString(),
  query('min_price').optional().isFloat({ min: 0 }),
  query('max_price').optional().isFloat({ min: 0 })
];

const suggestionsValidation = [
  query('q').isString().isLength({ min: 1, max: 50 }),
  query('limit').optional().isInt({ min: 1, max: 20 })
];

// Public routes
router.get('/search', searchValidation, searchProducts);
router.get('/suggestions', suggestionsValidation, getSuggestions);

// Admin only
router.post('/rebuild', authenticate, authorize('admin'), rebuildIndex);

export default router;
