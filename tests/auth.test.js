import request from 'supertest';
import app from '../src/app';
import { ensureDBConnected, ensureTestData, getAdminToken } from './setup';
describe('Auth API', () => {
    let adminToken;
    let userToken;
    let testEmail;
    const testPassword = 'TestPass123!';
    beforeAll(async () => {
        await ensureDBConnected();
        await ensureTestData();
        // Get admin token for admin-only tests
        adminToken = await getAdminToken();
        // Create a test user for authenticated tests
        testEmail = `test-${Date.now()}@example.com`;
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: testEmail, password: testPassword, name: 'Test User' });
        if (res.body.success) {
            userToken = res.body.data.token;
        }
        else {
            // If user already exists (unlikely), try to login
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: testEmail, password: testPassword });
            if (loginRes.body.success) {
                userToken = loginRes.body.data.token;
            }
        }
    });
    describe('Registration', () => {
        it('should register a new user', async () => {
            const newEmail = `new-${Date.now()}@example.com`;
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: newEmail, password: 'Password123!', name: 'New User' });
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
        });
        it('should reject duplicate email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: testEmail, password: 'AnotherPass123!', name: 'Duplicate' });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Email already registered');
        });
        it('should reject invalid input', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'invalid', password: '123', full_name: '' });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });
    describe('Authentication', () => {
        it('should login with correct credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: testEmail, password: testPassword });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
        });
        it('should reject wrong password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: testEmail, password: 'wrongpass' });
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Invalid credentials');
        });
        it('should reject non-existent user', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'nonexistent@example.com', password: 'password' });
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });
    describe('Protected Routes', () => {
        it('should get current user with valid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe(testEmail);
        });
        it('should reject request without token', async () => {
            const res = await request(app)
                .get('/api/auth/me');
            expect(res.status).toBe(401);
        });
        it('should reject request with invalid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token');
            expect(res.status).toBe(401);
        });
    });
    describe('Token Refresh', () => {
        it('should refresh token with valid refresh token', async () => {
            // Get refresh token by logging in again (assuming we stored it)
            // For simplicity, we'll login again
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: testEmail, password: testPassword });
            const refreshToken = loginRes.body.data.refreshToken;
            const res = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data).toHaveProperty('refreshToken');
        });
        it('should reject invalid refresh token', async () => {
            const res = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken: 'invalid-refresh-token' });
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });
    describe('Admin Access', () => {
        it('should access admin dashboard with admin token', async () => {
            const res = await request(app)
                .get('/api/admin/dashboard/stats')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.stats).toHaveProperty('total_revenue');
        });
        it('should reject non-admin accessing admin route', async () => {
            const res = await request(app)
                .get('/api/admin/dashboard/stats')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('FORBIDDEN');
        });
    });
});
