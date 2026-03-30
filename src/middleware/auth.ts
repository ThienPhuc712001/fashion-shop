import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Allow OPTIONS requests (CORS preflight) to pass through
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Access denied. No token provided.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'default-secret-change-me';
    const payload = jwt.verify(token, secret) as { userId: string; role: string };

    // Attach user info to request
    (req as any).user = {
      id: payload.userId,
      role: payload.role
    };
    (req as any).userId = payload.userId;

    next();
  } catch (err) {
    throw new AppError('Invalid or expired token', 401);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;
    if (!userRole || !roles.includes(userRole)) {
      throw new AppError('You do not have permission to perform this action', 403);
    }
    next();
  };
};