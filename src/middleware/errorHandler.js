import logger from './logger';
export class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error({
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });
    // Default error
    let statusCode = 500;
    let message = 'Internal Server Error';
    // Handle validation errors
    if ('errors' in err && Array.isArray(err.errors)) {
        statusCode = 400;
        message = 'Validation Error';
        return res.status(statusCode).json({
            success: false,
            error: message,
            details: err.errors
        });
    }
    // Handle AppError
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        return res.status(statusCode).json({
            success: false,
            error: message
        });
    }
    // Handle known error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
    }
    // Database errors
    if (err.code === 'SQLITE_CONSTRAINT' || err.code === 'SQLITE_BUSY') {
        statusCode = 400;
        message = 'Database error';
    }
    res.status(statusCode).json(Object.assign({ success: false, error: statusCode === 500 ? 'Internal Server Error' : err.name || 'Error', message }, (process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})));
};
export { errorHandler };
