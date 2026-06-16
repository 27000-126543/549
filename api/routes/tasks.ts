import { Router } from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  submitApproval,
  getTaskExecutions,
  runTask,
} from '../controllers/tasks';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getTasks);
router.get('/:id', authMiddleware, getTask);
router.post('/', authMiddleware, createTask);
router.put('/:id', authMiddleware, updateTask);
router.delete('/:id', authMiddleware, deleteTask);
router.post('/:id/approval', authMiddleware, submitApproval);
router.get('/:taskId/executions', authMiddleware, getTaskExecutions);
router.post('/:id/run', authMiddleware, runTask);

export default router;
