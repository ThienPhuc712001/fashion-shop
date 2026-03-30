import request from 'supertest';
import app from '../src/app';
import db from '../src/config/database';
import { ensureDBConnected, ensureTestData, getTestIds, registerTestUser } from './setup';

describe('Products API', () => {
  let adminToken: string;
  let customerToken: string;
  let testCategoryId: string;
  let testBrandId: string;

  beforeAll(async () => {
    await ensureDBConnected();
    await ensureTestData();

    // Get valid category and brand IDs
    const ids = await getTestIds();
    testCategoryId = ids.category_id;
    testBrandId = ids.brand_id;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'Admin123!',
      });
    adminToken = adminLogin.body.data.token;

    const customer = await registerTestUser(
      `customer-${Date.now()}@example.com`,
      'TestPass123!',
      'Test Customer'
    );
    customerToken = customer.token;
  });

  afterAll(async () => {
    await db.close();
  });

  describe('GET /api/products', () => {
    it('should list products with pagination', async () => {
      const res = await request(app).get('/api/products').query({ page: 1, limit: 10 }).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products).toBeDefined();
      expect(Array.isArray(res.body.data.products)).toBe(true);
      expect(res.body.data.pagination.page).toBe(1);
    });

    it('should filter products by category', async () => {
      const res = await request(app).get('/api/products').query({ category_id: testCategoryId }).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products).toEqual(expect.arrayContaining([expect.objectContaining({ category_id: testCategoryId })]));
    });

    it('should search products by name', async () => {
      const res = await request(app).get('/api/products').query({ search: 'áo' }).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products).toBeDefined();
    });

    it('should sort products', async () => {
      const res = await request(app).get('/api/products').query({ sort_by: 'base_price', sort_order: 'desc' }).expect(200);
      expect(res.body.success).toBe(true);
      const products = res.body.data.products;
      if (products.length > 1) {
        for (let i = 1; i < products.length; i++) {
          expect(products[i - 1].base_price).toBeGreaterThanOrEqual(products[i].base_price);
        }
      }
    });
  });

  describe('GET /api/products/:id', () => {
    it('should get product by ID', async () => {
      const list = await request(app).get('/api/products?limit=1');
      const productId = list.body.data.products[0].id;
      const res = await request(app).get(`/api/products/${productId}`).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', productId);
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('base_price');
      expect(res.body.data).toHaveProperty('variants');
      expect(res.body.data).toHaveProperty('images');
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app).get('/api/products/99999').expect(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Product not found');
    });
  });

  describe('POST /api/products (Admin)', () => {
    it('should create product as admin', async () => {
      const uniqueName = 'Test Product API ' + Date.now();
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: uniqueName,
          description: 'Created via API test',
          base_price: 199000,
          category_id: testCategoryId,
          brand_id: testBrandId,
          variants: [
            { size: 'S', color: 'White', stock: 10, price_adjustment: 0 },
            { size: 'M', color: 'Black', stock: 20, price_adjustment: 0 },
          ],
          images: ['test.jpg'],
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', uniqueName);
      expect(res.body.data).toHaveProperty('base_price', 199000);
    });

    it('should reject non-admin creating product', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Unauthorized Product',
          base_price: 100000,
          category_id: testCategoryId,
          brand_id: testBrandId,
          variants: [],
        })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('You do not have permission to perform this action');
    });
  });

  describe('GET /api/products/:id/variants', () => {
    it('should list variants for a product', async () => {
      const list = await request(app).get('/api/products?limit=1');
      const productId = list.body.data.products[0].id;
      const res = await request(app).get(`/api/products/${productId}/variants`).expect(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('UPDATE /api/products/:id (Admin)', () => {
    it('should update product as admin', async () => {
      // Create product first
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Product to Update ' + Date.now(),
          base_price: 100000,
          category_id: testCategoryId,
          brand_id: testBrandId,
          variants: [],
        });

      expect(createRes.body.success).toBe(true);
      const productId = createRes.body.data.id;

      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Product',
          base_price: 150000,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Product');
      expect(res.body.data.base_price).toBe(150000);
    });
  });

  describe('DELETE /api/products/:id (Admin)', () => {
    it('should delete product as admin', async () => {
      // Create product first
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Product to Delete ' + Date.now(),
          base_price: 50000,
          category_id: testCategoryId,
          brand_id: testBrandId,
          variants: [],
        });

      expect(createRes.body.success).toBe(true);
      const productId = createRes.body.data.id;

      const res = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify deleted
      await request(app).get(`/api/products/${productId}`).expect(404);
    });
  });
});
