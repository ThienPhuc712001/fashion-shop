import request from 'supertest';
import app from '../src/app';
import { ensureDBConnected, ensureTestData, getAdminToken, registerTestUser } from './setup';

describe('Auth Debug', () => {
  beforeAll(async () => {
    await ensureDBConnected();
    await ensureTestData();
  });

  it('should get me with token from register', async () => {
    const user = await registerTestUser('debug-auth@test.com', 'TestPass123!', 'Debug');
    const token = user.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    console.log('Status:', res.status);
    console.log('Body:', res.body);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
