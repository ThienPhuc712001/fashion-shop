import db from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
export const getAdminCustomers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        // Build WHERE clause
        const whereClauses = [];
        const params = [];
        if (search) {
            whereClauses.push('(email LIKE ? OR full_name LIKE ? OR phone LIKE ?)');
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        // Count total
        const countSql = `SELECT COUNT(*) as total FROM users u WHERE u.role != 'admin' ${whereSql}`;
        const [countResult] = await db.all(countSql, params);
        const total = (countResult === null || countResult === void 0 ? void 0 : countResult.total) || 0;
        // Get customers (exclude admin users)
        const dataSql = `
      SELECT 
        u.id,
        u.email,
        u.full_name,
        u.phone,
        u.avatar_url,
        u.created_at,
        u.updated_at,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_spent,
        MAX(o.created_at) as last_order_at
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id AND o.status != 'cancelled'
      WHERE u.role != 'admin'
      ${whereSql}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;
        const customers = await db.all(dataSql, [...params, Number(limit), offset]);
        res.json({
            success: true,
            data: customers,
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
export const getAdminCustomer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const customer = await db.get(`SELECT 
        u.id,
        u.email,
        u.full_name,
        u.phone,
        u.avatar_url,
        u.created_at,
        u.updated_at
       FROM users u
       WHERE u.id = ? AND u.role != 'admin'`, [id]);
        if (!customer) {
            throw new AppError('Customer not found', 404);
        }
        // Get customer stats
        const orders = await db.all(`SELECT id, order_number, status, total, created_at 
       FROM orders 
       WHERE user_id = ? 
       ORDER BY created_at DESC
       LIMIT 10`, [id]);
        const stats = await db.get(`SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_spent,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders
       FROM orders 
       WHERE user_id = ? AND status != 'cancelled'`, [id]);
        // Get addresses
        const addresses = await db.all('SELECT * FROM addresses WHERE user_id = ?', [id]);
        res.json({
            success: true,
            data: Object.assign(Object.assign({}, customer), { stats: stats || { total_orders: 0, total_spent: 0, completed_orders: 0 }, recent_orders: orders, addresses })
        });
    }
    catch (error) {
        next(error);
    }
};
export const updateCustomer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { full_name, phone, avatar_url } = req.body;
        // Check exists and is not admin
        const existing = await db.get('SELECT * FROM users WHERE id = ? AND role != ?', [id, 'admin']);
        if (!existing) {
            throw new AppError('Customer not found', 404);
        }
        await db.run(`UPDATE users SET 
        full_name = ?, phone = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`, [full_name || null, phone || null, avatar_url || null, id]);
        res.json({
            success: true,
            message: 'Customer updated successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
export const getCustomerOrders = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const orders = await db.all(`SELECT * FROM orders 
       WHERE user_id = ? 
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`, [id, Number(limit), offset]);
        const totalResult = await db.get('SELECT COUNT(*) as total FROM orders WHERE user_id = ?', [id]);
        res.json({
            success: true,
            data: orders,
            pagination: {
                total: totalResult.total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(totalResult.total / Number(limit))
            }
        });
    }
    catch (error) {
        next(error);
    }
};
