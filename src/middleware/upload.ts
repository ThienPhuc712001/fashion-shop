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
    const subDir = req.params?.type || 'products';
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
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
export const processImage = async (
  inputPath: string,
  outputPath: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp' | 'avif';
  } = {}
) => {
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
export const generateThumbnails = async (
  inputPath: string,
  baseName: string,
  sizes: { name: string; width: number; height: number }[]
) => {
  const results: string[] = [];

  for (const size of sizes) {
    const outputPath = inputPath.replace(
      baseName,
      `${size.name}-${baseName}`
    );

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
export const getFileUrl = (filePath: string): string => {
  const relativePath = path.relative(process.cwd(), filePath);
  return `/${relativePath.replace(/\\/g, '/')}`;
};

// Utility: Delete file
export const deleteFile = (filePath: string): boolean => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to delete file:', err);
    return false;
  }
};

// Cleanup old files helper
export const cleanupOldFiles = (dir: string, maxAgeDays: number = 7): number => {
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
  } catch (err) {
    console.error('Cleanup error:', err);
  }

  return deletedCount;
};
