import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

import db from './config/database';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import productsRoutes from './routes/products.routes';
import ordersRoutes from './routes/orders.routes';
import dashboardRoutes from './routes/dashboard.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Ensure logs directory exists (optional)
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

// Routes - core only
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    database: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API info
app.get('/api', (req: Request, res: Response) => {
  res.json({
    success: true,
    name: 'Fashion Shop API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      'admin/dashboard': '/api/admin/dashboard',
      health: '/health'
    }
  });
});

// 404 Handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error Handler (last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log('✅ Connected to SQLite database');
  console.log(`🚀 Fashion Shop API started on port ${PORT}`, { service: 'fashion-shop', timestamp: new Date().toISOString() });
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`📚 API: http://localhost:${PORT}/api`);
});

// Global error handlers
process.on('unhandledRejection', (reason: any, promise: any) => {
  console.error('⚠️  Unhandled Rejection at:', promise, 'reason:', reason?.message || reason);
  console.error(new Error().stack);
});

process.on('uncaughtException', (err: any) => {
  console.error('💥 Uncaught Exception:', err?.message || err);
  console.error(err.stack);
});

export default app;
