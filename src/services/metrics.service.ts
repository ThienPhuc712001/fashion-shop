import db from '../config/database';

interface Metrics {
  // System
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  // Database
  db: {
    connections: number;
    // SQLite specific
    page_count?: number;
    freelist_count?: number;
  };
  // Application
  app: {
    total_requests: number;
    error_requests: number;
    active_sessions: number;
    total_orders: number;
    total_users: number;
    total_products: number;
  };
  // Performance
  response_time_avg_ms?: number;
}

class MetricsService {
  private startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;

  incrementRequests(error = false) {
    this.requestCount++;
    if (error) this.errorCount++;
  }

  async getMetrics(): Promise<Metrics> {
    const memory = process.memoryUsage();
    const totalUsers = await db.get('SELECT COUNT(*) as count FROM users');
    const totalProducts = await db.get('SELECT COUNT(*) as count FROM products');
    const totalOrders = await db.get('SELECT COUNT(*) as count FROM orders');
    const activeSessions = await db.get('SELECT COUNT(*) as count FROM cart_sessions WHERE expires_at > CURRENT_TIMESTAMP');

    // SQLite stats (approx)
    let pageCount = 0, freelistCount = 0;
    try {
      const pragma = await db.all('PRAGMA page_count; PRAGMA freelist_count;');
      pageCount = pragma[0]?.page_count || 0;
      freelistCount = pragma[1]?.freelist_count || 0;
    } catch (e) {
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
