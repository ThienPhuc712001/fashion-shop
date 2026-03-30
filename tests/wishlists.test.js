import request from 'supertest';
import app from '../src/app';
import db from '../src/config/database';
import { ensureDBConnected, ensureTestData, getTestIds, registerTestUser } from './setup';
describe('Wishlists API', () => {
    let userToken;
    let productId;
    beforeAll(async () => {
        await ensureDBConnected();
        await ensureTestData();
        const user = await registerTestUser(`wishlist-user-${Date.now()}@example.com`, 'TestPass123!', 'Wishlist User');
        userToken = user.token;
        const ids = await getTestIds();
        productId = ids.product_id;
    });
    afterAll(async () => {
        await db.close();
    });
    describe('Wishlist Management', () => {
        it('should add product to wishlist', async () => {
            const res = await request(app)
                .post('/api/wishlists')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ product_id: productId })
                .expect(201);
            expect(res.body.success).toBe(true);
        });
        it('should not add duplicate', async () => {
            const res = await request(app)
                .post('/api/wishlists')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ product_id: productId })
                .expect(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Product already in wishlist');
        });
        it('should list wishlist products', async () => {
            const res = await request(app)
                .get('/api/wishlists')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.wishlists)).toBe(true);
        });
        it('should remove product from wishlist', async () => {
            // Get wishlist item ID
            const listRes = await request(app)
                .get('/api/wishlists')
                .set('Authorization', `Bearer ${userToken}`);
            if (listRes.body.data.wishlists.length > 0) {
                const itemId = listRes.body.data.wishlists[0].id;
                const res = await request(app)
                    .delete(`/api/wishlists/${itemId}`)
                    .set('Authorization', `Bearer ${userToken}`)
                    .expect(200);
                expect(res.body.success).toBe(true);
            }
        });
    });
});
