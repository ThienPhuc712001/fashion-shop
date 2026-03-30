import request from 'supertest';
import app from '../src/app';
describe('API Info', () => {
    it('GET /api should return API info', async () => {
        const res = await request(app).get('/api');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('name', 'Fashion Shop API');
        expect(res.body.endpoints).toBeDefined();
    });
});
