import request from 'supertest';
import app from '../src/app';
import db from '../src/config/database';
import { ensureDBConnected, ensureTestData, getTestIds, registerTestUser } from './setup';
describe('Orders API', () => {
    let customerToken;
    let testProductId;
    let testVariantId;
    let orderId;
    let orderNumber;
    beforeAll(async () => {
        await ensureDBConnected();
        await ensureTestData();
        // Register user
        const user = await registerTestUser(`order-user-${Date.now()}@example.com`, 'TestPass123!', 'Order User');
        customerToken = user.token;
        // Get test product/variant
        const ids = await getTestIds();
        testProductId = ids.product_id;
        testVariantId = ids.variant_id;
    });
    afterAll(async () => {
        await db.close();
    });
    const createOrder = async (token, email) => {
        const sessionRes = await request(app).post('/api/cart/session');
        const sessionToken = sessionRes.body.data.session_token;
        await request(app)
            .post('/api/cart/items')
            .set('x-cart-token', sessionToken)
            .send({
            variant_id: testVariantId,
            quantity: 1,
        });
        const body = {
            shipping_address: {
                full_name: 'Test User',
                phone: '0901234567',
                address: '123 Test St',
                city: 'Hanoi',
                district: 'Hoan Kiem',
                ward: 'Hang Bac',
                postal_code: '100000',
            },
            shipping_method: 'standard',
            payment_method: 'cod',
        };
        if (email)
            body.email = email;
        const res = await request(app)
            .post('/api/orders')
            .set('x-cart-token', sessionToken)
            .set('Authorization', token ? `Bearer ${token}` : undefined)
            .send(body);
        return res;
    };
    describe('Create Order', () => {
        it('should create guest order with email', async () => {
            const res = await createOrder(undefined, 'guest@example.com');
            expect(res.body.success).toBe(true);
            expect(res.body.data.order).toHaveProperty('id');
            expect(res.body.data.order).toHaveProperty('order_number');
            orderId = res.body.data.order.id;
            orderNumber = res.body.data.order.order_number;
        });
        it('should create authenticated user order (if endpoint supports)', async () => {
            // Currently POST /api/orders requires email for guest; if user logged in, email optional
            const res = await createOrder(customerToken);
            expect(res.body.success).toBe(true);
        });
    });
    describe('Get Order', () => {
        it('should get order by number for guest (by order number only)', async () => {
            // Assuming getOrderByNumber allows guest access with order number
            const res = await request(app)
                .get(`/api/orders/${orderNumber}`)
                .expect(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.order.order_number).toBe(orderNumber);
        });
        it('should return 404 for non-existent order', async () => {
            const res = await request(app).get('/api/orders/INVALID123').expect(404);
            expect(res.body.success).toBe(false);
        });
    });
    describe('List Orders', () => {
        it('should list orders for authenticated user', async () => {
            // Need to have orders belonging to this user
            // Create another order as authenticated
            await createOrder(customerToken);
            const res = await request(app)
                .get('/api/orders')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.orders)).toBe(true);
        });
    });
    describe('Order Validation', () => {
        it('should reject order without required fields', async () => {
            const sessionRes = await request(app).post('/api/cart/session');
            const token = sessionRes.body.data.session_token;
            const res = await request(app)
                .post('/api/orders')
                .set('x-cart-token', token)
                .send({}) // empty
                .expect(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Missing required checkout fields');
        });
        it('should reject order with empty cart', async () => {
            const sessionRes = await request(app).post('/api/cart/session');
            const token = sessionRes.body.data.session_token;
            const res = await request(app)
                .post('/api/orders')
                .set('x-cart-token', token)
                .send({
                email: 'empty@example.com',
                shipping_address: {
                    full_name: ' Empty',
                    phone: '0123456789',
                    address: 'Addr',
                    city: 'HCM',
                    district: 'District 1',
                    ward: 'Ward 1',
                    postal_code: '10000',
                },
                shipping_method: 'standard',
                payment_method: 'cod',
            })
                .expect(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Cart is empty');
        });
    });
});
