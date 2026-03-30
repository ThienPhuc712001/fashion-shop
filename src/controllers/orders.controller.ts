import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { CheckoutDto } from '../types';
import taxService from '../services/tax.service';

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId || null;

    const {
      shipping_address,
      billing_address,
      shipping_method,
      payment_method,
      coupon_code,
      notes,
      email
    } = req.body as CheckoutDto;

    if (!shipping_address || !shipping_method || !payment_method) {
      throw new AppError('Missing required checkout fields', 400);
    }

    if (!userId && !email) {
      throw new AppError('Email is required for guest checkout', 400);
    }

    const sessionToken = req.cookies?.cart_session || (req.headers['x-cart-token'] as string);
    let cartSession;

    if (sessionToken) {
      cartSession = await db.get(
        'SELECT * FROM cart_sessions WHERE session_token = ?',
        [sessionToken]
      );
    }

    if (!cartSession) {
      const newId = uuidv4();
      const newToken = uuidv4();
      await db.run(
        'INSERT INTO cart_sessions (id, user_id, session_token) VALUES (?, ?, ?)',
        [newId, userId, newToken]
      );
      cartSession = { id: newId, session_token: newToken };
    }

    const cartItems = await db.all(
      `SELECT ci.*,
              pv.stock_quantity,
              pv.price_adjustment,
              p.base_price,
              p.name as product_name,
              pv.sku,
              pv.size,
              pv.color_name
       FROM cart_items ci
       JOIN product_variants pv ON ci.variant_id = pv.id
       JOIN products p ON pv.product_id = p.id
       WHERE ci.cart_session_id = ?`,
      [cartSession.id]
    );

    if (cartItems.length === 0) {
      throw new AppError('Cart is empty', 400);
    }

    for (const item of cartItems) {
      if (item.quantity > item.stock_quantity) {
        throw new AppError(
          `Insufficient stock for ${item.product_name} (${item.size}, ${item.color_name}). Only ${item.stock_quantity} available.`,
          400
        );
      }
    }

    const subtotal = cartItems.reduce((sum, item) => {
      const unitPrice = item.price_snapshot || (item.base_price + item.price_adjustment);
      return sum + unitPrice * item.quantity;
    }, 0);

    let shipping_fee = 0;
    switch (shipping_method) {
      case 'express':
        shipping_fee = 30000;
        break;
      case 'standard':
        shipping_fee = 20000;
        break;
      case 'economy':
        shipping_fee = 15000;
        break;
      default:
        shipping_fee = 25000;
    }

    let discount_amount = 0;
    let applied_coupon_id: string | null = null;

    if (coupon_code) {
      const coupon = await db.get(
        `SELECT * FROM coupons
         WHERE code = ?
         AND is_active = 1
         AND (starts_at IS NULL OR starts_at <= CURRENT_TIMESTAMP)
         AND (expires_at IS NULL OR expires_at >= CURRENT_TIMESTAMP)`,
        [coupon_code]
      );

      if (!coupon) {
        throw new AppError('Invalid or expired coupon code', 400);
      }

      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        throw new AppError('Coupon usage limit has been reached', 400);
      }

      if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
        throw new AppError(
          `Minimum order of ${coupon.min_order_amount} VND required to use this coupon`,
          400
        );
      }

      if (coupon.discount_type === 'percentage') {
        discount_amount = subtotal * (coupon.discount_value / 100);
        if (coupon.max_discount_amount && discount_amount > coupon.max_discount_amount) {
          discount_amount = coupon.max_discount_amount;
        }
      } else {
        discount_amount = Number(coupon.discount_value);
      }

      if (discount_amount > subtotal) {
        discount_amount = subtotal;
      }

      applied_coupon_id = coupon.id;
    }

    // Calculate tax based on province
    const provinceCode = (shipping_address as any)?.province;
    const tax_amount = taxService.calculateTax(subtotal, provinceCode);

    const total = subtotal + shipping_fee - discount_amount + tax_amount;

    const now = new Date();
    const orderNumber = `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    const orderId = uuidv4();
    await db.run(
      `INSERT INTO orders (
        id, order_number, user_id, email, status,
        shipping_address, billing_address,
        subtotal, shipping_fee, discount_amount, tax_amount, total,
        currency, payment_method, payment_status, shipping_method, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        orderId,
        orderNumber,
        userId || null,
        email || null,
        'pending',
        JSON.stringify(shipping_address),
        billing_address ? JSON.stringify(billing_address) : null,
        subtotal,
        shipping_fee,
        discount_amount,
        tax_amount,
        total,
        'VND',
        payment_method,
        payment_method === 'cod' ? 'pending' : 'pending',
        shipping_method,
        notes || null
      ]
    );

    for (const item of cartItems) {
      const unitPrice = item.price_snapshot || (item.base_price + item.price_adjustment);
      await db.run(
        `INSERT INTO order_items (
          id, order_id, variant_id, product_name, variant_sku, variant_size, variant_color, quantity, unit_price, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          orderId,
          item.variant_id,
          item.product_name,
          item.sku,
          item.size,
          item.color_name,
          item.quantity,
          unitPrice,
          unitPrice * item.quantity
        ]
      );
    }

    if (applied_coupon_id && discount_amount > 0) {
      await db.run(
        'INSERT INTO order_coupons (order_id, coupon_id, discount_applied) VALUES (?, ?, ?)',
        [orderId, applied_coupon_id, discount_amount]
      );
      await db.run(
        'UPDATE coupons SET used_count = used_count + 1 WHERE id = ?',
        [applied_coupon_id]
      );
    }

    await db.run('DELETE FROM cart_items WHERE cart_session_id = ?', [cartSession.id]);

    res.status(201).json({
      success: true,
      data: {
        order: {
          id: orderId,
          order_number: orderNumber,
          user_id: userId,
          email,
          status: 'pending',
          subtotal,
          shipping_fee,
          discount_amount,
          tax_amount,
          total,
          shipping_method,
          payment_method,
          payment_status: 'pending',
          shipping_address,
          billing_address,
          notes,
          created_at: new Date().toISOString()
        },
        cart_session: cartSession.session_token
      },
      message: 'Order created successfully'
    });
  } catch (err) {
    next(err);
  }
};

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (userId) {
      whereClause += ' AND user_id = ?';
      params.push(userId);
    } else {
      throw new AppError('Authentication required', 401);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status as string);
    }

    const countResult = await db.get(
      `SELECT COUNT(*) as total FROM orders ${whereClause}`,
      params
    );

    const orders = await db.all(
      `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / Number(limit))
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const userRole = (req as any).user?.role;

    const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.user_id !== userId && userRole !== 'admin') {
      throw new AppError('Not authorized to view this order', 403);
    }

    const items = await db.all(
      `SELECT oi.*, pv.sku, pv.size, pv.color_name, pv.color_hex,
              p.name as product_name, p.slug as product_slug
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       LEFT JOIN product_variants pv ON oi.variant_id = pv.id
       WHERE oi.order_id = ?`,
      [id]
    );

    const coupons = await db.all(
      `SELECT c.code, c.name, c.discount_type, c.discount_value, oc.discount_applied
       FROM order_coupons oc
       JOIN coupons c ON oc.coupon_id = c.id
       WHERE oc.order_id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: {
        order,
        items,
        coupons: coupons.length > 0 ? coupons : undefined
      }
    });
  } catch (err) {
    next(err);
  }
};

export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const userRole = (req as any).user?.role;

    const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.user_id !== userId && userRole !== 'admin') {
      throw new AppError('Not authorized to cancel this order', 403);
    }

    if (!['pending', 'paid'].includes(order.status)) {
      throw new AppError(`Cannot cancel order in '${order.status}' status`, 400);
    }

    await db.run(
      "UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, tracking_number } = req.body;
    const userRole = (req as any).user?.role;

    if (userRole !== 'admin') {
      throw new AppError('Admin only', 403);
    }

    const allowedStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!allowedStatuses.includes(status)) {
      throw new AppError(`Invalid status. Allowed: ${allowedStatuses.join(', ')}`, 400);
    }

    const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const updates = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [status];

    if (tracking_number) {
      updates.push('tracking_number = ?');
      params.push(tracking_number);
    }

    params.push(id);

    await db.run(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Note: Email notifications can be enabled here when email service is fully configured

    res.json({
      success: true,
      message: `Order status updated to ${status}`
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderByNumber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { order_number } = req.params;

    const order = await db.get(
      'SELECT * FROM orders WHERE order_number = ?',
      [order_number]
    );

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const items = await db.all(
      'SELECT * FROM order_items WHERE order_id = ?',
      [order.id]
    );

    res.json({
      success: true,
      data: { order, items }
    });
  } catch (err) {
    next(err);
  }
};
