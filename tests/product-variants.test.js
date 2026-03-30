import request from 'supertest';
import app from '../src/app';
import db from '../src/config/database';
import { ensureDBConnected, ensureTestData, getTestIds } from './setup';
describe('Product Variants API', () => {
    let adminToken;
    let productId; // UUID
    beforeAll(async () => {
        await ensureDBConnected();
        await ensureTestData();
        // Get existing product from seed
        const ids = await getTestIds();
        productId = ids.product_id; // UUID
        // Login admin
        const adminLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@test.com', password: 'Admin123!' });
        adminToken = adminLogin.body.data.token;
    });
    afterAll(async () => {
        await db.close();
    });
    describe('POST /api/products/:id/variants', () => {
        it('should add variant to product', async () => {
            const res = await request(app)
                .post(`/api/products/${productId}/variants`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                sku: `TEST-${Date.now()}`,
                size: 'XXL',
                color_name: 'Yellow',
                stock_quantity: 25,
                price_adjustment: 5000,
            })
                .expect(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('variant');
            expect(res.body.data.variant).toHaveProperty('sku');
        });
        it('should reject duplicate SKU', async () => {
            const sku = `DUP-${Date.now()}`;
            // First
            await request(app)
                .post(`/api/products/${productId}/variants`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ sku, size: 'M', color_name: 'Red', stock_quantity: 10 });
            // Duplicate
            const res = await request(app)
                .post(`/api/products/${productId}/variants`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ sku, size: 'L', color_name: 'Blue', stock_quantity: 5 })
                .expect(400);
            expect(res.body.success).toBe(false);
        });
    });
    describe('PUT /api/products/:id/variants/:variantId', () => {
        let variantId;
        it('should create temp variant then update it', async () => {
            const createRes = await request(app)
                .post(`/api/products/${productId}/variants`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                sku: `TMP-${Date.now()}`,
                size: 'M',
                color_name: 'Green',
                stock_quantity: 10,
            });
            variantId = createRes.body.data.variant.id;
            const res = await request(app)
                .put(`/api/products/${productId}/variants/${variantId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                stock_quantity: 50,
                price_adjustment: 2000,
            })
                .expect(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.variant.stock_quantity).toBe(50);
        });
    });
    describe('DELETE /api/products/:id/variants/:variantId', () => {
        let variantId;
        it('should delete variant', async () => {
            const createRes = await request(app)
                .post(`/api/products/${productId}/variants`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                sku: `DEL-${Date.now()}`,
                size: 'S',
                color_name: 'Pink',
                stock_quantity: 5,
            });
            variantId = createRes.body.data.variant.id;
            const res = await request(app)
                .delete(`/api/products/${productId}/variants/${variantId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(res.body.success).toBe(true);
        });
    });
});
