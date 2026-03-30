import request from 'supertest';
import app from '../src/app';
import { ensureDBConnected } from './setup';
describe('Health Check', () => {
    beforeAll(async () => {
        await ensureDBConnected();
    });
    it('GET /health should return 200 and healthy status', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'healthy');
        expect(res.body).toHaveProperty('database', 'healthy');
    });
});
