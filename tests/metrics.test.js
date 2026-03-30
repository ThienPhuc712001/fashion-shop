import request from 'supertest';
import app from '../src/app';
import { ensureDBConnected } from './setup';
describe('Metrics & Health API', () => {
    beforeAll(async () => {
        await ensureDBConnected();
    });
    it('should return health status', async () => {
        const res = await request(app).get('/health').expect(200);
        expect(res.body.status).toBe('healthy');
    });
    it('should return metrics (if implemented)', async () => {
        const res = await request(app).get('/api/metrics').expect(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('uptime');
        expect(res.body.data).toHaveProperty('memory');
    });
});
