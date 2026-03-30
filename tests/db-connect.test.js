import { ensureDBConnected } from './setup';
describe('DB Tests', () => {
    beforeAll(async () => {
        console.log('BeforeAll: connecting...');
        await ensureDBConnected();
        console.log('BeforeAll: connected');
    });
    it('should be connected', () => {
        expect(true).toBe(true);
    });
});
