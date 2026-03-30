import request from 'supertest';
import app from '../src/app';
import db from '../src/config/database';
import { getAdminToken } from './setup';
describe('Webhooks API', () => {
    let adminToken;
    beforeAll(async () => {
        await getAdminToken().then(t => adminToken = t);
    });
    afterAll(async () => {
        await db.close();
    });
    it('should list webhooks', async () => {
        const res = await request(app)
            .get('/api/admin/webhooks')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.webhooks)).toBe(true);
    });
    it('should create webhook', async () => {
        const res = await request(app)
            .post('/api/admin/webhooks')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            name: 'Test Webhook',
            url: 'https://example.com/webhook',
            events: ['order.created', 'order.updated'],
            secret: 'test-secret',
        })
            .expect(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id');
    });
    it('should trigger webhook (manual test only)', async () => {
        // skip actual network call in tests
    }).skip;
});
