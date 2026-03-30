import express from 'express';
const router = express.Router();
import { getWishlist, addToWishlist, removeFromWishlist, checkWishlist } from '../controllers/wishlist.controller';
import { param, body } from 'express-validator';
import { authenticate } from '../middleware/auth';
// All routes require authentication
router.use(authenticate);
// Validation
const addWishlistValidation = [
    body('product_id').isString().notEmpty()
];
// Routes
router.get('/', getWishlist);
router.post('/', addWishlistValidation, addToWishlist);
router.delete('/:product_id', [param('product_id').isString()], removeFromWishlist);
router.get('/check/:product_id', [param('product_id').isString()], checkWishlist);
export default router;
