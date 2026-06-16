import { Router } from 'express';
import {
  getTenants,
  getCurrentTenant,
  getUsers,
  getRoles,
  getDepartments,
  getProjects,
} from '../controllers/tenants';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getTenants);
router.get('/current', authMiddleware, getCurrentTenant);
router.get('/users', authMiddleware, getUsers);
router.get('/roles', authMiddleware, getRoles);
router.get('/departments', authMiddleware, getDepartments);
router.get('/projects', authMiddleware, getProjects);

export default router;
