import express from 'express';
const router = express.Router();
import {
  listBrands,
  getBrand,
  getBrandBySlug,
  createBrand,
  updateBrand,
  deleteBrand
} from '../controllers/brands.controller';
import { query, param, body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';

// Validation
const brandValidation = [
  body('name').isString().notEmpty(),
  body('slug').optional().isString(),
  body('logo_url').optional().isURL(),
  body('description').optional().isString(),
  body('is_active').optional().isBoolean()
];

// Public routes
router.get('/', listBrands);
router.get('/:id', getBrand);
router.get('/slug/:slug', getBrandBySlug); // optional

// Admin routes
router.post('/', authenticate, authorize('admin'), brandValidation, createBrand);
router.put('/:id', authenticate, authorize('admin'), [
  param('id').isString(),
  ...brandValidation
], updateBrand);
router.delete('/:id', authenticate, authorize('admin'), [param('id').isString()], deleteBrand);

export default router;