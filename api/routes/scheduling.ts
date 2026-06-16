import { Router } from 'express';
import {
  getNodes,
  getNode,
  updateNodeStatus,
  getStrategies,
  createStrategy,
  getScalingRules,
} from '../controllers/scheduling';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/nodes', authMiddleware, getNodes);
router.get('/nodes/:id', authMiddleware, getNode);
router.put('/nodes/:id/status', authMiddleware, updateNodeStatus);
router.get('/strategies', authMiddleware, getStrategies);
router.post('/strategies', authMiddleware, createStrategy);
router.get('/scaling-rules', authMiddleware, getScalingRules);

export default router;
