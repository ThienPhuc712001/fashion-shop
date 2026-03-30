import request from 'supertest';
import app from '../src/app';
import db from '../src/config/database';
import { ensureDBConnected, ensureTestData, getAdminToken, getTestIds } from './setup';
describe('Admin Dashboard API', () => {
    let adminToken;
    beforeAll(async () => {
        await ensureDBConnected();
        await ensureTestData();
        adminToken = await getAdminToken();
        // Create a test order to populate data
        await createTestOrder();
    });
    afterAll(async () => {
        await db.close();
    });
    const createTestOrder = async () => {
        const ids = await getTestIds();
        const sessionRes = await request(app).post('/api/cart/session');
        const sessionToken = sessionRes.body.data.session_token;
        await request(app)
            .post('/api/cart/items')
            .set('x-cart-token', sessionToken)
            .send({
            variant_id: ids.variant_id,
            quantity: 1,
        });
        await request(app)
            .post('/api/orders')
            .set('x-cart-token', sessionToken)
            .send({
            email: 'dashboard-test@example.com',
            shipping_address: {
                full_name: 'Dashboard Test',
                phone: '0901234567',
                address: '123 Test St',
                city: 'Hanoi',
                district: 'Hoan Kiem',
                ward: 'Hang Bac',
                postal_code: '100000',
            },
            shipping_method: 'standard',
            payment_method: 'cod',
        });
    };
    describe('Dashboard Stats', () => {
        it('should return overview stats', async () => {
            const res = await request(app)
                .get('/api/admin/dashboard/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('period');
            expect(res.body.data).toHaveProperty('ordersByStatus');
            expect(res.body.data).toHaveProperty('topProducts');
            expect(res.body.data).toHaveProperty('topCategories');
            expect(res.body.data).toHaveProperty('salesTrend');
            expect(res.body.data).toHaveProperty('recentOrders');
            expect(res.body.data).toHaveProperty('lowStock');
            expect(res.body.data).toHaveProperty('customerStats');
        });
    });
    describe('Sales Report', () => {
        it('should return sales report with date range', async () => {
            const today = new Date();
            const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const res = await request(app)
                .get('/api/admin/dashboard/sales-report')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                start_date: lastWeek.toISOString().split('T')[0],
                end_date: today.toISOString().split('T')[0],
                group_by: 'day',
            })
                .expect(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('period');
            expect(res.body.data.period).toHaveProperty('start_date');
            expect(res.body.data.period).toHaveProperty('group_by', 'day');
            expect(res.body.data).toHaveProperty('summary');
            expect(res.body.data).toHaveProperty('report');
            expect(Array.isArray(res.body.data.report)).toBe(true);
        });
        it('should group by month', async () => {
            const today = new Date();
            const lastYear = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
            const res = await request(app)
                .get('/api/admin/dashboard/sales-report')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                start_date: lastYear.toISOString().split('T')[0],
                end_date: today.toISOString().split('T')[0],
                group_by: 'month',
            })
                .expect(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.period.group_by).toBe('month');
        });
    });
    describe('Product Performance', () => {
        it('should return product performance metrics', async () => {
            const res = await request(app)
                .get('/api/admin/dashboard/product-performance')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ limit: 10 })
                .expect(200);
            expect(res.body).toHaveProperty('success', true);
            expect(Array.isArray(res.body.data)).toBe(true);
            if (res.body.data.length > 0) {
                const p = res.body.data[0];
                expect(p).toHaveProperty('id');
                expect(p).toHaveProperty('name');
                expect(p).toHaveProperty('sold_quantity');
                expect(p).toHaveProperty('total_revenue');
            }
        });
    });
    describe('Inventory Status', () => {
        it('should return inventory status', async () => {
            const res = await request(app)
                .get('/api/admin/dashboard/inventory')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('summary');
            expect(res.body.data).toHaveProperty('items');
            expect(res.body.data.summary).toHaveProperty('total_variants');
            expect(res.body.data.summary).toHaveProperty('low_stock_count');
            expect(res.body.data.summary).toHaveProperty('out_of_stock_count');
        });
    });
    describe('Recent Orders', () => {
        it('should return recent orders list', async () => {
            const res = await request(app)
                .get('/api/admin/dashboard/recent-orders')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ limit: 5 })
                .expect(200);
            expect(res.body).toHaveProperty('success', true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body).toHaveProperty('pagination');
            if (res.body.data.length > 0) {
                const o = res.body.data[0];
                expect(o).toHaveProperty('id');
                expect(o).toHaveProperty('order_number');
                expect(o).toHaveProperty('status');
            }
        });
    });
});
