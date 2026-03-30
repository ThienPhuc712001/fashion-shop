import db from '../config/database';
import { AppError } from '../middleware/errorHandler';
// Simple CSV parser
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2)
        return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((header, idx) => {
            obj[header] = values[idx];
        });
        result.push(obj);
    }
    return result;
}
// GET /api/admin/products/export-csv
export const exportProductsCSV = async (req, res, next) => {
    try {
        const { category_id, brand_id, is_active } = req.query;
        let sql = `
      SELECT 
        p.id, p.name, p.slug, p.description, p.base_price, p.compare_price,
        p.is_active, p.meta_title, p.meta_description,
        c.name as category_name, c.slug as category_slug,
        b.name as brand_name, b.slug as brand_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE 1=1
    `;
        const params = [];
        if (category_id) {
            sql += ' AND p.category_id = ?';
            params.push(category_id);
        }
        if (brand_id) {
            sql += ' AND p.brand_id = ?';
            params.push(brand_id);
        }
        if (is_active !== undefined) {
            sql += ' AND p.is_active = ?';
            params.push(is_active === 'true');
        }
        sql += ' ORDER BY p.created_at DESC';
        const products = await db.all(sql, params);
        const headers = [
            'ID', 'Name', 'Slug', 'Description', 'Base Price', 'Compare Price',
            'Is Active', 'Meta Title', 'Meta Description', 'Category', 'Brand'
        ];
        const csvRows = products.map(p => [
            p.id,
            p.name,
            p.slug,
            (p.description || '').replace(/"/g, '""'),
            p.base_price,
            p.compare_price || '',
            p.is_active ? 'true' : 'false',
            p.meta_title || '',
            p.meta_description || '',
            p.category_name || '',
            p.brand_name || ''
        ]);
        const csvContent = [
            headers.join(','),
            ...csvRows.map(row => row.map(field => `"${String(field)}"`).join(','))
        ].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="products-export-${Date.now()}.csv"`);
        res.send(csvContent);
    }
    catch (err) {
        next(err);
    }
};
// POST /api/admin/products/import-csv
export const importProductsCSV = async (req, res, next) => {
    try {
        res.json({
            success: true,
            message: 'Import endpoint ready. Use multipart/form-data with "file" field containing CSV.',
            example: {
                headers: ['name', 'slug', 'description', 'base_price', 'category_slug', 'brand_slug'],
                row: ['New Product', 'new-product', 'Description', 100000, 'quan-ao', 'nike']
            }
        });
    }
    catch (err) {
        next(err);
    }
};
// GET /api/admin/variants/export-csv
export const exportVariantsCSV = async (req, res, next) => {
    try {
        const { product_id } = req.query;
        if (!product_id) {
            throw new AppError('product_id is required', 400);
        }
        const sql = `
      SELECT 
        pv.id, p.name as product_name, pv.sku, pv.size, pv.color_name,
        pv.color_hex, pv.material, pv.price_adjustment, pv.stock_quantity,
        pv.low_stock_threshold, pv.weight_grams, pv.barcode, pv.is_available
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE pv.product_id = ?
      ORDER BY pv.size, pv.color_name
    `;
        const variants = await db.all(sql, [product_id]);
        const headers = [
            'ID', 'Product', 'SKU', 'Size', 'Color Name', 'Color Hex',
            'Material', 'Price Adjustment', 'Stock Quantity', 'Low Stock Threshold',
            'Weight (grams)', 'Barcode', 'Is Available'
        ];
        const csvRows = variants.map(v => [
            v.id,
            v.product_name,
            v.sku,
            v.size || '',
            v.color_name || '',
            v.color_hex || '',
            v.material || '',
            v.price_adjustment || 0,
            v.stock_quantity,
            v.low_stock_threshold || 10,
            v.weight_grams || '',
            v.barcode || '',
            v.is_available ? 'true' : 'false'
        ]);
        const csvContent = [
            headers.join(','),
            ...csvRows.map(row => row.map(field => `"${String(field)}"`).join(','))
        ].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="variants-${product_id}-${Date.now()}.csv"`);
        res.send(csvContent);
    }
    catch (err) {
        next(err);
    }
};
// PUT /api/admin/products/:id/variants/bulk-update
export const bulkUpdateVariants = async (req, res, next) => {
    try {
        const { product_id } = req.params;
        const { updates } = req.body;
        if (!Array.isArray(updates) || updates.length === 0) {
            throw new AppError('updates must be a non-empty array', 400);
        }
        if (updates.length > 100) {
            throw new AppError('Maximum 100 variants per batch', 400);
        }
        const updatesSql = `
      UPDATE product_variants 
      SET stock_quantity = COALESCE(?, stock_quantity),
          price_adjustment = COALESCE(?, price_adjustment),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND product_id = ?
    `;
        let updatedCount = 0;
        for (const update of updates) {
            const result = await db.run(updatesSql, [update.stock_quantity, update.price_adjustment, update.variant_id, product_id]);
            updatedCount += result.changes;
        }
        res.json({
            success: true,
            message: `Updated ${updatedCount} variants`,
            data: { updated_count: updatedCount }
        });
    }
    catch (err) {
        next(err);
    }
};
