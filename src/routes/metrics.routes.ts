import express from 'express';
const router = express.Router();
import { getMetrics } from '../controllers/metrics.controller';
import { authenticate, authorize } from '../middleware/auth';

// GET /metrics (admin only) or ?format=prometheus
router.get('/', getMetrics);

export default router;
