import logger from './logger';
export const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            requestId: req.requestId,
            userId: req.userId || null
        };
        if (res.statusCode >= 500) {
            logger.error('Request failed', logData);
        }
        else if (res.statusCode >= 400) {
            logger.warn('Request error', logData);
        }
        else {
            logger.info('Request completed', logData);
        }
    });
    next();
};
export default requestLogger;
