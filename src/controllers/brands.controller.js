import db from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
// GET /api/brands
export const listBrands = async (req, res, next) => {
    try {
        const { include_inactive = false } = req.query;
        let sql = 'SELECT * FROM brands';
        if (!include_inactive) {
            sql += ' WHERE is_active = 1';
        }
        sql += ' ORDER BY name';
        const brands = await db.all(sql);
        res.json({ success: true, data: brands });
    }
    catch (err) {
        next(err);
    }
};
// GET /api/brands/:id
export const getBrand = async (req, res, next) => {
    try {
        const { id } = req.params;
        const brand = await db.get('SELECT * FROM brands WHERE id = ?', [id]);
        if (!brand) {
            throw new AppError('Brand not found', 404);
        }
        res.json({ success: true, data: brand });
    }
    catch (err) {
        next(err);
    }
};
// GET /api/brands/slug/:slug (optional)
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
// POST /api/brands (admin)
export const createBrand = async (req, res, next) => {
    try {
        const { name, slug, logo_url, description, is_active = true } = req.body;
        if (!name)
            throw new AppError('Name is required', 400);
        const id = uuidv4();
        const slugValue = slug || name.toLowerCase().replace(/\s+/g, '-');
        await db.run(`INSERT INTO brands (id, name, slug, logo_url, description, is_active) VALUES (?, ?, ?, ?, ?, ?)`, [id, name, slugValue, logo_url || null, description || null, is_active]);
        res.status(201).json({ success: true, data: { id, name, slug: slugValue }, message: 'Brand created' });
    }
    catch (err) {
        next(err);
    }
};
// PUT /api/brands/:id (admin)
export const updateBrand = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, slug, logo_url, description, is_active } = req.body;
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
        if (logo_url !== undefined) {
            updates.push('logo_url = ?');
            values.push(logo_url);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active);
        }
        if (updates.length === 0) {
            throw new AppError('No fields to update', 400);
        }
        values.push(id);
        await db.run(`UPDATE brands SET ${updates.join(', ')} WHERE id = ?`, values);
        res.json({ success: true, message: 'Brand updated' });
    }
    catch (err) {
        next(err);
    }
};
// DELETE /api/brands/:id (admin)
export const deleteBrand = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Check if brand has products
        const productCount = await db.get('SELECT COUNT(*) as count FROM products WHERE brand_id = ?', [id]);
        if (productCount.count > 0) {
            throw new AppError('Cannot delete brand with products. Deactivate instead.', 400);
        }
        const result = await db.run('DELETE FROM brands WHERE id = ?', [id]);
        if (result.changes === 0) {
            throw new AppError('Brand not found', 404);
        }
        res.json({ success: true, message: 'Brand deleted' });
    }
    catch (err) {
        next(err);
    }
};
