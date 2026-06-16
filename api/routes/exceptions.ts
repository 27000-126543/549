import { Router } from 'express';
import {
  getFailedTasks,
  retryTask,
  batchRetry,
  getDeadLetters,
  handleDeadLetter,
  getCanaryStrategies,
} from '../controllers/exceptions';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/failed-tasks', authMiddleware, getFailedTasks);
router.post('/failed-tasks/:id/retry', authMiddleware, retryTask);
router.post('/failed-tasks/batch-retry', authMiddleware, batchRetry);
router.get('/dead-letters', authMiddleware, getDeadLetters);
router.post('/dead-letters/:id/handle', authMiddleware, handleDeadLetter);
router.get('/canary-strategies', authMiddleware, getCanaryStrategies);

export default router;
