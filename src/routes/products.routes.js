import express from 'express';
const router = express.Router();
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct, getProductVariants, createProductVariant, updateProductVariant, deleteProductVariant } from '../controllers/products.controller';
import { query, param, body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
// Validation
const listValidation = [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('category').optional().isString(),
    query('brand').optional().isString(),
    query('min_price').optional().isFloat({ min: 0 }),
    query('max_price').optional().isFloat({ min: 0 }),
    query('search').optional().isString().isLength({ max: 100 }),
    query('in_stock').optional().isBoolean(),
    query('min_rating').optional().isFloat({ min: 0, max: 5 }),
    query('sort_by').optional().isString(),
    query('sort_order').optional().isIn(['ASC', 'DESC'])
];
const createProductValidation = [
    body('name').isString().notEmpty(),
    body('slug').optional().isString(),
    body('description').optional().isString(),
    body('category_id').optional().isString(),
    body('brand_id').optional().isString(),
    body('base_price').isFloat({ min: 0 }),
    body('compare_price').optional().isFloat({ min: 0 }),
    body('is_active').optional().isBoolean()
];
const variantValidation = [
    body('sku').isString().notEmpty(),
    body('size').optional().isString(),
    body('color_name').optional().isString(),
    body('color_hex').optional().isString(),
    body('material').optional().isString(),
    body('price_adjustment').optional().isFloat(),
    body('stock_quantity').optional().isInt({ min: 0 }),
    body('low_stock_threshold').optional().isInt(),
    body('weight_grams').optional().isInt(),
    body('barcode').optional().isString(),
    body('is_available').optional().isBoolean()
];
// Public routes
router.get('/', listValidation, listProducts);
router.get('/:id', getProduct);
router.get('/:id/variants', getProductVariants);
// Admin/seller routes
router.post('/', authenticate, authorize('admin', 'seller'), createProductValidation, createProduct);
router.put('/:id', authenticate, authorize('admin', 'seller'), [
    param('id').isString(),
    ...createProductValidation.filter(r => Array.isArray(r) && r.length > 0 && r[0].exists === false)
], updateProduct);
router.delete('/:id', authenticate, authorize('admin'), [param('id').isString()], deleteProduct);
// Variant management
router.post('/:id/variants', authenticate, authorize('admin', 'seller'), variantValidation, createProductVariant);
router.put('/:id/variants/:variantId', authenticate, authorize('admin', 'seller'), [
    param('id').isString(),
    param('variantId').isString(),
    ...variantValidation.filter(r => Array.isArray(r) && r.length > 0 && r[0].optional === true)
], updateProductVariant);
router.delete('/:id/variants/:variantId', authenticate, authorize('admin'), [
    param('id').isString(),
    param('variantId').isString()
], deleteProductVariant);
export default router;
