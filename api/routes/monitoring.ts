import { Router } from 'express';
import {
  getRealtimeData,
  getLoadForecastData,
  getQueues,
  getMetricsHistory,
} from '../controllers/monitoring';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/realtime', authMiddleware, getRealtimeData);
router.get('/forecast', authMiddleware, getLoadForecastData);
router.get('/queues', authMiddleware, getQueues);
router.get('/history', authMiddleware, getMetricsHistory);

export default router;
