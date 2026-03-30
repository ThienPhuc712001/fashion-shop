import { Request, Response, NextFunction } from 'express';
import logger from './logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
  if ('errors' in err && Array.isArray((err as any).errors)) {
    statusCode = 400;
    message = 'Validation Error';
    return res.status(statusCode).json({
      success: false,
      error: message,
      details: (err as any).errors
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
  if ((err as any).code === 'SQLITE_CONSTRAINT' || (err as any).code === 'SQLITE_BUSY') {
    statusCode = 400;
    message = 'Database error';
  }

  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Internal Server Error' : err.name || 'Error',
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
};

export { errorHandler };