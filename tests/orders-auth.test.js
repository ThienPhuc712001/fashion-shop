import request from 'supertest';
import app from '../src/app';
import db from '../src/config/database';
import { ensureDBConnected, ensureTestData, getTestIds, registerTestUser } from './setup';
describe('Orders API - Authenticated', () => {
    let userToken;
    let productId;
    let variantId;
    beforeAll(async () => {
        await ensureDBConnected();
        await ensureTestData();
        const user = await registerTestUser(`auth-order-${Date.now()}@example.com`, 'Pass123!', 'AuthOrder');
        userToken = user.token;
        const ids = await getTestIds();
        productId = ids.product_id;
        variantId = ids.variant_id;
    });
    afterAll(async () => {
        await db.close();
    });
    const createAuthenticatedOrder = async (token) => {
        const sessionRes = await request(app).post('/api/cart/session');
        const sessionToken = sessionRes.body.data.session_token;
        await request(app)
            .post('/api/cart/items')
            .set('x-cart-token', sessionToken)
            .send({ variant_id: variantId, quantity: 1 });
        const res = await request(app)
            .post('/api/orders')
            .set('x-cart-token', sessionToken)
            .set('Authorization', `Bearer ${token}`)
            .send({
            shipping_address: {
                full_name: 'Auth User',
                phone: '0901234567',
                address: '123 Auth St',
                city: 'Hanoi',
                district: 'Hoan Kiem',
                ward: 'Hang Bac',
                postal_code: '100000',
            },
            shipping_method: 'standard',
            payment_method: 'cod',
        });
        return res;
    };
    it('should create order with authenticated user', async () => {
        const res = await createAuthenticatedOrder(userToken);
        expect(res.body.success).toBe(true);
        expect(res.body.data.order).toHaveProperty('id');
        expect(res.body.data.order).toHaveProperty('user_id'); // should have user_id
    });
    it('should list orders for authenticated user', async () => {
        // Create order first
        await createAuthenticatedOrder(userToken);
        const res = await request(app)
            .get('/api/orders')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.orders)).toBe(true);
        expect(res.body.data.orders.length).toBeGreaterThan(0);
    });
    it('should get own order by number', async () => {
        const orderRes = await createAuthenticatedOrder(userToken);
        const orderNumber = orderRes.body.data.order.order_number;
        const getRes = await request(app)
            .get(`/api/orders/${orderNumber}`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);
        expect(getRes.body.success).toBe(true);
        expect(getRes.body.data.order.order_number).toBe(orderNumber);
    });
});
