import { authenticate, authorize } from '../src/middleware/auth';
import { errorHandler } from '../src/middleware/errorHandler';
describe('Auth Middleware', () => {
    let mockReq;
    let mockRes;
    let next;
    beforeEach(() => {
        mockReq = { headers: {} };
        mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        next = jest.fn();
    });
    describe('authenticate', () => {
        it('should attach user when valid token provided', async () => {
            // Mock db.get user by token
            const db = require('../src/config/database');
            db.get = jest.fn().mockResolvedValue({ id: 'user123', email: 'test@example.com', role: 'customer' });
            // Mock jwt.verify
            const jwt = require('jsonwebtoken');
            jwt.verify = jest.fn().mockReturnValue({ userId: 'user123' });
            mockReq.headers.authorization = 'Bearer validtoken';
            await authenticate(mockReq, mockRes, next);
            expect(mockReq.user).toBeDefined();
            expect(mockReq.user.id).toBe('user123');
            expect(next).toHaveBeenCalled();
        });
        it('should reject when no token', async () => {
            await authenticate(mockReq, mockRes, next);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: 'No token provided' }));
        });
        it('should reject invalid token', async () => {
            const jwt = require('jsonwebtoken');
            jwt.verify = jest.fn().mockImplementation(() => { throw new Error('Invalid token'); });
            mockReq.headers.authorization = 'Bearer invalid';
            await authenticate(mockReq, mockRes, next);
            expect(mockRes.status).toHaveBeenCalledWith(401);
        });
    });
    describe('authorize', () => {
        it('should allow admin role', async () => {
            mockReq.user = { role: 'admin' };
            await authorize(['admin'])(mockReq, mockRes, next);
            expect(next).toHaveBeenCalled();
        });
        it('should allow customer role', async () => {
            mockReq.user = { role: 'customer' };
            await authorize(['customer'])(mockReq, mockRes, next);
            expect(next).toHaveBeenCalled();
        });
        it('should reject unauthorized role', async () => {
            mockReq.user = { role: 'customer' };
            await authorize(['admin'])(mockReq, mockRes, next);
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: 'FORBIDDEN' }));
        });
    });
});
describe('Error Handler Middleware', () => {
    let mockReq;
    let mockRes;
    let next;
    beforeEach(() => {
        mockReq = {};
        mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        next = jest.fn();
    });
    it('should handle known errors with status code', () => {
        const err = new Error('Validation error');
        // @ts-ignore
        err.statusCode = 400;
        // @ts-ignore
        err.errorCode = 'VALIDATION_ERROR';
        errorHandler(err, mockReq, mockRes, next);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Validation error',
        }));
    });
    it('should handle default 500 for unknown errors', () => {
        const err = new Error('Unknown');
        errorHandler(err, mockReq, mockRes, next);
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
        }));
    });
    it('should not leak stack trace in production', () => {
        const err = new Error('Test error');
        // @ts-ignore
        process.env.NODE_ENV = 'production';
        errorHandler(err, mockReq, mockRes, next);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            // no stack
        }));
        // @ts-ignore
        process.env.NODE_ENV = 'test';
    });
});
