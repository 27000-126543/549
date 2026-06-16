import { Router } from 'express';
import {
  getPendingApprovalsList,
  getApprovalHistory,
  handleApproval,
  getApprovalFlows,
  createApprovalFlow,
} from '../controllers/approvals';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/pending', authMiddleware, getPendingApprovalsList);
router.get('/history', authMiddleware, getApprovalHistory);
router.post('/handle', authMiddleware, handleApproval);
router.get('/flows', authMiddleware, getApprovalFlows);
router.post('/flows', authMiddleware, createApprovalFlow);

export default router;
