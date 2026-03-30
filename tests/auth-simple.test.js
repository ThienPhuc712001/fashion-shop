import request from 'supertest';
import app from '../src/app';
import { ensureDBConnected, ensureTestData } from './setup';
describe('Auth Simple', () => {
    beforeAll(async () => {
        await ensureDBConnected();
        await ensureTestData();
    });
    it('register new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'test1@test.com', password: 'Pass123!', name: 'Test1' });
        console.log('Status:', res.status);
        console.log('Body:', res.body);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('token');
    });
});
