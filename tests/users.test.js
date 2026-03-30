import request from 'supertest';
import app from '../src/app';
import db from '../src/config/database';
import { ensureDBConnected, ensureTestData, registerTestUser } from './setup';
describe('Users API', () => {
    let userToken;
    beforeAll(async () => {
        await ensureDBConnected();
        await ensureTestData();
        const user = await registerTestUser(`profile-user-${Date.now()}@example.com`, 'TestPass123!', 'Profile User');
        userToken = user.token;
    });
    afterAll(async () => {
        await db.close();
    });
    describe('GET /api/users/me', () => {
        it('should get current user profile', async () => {
            const res = await request(app)
                .get('/api/users/me')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user).toHaveProperty('email');
            expect(res.body.data.user).toHaveProperty('full_name');
            expect(res.body.data.user).toHaveProperty('role');
        });
        it('should reject without token', async () => {
            const res = await request(app).get('/api/users/me').expect(401);
            expect(res.body.success).toBe(false);
        });
    });
    describe('PUT /api/users/me', () => {
        it('should update user profile', async () => {
            const newName = 'Updated Name ' + Date.now();
            const res = await request(app)
                .put('/api/users/me')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ full_name: newName })
                .expect(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.full_name).toBe(newName);
        });
        it('should reject invalid data', async () => {
            const res = await request(app)
                .put('/api/users/me')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ email: 'invalid-email' })
                .expect(400);
            expect(res.body.success).toBe(false);
        });
    });
    describe('Addresses', () => {
        it('should create address', async () => {
            const res = await request(app)
                .post('/api/addresses')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                label: 'Home',
                recipient_name: 'Test User',
                phone: '0901234567',
                province: 'Hanoi',
                district: 'Hoan Kiem',
                ward: 'Hang Bac',
                street_address: '123 Test St',
                is_default: true,
            })
                .expect(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.address).toHaveProperty('id');
        });
        it('should list addresses', async () => {
            const res = await request(app)
                .get('/api/addresses')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.addresses)).toBe(true);
        });
    });
});
