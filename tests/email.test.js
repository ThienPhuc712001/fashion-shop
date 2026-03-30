import request from 'supertest';
import app from '../src/app';
import db from '../src/config/database';
import { getAdminToken } from './setup';
describe('Email Service', () => {
    let adminToken;
    beforeAll(async () => {
        adminToken = await getAdminToken();
    });
    afterAll(async () => {
        await db.close();
    });
    it('should send test email (if configured)', async () => {
        // This test requires SMTP configured in .env
        // Skip if no email provider
        const res = await request(app)
            .post('/api/admin/email/test')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        expect(res.body.success).toBe(true);
    });
});
