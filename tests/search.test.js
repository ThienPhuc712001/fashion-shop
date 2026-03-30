import request from 'supertest';
import app from '../src/app';
import { ensureDBConnected, ensureTestData } from './setup';
describe('Search API', () => {
    beforeAll(async () => {
        await ensureDBConnected();
        await ensureTestData();
    });
    it('should search products by text', async () => {
        const res = await request(app)
            .get('/api/search')
            .query({ q: 'áo' })
            .expect(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.results)).toBe(true);
    });
    it('should search with empty query return all or error', async () => {
        const res = await request(app)
            .get('/api/search')
            .query({}) // no q
            .expect(400);
        expect(res.body.success).toBe(false);
    });
    it('should limit search results', async () => {
        const res = await request(app)
            .get('/api/search')
            .query({ q: 'áo', limit: 5 })
            .expect(200);
        expect(res.body.data.results.length).toBeLessThanOrEqual(5);
    });
});
