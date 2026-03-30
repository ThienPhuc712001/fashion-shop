import * as fs from 'fs';
import * as path from 'path';
import db from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { upload, processImage, getFileUrl, deleteFile } from '../middleware/upload';
import { v4 as uuidv4 } from 'uuid';
// POST /api/products/:id/images - Upload product images
export const uploadProductImage = [
    upload.single('image'),
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { is_primary = false, alt_text = '' } = req.body;
            // Validate product exists
            const product = await db.get('SELECT id FROM products WHERE id = ?', [id]);
            if (!product) {
                throw new AppError('Product not found', 404);
            }
            if (!req.file) {
                throw new AppError('No image file provided', 400);
            }
            // Generate optimized versions
            const uploadsDir = path.dirname(req.file.path);
            const baseName = path.basename(req.file.path, path.extname(req.file.path));
            const ext = '.jpg'; // Always convert to jpeg for consistency
            // Create different sizes
            const sizes = [
                { name: 'thumb', width: 200, height: 200 },
                { name: 'medium', width: 600, height: 600 },
                { name: 'large', width: 1200, height: 1200 }
            ];
            const imageId = uuidv4();
            // Process and save images
            const variants = [];
            // Process main image (large)
            const mainPath = path.join(uploadsDir, `${imageId}${ext}`);
            await processImage(req.file.path, mainPath, {
                width: 1200,
                height: 1200,
                quality: 85,
                format: 'jpeg'
            });
            // Create thumbnails
            for (const size of sizes) {
                const thumbPath = path.join(uploadsDir, `${size.name}-${imageId}${ext}`);
                await processImage(req.file.path, thumbPath, {
                    width: size.width,
                    height: size.height,
                    quality: 75,
                    format: 'jpeg'
                });
                variants.push({
                    size: size.name,
                    url: getFileUrl(thumbPath),
                    width: size.width,
                    height: size.height
                });
            }
            // Save to database
            const sortOrder = await db.get('SELECT MAX(sort_order) as max FROM product_images WHERE product_id = ?', [id]);
            await db.run(`INSERT INTO product_images (id, product_id, variant_id, url, alt_text, is_primary, sort_order) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                imageId,
                id,
                null,
                getFileUrl(mainPath),
                alt_text,
                is_primary,
                (sortOrder.max || 0) + 1
            ]);
            // If this is primary, unset other primary images
            if (is_primary) {
                await db.run('UPDATE product_images SET is_primary = 0 WHERE product_id = ? AND id != ?', [id, imageId]);
            }
            // Delete original uploaded file
            deleteFile(req.file.path);
            res.status(201).json({
                success: true,
                data: {
                    id: imageId,
                    url: getFileUrl(mainPath),
                    variants,
                    is_primary
                },
                message: 'Image uploaded successfully'
            });
        }
        catch (err) {
            next(err);
        }
    }
];
// DELETE /api/products/:id/images/:imageId
export const deleteProductImage = async (req, res, next) => {
    try {
        const { id, imageId } = req.params;
        // Get image info
        const image = await db.get('SELECT * FROM product_images WHERE id = ? AND product_id = ?', [imageId, id]);
        if (!image) {
            throw new AppError('Image not found', 404);
        }
        // Delete from database
        await db.run('DELETE FROM product_images WHERE id = ?', [imageId]);
        // Delete files (simple cleanup - in production, use pattern matching for variants)
        try {
            const filePath = path.join(process.cwd(), image.url.replace(/^\//, ''));
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        catch (err) {
            console.error('Failed to delete file:', err);
        }
        res.json({
            success: true,
            message: 'Image deleted'
        });
    }
    catch (err) {
        next(err);
    }
};
// PUT /api/products/:id/images/:imageId/set-primary
export const setPrimaryImage = async (req, res, next) => {
    try {
        const { id, imageId } = req.params;
        // Check image exists
        const image = await db.get('SELECT * FROM product_images WHERE id = ? AND product_id = ?', [imageId, id]);
        if (!image) {
            throw new AppError('Image not found', 404);
        }
        // Unset all primary for this product
        await db.run('UPDATE product_images SET is_primary = 0 WHERE product_id = ?', [id]);
        // Set this one as primary
        await db.run('UPDATE product_images SET is_primary = 1 WHERE id = ?', [imageId]);
        res.json({
            success: true,
            message: 'Primary image updated'
        });
    }
    catch (err) {
        next(err);
    }
};
// GET /api/products/:id/images
export const listProductImages = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const images = await db.all(`SELECT * FROM product_images 
       WHERE product_id = ? 
       ORDER BY is_primary DESC, sort_order ASC 
       LIMIT ? OFFSET ?`, [id, Number(limit), Number(offset)]);
        res.json({
            success: true,
            data: images
        });
    }
    catch (err) {
        next(err);
    }
};
