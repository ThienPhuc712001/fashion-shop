import express from 'express';
const router = express.Router();
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  createCartSession
} from '../controllers/cart.controller';
import { body, param } from 'express-validator';

// Validation
const addToCartValidation = [
  body('variant_id').isString().notEmpty(),
  body('quantity').optional().isInt({ min: 1 })
];

const updateQuantityValidation = [
  param('id').isString(),
  body('quantity').isInt({ min: 1 })
];

// Routes
router.post('/session', createCartSession);
router.get('/', getCart);
router.post('/items', addToCartValidation, addToCart);
router.put('/items/:id', updateQuantityValidation, updateCartItem);
router.delete('/items/:id', [param('id').isString()], removeCartItem);

export default router;
