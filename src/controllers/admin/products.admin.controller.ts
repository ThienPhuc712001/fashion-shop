import { Request, Response, NextFunction } from 'express';
import db from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import * as fs from 'fs';
import * as path from 'path';

// Helper: Generate slug
const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export const getAdminProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      is_active,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build WHERE clause
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (search) {
      whereClauses.push('(p.name LIKE ? OR p.description LIKE ? OR p.slug LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      whereClauses.push('p.category = ?');
      params.push(category);
    }

    if (is_active !== undefined) {
      whereClauses.push('p.is_active = ?');
      params.push(is_active);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total
    const countSql = `SELECT COUNT(*) as total FROM products p ${whereSql}`;
    const [countResult] = await db.all(countSql, params);
    const total = countResult?.total || 0;

    // Get products - minimal JOINs
    const dataSql = `
      SELECT 
        p.*,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id) as variant_count
      FROM products p
      ${whereSql}
      ORDER BY p.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    const products = await db.all(dataSql, [...params, Number(limit), offset]);

    res.json({
      success: true,
      data: products,
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

export const getAdminProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const product = await db.get(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Get images
    const images = await db.all(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, is_primary DESC',
      [id]
    );

    // Get variants
    const variants = await db.all(
      'SELECT * FROM product_variants WHERE product_id = ?',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...product,
        images,
        variants
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      description,
      base_price,
      category_id,
      is_active = 1,
      slug,
      image_url
    } = req.body;

    const productSlug = slug || generateSlug(name);
    const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.run(
      `INSERT INTO products (
        id, name, slug, description, base_price, 
        category_id, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [productId, name, productSlug, description || null, base_price || 0, category_id, is_active]
    );

    // If image URL provided, insert as primary image
    if (image_url) {
      await db.run(
        `INSERT INTO product_images (id, product_id, url, alt_text, is_primary, sort_order) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [`img_${Date.now()}`, productId, image_url, name, 1, 0]
      );
    }

    res.status(201).json({
      success: true,
      data: { id: productId, name, slug: productSlug },
      message: 'Product created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      base_price,
      category_id,
      is_active,
      slug,
      image_url
    } = req.body;

    // Check exists
    const existing = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      throw new AppError('Product not found', 404);
    }

    const productSlug = slug || generateSlug(name);

    await db.run(
      `UPDATE products SET 
        name = ?, slug = ?, description = ?, base_price = ?, 
        category_id = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, productSlug, description || null, base_price || 0, category_id, is_active, id]
    );

    // Handle image update if provided
    if (image_url) {
      // Delete old primary image
      await db.run('DELETE FROM product_images WHERE product_id = ? AND is_primary = 1', [id]);
      // Add new primary image
      await db.run(
        `INSERT INTO product_images (id, product_id, url, alt_text, is_primary, sort_order) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [`img_${Date.now()}`, id, image_url, name, 1, 0]
      );
    }

    res.json({
      success: true,
      message: 'Product updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      throw new AppError('Product not found', 404);
    }

    // Check if product has variants or orders
    const variantCount = await db.get('SELECT COUNT(*) as cnt FROM product_variants WHERE product_id = ?', [id]);
    if (variantCount.cnt > 0) {
      throw new AppError('Cannot delete product with variants. Delete variants first.', 400);
    }

    // Check order history
    const orderItemCount = await db.get('SELECT COUNT(*) as cnt FROM order_items WHERE product_id = ?', [id]);
    if (orderItemCount.cnt > 0) {
      // Soft delete instead - mark as inactive
      await db.run('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
      return res.json({
        success: true,
        message: 'Product has order history. Marked as inactive instead.'
      });
    }

    // Hard delete
    await db.run('DELETE FROM product_images WHERE product_id = ?', [id]);
    await db.run('DELETE FROM products WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getProductVariants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { product_id } = req.params;

    const variants = await db.all(
      `SELECT * FROM product_variants WHERE product_id = ? ORDER BY created_at DESC`,
      [product_id]
    );

    res.json({
      success: true,
      data: variants
    });
  } catch (error) {
    next(error);
  }
};

export const updateVariantStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { variant_id } = req.params;
    const { stock_quantity, reserved_quantity } = req.body;

    await db.run(
      `UPDATE product_variants SET 
        stock_quantity = ?, reserved_quantity = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [stock_quantity, reserved_quantity || 0, variant_id]
    );

    // Update parent product stock total
    await db.run(
      `UPDATE products SET 
        stock_quantity = (SELECT SUM(stock_quantity) FROM product_variants WHERE product_id = 
          (SELECT product_id FROM product_variants WHERE id = ?))
       WHERE id = (SELECT product_id FROM product_variants WHERE id = ?)`,
      [variant_id, variant_id]
    );

    res.json({
      success: true,
      message: 'Variant stock updated'
    });
  } catch (error) {
    next(error);
  }
};
