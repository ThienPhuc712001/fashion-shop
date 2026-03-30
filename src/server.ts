import 'dotenv/config';
import app from './app';
import db from './config/database';
import logger from './middleware/logger';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
logger.info(`🚀 Starting server on port ${PORT}`);

// Start listening on 0.0.0.0 (required for Railway/cloud)
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`✅ Server listening on 0.0.0.0:${PORT}`);
  logger.info(`💚 Health: http://0.0.0.0:${PORT}/health`);
  logger.info(`📚 API: http://0.0.0.0:${PORT}/api`);
});

// Handle listen errors (e.g., port already in use)
server.on('error', (err: any) => {
  logger.error(`❌ Server error on port ${PORT}: ${err.message}`);
  process.exit(1);
});

// Initialize database in background (non-blocking)
db.init().then(() => {
  logger.info('✅ Database connected and initialized');
}).catch((err) => {
  logger.error('Failed to initialize database:', err);
  // Server still runs, but DB errors will happen on first query
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, closing server...');
  server.close(async () => {
    try {
      await db.close();
      logger.info('Database connection closed');
      process.exit(0);
    } catch (err) {
      logger.error('Error closing database:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  gracefulShutdown();
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  gracefulShutdown();
});