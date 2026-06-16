import { Router } from 'express';
import {
  getDashboard,
  getSuccessRateTrend,
  getCostAnalysis,
  getHeatmap,
  getAuditLogs,
} from '../controllers/analytics';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authMiddleware, getDashboard);
router.get('/success-rate', authMiddleware, getSuccessRateTrend);
router.get('/cost', authMiddleware, getCostAnalysis);
router.get('/heatmap', authMiddleware, getHeatmap);
router.get('/audit-logs', authMiddleware, getAuditLogs);

export default router;
