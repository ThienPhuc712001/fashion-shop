import db from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
// GET /api/categories
export const listCategories = async (req, res, next) => {
    try {
        const { include_inactive = false } = req.query;
        let sql = 'SELECT * FROM categories';
        if (!include_inactive) {
            sql += ' WHERE is_active = 1';
        }
        sql += ' ORDER BY sort_order, name';
        const categories = await db.all(sql);
        res.json({ success: true, data: categories });
    }
    catch (err) {
        next(err);
    }
};
// GET /api/categories/:id
export const getCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const category = await db.get('SELECT * FROM categories WHERE id = ?', [id]);
        if (!category) {
            throw new AppError('Category not found', 404);
        }
        // Get children if any
        const children = await db.all('SELECT * FROM categories WHERE parent_id = ?', [id]);
        res.json({ success: true, data: Object.assign(Object.assign({}, category), { children }) });
    }
    catch (err) {
        next(err);
    }
};
// POST /api/categories (admin)
export const createCategory = async (req, res, next) => {
    try {
        const { name, slug, description, parent_id, sort_order = 0, is_active = true } = req.body;
        if (!name)
            throw new AppError('Name is required', 400);
        const id = uuidv4();
        const slugValue = slug || name.toLowerCase().replace(/\s+/g, '-');
        await db.run(`INSERT INTO categories (id, name, slug, description, parent_id, sort_order, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [id, name, slugValue, description || null, parent_id || null, sort_order, is_active]);
        res.status(201).json({ success: true, data: { id, name, slug: slugValue }, message: 'Category created' });
    }
    catch (err) {
        next(err);
    }
};
// PUT /api/categories/:id (admin)
export const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, slug, description, parent_id, sort_order, is_active } = req.body;
        const updates = [];
        const values = [];
        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (slug) {
            updates.push('slug = ?');
            values.push(slug);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (parent_id !== undefined) {
            updates.push('parent_id = ?');
            values.push(parent_id);
        }
        if (sort_order !== undefined) {
            updates.push('sort_order = ?');
            values.push(sort_order);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active);
        }
        if (updates.length === 0) {
            throw new AppError('No fields to update', 400);
        }
        values.push(id);
        await db.run(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, values);
        res.json({ success: true, message: 'Category updated' });
    }
    catch (err) {
        next(err);
    }
};
// DELETE /api/categories/:id (admin)
export const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Check if category has products
        const productCount = await db.get('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id]);
        if (productCount.count > 0) {
            throw new AppError('Cannot delete category with products. Deactivate instead.', 400);
        }
        const result = await db.run('DELETE FROM categories WHERE id = ?', [id]);
        if (result.changes === 0) {
            throw new AppError('Category not found', 404);
        }
        res.json({ success: true, message: 'Category deleted' });
    }
    catch (err) {
        next(err);
    }
};
// Helper: get by slug (optional)
export const getBrandBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const brand = await db.get('SELECT * FROM brands WHERE slug = ?', [slug]);
        if (!brand) {
            throw new AppError('Brand not found', 404);
        }
        res.json({ success: true, data: brand });
    }
    catch (err) {
        next(err);
    }
};
