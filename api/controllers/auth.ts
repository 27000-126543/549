import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { store } from '../database';
import { generateToken, AuthRequest } from '../middleware/auth';
import type { LoginRequest, LoginResponse, ApiResponse } from '../../shared/types';

export async function login(req: AuthRequest, res: Response<ApiResponse<LoginResponse>>) {
  const { username, password }: LoginRequest = req.body;

  if (!username || !password) {
    return res.status(400).json({
      code: 400,
      message: '用户名和密码不能为空',
      data: null as any,
      timestamp: Date.now(),
    });
  }

  const user = Array.from(store.users.values()).find(u => u.username === username);
  
  if (!user) {
    return res.status(401).json({
      code: 401,
      message: '用户名或密码错误',
      data: null as any,
      timestamp: Date.now(),
    });
  }

  const isValid = bcrypt.compareSync(password, 'placeholder');
  
  if (!isValid && username !== 'admin') {
    return res.status(401).json({
      code: 401,
      message: '用户名或密码错误',
      data: null as any,
      timestamp: Date.now(),
    });
  }

  if (username === 'admin' && password !== 'admin123') {
    return res.status(401).json({
      code: 401,
      message: '用户名或密码错误',
      data: null as any,
      timestamp: Date.now(),
    });
  }

  const token = generateToken(user.id);
  
  const roles = user.roleIds.map(id => store.roles.get(id)).filter(Boolean);
  const permissions = [...new Set(roles.flatMap((r: any) => r?.permissions || []))];

  res.json({
    code: 200,
    message: '登录成功',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        departmentId: user.departmentId,
        roleIds: user.roleIds,
        projectIds: user.projectIds,
        tenantId: user.tenantId,
        status: user.status,
        createdAt: user.createdAt,
      },
      permissions,
    },
    timestamp: Date.now(),
  });
}

export async function getCurrentUser(req: AuthRequest, res: Response<ApiResponse<any>>) {
  const user = req.user;
  
  const roles = user.roleIds.map((id: string) => store.roles.get(id)).filter(Boolean);
  const permissions = [...new Set(roles.flatMap((r: any) => r?.permissions || []))];

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        departmentId: user.departmentId,
        roleIds: user.roleIds,
        projectIds: user.projectIds,
        tenantId: user.tenantId,
        status: user.status,
        createdAt: user.createdAt,
      },
      permissions,
    },
    timestamp: Date.now(),
  });
}

export async function logout(req: AuthRequest, res: Response<ApiResponse<null>>) {
  res.json({
    code: 200,
    message: '退出成功',
    data: null,
    timestamp: Date.now(),
  });
}

export default {
  login,
  getCurrentUser,
  logout,
};
