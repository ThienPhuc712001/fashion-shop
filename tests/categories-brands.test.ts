import request from 'supertest';
import app from '../src/app';

describe('Categories & Brands Public API', () => {
  describe('Categories', () => {
    it('should list categories', async () => {
      const res = await request(app).get('/api/categories').expect(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.categories)).toBe(true);
    });

    it('should get category by slug', async () => {
      const res = await request(app).get('/api/categories/quan-ao').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.category).toHaveProperty('name');
    });

    it('should return 404 for non-existent category', async () => {
      const res = await request(app).get('/api/categories/non-existent').expect(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Brands', () => {
    it('should list brands', async () => {
      const res = await request(app).get('/api/brands').expect(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.brands)).toBe(true);
    });

    it('should get brand by slug', async () => {
      const res = await request(app).get('/api/brands/nike').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.brand).toHaveProperty('name');
    });

    it('should return 404 for non-existent brand', async () => {
      const res = await request(app).get('/api/brands/non-existent').expect(404);
      expect(res.body.success).toBe(false);
    });
  });
});
