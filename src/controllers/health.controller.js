import db from '../config/database';
export const healthCheck = async (req, res) => {
    try {
        // Test DB connection
        await db.get('SELECT 1 as health');
        const dbStatus = 'healthy';
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            status: 'unhealthy',
            database: 'down',
            uptime: process.uptime()
        });
    }
    res.json({
        success: true,
        status: 'healthy',
        database: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
};
