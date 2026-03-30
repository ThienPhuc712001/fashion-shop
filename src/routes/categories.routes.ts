import express from 'express';
const router = express.Router();
import {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categories.controller';
import { query, param, body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';

// Validation
const categoryValidation = [
  body('name').isString().notEmpty(),
  body('slug').optional().isString(),
  body('description').optional().isString(),
  body('parent_id').optional().isString(),
  body('sort_order').optional().isInt(),
  body('is_active').optional().isBoolean()
];

// Public routes
router.get('/', listCategories);
router.get('/:id', getCategory);

// Admin routes
router.post('/', authenticate, authorize('admin'), categoryValidation, createCategory);
router.put('/:id', authenticate, authorize('admin'), [
  param('id').isString(),
  ...categoryValidation
], updateCategory);
router.delete('/:id', authenticate, authorize('admin'), [param('id').isString()], deleteCategory);

export default router;