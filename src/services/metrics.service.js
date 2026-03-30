import db from '../config/database';
class MetricsService {
    constructor() {
        this.startTime = Date.now();
        this.requestCount = 0;
        this.errorCount = 0;
    }
    incrementRequests(error = false) {
        this.requestCount++;
        if (error)
            this.errorCount++;
    }
    async getMetrics() {
        var _a, _b;
        const memory = process.memoryUsage();
        const totalUsers = await db.get('SELECT COUNT(*) as count FROM users');
        const totalProducts = await db.get('SELECT COUNT(*) as count FROM products');
        const totalOrders = await db.get('SELECT COUNT(*) as count FROM orders');
        const activeSessions = await db.get('SELECT COUNT(*) as count FROM cart_sessions WHERE expires_at > CURRENT_TIMESTAMP');
        // SQLite stats (approx)
        let pageCount = 0, freelistCount = 0;
        try {
            const pragma = await db.all('PRAGMA page_count; PRAGMA freelist_count;');
            pageCount = ((_a = pragma[0]) === null || _a === void 0 ? void 0 : _a.page_count) || 0;
            freelistCount = ((_b = pragma[1]) === null || _b === void 0 ? void 0 : _b.freelist_count) || 0;
        }
        catch (e) {
            // ignore
        }
        return {
            uptime: Date.now() - this.startTime,
            memory: {
                rss: memory.rss,
                heapTotal: memory.heapTotal,
                heapUsed: memory.heapUsed,
                external: memory.external
            },
            db: {
                connections: 1, // SQLite single connection
                page_count: pageCount,
                freelist_count: freelistCount
            },
            app: {
                total_requests: this.requestCount,
                error_requests: this.errorCount,
                active_sessions: activeSessions.count,
                total_orders: totalOrders.count,
                total_users: totalUsers.count,
                total_products: totalProducts.count
            }
        };
    }
}
export const metricsService = new MetricsService();
export default metricsService;
