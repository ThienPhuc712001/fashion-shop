import express from 'express';
const router = express.Router();
import { getMetrics } from '../controllers/metrics.controller';
// GET /metrics (admin only) or ?format=prometheus
router.get('/', getMetrics);
export default router;
