import { getSystemMetrics, getRequestMetrics, resetMetrics } from '../src/services/metrics.service';
describe('Metrics Service', () => {
    beforeAll(async () => {
        await resetMetrics();
    });
    describe('getSystemMetrics', () => {
        it('should return system metrics', async () => {
            const metrics = await getSystemMetrics();
            expect(metrics).toHaveProperty('uptime');
            expect(metrics).toHaveProperty('memory');
            expect(metrics.memory).toHaveProperty('heapUsed');
            expect(metrics.memory).toHaveProperty('heapTotal');
            expect(metrics).toHaveProperty('cpu');
        });
    });
    describe('getRequestMetrics', () => {
        it('should return request metrics', async () => {
            const metrics = await getRequestMetrics();
            expect(metrics).toHaveProperty('totalRequests');
            expect(metrics).toHaveProperty('averageResponseTime');
            expect(metrics).toHaveProperty('errors');
            expect(metrics).toHaveProperty('endpoints');
        });
    });
    describe('resetMetrics', () => {
        it('should reset metrics to zero', async () => {
            await resetMetrics();
            const metrics = await getRequestMetrics();
            expect(metrics.totalRequests).toBe(0);
        });
    });
});
