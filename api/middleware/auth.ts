import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { store, ADMIN_ID } from '../database';

const JWT_SECRET = process.env.JWT_SECRET || 'task-scheduler-secret-key-2024';

export interface AuthRequest extends Request {
  userId?: string;
  tenantId?: string;
  user?: any;
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 401,
      message: '未授权访问',
      data: null,
      timestamp: Date.now(),
    });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({
      code: 401,
      message: 'Token已过期或无效',
      data: null,
      timestamp: Date.now(),
    });
  }

  const user = store.users.get(decoded.userId);
  if (!user || user.status !== 'active') {
    return res.status(401).json({
      code: 401,
      message: '用户不存在或已被禁用',
      data: null,
      timestamp: Date.now(),
    });
  }

  req.userId = decoded.userId;
  req.tenantId = user.tenantId;
  req.user = user;
  next();
}

export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '未授权访问',
        data: null,
        timestamp: Date.now(),
      });
    }

    const roles = user.roleIds.map((id: string) => store.roles.get(id)).filter(Boolean);
    const hasPermission = roles.some((role: any) => 
      role.permissions.includes(permission) || role.permissions.includes('*')
    );

    if (!hasPermission && user.id !== ADMIN_ID) {
      return res.status(403).json({
        code: 403,
        message: '权限不足',
        data: null,
        timestamp: Date.now(),
      });
    }

    next();
  };
}

export default {
  authMiddleware,
  generateToken,
  verifyToken,
  requirePermission,
};
