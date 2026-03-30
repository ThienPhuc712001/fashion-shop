import request from 'supertest';
import app from '../src/app';
import db from '../src/config/database';
import { ensureDBConnected } from './setup';
describe('Global Error & Edge Cases', () => {
    beforeAll(async () => {
        await ensureDBConnected();
    });
    afterAll(async () => {
        await db.close();
    });
    describe('404 Not Found', () => {
        it('should return 404 for unknown route', async () => {
            const res = await request(app).get('/api/unknown-route-xyz').expect(404);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Not Found');
        });
    });
    describe('Method Not Allowed', () => {
        it('should return 405 for wrong method', async () => {
            const res = await request(app).post('/api/products/123/variants').expect(405);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Method Not Allowed');
        });
    });
    describe('Validation Errors', () => {
        it('should return 400 for invalid JSON', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .set('Content-Type', 'application/json')
                .send('invalid-json')
                .expect(400);
            expect(res.body.success).toBe(false);
        });
        it('should return 400 for missing required fields', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@example.com' }) // missing password, name
                .expect(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBeDefined();
        });
    });
    describe('SQL Injection Protection', () => {
        it('should safely handle SQL injection attempt in search', async () => {
            const res = await request(app)
                .get('/api/products')
                .query({ search: "'; DROP TABLE users; --" })
                .expect(200);
            expect(res.body.success).toBe(true);
            // Should not crash or drop table
        });
    });
    describe('Rate Limiting (if implemented)', () => {
        it('should throttle excessive requests' /*, async () => {
          // If rate limit is enabled, this would eventually return 429
          for (let i = 0; i < 100; i++) {
            await request(app).get('/api/products?limit=1');
          }
          const res = await request(app).get('/api/products?limit=1');
          // expect(res.status).toBe(429);
        }*/).skip; // Skip if not implemented
    });
    describe('CORS Headers', () => {
        it('should include CORS headers in response', async () => {
            const res = await request(app)
                .options('/api/products')
                .set('Origin', 'https://example.com')
                .set('Access-Control-Request-Method', 'GET');
            expect(res.status).toBe(204);
            expect(res.header['access-control-allow-origin']).toMatch(/example\.com/);
        });
    });
    describe('Database Connection Errors', () => {
        it('should handle DB connection failure gracefully', async () => {
            // Simulate DB failure by closing connection before request
            await db.close();
            try {
                const res = await request(app).get('/health');
                expect(res.status).toBe(500); // Should report unhealthy
            }
            finally {
                // Reconnect for other tests
                await db.connect();
                await db.createTables();
            }
        });
    });
});
