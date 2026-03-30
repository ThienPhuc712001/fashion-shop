import { Request, Response, NextFunction } from 'express';
import metricsService from '../services/metrics.service';

// GET /metrics (Prometheus format or JSON)
export const getMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await metricsService.getMetrics();

    // If Prometheus format requested
    if (req.query.format === 'prometheus') {
      const prometheus = `
# HELP fashion_shop_uptime_ms Uptime in milliseconds
# TYPE fashion_shop_uptime_ms gauge
fashion_shop_uptime_ms ${metrics.uptime}

# HELP fashion_shop_memory_rss_bytes Resident set size memory
# TYPE fashion_shop_memory_rss_bytes gauge
fashion_shop_memory_rss_bytes ${metrics.memory.rss}

# HELP fashion_shop_memory_heap_used_bytes Heap used memory
# TYPE fashion_shop_memory_heap_used_bytes gauge
fashion_shop_memory_heap_used_bytes ${metrics.memory.heapUsed}

# HELP fashion_shop_requests_total Total HTTP requests
# TYPE fashion_shop_requests_total counter
fashion_shop_requests_total ${metrics.app.total_requests}

# HELP fashion_shop_errors_total Total error responses
# TYPE fashion_shop_errors_total counter
fashion_shop_errors_total ${metrics.app.error_requests}

# HELP fashion_shop_active_sessions Current active cart sessions
# TYPE fashion_shop_active_sessions gauge
fashion_shop_active_sessions ${metrics.app.active_sessions}

# HELP fashion_shop_total_orders Total orders in system
# TYPE fashion_shop_total_orders gauge
fashion_shop_total_orders ${metrics.app.total_orders}

# HELP fashion_shop_total_users Total registered users
# TYPE fashion_shop_total_users gauge
fashion_shop_total_users ${metrics.app.total_users}

# HELP fashion_shop_total_products Total products
# TYPE fashion_shop_total_products gauge
fashion_shop_total_products ${metrics.app.total_products}
`;

      res.setHeader('Content-Type', 'text/plain; version=0.0.4');
      return res.send(prometheus.trim());
    }

    // Default JSON format
    res.json({
      success: true,
      data: metrics
    });
  } catch (err) {
    next(err);
  }
};
