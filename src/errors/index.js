export class AppError extends Error {
    constructor(message, statusCode = 500, code) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class ValidationError extends AppError {
    constructor(message = 'Validation failed') {
        super(message, 400, 'VALIDATION_ERROR');
    }
}
export class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'AUTH_ERROR');
    }
}
export class AuthorizationError extends AppError {
    constructor(message = 'Not authorized') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}
export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
    }
}
export class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409, 'CONFLICT');
    }
}
export class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429, 'RATE_LIMIT');
    }
}
export class PaymentError extends AppError {
    constructor(message = 'Payment failed', code) {
        super(message, 402, code || 'PAYMENT_ERROR');
    }
}
export class ShippingError extends AppError {
    constructor(message = 'Shipping error', code) {
        super(message, 422, code || 'SHIPPING_ERROR');
    }
}
export class InventoryError extends AppError {
    constructor(message = 'Inventory error') {
        super(message, 409, 'INVENTORY_ERROR');
    }
}
