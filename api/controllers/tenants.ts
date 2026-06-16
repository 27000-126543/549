import { Response } from 'express';
import { store } from '../database';
import type { AuthRequest } from '../middleware/auth';
import type { ApiResponse, PageResponse, Tenant, User, Role, Department, Project } from '../../shared/types';

export async function getTenants(req: AuthRequest, res: Response<ApiResponse<PageResponse<Tenant>>>) {
  const { page = 1, pageSize = 20 } = req.query as any;
  
  const tenants = Array.from(store.tenants.values());
  const total = tenants.length;
  const start = (page - 1) * pageSize;

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      list: tenants.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    },
    timestamp: Date.now(),
  });
}

export async function getCurrentTenant(req: AuthRequest, res: Response<ApiResponse<Tenant>>) {
  const tenant = store.tenants.get(req.tenantId!);

  if (!tenant) {
    return res.status(404).json({
      code: 404,
      message: '租户不存在',
      data: null as any,
      timestamp: Date.now(),
    });
  }

  res.json({
    code: 200,
    message: '获取成功',
    data: tenant,
    timestamp: Date.now(),
  });
}

export async function getUsers(req: AuthRequest, res: Response<ApiResponse<PageResponse<User>>>) {
  const { page = 1, pageSize = 20, departmentId, keyword } = req.query as any;
  
  let users = Array.from(store.users.values()).filter(u => u.tenantId === req.tenantId);
  
  if (departmentId) users = users.filter(u => u.departmentId === departmentId);
  if (keyword) {
    const kw = keyword.toLowerCase();
    users = users.filter(u => 
      u.username.toLowerCase().includes(kw) || 
      u.email.toLowerCase().includes(kw)
    );
  }

  const total = users.length;
  const start = (page - 1) * pageSize;

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      list: users.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    },
    timestamp: Date.now(),
  });
}

export async function getRoles(req: AuthRequest, res: Response<ApiResponse<Role[]>>) {
  const roles = Array.from(store.roles.values()).filter(r => r.tenantId === req.tenantId);

  res.json({
    code: 200,
    message: '获取成功',
    data: roles,
    timestamp: Date.now(),
  });
}

export async function getDepartments(req: AuthRequest, res: Response<ApiResponse<Department[]>>) {
  const departments = Array.from(store.departments.values()).filter(d => d.tenantId === req.tenantId);
  
  const deptMap = new Map<string, Department>();
  departments.forEach(d => deptMap.set(d.id, { ...d, children: [] }));
  
  const rootDepartments: Department[] = [];
  deptMap.forEach(d => {
    if (d.parentId && deptMap.has(d.parentId)) {
      const parent = deptMap.get(d.parentId)!;
      parent.children = parent.children || [];
      parent.children.push(d);
    } else {
      rootDepartments.push(d);
    }
  });

  res.json({
    code: 200,
    message: '获取成功',
    data: rootDepartments,
    timestamp: Date.now(),
  });
}

export async function getProjects(req: AuthRequest, res: Response<ApiResponse<PageResponse<Project>>>) {
  const { page = 1, pageSize = 20 } = req.query as any;
  
  const projects = Array.from(store.projects.values()).filter(p => p.tenantId === req.tenantId);
  const total = projects.length;
  const start = (page - 1) * pageSize;

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      list: projects.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    },
    timestamp: Date.now(),
  });
}

export default {
  getTenants,
  getCurrentTenant,
  getUsers,
  getRoles,
  getDepartments,
  getProjects,
};
