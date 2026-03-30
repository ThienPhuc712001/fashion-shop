import { getConfig, isProduction, getDatabaseConfig, getJWTSecret } from '../src/services/config.service';

describe('Config Service', () => {
  describe('getConfig', () => {
    it('should return all config', async () => {
      const config = await getConfig();
      expect(config).toHaveProperty('env');
      expect(config).toHaveProperty('database');
      expect(config).toHaveProperty('jwt');
      expect(config).toHaveProperty('upload');
      expect(config).toHaveProperty('payment');
      expect(config).toHaveProperty('email');
    });
  });

  describe('isProduction', () => {
    it('should return false in test env', async () => {
      const prod = await isProduction();
      expect(prod).toBe(false);
    });
  });

  describe('getDatabaseConfig', () => {
    it('should return DB config', async () => {
      const dbConfig = await getDatabaseConfig();
      expect(dbConfig).toHaveProperty('type');
      expect(dbConfig).toHaveProperty('path');
    });
  });

  describe('getJWTSecret', () => {
    it('should return JWT secret (or throw if missing)', async () => {
      // In test env, might be dummy secret
      const secret = await getJWTSecret();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(0);
    });
  });
});
