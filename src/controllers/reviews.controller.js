import db from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
// POST /api/reviews – tạo review sau khi mua
export const createReview = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { product_id, order_item_id, rating, comment } = req.body;
        if (!product_id || !rating) {
            throw new AppError('product_id and rating are required', 400);
        }
        if (rating < 1 || rating > 5) {
            throw new AppError('Rating must be between 1 and 5', 400);
        }
        // Verify product exists
        const product = await db.get('SELECT id FROM products WHERE id = ?', [product_id]);
        if (!product) {
            throw new AppError('Product not found', 404);
        }
        // If order_item_id provided, verify user purchased this product
        if (order_item_id) {
            const orderItem = await db.get(`SELECT oi.* FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE oi.id = ? AND o.user_id = ?`, [order_item_id, userId]);
            if (!orderItem) {
                throw new AppError('Order item not found or not purchased by user', 403);
            }
        }
        const reviewId = uuidv4();
        await db.run(`INSERT INTO reviews (id, user_id, product_id, order_item_id, rating, comment, is_verified_purchase) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            reviewId,
            userId,
            product_id,
            order_item_id || null,
            rating,
            comment || null,
            order_item_id ? 1 : 0
        ]);
        res.status(201).json({
            success: true,
            data: { id: reviewId, product_id, rating, comment },
            message: 'Review submitted'
        });
    }
    catch (err) {
        next(err);
    }
};
// GET /api/products/:id/reviews – lấy reviews của sản phẩm (public)
export const getProductReviews = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        // Get reviews with user info
        const reviews = await db.all(`SELECT r.*, u.full_name, u.avatar_url
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ? AND r.is_visible = 1
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`, [productId, Number(limit), offset]);
        // Get summary stats
        const stats = await db.get(`SELECT 
        COUNT(*) as count,
        AVG(rating) as average,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
       FROM reviews 
       WHERE product_id = ? AND is_visible = 1`, [productId]);
        res.json({
            success: true,
            data: {
                reviews,
                summary: stats
            }
        });
    }
    catch (err) {
        next(err);
    }
};
// PUT /api/reviews/:id – chỉnh sửa review (user hoặc admin)
export const updateReview = async (req, res, next) => {
    var _a;
    try {
        const userId = req.userId;
        const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        const { id } = req.params;
        const { rating, comment } = req.body;
        // Fetch review
        const review = await db.get('SELECT * FROM reviews WHERE id = ?', [id]);
        if (!review) {
            throw new AppError('Review not found', 404);
        }
        // Check ownership or admin
        if (review.user_id !== userId && userRole !== 'admin') {
            throw new AppError('Not authorized', 403);
        }
        const updates = [];
        const values = [];
        if (rating !== undefined) {
            if (rating < 1 || rating > 5) {
                throw new AppError('Rating must be between 1 and 5', 400);
            }
            updates.push('rating = ?');
            values.push(rating);
        }
        if (comment !== undefined) {
            updates.push('comment = ?');
            values.push(comment);
        }
        if (updates.length === 0) {
            throw new AppError('No fields to update', 400);
        }
        values.push(id);
        await db.run(`UPDATE reviews SET ${updates.join(', ')} WHERE id = ?`, values);
        res.json({
            success: true,
            message: 'Review updated'
        });
    }
    catch (err) {
        next(err);
    }
};
// DELETE /api/reviews/:id – xóa review (admin hoặc user)
export const deleteReview = async (req, res, next) => {
    var _a;
    try {
        const userId = req.userId;
        const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        const { id } = req.params;
        const review = await db.get('SELECT * FROM reviews WHERE id = ?', [id]);
        if (!review) {
            throw new AppError('Review not found', 404);
        }
        if (review.user_id !== userId && userRole !== 'admin') {
            throw new AppError('Not authorized', 403);
        }
        await db.run('DELETE FROM reviews WHERE id = ?', [id]);
        res.json({
            success: true,
            message: 'Review deleted'
        });
    }
    catch (err) {
        next(err);
    }
};
