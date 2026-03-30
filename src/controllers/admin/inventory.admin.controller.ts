import { Request, Response, NextFunction } from 'express';
import db from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export const getAdminInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 50,
      lowStock,
      search
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build query with JOINs to get product info + variants
    let countSql = `
      SELECT COUNT(*) as total
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    let dataSql = `
      SELECT 
        v.id as variant_id,
        v.sku,
        v.stock_quantity,
        v.low_stock_threshold,
        p.id as product_id,
        p.name as product_name,
        p.slug as product_slug,
        c.name as category_name
      FROM product_variants v
      JOIN products p ON v.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (lowStock && String(lowStock).toLowerCase() === 'true') {
      countSql += ' AND v.stock_quantity <= v.low_stock_threshold';
      dataSql += ' AND v.stock_quantity <= v.low_stock_threshold';
    }

    if (search) {
      countSql += ' AND (p.name LIKE ? OR v.sku LIKE ?)';
      dataSql += ' AND (p.name LIKE ? OR v.sku LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Get total count
    const [countResult] = await db.all(countSql, params);
    const total = countResult?.total || 0;

    // Add pagination to data query
    dataSql += ' ORDER BY p.name, v.created_at LIMIT ? OFFSET ?';

    const inventory = await db.all(dataSql, [...params, Number(limit), offset]);

    // Get summary stats
    const summary = await db.get(`
      SELECT 
        COUNT(*) as total_variants,
        SUM(v.stock_quantity) as total_stock,
        SUM(CASE WHEN v.stock_quantity <= v.low_stock_threshold THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN v.stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_count
      FROM product_variants v
    `);

    res.json({
      success: true,
      data: {
        items: inventory,
        summary: summary || { total_variants: 0, total_stock: 0, low_stock_count: 0, out_of_stock_count: 0 }
      },
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

export const updateVariantStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { variant_id } = req.params;
    const { stock_quantity } = req.body;

    console.log('[updateVariantStock] variant_id:', variant_id, 'stock_quantity:', stock_quantity);

    // Check variant exists
    const variant = await db.get(
      'SELECT * FROM product_variants WHERE id = ?',
      [variant_id]
    );
    if (!variant) {
      throw new AppError('Variant not found', 404);
    }
    console.log('[updateVariantStock] variant found:', variant.id);

    // Update variant stock only (product aggregate not stored separately)
    console.log('[updateVariantStock] Executing UPDATE query');
    await db.run(
      `UPDATE product_variants SET stock_quantity = ? WHERE id = ?`,
      [stock_quantity, variant_id]
    );
    console.log('[updateVariantStock] UPDATE done');

    res.json({
      success: true,
      message: 'Stock updated successfully'
    });
  } catch (error: any) {
    console.error('[updateVariantStock] ERROR:', error.message, error.stack);
    next(error);
  }
};

export const bulkUpdateVariantStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { updates } = req.body; // Array of { variant_id, stock_quantity }

    if (!Array.isArray(updates)) {
      throw new AppError('updates must be an array', 400);
    }

    for (const update of updates) {
      const { variant_id, stock_quantity } = update;
      await db.run(
        `UPDATE product_variants SET stock_quantity = ? WHERE id = ?`,
        [stock_quantity, variant_id]
      );
    }

    // Recalculate parent product stocks (could optimize with batch update)
    // For now, just return success
    res.json({
      success: true,
      message: `${updates.length} variants updated`
    });
  } catch (error) {
    next(error);
  }
};
