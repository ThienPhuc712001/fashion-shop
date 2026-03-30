import { searchProducts, searchAutocomplete } from '../src/services/search.service';
import db from '../src/config/database';

describe('Search Service', () => {
  beforeAll(async () => {
    await db.connect();
    await db.createTables();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('searchProducts', () => {
    it('should return matching products', async () => {
      const result = await searchProducts('áo', { limit: 5 });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('name');
      }
    });

    it('should support category filter', async () => {
      // Assuming category with id exists
      const result = await searchProducts('áo', { category_id: '1' });
      expect(Array.isArray(result)).toBe(true);
    });

    it('should support price range filter', async () => {
      const result = await searchProducts('áo', { min_price: 100000, max_price: 500000 });
      expect(Array.isArray(result)).toBe(true);
      result.forEach(p => {
        expect(p.base_price).toBeGreaterThanOrEqual(100000);
        expect(p.base_price).toBeLessThanOrEqual(500000);
      });
    });

    it('should support sorting', async () => {
      const result = await searchProducts('áo', { sort_by: 'base_price', sort_order: 'desc' });
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 1) {
        for (let i = 1; i < result.length; i++) {
          expect(result[i - 1].base_price).toBeGreaterThanOrEqual(result[i].base_price);
        }
      }
    });

    it('should return empty array for no matches', async () => {
      const result = await searchProducts('xyz123nonexistent');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('searchAutocomplete', () => {
    it('should return suggestions', async () => {
      const result = await searchAutocomplete('áo');
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('text');
        expect(result[0]).toHaveProperty('type'); // product, category, brand
      }
    });
  });
});
