import { Request, Response, NextFunction } from 'express';
import db from '../config/database';
import { AppError } from '../middleware/errorHandler';

// GET /api/admin/dashboard/stats - Dashboard statistics (admin only)
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period = 'month' } = req.query;
    let dateFilter = '';

    switch (period) {
      case 'week':
        dateFilter = "AND o.created_at >= datetime('now', '-7 days')";
        break;
      case 'month':
        dateFilter = "AND o.created_at >= datetime('now', 'start of month')";
        break;
      case 'year':
        dateFilter = "AND o.created_at >= datetime('now', 'start of year')";
        break;
      case 'all':
        dateFilter = '';
        break;
      default:
        dateFilter = "AND o.created_at >= datetime('now', 'start of month')";
    }

    // 1. Total revenue, orders, customers
    const overview = await db.get(
      `SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_revenue,
        COUNT(DISTINCT o.user_id) as total_customers,
        COALESCE(SUM(o.discount_amount), 0) as total_discounts
       FROM orders o
       WHERE 1=1 ${dateFilter}`,
    );

    // 2. Orders by status
    const ordersByStatus = await db.all(
      `SELECT status, COUNT(*) as count 
       FROM orders o
       WHERE 1=1 ${dateFilter}
       GROUP BY status 
       ORDER BY count DESC`,
    );

    // 3. Top products (by quantity sold)
    const topProducts = await db.all(
      `SELECT 
        p.id, p.name, p.slug,
        COUNT(oi.id) as quantity_sold,
        SUM(oi.subtotal) as total_revenue
       FROM order_items oi
       JOIN product_variants pv ON oi.variant_id = pv.id
       JOIN products p ON pv.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE 1=1 ${dateFilter}
       GROUP BY p.id
       ORDER BY quantity_sold DESC
       LIMIT 10`,
    );

    // 4. Top categories
    const topCategories = await db.all(
      `SELECT 
        c.id, c.name, c.slug,
        COUNT(oi.id) as quantity_sold,
        SUM(oi.subtotal) as total_revenue
       FROM order_items oi
       JOIN product_variants pv ON oi.variant_id = pv.id
       JOIN products p ON pv.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       JOIN orders o ON oi.order_id = o.id
       WHERE 1=1 ${dateFilter}
       GROUP BY c.id
       ORDER BY total_revenue DESC
       LIMIT 10`,
    );

    // 5. Sales trend (daily for last 30 days)
    const salesTrend = await db.all(
      `SELECT 
        date(o.created_at) as date,
        COUNT(*) as orders,
        SUM(o.total) as revenue
       FROM orders o
       WHERE o.created_at >= datetime('now', '-30 days')
       GROUP BY date(o.created_at)
       ORDER BY date`,
    );

    // 6. Recent orders (last 10)
    const recentOrders = await db.all(
      `SELECT o.id, o.order_number, o.status, o.total, o.created_at,
              u.email as user_email, u.full_name as user_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 10`,
    );

    // 7. Low stock products
    const lowStock = await db.all(
      `SELECT p.id, p.name, p.slug,
        SUM(pv.stock_quantity) as total_stock
       FROM products p
       JOIN product_variants pv ON p.id = pv.product_id
       GROUP BY p.id
       HAVING total_stock < 20
       ORDER BY total_stock ASC
       LIMIT 10`,
    );

    // 8. Customer insights
    const customerStats = await db.get(
      `SELECT 
        COUNT(*) as total,
        AVG(order_count) as avg_orders,
        MAX(order_count) as max_orders
       FROM (
         SELECT user_id, COUNT(*) as order_count 
         FROM orders 
         WHERE user_id IS NOT NULL
         GROUP BY user_id
       )`,
    );

    res.json({
      success: true,
      data: {
        period,
        overview: overview[0],
        ordersByStatus,
        topProducts,
        topCategories,
        salesTrend,
        recentOrders,
        lowStock,
        customerStats
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/dashboard/recent-orders - Get recent orders with filters
export const getRecentOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 20, offset = 0, status } = req.query;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }

    const orders = await db.all(
      `SELECT o.*, u.email as user_email, u.full_name as user_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const countResult = await db.get(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: orders,
      pagination: {
        total: countResult.total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/dashboard/sales-report - Sales report by date range
export const getSalesReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start_date, end_date, group_by = 'day' } = req.query;

    if (!start_date || !end_date) {
      throw new AppError('start_date and end_date are required', 400);
    }

    let groupFormat: string;
    switch (group_by) {
      case 'hour':
        groupFormat = "strftime('%Y-%m-%d %H:00', o.created_at)";
        break;
      case 'day':
        groupFormat = "date(o.created_at)";
        break;
      case 'week':
        groupFormat = "strftime('%Y-%W', o.created_at)";
        break;
      case 'month':
        groupFormat = "strftime('%Y-%m', o.created_at)";
        break;
      default:
        groupFormat = "date(o.created_at)";
    }

    const report = await db.all(
      `SELECT 
        ${groupFormat} as period,
        COUNT(*) as orders,
        SUM(o.total) as revenue,
        SUM(o.discount_amount) as discounts,
        COUNT(DISTINCT o.user_id) as customers
       FROM orders o
       WHERE o.created_at BETWEEN ? AND ?
       GROUP BY ${groupFormat}
       ORDER BY period`,
      [start_date, end_date]
    );

    // Summary
    const summary = await db.get(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(o.total) as total_revenue,
        SUM(o.discount_amount) as total_discounts,
        COUNT(DISTINCT o.user_id) as total_customers,
        AVG(o.total) as avg_order_value
       FROM orders o
       WHERE o.created_at BETWEEN ? AND ?`,
      [start_date, end_date]
    );

    res.json({
      success: true,
      data: {
        period: { start_date, end_date, group_by },
        summary,
        report
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/dashboard/product-performance - Product performance metrics
export const getProductPerformance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 20, metric = 'quantity' } = req.query;

    const products = await db.all(
      `SELECT 
        p.id, p.name, p.slug, p.base_price,
        COUNT(oi.id) as sold_quantity,
        COALESCE(SUM(oi.subtotal), 0) as total_revenue,
        COUNT(DISTINCT o.id) as order_count
       FROM products p
       LEFT JOIN product_variants pv ON p.id = pv.product_id
       LEFT JOIN order_items oi ON pv.id = oi.variant_id
       LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
       GROUP BY p.id
       ORDER BY ${metric === 'revenue' ? 'total_revenue' : 'sold_quantity'} DESC
       LIMIT ?`,
      [Number(limit)]
    );

    // Conversion rate (views to orders - requires tracking, placeholder)
    const performance = products.map(p => ({
      ...p,
      conversion_rate: 0, // TODO: implement view tracking
      avg_price: p.sold_quantity > 0 ? p.total_revenue / p.sold_quantity : 0
    }));

    res.json({
      success: true,
      data: performance
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/dashboard/inventory - Inventory status
export const getInventoryStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inventory = await db.all(
      `SELECT 
        p.id, p.name, p.slug,
        pv.sku, pv.size, pv.color_name, pv.stock_quantity,
        pv.low_stock_threshold,
        CASE WHEN pv.stock_quantity <= pv.low_stock_threshold THEN 1 ELSE 0 END as is_low_stock
       FROM products p
       JOIN product_variants pv ON p.id = pv.product_id
       ORDER BY pv.stock_quantity ASC`,
    );

    // Summary
    const summary = {
      total_variants: inventory.length,
      low_stock_count: inventory.filter((i: any) => i.is_low_stock).length,
      out_of_stock_count: inventory.filter((i: any) => i.stock_quantity === 0).length,
      total_stock_value: inventory.reduce((sum, i: any) => sum + (i.stock_quantity * i.base_price || 0), 0)
    };

    res.json({
      success: true,
      data: {
        summary,
        items: inventory
      }
    });
  } catch (err) {
    next(err);
  }
};
