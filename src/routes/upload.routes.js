import express from 'express';
const router = express.Router();
import { uploadProductImage, deleteProductImage, setPrimaryImage, listProductImages } from '../controllers/upload.controller';
import { authenticate, authorize } from '../middleware/auth';
import { param } from 'express-validator';
import { uploadLimiter } from '../middleware/rateLimit';
// Upload image to product
router.post('/products/:id/images', authenticate, authorize('admin', 'seller'), uploadLimiter, uploadProductImage);
// List product images
router.get('/products/:id/images', listProductImages);
// Delete product image
router.delete('/products/:id/images/:imageId', authenticate, authorize('admin', 'seller'), uploadLimiter, [param('imageId').isString()], deleteProductImage);
// Set primary image
router.put('/products/:id/images/:imageId/set-primary', authenticate, authorize('admin', 'seller'), uploadLimiter, [param('imageId').isString()], setPrimaryImage);
export default router;
