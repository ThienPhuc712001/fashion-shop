import request from 'supertest';
import app from '../src/app';
import db from '../src/config/database';
import { ensureDBConnected, ensureTestData, getAdminToken } from './setup';
describe('Categories & Brands Admin API', () => {
    let adminToken;
    beforeAll(async () => {
        await ensureDBConnected();
        await ensureTestData();
        adminToken = await getAdminToken();
    });
    afterAll(async () => {
        await db.close();
    });
    describe('Categories (Admin)', () => {
        it('should list categories', async () => {
            const res = await request(app)
                .get('/api/admin/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.categories)).toBe(true);
        });
        it('should create category', async () => {
            const uniqueName = 'Category ' + Date.now();
            const res = await request(app)
                .post('/api/admin/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                name: uniqueName,
                slug: 'cat-' + Date.now(),
                description: 'Test category',
                is_active: true,
            })
                .expect(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.category).toHaveProperty('name', uniqueName);
        });
        it('should update category', async () => {
            // Create temp category
            const createRes = await request(app)
                .post('/api/admin/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                name: 'Temp Cat',
                slug: 'temp-cat-' + Date.now(),
            });
            const catId = createRes.body.data.category.id;
            const res = await request(app)
                .put(`/api/admin/categories/${catId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ description: 'Updated desc' })
                .expect(200);
            expect(res.body.success).toBe(true);
        });
        it('should delete category', async () => {
            const createRes = await request(app)
                .post('/api/admin/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                name: 'To Delete',
                slug: 'delete-' + Date.now(),
            });
            const catId = createRes.body.data.category.id;
            const res = await request(app)
                .delete(`/api/admin/categories/${catId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(res.body.success).toBe(true);
        });
    });
    describe('Brands (Admin)', () => {
        it('should list brands', async () => {
            const res = await request(app)
                .get('/api/admin/brands')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.brands)).toBe(true);
        });
        it('should create brand', async () => {
            const uniqueName = 'Brand ' + Date.now();
            const res = await request(app)
                .post('/api/admin/brands')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                name: uniqueName,
                slug: 'brand-' + Date.now(),
                description: 'Test brand',
                is_active: true,
            })
                .expect(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.brand).toHaveProperty('name', uniqueName);
        });
        it('should update brand', async () => {
            const createRes = await request(app)
                .post('/api/admin/brands')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                name: 'Temp Brand',
                slug: 'temp-brand-' + Date.now(),
            });
            const brandId = createRes.body.data.brand.id;
            const res = await request(app)
                .put(`/api/admin/brands/${brandId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ description: 'Updated brand desc' })
                .expect(200);
            expect(res.body.success).toBe(true);
        });
        it('should delete brand', async () => {
            const createRes = await request(app)
                .post('/api/admin/brands')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                name: 'To Delete Brand',
                slug: 'delete-brand-' + Date.now(),
            });
            const brandId = createRes.body.data.brand.id;
            const res = await request(app)
                .delete(`/api/admin/brands/${brandId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(res.body.success).toBe(true);
        });
    });
});
