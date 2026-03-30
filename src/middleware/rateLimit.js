import rateLimit from 'express-rate-limit';
// Different limits for different endpoints
export const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests. Please try again later.' },
    skip: (req) => process.env.NODE_ENV === 'test' // Skip in tests
});
export const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 attempts per 5 minutes
    standardHeaders: true,
    message: { success: false, error: 'Too many authentication attempts. Please try again later.' },
    skip: (req) => process.env.NODE_ENV === 'test'
});
export const checkoutLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 orders per 5 minutes per IP
    standardHeaders: true,
    message: { success: false, error: 'Too many orders. Please slow down.' },
    skip: (req) => process.env.NODE_ENV === 'test'
});
export const paymentLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // payment callbacks/creates
    standardHeaders: true,
    message: { success: false, error: 'Payment requests too frequent.' },
    skip: (req) => process.env.NODE_ENV === 'test'
});
export const uploadLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // upload requests
    standardHeaders: true,
    message: { success: false, error: 'Upload limit exceeded.' }
});
