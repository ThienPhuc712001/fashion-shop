import express from 'express';
const router = express.Router();
import {
  register,
  login,
  getProfile,
  updateProfile,
  logout
} from '../controllers/auth.controller';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

// Validation
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').optional().isString().trim(),
  body('phone').optional().isString()
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isString()
];

const updateProfileValidation = [
  body('full_name').optional().isString().trim(),
  body('phone').optional().isString(),
  body('avatar_url').optional().isURL()
];

// Routes
router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getProfile);
router.put('/profile', authenticate, updateProfileValidation, updateProfile);

export default router;
