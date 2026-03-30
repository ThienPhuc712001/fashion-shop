import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
// Configuration
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const basePath = path.join(process.cwd(), uploadDir);
// Ensure upload directory exists
if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
}
// Storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        var _a;
        const subDir = ((_a = req.params) === null || _a === void 0 ? void 0 : _a.type) || 'products';
        const dir = path.join(basePath, subDir);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `${uuidv4()}${ext}`;
        cb(null, filename);
    }
});
// File filter - images only
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|avif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, avif)'));
};
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '5000000'), // 5MB default
    }
});
// Image processing pipeline
export const processImage = async (inputPath, outputPath, options = {}) => {
    const { width = 1200, height = 1200, quality = 80, format = 'jpeg' } = options;
    let pipeline = sharp(inputPath);
    // Resize with smart cropping
    pipeline = pipeline.resize(width, height, {
        fit: 'cover',
        position: 'center'
    });
    // Set output format
    pipeline = pipeline.toFormat(format, { quality });
    await pipeline.toFile(outputPath);
    // Remove original after processing
    fs.unlinkSync(inputPath);
};
// Multiple sizes generator
export const generateThumbnails = async (inputPath, baseName, sizes) => {
    const results = [];
    for (const size of sizes) {
        const outputPath = inputPath.replace(baseName, `${size.name}-${baseName}`);
        await processImage(inputPath, outputPath, {
            width: size.width,
            height: size.height,
            format: 'jpeg'
        });
        results.push(outputPath);
    }
    return results;
};
// Utility: Get relative URL from file path
export const getFileUrl = (filePath) => {
    const relativePath = path.relative(process.cwd(), filePath);
    return `/${relativePath.replace(/\\/g, '/')}`;
};
// Utility: Delete file
export const deleteFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    }
    catch (err) {
        console.error('Failed to delete file:', err);
        return false;
    }
};
// Cleanup old files helper
export const cleanupOldFiles = (dir, maxAgeDays = 7) => {
    let deletedCount = 0;
    const now = Date.now();
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (now - stat.mtime.getTime() > maxAge) {
                fs.unlinkSync(filePath);
                deletedCount++;
            }
        }
    }
    catch (err) {
        console.error('Cleanup error:', err);
    }
    return deletedCount;
};
