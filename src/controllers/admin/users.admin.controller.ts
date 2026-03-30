import { Request, Response, NextFunction } from 'express';
import db from '../../config/database';

/**
 * Admin Users Controller
 * Manage users (separate from customers - all registered users)
 */
export const getAdminUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      is_active,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build WHERE clause
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (search) {
      whereClauses.push('(u.email LIKE ? OR u.full_name LIKE ? OR u.phone LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (role) {
      whereClauses.push('u.role = ?');
      params.push(role);
    }

    if (is_active !== undefined) {
      whereClauses.push('u.is_active = ?');
      params.push(is_active);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total
    const countSql = `SELECT COUNT(*) as total FROM users u ${whereSql}`;
    const [countResult] = await db.all(countSql, params);
    const total = countResult?.total || 0;

    // Get users
    const dataSql = `
      SELECT 
        u.id,
        u.email,
        u.full_name,
        u.phone,
        u.avatar_url,
        u.role,
        u.email_verified,
        u.is_active,
        u.created_at,
        COUNT(DISTINCT o.id) as order_count,
        COUNT(DISTINCT a.id) as address_count
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      LEFT JOIN addresses a ON u.id = a.user_id
      ${whereSql}
      GROUP BY u.id
      ORDER BY u.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    const users = await db.all(dataSql, [...params, Number(limit), offset]);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await db.get(
      `SELECT 
        u.id,
        u.email,
        u.full_name,
        u.phone,
        u.avatar_url,
        u.role,
        u.email_verified,
        u.is_active,
        u.created_at,
        u.updated_at
       FROM users u
       WHERE u.id = ?`,
      [id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's orders summary
    const orders = await db.all(
      `SELECT 
        id,
        order_number,
        status,
        total,
        created_at
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [id]
    );

    // Get user's addresses
    const addresses = await db.all(
      'SELECT * FROM addresses WHERE user_id = ?',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...user,
        recent_orders: orders,
        addresses
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      phone,
      avatar_url,
      is_active,
      role
    } = req.body;

    // Check user exists
    const existing = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (full_name !== undefined) {
      updates.push('full_name = ?');
      params.push(full_name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (avatar_url !== undefined) {
      updates.push('avatar_url = ?');
      params.push(avatar_url);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Soft delete: set is_active = 0
    await db.run(
      'UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};
