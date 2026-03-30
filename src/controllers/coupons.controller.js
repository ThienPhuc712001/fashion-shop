import db from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { body } from 'express-validator';
// Validation rules
const couponValidation = [
    body('code').isString().notEmpty().withMessage('Code is required'),
    body('name').optional().isString(),
    body('description').optional().isString(),
    body('discount_type').isIn(['percentage', 'fixed']).withMessage('discount_type must be percentage or fixed'),
    body('discount_value').isNumeric().withMessage('discount_value must be a number'),
    body('min_order_amount').optional().isNumeric(),
    body('max_discount_amount').optional().isNumeric(),
    body('usage_limit').optional().isInt(),
    body('per_user_limit').optional().isInt(),
    body('starts_at').optional().isISO8601(),
    body('expires_at').optional().isISO8601(),
    body('is_active').optional().isBoolean()
];
// GET /api/coupons - Admin only
export const listCoupons = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, is_active, code, sort_by = 'created_at', sort_order = 'DESC' } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        let whereClause = 'WHERE 1=1';
        const params = [];
        if (is_active !== undefined) {
            whereClause += ' AND is_active = ?';
            params.push(is_active === 'true');
        }
        if (code) {
            whereClause += ' AND code LIKE ?';
            params.push(`%${code}%`);
        }
        const orderBy = `${sort_by} ${sort_order}`;
        const coupons = await db.all(`SELECT * FROM coupons ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`, [...params, Number(limit), offset]);
        const countResult = await db.get(`SELECT COUNT(*) as total FROM coupons ${whereClause}`, params);
        res.json({
            success: true,
            data: coupons,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: countResult.total,
                pages: Math.ceil(countResult.total / Number(limit))
            }
        });
    }
    catch (err) {
        next(err);
    }
};
// GET /api/coupons/:id
export const getCoupon = async (req, res, next) => {
    try {
        const { id } = req.params;
        const coupon = await db.get('SELECT * FROM coupons WHERE id = ?', [id]);
        if (!coupon) {
            throw new AppError('Coupon not found', 404);
        }
        res.json({
            success: true,
            data: coupon
        });
    }
    catch (err) {
        next(err);
    }
};
// GET /api/coupons/code/:code (public - for validation)
export const getCouponByCode = async (req, res, next) => {
    try {
        const { code } = req.params;
        const coupon = await db.get(`SELECT * FROM coupons 
       WHERE code = ? 
       AND is_active = 1 
       AND (starts_at IS NULL OR starts_at <= CURRENT_TIMESTAMP) 
       AND (expires_at IS NULL OR expires_at >= CURRENT_TIMESTAMP)`, [code]);
        if (!coupon) {
            throw new AppError('Coupon not found or not valid', 404);
        }
        // Check usage limit
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
            throw new AppError('Coupon usage limit reached', 400);
        }
        res.json({
            success: true,
            data: {
                id: coupon.id,
                code: coupon.code,
                name: coupon.name,
                description: coupon.description,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value,
                min_order_amount: coupon.min_order_amount,
                max_discount_amount: coupon.max_discount_amount,
                per_user_limit: coupon.per_user_limit
            }
        });
    }
    catch (err) {
        next(err);
    }
};
// POST /api/coupons (admin)
export const createCoupon = async (req, res, next) => {
    try {
        const { code, name, description, discount_type, discount_value, min_order_amount = 0, max_discount_amount, usage_limit, per_user_limit = 1, starts_at, expires_at, is_active = true } = req.body;
        if (!code || !discount_type || !discount_value) {
            throw new AppError('Code, discount_type, and discount_value are required', 400);
        }
        // Check code uniqueness
        const existing = await db.get('SELECT id FROM coupons WHERE code = ?', [code]);
        if (existing) {
            throw new AppError('Coupon code already exists', 409);
        }
        const id = uuidv4();
        await db.run(`INSERT INTO coupons (
        id, code, name, description, discount_type, discount_value,
        min_order_amount, max_discount_amount, usage_limit, used_count,
        per_user_limit, starts_at, expires_at, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            id, code, name || null, description || null, discount_type, discount_value,
            min_order_amount, max_discount_amount || null, usage_limit || null, 0,
            per_user_limit, starts_at || null, expires_at || null, is_active
        ]);
        res.status(201).json({
            success: true,
            data: { id, code },
            message: 'Coupon created'
        });
    }
    catch (err) {
        next(err);
    }
};
// PUT /api/coupons/:id (admin)
export const updateCoupon = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { code, name, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, per_user_limit, starts_at, expires_at, is_active } = req.body;
        const updates = [];
        const values = [];
        if (code !== undefined) {
            // Check uniqueness if changing code
            const existing = await db.get('SELECT id FROM coupons WHERE code = ? AND id != ?', [code, id]);
            if (existing) {
                throw new AppError('Coupon code already exists', 409);
            }
            updates.push('code = ?');
            values.push(code);
        }
        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (discount_type !== undefined) {
            updates.push('discount_type = ?');
            values.push(discount_type);
        }
        if (discount_value !== undefined) {
            updates.push('discount_value = ?');
            values.push(discount_value);
        }
        if (min_order_amount !== undefined) {
            updates.push('min_order_amount = ?');
            values.push(min_order_amount);
        }
        if (max_discount_amount !== undefined) {
            updates.push('max_discount_amount = ?');
            values.push(max_discount_amount);
        }
        if (usage_limit !== undefined) {
            updates.push('usage_limit = ?');
            values.push(usage_limit);
        }
        if (per_user_limit !== undefined) {
            updates.push('per_user_limit = ?');
            values.push(per_user_limit);
        }
        if (starts_at !== undefined) {
            updates.push('starts_at = ?');
            values.push(starts_at);
        }
        if (expires_at !== undefined) {
            updates.push('expires_at = ?');
            values.push(expires_at);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active);
        }
        if (updates.length === 0) {
            throw new AppError('No fields to update', 400);
        }
        values.push(id);
        await db.run(`UPDATE coupons SET ${updates.join(', ')} WHERE id = ?`, values);
        res.json({
            success: true,
            message: 'Coupon updated'
        });
    }
    catch (err) {
        next(err);
    }
};
// DELETE /api/coupons/:id (admin)
export const deleteCoupon = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.run('DELETE FROM coupons WHERE id = ?', [id]);
        if (result.changes === 0) {
            throw new AppError('Coupon not found', 404);
        }
        res.json({
            success: true,
            message: 'Coupon deleted'
        });
    }
    catch (err) {
        next(err);
    }
};
// POST /api/coupons/validate - Public endpoint to validate coupon
export const validateCoupon = async (req, res, next) => {
    try {
        const { code, order_amount, user_id } = req.body;
        if (!code || order_amount === undefined) {
            throw new AppError('Code and order_amount are required', 400);
        }
        const coupon = await db.get(`SELECT * FROM coupons 
       WHERE code = ? 
       AND is_active = 1 
       AND (starts_at IS NULL OR starts_at <= CURRENT_TIMESTAMP) 
       AND (expires_at IS NULL OR expires_at >= CURRENT_TIMESTAMP)`, [code]);
        if (!coupon) {
            throw new AppError('Coupon not found or invalid', 404);
        }
        // Check usage limit
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
            throw new AppError('Coupon usage limit reached', 400);
        }
        // Check minimum order amount
        if (coupon.min_order_amount && Number(order_amount) < Number(coupon.min_order_amount)) {
            throw new AppError(`Minimum order amount of ${coupon.min_order_amount} required`, 400);
        }
        // Calculate discount
        let discount = 0;
        if (coupon.discount_type === 'percentage') {
            discount = (Number(order_amount) * Number(coupon.discount_value)) / 100;
            if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
                discount = coupon.max_discount_amount;
            }
        }
        else {
            discount = Number(coupon.discount_value);
        }
        // Cannot exceed order amount
        if (discount > Number(order_amount)) {
            discount = Number(order_amount);
        }
        res.json({
            success: true,
            data: {
                coupon_id: coupon.id,
                code: coupon.code,
                name: coupon.name,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value,
                min_order_amount: coupon.min_order_amount,
                max_discount_amount: coupon.max_discount_amount,
                calculated_discount: Math.round(discount * 100) / 100,
                final_amount: Math.round((Number(order_amount) - discount) * 100) / 100
            }
        });
    }
    catch (err) {
        next(err);
    }
};
// POST /api/coupons/:id/apply - Apply coupon to order (creates order_coupon record)
export const applyCoupon = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { order_id } = req.body;
        if (!order_id) {
            throw new AppError('order_id is required', 400);
        }
        // Get coupon
        const coupon = await db.get('SELECT * FROM coupons WHERE id = ? AND is_active = 1', [id]);
        if (!coupon) {
            throw new AppError('Coupon not found or inactive', 404);
        }
        // Get order
        const order = await db.get('SELECT * FROM orders WHERE id = ?', [order_id]);
        if (!order) {
            throw new AppError('Order not found', 404);
        }
        // Check if coupon already applied to this order
        const existing = await db.get('SELECT * FROM order_coupons WHERE order_id = ? AND coupon_id = ?', [order_id, id]);
        if (existing) {
            throw new AppError('Coupon already applied to this order', 409);
        }
        // Calculate discount
        let discount = order.total * (coupon.discount_value / 100);
        if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
            discount = coupon.max_discount_amount;
        }
        // Apply discount to order
        await db.run('UPDATE orders SET discount_amount = discount_amount + ? WHERE id = ?', [discount, order_id]);
        // Record in order_coupons
        await db.run('INSERT INTO order_coupons (order_id, coupon_id, discount_applied) VALUES (?, ?, ?)', [order_id, id, discount]);
        // Increment used count
        await db.run('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [id]);
        res.json({
            success: true,
            data: {
                order_id,
                coupon_id: coupon.id,
                code: coupon.code,
                discount_applied: Math.round(discount * 100) / 100,
                new_order_total: Math.round((order.total - discount) * 100) / 100
            },
            message: 'Coupon applied successfully'
        });
    }
    catch (err) {
        next(err);
    }
};
