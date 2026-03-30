import db from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
export const getAdminOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, search, start_date, end_date } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        // Build WHERE clause - optimized, no JOINs
        const whereClauses = [];
        const params = [];
        if (status) {
            whereClauses.push('status = ?');
            params.push(status);
        }
        if (search) {
            whereClauses.push('order_number LIKE ?');
            params.push(`%${search}%`);
        }
        if (start_date && end_date) {
            whereClauses.push('DATE(created_at) BETWEEN ? AND ?');
            params.push(start_date, end_date);
        }
        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        // Count total
        const countSql = `SELECT COUNT(*) as total FROM orders ${whereSql}`;
        const [countResult] = await db.all(countSql, params);
        const total = (countResult === null || countResult === void 0 ? void 0 : countResult.total) || 0;
        // Get orders - minimal columns
        const dataSql = `
      SELECT id, order_number, status, total, created_at, updated_at
      FROM orders
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
        const orders = await db.all(dataSql, [...params, Number(limit), offset]);
        res.json({
            success: true,
            data: orders,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        next(error);
    }
};
export const getAdminOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await db.get(`SELECT o.*, u.email as user_email, u.full_name as user_name, u.phone as user_phone
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`, [id]);
        if (!order) {
            throw new AppError('Order not found', 404);
        }
        const items = await db.all(`SELECT oi.*, p.name, p.slug, pi.url as image
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
       WHERE oi.order_id = ?`, [id]);
        const address = await db.get('SELECT * FROM addresses WHERE id = ?', [order.shipping_address_id]);
        res.json({
            success: true,
            data: Object.assign(Object.assign({}, order), { items, shipping_address: address })
        });
    }
    catch (error) {
        next(error);
    }
};
export const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, tracking_number } = req.body;
        // Check order exists
        const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
        if (!order) {
            throw new AppError('Order not found', 404);
        }
        // Update
        await db.run(`UPDATE orders SET status = ?, tracking_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, tracking_number || null, id]);
        // Send notification (optional - could email customer)
        // TODO: Implement email notification
        res.json({
            success: true,
            data: { id, status, tracking_number },
            message: 'Order status updated successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
export const cancelOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
        if (!order) {
            throw new AppError('Order not found', 404);
        }
        if (order.status === 'delivered' || order.status === 'cancelled') {
            throw new AppError('Cannot cancel order in current status', 400);
        }
        await db.run(`UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
        // Restore product stock
        const items = await db.all('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
        for (const item of items) {
            await db.run('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
        }
        res.json({
            success: true,
            message: 'Order cancelled and stock restored'
        });
    }
    catch (error) {
        next(error);
    }
};
