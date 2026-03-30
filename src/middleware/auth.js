import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
export const authenticate = (req, res, next) => {
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
        const payload = jwt.verify(token, secret);
        // Attach user info to request
        req.user = {
            id: payload.userId,
            role: payload.role
        };
        req.userId = payload.userId;
        next();
    }
    catch (err) {
        throw new AppError('Invalid or expired token', 401);
    }
};
export const authorize = (...roles) => {
    return (req, res, next) => {
        var _a;
        const userRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (!userRole || !roles.includes(userRole)) {
            throw new AppError('You do not have permission to perform this action', 403);
        }
        next();
    };
};
