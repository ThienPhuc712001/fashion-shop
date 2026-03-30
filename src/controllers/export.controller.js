import db from '../config/database';
import { AppError } from '../middleware/errorHandler';
// GET /api/admin/orders/export?format=csv&start_date=&end_date=&status=
export const exportOrders = async (req, res, next) => {
    var _a;
    try {
        const { format = 'csv', start_date, end_date, status } = req.query;
        const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (userRole !== 'admin') {
            throw new AppError('Admin only', 403);
        }
        let whereClause = 'WHERE 1=1';
        const params = [];
        if (start_date && end_date) {
            whereClause += ' AND o.created_at BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }
        if (status) {
            whereClause += ' AND o.status = ?';
            params.push(status);
        }
        // Get orders with items
        const orders = await db.all(`SELECT o.*, 
        u.email as user_email, u.full_name as user_name,
        u.phone as user_phone
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ${whereClause}
       ORDER BY o.created_at DESC`, params);
        // Get order items for each order
        for (const order of orders) {
            order.items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
        }
        if (format === 'json') {
            return res.json({
                success: true,
                data: orders,
                count: orders.length
            });
        }
        // CSV format
        const csvHeaders = [
            'Order Number',
            'Date',
            'Customer Name',
            'Customer Email',
            'Phone',
            'Status',
            'Payment Method',
            'Payment Status',
            'Shipping Method',
            'Subtotal',
            'Shipping Fee',
            'Discount',
            'Tax',
            'Total',
            'Address',
            'Items Count',
            'Items Details'
        ];
        const csvRows = orders.map(order => {
            const items = order.items;
            const itemsDetail = items.map(item => `${item.product_name} (${item.variant_size}/${item.variant_color}) x${item.quantity} - ${item.unit_price} VND`).join('; ');
            const addressObj = JSON.parse(order.shipping_address || '{}');
            return [
                order.order_number,
                order.created_at,
                order.user_name || 'Guest',
                order.user_email || order.email || '',
                order.user_phone || '',
                order.status,
                order.payment_method || '',
                order.payment_status || '',
                order.shipping_method || '',
                order.subtotal,
                order.shipping_fee,
                order.discount_amount,
                order.tax_amount,
                order.total,
                (addressObj === null || addressObj === void 0 ? void 0 : addressObj.recipient_name) || '',
                items.length,
                itemsDetail
            ];
        });
        // Build CSV string
        const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="orders-export-${Date.now()}.csv"`);
        res.send(csvContent);
    }
    catch (err) {
        next(err);
    }
};
export default { exportOrders };
