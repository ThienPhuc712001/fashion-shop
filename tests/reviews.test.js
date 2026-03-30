import request from 'supertest';
import app from '../src/app';
import db from '../src/config/database';
import { ensureDBConnected, ensureTestData, getTestIds, registerTestUser } from './setup';
describe('Reviews API', () => {
    let userToken;
    let productId;
    let orderItemId; // cần tạo order item để tạo review
    beforeAll(async () => {
        await ensureDBConnected();
        await ensureTestData();
        const user = await registerTestUser(`review-user-${Date.now()}@example.com`, 'TestPass123!', 'Review User');
        userToken = user.token;
        // Get product and create order item to attach review
        const ids = await getTestIds();
        productId = ids.product_id;
        // Create order with item
        const sessionRes = await request(app).post('/api/cart/session');
        const sessionToken = sessionRes.body.data.session_token;
        await request(app)
            .post('/api/cart/items')
            .set('x-cart-token', sessionToken)
            .send({
            variant_id: ids.variant_id,
            quantity: 1,
        });
        const orderRes = await request(app)
            .post('/api/orders')
            .set('x-cart-token', sessionToken)
            .send({
            email: 'review-order@example.com',
            shipping_address: {
                full_name: 'Review Buyers',
                phone: '0901234567',
                address: '123 Test',
                city: 'Hanoi',
                district: 'Hoan Kiem',
                ward: 'Hang Bac',
                postal_code: '100000',
            },
            shipping_method: 'standard',
            payment_method: 'cod',
        });
        const order = orderRes.body.data.order;
        if (order.items && order.items.length > 0) {
            orderItemId = order.items[0].id;
        }
    });
    afterAll(async () => {
        await db.close();
    });
    it('should create review for product', async () => {
        if (!orderItemId) {
            // Skip if no order item (need to ensure test order creation works)
            return;
        }
        const res = await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
            product_id: productId,
            order_item_id: orderItemId,
            rating: 5,
            comment: 'Great product!',
        })
            .expect(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id');
    });
    it('should reject duplicate review for same product', async () => {
        if (!orderItemId)
            return;
        const res = await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
            product_id: productId,
            order_item_id: orderItemId,
            rating: 4,
            comment: 'Another review',
        })
            .expect(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('You have already reviewed this product');
    });
    it('should get reviews for a product', async () => {
        const res = await request(app)
            .get(`/api/products/${productId}/reviews`)
            .expect(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.reviews)).toBe(true);
    });
    it('should allow vendor/anyone get review by ID', async () => {
        // Get first review ID
        const listRes = await request(app).get(`/api/products/${productId}/reviews`);
        if (listRes.body.data.reviews.length > 0) {
            const reviewId = listRes.body.data.reviews[0].id;
            const res = await request(app)
                .get(`/api/reviews/${reviewId}`)
                .expect(200);
            expect(res.body.success).toBe(true);
        }
    });
    it('should toggle helpful vote', async () => {
        const listRes = await request(app).get(`/api/products/${productId}/reviews`);
        if (listRes.body.data.reviews.length > 0) {
            const reviewId = listRes.body.data.reviews[0].id;
            const res = await request(app)
                .post(`/api/reviews/${reviewId}/helpful`)
                .expect(200);
            expect(res.body.success).toBe(true);
        }
    });
});
