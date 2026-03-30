import 'dotenv/config';
import app from './app';
import db from './config/database';
import logger from './middleware/logger';
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, async () => {
    try {
        await db.init();
        logger.info(`🚀 Fashion Shop API started on port ${PORT}`);
        logger.info(`💚 Health: http://localhost:${PORT}/health`);
        logger.info(`📚 API: http://localhost:${PORT}/api`);
    }
    catch (err) {
        logger.error('Failed to start server:', err);
        process.exit(1);
    }
});
// Graceful shutdown
const gracefulShutdown = () => {
    logger.info('Received shutdown signal, closing server...');
    server.close(async () => {
        try {
            await db.close();
            logger.info('Database connection closed');
            process.exit(0);
        }
        catch (err) {
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
