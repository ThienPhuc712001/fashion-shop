import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { RegisterDto, LoginDto } from '../types';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, full_name, phone }: RegisterDto = req.body;

    // Validation
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    // Check if user exists
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = uuidv4();
    await db.run(
      `INSERT INTO users (id, email, password_hash, full_name, phone) VALUES (?, ?, ?, ?, ?)`,
      [userId, email, password_hash, full_name || null, phone || null]
    );

    // Generate JWT
    const secret = (process.env.JWT_SECRET || 'default-secret') as string;
    const token = jwt.sign(
      { userId, role: 'customer' },
      secret as any,
      { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
    );

    res.status(201).json({
      success: true,
      data: {
        user: { id: userId, email, full_name, phone, role: 'customer' },
        token
      },
      message: 'Registration successful'
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password }: LoginDto = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    // Find user
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate JWT
    const secret = (process.env.JWT_SECRET || 'default-secret') as string;
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      secret as any,
      { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          avatar_url: user.avatar_url,
          role: user.role,
          email_verified: user.email_verified
        },
        token
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const user = await db.get(
      'SELECT id, email, full_name, phone, avatar_url, role, email_verified, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { full_name, phone, avatar_url } = req.body;

    await db.run(
      'UPDATE users SET full_name = ?, phone = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [full_name || null, phone || null, avatar_url || null, userId]
    );

    const user = await db.get(
      'SELECT id, email, full_name, phone, avatar_url, role, email_verified, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      data: { user },
      message: 'Profile updated successfully'
    });
  } catch (err) {
    next(err);
  }
};

// Logout - For stateless JWT, we just return success. Client should remove token.
// Could implement token blacklist in future if needed.
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Since JWT is stateless, we can't invalidate it server-side without a blacklist.
    // Just return success - client will remove token from storage.
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    next(err);
  }
};