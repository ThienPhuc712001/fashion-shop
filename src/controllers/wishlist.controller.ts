import { Request, Response, NextFunction } from 'express';
import db from '../config/database';
import { AppError } from '../middleware/errorHandler';

// GET /api/wishlist – danh sách sản phẩm yêu thích của user
export const getWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const products = await db.all(
      `SELECT p.*, w.created_at as added_at
       FROM wishlists w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, Number(limit), offset]
    );

    const totalRow = await db.get(
      'SELECT COUNT(*) as total FROM wishlists WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalRow.total
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/wishlist – thêm sản phẩm vào wishlist
export const addToWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { product_id } = req.body;

    if (!product_id) {
      throw new AppError('product_id is required', 400);
    }

    // Verify product exists
    const product = await db.get('SELECT id FROM products WHERE id = ?', [product_id]);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Check if already in wishlist
    const existing = await db.get(
      'SELECT * FROM wishlists WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );
    if (existing) {
      throw new AppError('Product already in wishlist', 400);
    }

    await db.run(
      'INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)',
      [userId, product_id]
    );

    res.status(201).json({
      success: true,
      message: 'Added to wishlist'
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/wishlist/:productId – xóa khỏi wishlist
export const removeFromWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { product_id } = req.params;

    const result = await db.run(
      'DELETE FROM wishlists WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );

    if (result.changes === 0) {
      throw new AppError('Product not in wishlist', 404);
    }

    res.json({
      success: true,
      message: 'Removed from wishlist'
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/wishlist/check/:productId – kiểm tra sản phẩm có trong wishlist không
export const checkWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { product_id } = req.params;

    const exists = await db.get(
      'SELECT 1 FROM wishlists WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );

    res.json({
      success: true,
      data: {
        in_wishlist: !!exists
      }
    });
  } catch (err) {
    next(err);
  }
};