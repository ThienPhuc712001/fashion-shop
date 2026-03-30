import express from 'express';
const router = express.Router();
import { getAdminOrders, getAdminOrder, updateOrderStatus, cancelOrder } from '../controllers/admin/orders.admin.controller';
import { getAdminProducts, getAdminProduct, createProduct, updateProduct, deleteProduct, getProductVariants, updateVariantStock } from '../controllers/admin/products.admin.controller';
import { getAdminCustomers, getAdminCustomer, updateCustomer, getCustomerOrders } from '../controllers/admin/customers.admin.controller';
import { getAdminInventory, updateVariantStock as updateInventoryStock, bulkUpdateVariantStock } from '../controllers/admin/inventory.admin.controller';
import { authenticate, authorize } from '../middleware/auth';
import { body, param, query } from 'express-validator';
// All routes require admin authentication
router.use(authenticate, authorize('admin'));
// === ORDERS ADMIN ===
router.get('/orders', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isString(),
    query('search').optional().isString(),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601()
], getAdminOrders);
router.get('/orders/:id', [
    param('id').isString()
], getAdminOrder);
router.put('/orders/:id/status', [
    param('id').isString(),
    body('status').isString(),
    body('tracking_number').optional().isString()
], updateOrderStatus);
router.put('/orders/:id/cancel', [
    param('id').isString()
], cancelOrder);
// === PRODUCTS ADMIN ===
router.get('/products', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('category').optional().isString(),
    query('status').optional().isString(),
    query('sortBy').optional().isString(),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], getAdminProducts);
router.get('/products/:id', [
    param('id').isString()
], getAdminProduct);
router.post('/products', [
    body('name').isString().notEmpty(),
    body('description').optional().isString(),
    body('base_price').optional().isFloat({ min: 0 }),
    body('cost').optional().isFloat({ min: 0 }),
    body('category_id').optional().isString(),
    body('status').optional().isIn(['active', 'inactive', 'out_of_stock']),
    body('slug').optional().isString()
], createProduct);
router.put('/products/:id', [
    param('id').isString(),
    body('name').optional().isString(),
    body('description').optional().isString(),
    body('base_price').optional().isFloat({ min: 0 }),
    body('cost').optional().isFloat({ min: 0 }),
    body('category_id').optional().isString(),
    body('status').optional().isIn(['active', 'inactive', 'out_of_stock']),
    body('slug').optional().isString()
], updateProduct);
router.delete('/products/:id', [
    param('id').isString()
], deleteProduct);
router.get('/products/:id/variants', [
    param('id').isString()
], getProductVariants);
router.put('/variants/:variant_id/stock', [
    param('variant_id').isString(),
    body('stock_quantity').isInt({ min: 0 }),
    body('reserved_quantity').optional().isInt({ min: 0 })
], updateVariantStock);
// === CUSTOMERS ADMIN ===
router.get('/customers', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString()
], getAdminCustomers);
router.get('/customers/:id', [
    param('id').isString()
], getAdminCustomer);
router.put('/customers/:id', [
    param('id').isString(),
    body('full_name').optional().isString(),
    body('phone').optional().isString(),
    body('avatar_url').optional().isURL()
], updateCustomer);
router.get('/customers/:id/orders', [
    param('id').isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
], getCustomerOrders);
// === INVENTORY ADMIN ===
router.get('/inventory', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('lowStock').optional().isBoolean(),
    query('search').optional().isString()
], getAdminInventory);
router.patch('/inventory/:variant_id', [
    param('variant_id').isString(),
    body('stock_quantity').isInt({ min: 0 }),
    body('reserved_quantity').optional().isInt({ min: 0 })
], updateInventoryStock);
router.patch('/inventory/bulk-update', [
    body('updates').isArray(),
    body('updates.*.variant_id').isString(),
    body('updates.*.stock_quantity').isInt({ min: 0 })
], bulkUpdateVariantStock);
export default router;
