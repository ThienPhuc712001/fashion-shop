import request from 'supertest';
import app from '../src/app';
import { ensureDBConnected } from './setup';

describe('Health & Metrics API', () => {
  beforeAll(async () => {
    await ensureDBConnected();
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/health').expect(200);
      expect(res.body).toHaveProperty('status', 'healthy');
      expect(res.body).toHaveProperty('database', 'healthy');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/metrics', () => {
    it('should return system metrics', async () => {
      const res = await request(app).get('/api/metrics').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('uptime');
      expect(res.body.data).toHaveProperty('memory');
      expect(res.body.data).toHaveProperty('cpu');
    });
  });

  describe('GET /api/status', () => {
    it('should return API status', async () => {
      const res = await request(app).get('/api/status').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('api_version');
      expect(res.body.data).toHaveProperty('environment');
    });
  });
});
