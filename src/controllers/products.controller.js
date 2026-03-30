import db from '../config/database';
import { AppError } from '../middleware/errorHandler';
import searchService from '../services/search.service';
export const listProducts = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, category, brand, min_price, max_price, search, in_stock, min_rating, sort_by = 'created_at', sort_order = 'DESC' } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        let whereClause = 'WHERE 1=1';
        const params = [];
        if (category) {
            whereClause += ' AND p.category_id = ?';
            params.push(category);
        }
        if (brand) {
            whereClause += ' AND p.brand_id = ?';
            params.push(brand);
        }
        if (min_price) {
            whereClause += ' AND p.base_price >= ?';
            params.push(Number(min_price));
        }
        if (max_price) {
            whereClause += ' AND p.base_price <= ?';
            params.push(Number(max_price));
        }
        if (in_stock === 'true') {
            whereClause += ' AND EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.stock_quantity > 0 AND pv.is_available = 1)';
        }
        if (min_rating) {
            whereClause += ' AND (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) >= ?';
            params.push(Number(min_rating));
        }
        // Full-text search
        if (search && typeof search === 'string' && search.trim().length >= 2) {
            try {
                const searchResults = await searchService.searchProducts(search, { limit: 1000 });
                if (searchResults.length > 0) {
                    const productIds = searchResults.map((p) => p.id);
                    whereClause += ` AND p.id IN (${productIds.map(() => '?').join(',')})`;
                    params.push(...productIds);
                }
                else {
                    whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
                    const term = `%${search}%`;
                    params.push(term, term);
                }
            }
            catch (e) {
                whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
                const term = `%${search}%`;
                params.push(term, term);
            }
        }
        const countRow = await db.get(`SELECT COUNT(*) as total FROM products p ${whereClause}`, params);
        const total = countRow.total;
        // Sorting
        const validSortColumns = ['created_at', 'name', 'base_price', 'slug'];
        let sortCol = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
        let sortDir = sort_order === 'ASC' ? 'ASC' : 'DESC';
        // Special sorting: rating (popularity disabled due to missing order_items.product_id?)
        if (sort_by === 'rating') {
            sortCol = '(SELECT AVG(rating) FROM reviews WHERE product_id = p.id)';
            sortDir = sortDir || 'DESC';
        }
        // Note: popularity sort would require order_items.product_id column, currently disabled
        const products = await db.all(`SELECT p.*, 
              c.name as category_name, 
              b.name as brand_name,
              (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
              (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) as avg_rating,
              (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       ${whereClause}
       ORDER BY ${sortCol} ${sortDir}
       LIMIT ? OFFSET ?`, [...params, Number(limit), offset]);
        res.json({
            success: true,
            data: {
                products,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                },
                filters: {
                    category,
                    brand,
                    min_price,
                    max_price,
                    in_stock,
                    min_rating,
                    sort_by,
                    sort_order
                }
            }
        });
    }
    catch (err) {
        next(err);
    }
};
export const getProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await db.get(`SELECT p.*, 
              c.name as category_name,
              c.slug as category_slug,
              b.name as brand_name,
              b.slug as brand_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.id = ?`, [id]);
        if (!product) {
            throw new AppError('Product not found', 404);
        }
        const variants = await db.all('SELECT * FROM product_variants WHERE product_id = ? AND is_available = 1', [id]);
        const images = await db.all('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, is_primary DESC', [id]);
        res.json({
            success: true,
            data: Object.assign(Object.assign({}, product), { variants,
                images })
        });
    }
    catch (err) {
        next(err);
    }
};
export const createProduct = async (req, res, next) => {
    var _a;
    try {
        const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (!userRole || !['admin', 'seller'].includes(userRole)) {
            throw new AppError('Admin or seller required', 403);
        }
        const { name, slug, description, category_id, brand_id, base_price, compare_price, is_active = true } = req.body;
        if (!name || !base_price) {
            throw new AppError('Name and base_price are required', 400);
        }
        const productId = 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const productSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').trim();
        await db.run(`INSERT INTO products (id, name, slug, description, category_id, brand_id, base_price, compare_price, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [productId, name, productSlug, description || null, category_id || null, brand_id || null, base_price, compare_price || null, is_active]);
        // Sync to FTS
        try {
            await searchService.syncProduct(productId);
        }
        catch (e) {
            console.error('FTS sync failed:', e.message);
        }
        const product = await db.get('SELECT * FROM products WHERE id = ?', [productId]);
        res.status(201).json({
            success: true,
            data: product,
            message: 'Product created successfully'
        });
    }
    catch (err) {
        next(err);
    }
};
export const updateProduct = async (req, res, next) => {
    var _a;
    try {
        const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (!userRole || !['admin', 'seller'].includes(userRole)) {
            throw new AppError('Admin or seller required', 403);
        }
        const { id } = req.params;
        const { name, slug, description, category_id, brand_id, base_price, compare_price, is_active } = req.body;
        const updates = [];
        const values = [];
        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (slug !== undefined) {
            updates.push('slug = ?');
            values.push(slug);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (category_id !== undefined) {
            updates.push('category_id = ?');
            values.push(category_id);
        }
        if (brand_id !== undefined) {
            updates.push('brand_id = ?');
            values.push(brand_id);
        }
        if (base_price !== undefined) {
            updates.push('base_price = ?');
            values.push(base_price);
        }
        if (compare_price !== undefined) {
            updates.push('compare_price = ?');
            values.push(compare_price);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active);
        }
        if (updates.length === 0) {
            throw new AppError('No fields to update', 400);
        }
        values.push(id);
        await db.run(`UPDATE products SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
        const product = await db.get('SELECT * FROM products WHERE id = ?', [id]);
        if (!product) {
            throw new AppError('Product not found', 404);
        }
        // Sync FTS
        try {
            await searchService.syncProduct(id);
        }
        catch (e) {
            console.error('FTS sync failed:', e.message);
        }
        res.json({
            success: true,
            data: product,
            message: 'Product updated successfully'
        });
    }
    catch (err) {
        next(err);
    }
};
export const deleteProduct = async (req, res, next) => {
    var _a;
    try {
        const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (!userRole || userRole !== 'admin') {
            throw new AppError('Admin only', 403);
        }
        const { id } = req.params;
        const result = await db.run('DELETE FROM products WHERE id = ?', [id]);
        if (result.changes === 0) {
            throw new AppError('Product not found', 404);
        }
        // Remove from FTS
        try {
            await searchService.removeProduct(id);
        }
        catch (e) {
            console.error('FTS removal failed:', e.message);
        }
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    }
    catch (err) {
        next(err);
    }
};
export const getProductVariants = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { available_only = false } = req.query;
        let sql = `SELECT * FROM product_variants WHERE product_id = ?`;
        const params = [id];
        if (available_only === 'true') {
            sql += ' AND is_available = 1 AND stock_quantity > 0';
        }
        const variants = await db.all(sql, params);
        res.json({
            success: true,
            data: variants
        });
    }
    catch (err) {
        next(err);
    }
};
export const createProductVariant = async (req, res, next) => {
    var _a;
    try {
        const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (!userRole || !['admin', 'seller'].includes(userRole)) {
            throw new AppError('Admin or seller required', 403);
        }
        const productSlug = req.params.id; // slug from URL
        const { sku, size, color, color_name, color_hex, price_adjustment, stock_quantity, is_available } = req.body;
        const colorName = color_name || color || null;
        if (!sku) {
            throw new AppError('SKU is required', 400);
        }
        // Lookup product UUID by slug
        const product = await db.get('SELECT id FROM products WHERE slug = ?', [productSlug]);
        if (!product) {
            throw new AppError('Product not found', 404);
        }
        const productUuid = product.id;
        const variantId = 'var_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        await db.run(`INSERT INTO product_variants (id, product_id, sku, size, color_name, color_hex, price_adjustment, stock_quantity, is_available) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [variantId, productUuid, sku, size || null, colorName, color_hex || null, price_adjustment || 0, stock_quantity || 0, is_available !== false]);
        const variant = await db.get('SELECT * FROM product_variants WHERE id = ?', [variantId]);
        res.status(201).json({
            success: true,
            data: variant,
            message: 'Variant created'
        });
    }
    catch (err) {
        next(err);
    }
};
export const updateProductVariant = async (req, res, next) => {
    var _a;
    try {
        const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (!userRole || !['admin', 'seller'].includes(userRole)) {
            throw new AppError('Admin or seller required', 403);
        }
        const productSlug = req.params.id;
        const { variantId } = req.params;
        const { sku, size, color, color_name, color_hex, price_adjustment, stock_quantity, is_available } = req.body;
        // Lookup product UUID
        const product = await db.get('SELECT id FROM products WHERE slug = ?', [productSlug]);
        if (!product) {
            throw new AppError('Product not found', 404);
        }
        const productUuid = product.id;
        const updates = [];
        const values = [];
        if (sku !== undefined) {
            updates.push('sku = ?');
            values.push(sku);
        }
        if (size !== undefined) {
            updates.push('size = ?');
            values.push(size);
        }
        if (color_name !== undefined || color !== undefined) {
            updates.push('color_name = ?');
            values.push(color_name || color || null);
        }
        if (color_hex !== undefined) {
            updates.push('color_hex = ?');
            values.push(color_hex);
        }
        if (price_adjustment !== undefined) {
            updates.push('price_adjustment = ?');
            values.push(price_adjustment);
        }
        if (stock_quantity !== undefined) {
            updates.push('stock_quantity = ?');
            values.push(stock_quantity);
        }
        if (is_available !== undefined) {
            updates.push('is_available = ?');
            values.push(is_available);
        }
        if (updates.length === 0) {
            throw new AppError('No fields to update', 400);
        }
        values.push(variantId, productUuid);
        const result = await db.run(`UPDATE product_variants SET ${updates.join(', ')} WHERE id = ? AND product_id = ?`, values);
        if (result.changes === 0) {
            throw new AppError('Variant not found', 404);
        }
        const variant = await db.get('SELECT * FROM product_variants WHERE id = ?', [variantId]);
        res.json({
            success: true,
            data: variant,
            message: 'Variant updated'
        });
    }
    catch (err) {
        next(err);
    }
};
export const deleteProductVariant = async (req, res, next) => {
    var _a;
    try {
        const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (!userRole || userRole !== 'admin') {
            throw new AppError('Admin only', 403);
        }
        const productSlug = req.params.id;
        const { variantId } = req.params;
        // Lookup product UUID
        const product = await db.get('SELECT id FROM products WHERE slug = ?', [productSlug]);
        if (!product) {
            throw new AppError('Product not found', 404);
        }
        const productUuid = product.id;
        const result = await db.run('DELETE FROM product_variants WHERE id = ? AND product_id = ?', [variantId, productUuid]);
        if (result.changes === 0) {
            throw new AppError('Variant not found', 404);
        }
        res.json({
            success: true,
            message: 'Variant deleted'
        });
    }
    catch (err) {
        next(err);
    }
};
