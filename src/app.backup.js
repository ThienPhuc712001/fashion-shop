import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import * as crypto from 'crypto';
import logger from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { healthCheck } from './controllers/health.controller';
import { apiLimiter } from './middleware/rateLimit';
import authRoutes from './routes/auth.routes';
import productsRoutes from './routes/products.routes';
import cartRoutes from './routes/cart.routes';
import ordersRoutes from './routes/orders.routes';
import paymentsRoutes from './routes/payments.routes';
import categoriesRoutes from './routes/categories.routes';
import brandsRoutes from './routes/brands.routes';
import addressesRoutes from './routes/addresses.routes';
import reviewsRoutes from './routes/reviews.routes';
import wishlistRoutes from './routes/wishlist.routes';
import uploadRoutes from './routes/upload.routes';
import couponsRoutes from './routes/coupons.routes';
import dashboardRoutes from './routes/dashboard.routes';
import shippingRoutes from './routes/shipping.routes';
import searchRoutes from './routes/search.routes';
import metricsRoutes from './routes/metrics.routes';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
// Ensure logs directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}
// Security
app.use(helmet());
// CORS - allow both backend and admin UI origins
const defaultCorsOrigins = ['http://localhost:3000', 'http://localhost:5173'];
const corsOrigins = (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : defaultCorsOrigins);
app.use(cors({
    origin: corsOrigins,
    credentials: true
}));
// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// HTTP request logging
morgan.token('id', () => crypto.randomBytes(4).toString('hex'));
app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
}));
// Request ID middleware
app.use((req, res, next) => {
    req.requestId = crypto.randomBytes(8).toString('hex');
    res.setHeader('X-Request-ID', req.requestId);
    next();
});
// Global rate limiting (skip health check)
app.use('/health', (req, res, next) => next());
app.use(apiLimiter);
// Health check
app.get('/health', healthCheck);
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/products/search', searchRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payment', paymentsRoutes);
app.use('/api/addresses', addressesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/shipping', shippingRoutes);
// app.use('/api/admin', adminRoutes); // TEMPORARILY DISABLED FOR DEBUGGING
app.use('/metrics', metricsRoutes);
// API info
app.get('/api', (req, res) => {
    res.json({
        success: true,
        name: 'Fashion Shop API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            products: '/api/products',
            'products/search': '/api/products/search',
            categories: '/api/categories',
            brands: '/api/brands',
            cart: '/api/cart',
            orders: '/api/orders',
            payments: '/api/payment',
            addresses: '/api/addresses',
            reviews: '/api/reviews',
            wishlist: '/api/wishlist',
            upload: '/api/upload',
            coupons: '/api/coupons',
            'admin/dashboard': '/api/admin/dashboard',
            shipping: '/api/shipping',
            'admin/orders/export': '/api/admin/orders/export',
            metrics: '/metrics',
            health: '/health'
        }
    });
});
// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});
// Error Handler (last)
app.use(errorHandler);
// Global error handlers to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️  Unhandled Rejection at:', promise, 'reason:', (reason === null || reason === void 0 ? void 0 : reason.message) || reason);
    console.error(new Error().stack);
});
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', (err === null || err === void 0 ? void 0 : err.message) || err);
    console.error(err.stack);
    // Don't exit automatically - log and keep running for debugging
    // setTimeout(() => process.exit(1), 2000);
});
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});
// Catch promise rejections that bubble up
process.on('rejectionHandled', (promise) => {
    console.log('✅ Promise rejection handled:', promise);
});
export default app;
