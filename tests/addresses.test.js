import request from 'supertest';
import app from '../src/app';
import db from '../src/config/database';
import { ensureDBConnected, ensureTestData, registerTestUser } from './setup';
describe('Addresses API', () => {
    let userToken;
    let addressId;
    beforeAll(async () => {
        await ensureDBConnected();
        await ensureTestData();
        const user = await registerTestUser(`addr-user-${Date.now()}@example.com`, 'TestPass123!', 'Addr User');
        userToken = user.token;
    });
    afterAll(async () => {
        await db.close();
    });
    describe('Address CRUD', () => {
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
            addressId = res.body.data.address.id;
        });
        it('should list addresses', async () => {
            const res = await request(app)
                .get('/api/addresses')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.addresses)).toBe(true);
        });
        it('should update address', async () => {
            const res = await request(app)
                .put(`/api/addresses/${addressId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                label: 'Work',
                phone: '0987654321',
            })
                .expect(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.address.label).toBe('Work');
        });
        it('should set default address', async () => {
            // Create second address
            const secondRes = await request(app)
                .post('/api/addresses')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                label: 'Other',
                recipient_name: 'Other User',
                phone: '0123456789',
                province: 'HCM',
                district: 'District 1',
                ward: 'Ben Nghe',
                street_address: '456 Other St',
                is_default: false,
            });
            const secondId = secondRes.body.data.address.id;
            const res = await request(app)
                .post(`/api/addresses/${secondId}/set-default`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);
            expect(res.body.success).toBe(true);
        });
        it('should delete address', async () => {
            const res = await request(app)
                .delete(`/api/addresses/${addressId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);
            expect(res.body.success).toBe(true);
        });
    });
});
