import express from 'express';
const router = express.Router();
import { getDashboardStats, getRecentOrders, getSalesReport, getProductPerformance, getInventoryStatus } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth';
// All routes require admin
router.use(authenticate, authorize('admin'));
// Main dashboard stats
router.get('/stats', getDashboardStats);
// Recent orders
router.get('/recent-orders', getRecentOrders);
// Sales report
router.get('/sales-report', getSalesReport);
// Product performance
router.get('/product-performance', getProductPerformance);
// Inventory status
router.get('/inventory', getInventoryStatus);
export default router;
