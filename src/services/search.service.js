import db from '../config/database';
class SearchService {
    /**
     * Sync product to FTS index
     */
    async syncProduct(productId) {
        const product = await db.get(`SELECT p.*, c.name as category_name, b.name as brand_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.id = ?`, [productId]);
        if (!product)
            return;
        // Check if already exists in FTS
        const existing = await db.get('SELECT * FROM products_fts WHERE product_id = ?', [productId]);
        if (existing) {
            await db.run(`UPDATE products_fts SET 
          name = ?, description = ?, category_name = ?, brand_name = ?
         WHERE product_id = ?`, [product.name, product.description || '', product.category_name || '', product.brand_name || '', productId]);
        }
        else {
            await db.run(`INSERT INTO products_fts (product_id, name, description, category_name, brand_name)
         VALUES (?, ?, ?, ?, ?)`, [productId, product.name, product.description || '', product.category_name || '', product.brand_name || '']);
        }
    }
    /**
     * Remove product from FTS index
     */
    async removeProduct(productId) {
        await db.run('DELETE FROM products_fts WHERE product_id = ?', [productId]);
    }
    /**
     * Search products using FTS5
     */
    async searchProducts(query, options = {}) {
        const { limit = 20, offset = 0, category_id, min_price, max_price } = options;
        if (!query.trim()) {
            return [];
        }
        // Build FTS query with BM25 ranking
        let sql = `
      SELECT p.*, 
             pfts.rank as search_rank,
             c.name as category_name,
             b.name as brand_name,
             (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM products_fts pfts
      JOIN products p ON pfts.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE pfts.name MATCH ?
    `;
        const params = [query];
        if (category_id) {
            sql += ' AND p.category_id = ?';
            params.push(category_id);
        }
        if (min_price !== undefined) {
            sql += ' AND p.base_price >= ?';
            params.push(min_price);
        }
        if (max_price !== undefined) {
            sql += ' AND p.base_price <= ?';
            params.push(max_price);
        }
        sql += ' ORDER BY rank LIMIT ? OFFSET ?';
        params.push(limit, offset);
        return db.all(sql, params);
    }
    /**
     * Get search suggestions (autocomplete)
     */
    async getSuggestions(prefix, limit = 10) {
        if (!prefix.trim()) {
            return [];
        }
        // Simple LIKE suggestions from products and categories
        const suggestions = await db.all(`SELECT DISTINCT name as suggestion FROM products_fts 
       WHERE name LIKE ? 
       UNION
       SELECT DISTINCT category_name FROM products_fts 
       WHERE category_name LIKE ?
       UNION
       SELECT DISTINCT brand_name FROM products_fts 
       WHERE brand_name LIKE ?
       LIMIT ?`, [`${prefix}%`, `${prefix}%`, `${prefix}%`, limit]);
        return suggestions.map(s => s.suggestion).filter(Boolean);
    }
    /**
     * Rebuild entire FTS index (admin function)
     */
    async rebuildIndex() {
        // Clear existing
        await db.run('DELETE FROM products_fts');
        // Get all products
        const products = await db.all(`SELECT p.*, c.name as category_name, b.name as brand_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.is_active = 1`);
        const insertSql = `
      INSERT INTO products_fts (product_id, name, description, category_name, brand_name)
      VALUES (?, ?, ?, ?, ?)
    `;
        for (const product of products) {
            await db.run(insertSql, [
                product.id,
                product.name,
                product.description || '',
                product.category_name || '',
                product.brand_name || ''
            ]);
        }
        return { indexed: products.length };
    }
}
export const searchService = new SearchService();
export default searchService;
