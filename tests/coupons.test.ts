import request from 'supertest';
import app from '../src/app';
import db from '../src/config/database';
import { testUsers, ensureDBConnected, ensureTestData, getAdminToken, getTestIds } from './setup';

describe('Coupons API', () => {
  let adminToken: string;

  beforeAll(async () => {
    await ensureDBConnected();
    await ensureTestData();
    adminToken = await getAdminToken();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('Coupon Management (Admin)', () => {
    it('should create percentage coupon', async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const code = `PCT${Date.now()}`;

      const res = await request(app)
        .post('/api/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code,
          description: '10% discount test',
          discount_type: 'percentage',
          discount_value: 10,
          min_order_amount: 100000,
          max_discount_amount: 50000,
          usage_limit: 100,
          per_user_limit: 1,
          valid_from: now.toISOString(),
          valid_to: future.toISOString(),
        })
        .expect(201);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('code', code);
    });

    it('should create fixed amount coupon', async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const code = `FIX${Date.now()}`;

      const res = await request(app)
        .post('/api/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code,
          description: '50k discount',
          discount_type: 'fixed',
          discount_value: 50000,
          min_order_amount: 200000,
          usage_limit: 50,
          valid_from: now.toISOString(),
          valid_to: future.toISOString(),
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('code');
    });

    it('should list coupons with pagination', async () => {
      const res = await request(app)
        .get('/api/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined(); // array of coupons
      expect(res.body.pagination).toBeDefined();
    });

    it('should update coupon', async () => {
      const listRes = await request(app)
        .get('/api/coupons')
        .set('Authorization', `Bearer ${adminToken}`);

      // Expect at least one coupon exists
      if (listRes.body.data.length === 0) {
        // Create a temp coupon
        const now = new Date();
        const future = new Date(now.getTime() + 86400000);
        const createRes = await request(app)
          .post('/api/coupons')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            code: `TEMP${Date.now()}`,
            discount_type: 'fixed',
            discount_value: 10000,
            valid_from: now.toISOString(),
            valid_to: future.toISOString(),
          });
        var couponId = createRes.body.data.id;
      } else {
        var couponId = listRes.body.data[0].id;
      }

      const res = await request(app)
        .put(`/api/coupons/${couponId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Updated description',
          usage_limit: 200,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Coupon updated');
    });

    it('should delete coupon', async () => {
      // Create a temp coupon to delete
      const now = new Date();
      const future = new Date(now.getTime() + 86400000);
      const code = `TEMP-DELETE-${Date.now()}`;

      const createRes = await request(app)
        .post('/api/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code,
          discount_type: 'fixed',
          discount_value: 10000,
          valid_from: now.toISOString(),
          valid_to: future.toISOString(),
        });

      const couponId = createRes.body.data.id;

      const res = await request(app)
        .delete(`/api/coupons/${couponId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('Coupon Validation', () => {
    let validCouponCode: string;

    beforeAll(async () => {
      // Create a fresh valid coupon for validation tests
      const now = new Date();
      const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const code = `VALID10-${Date.now()}`;

      const couponRes = await request(app)
        .post('/api/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code,
          description: 'Valid 10%',
          discount_type: 'percentage',
          discount_value: 10,
          min_order_amount: 100000,
          valid_from: now.toISOString(),
          valid_to: future.toISOString(),
          usage_limit: 10,
        });

      validCouponCode = couponRes.body.data.code;
    });

    it('should validate valid coupon and calculate discount', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .send({
          code: validCouponCode,
          order_amount: 500000,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('coupon_id');
      expect(res.body.data).toHaveProperty('code', validCouponCode);
      expect(res.body.data).toHaveProperty('discount_type', 'percentage');
      expect(res.body.data).toHaveProperty('calculated_discount');
      expect(res.body.data).toHaveProperty('final_amount');
      // 10% of 500000 = 50000
      expect(res.body.data.calculated_discount).toBe(50000);
      expect(res.body.data.final_amount).toBe(450000);
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .send({ code: validCouponCode }) // missing order_amount
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Code and order_amount are required');
    });

    it('should reject coupon below minimum order amount', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .send({
          code: validCouponCode,
          order_amount: 50000, // Below min 100000
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Minimum order amount');
    });

    it('should reject non-existent coupon', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .send({
          code: `NONEXIST-${Date.now()}`,
          order_amount: 100000,
        })
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it('should respect max discount for percentage coupon', async () => {
      // Create coupon with max discount
      const now = new Date();
      const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const code = `MAXDISC-${Date.now()}`;

      const couponRes = await request(app)
        .post('/api/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code,
          discount_type: 'percentage',
          discount_value: 50, // 50%
          min_order_amount: 0,
          max_discount_amount: 100000, // cap at 100k
          valid_from: now.toISOString(),
          valid_to: future.toISOString(),
        });

      // order_amount = 1000000 -> 50% = 500000 but max is 100000
      const res = await request(app)
        .post('/api/coupons/validate')
        .send({
          code,
          order_amount: 1000000,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.calculated_discount).toBe(100000);
      expect(res.body.data.final_amount).toBe(900000);
    });

    it.skip('should enforce usage limit', async () => {
      // Create coupon with usage limit = 1 (already used from previous tests)
      // For simplicity skip this test or implement proper usage tracking reset
    });
  });

  // Apply Coupon to Order tests skipped due to order creation dependency
  // These require a fully working order flow with proper validation
  // Will implement after order tests are stable
});
