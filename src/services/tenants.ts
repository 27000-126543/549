import { request } from './api';
import type { Tenant, User, Role, Department, Project, PageResponse, ApiResponse } from '../../shared/types';

export async function getTenants(params?: { page?: number; pageSize?: number }): Promise<ApiResponse<PageResponse<Tenant>>> {
  return request<PageResponse<Tenant>>('get', '/tenants', params);
}

export async function getCurrentTenant(): Promise<ApiResponse<Tenant>> {
  return request<Tenant>('get', '/tenants/current');
}

export async function getUsers(params?: { page?: number; pageSize?: number; departmentId?: string; keyword?: string }): Promise<ApiResponse<PageResponse<User>>> {
  return request<PageResponse<User>>('get', '/tenants/users', params);
}

export async function getRoles(): Promise<ApiResponse<Role[]>> {
  return request<Role[]>('get', '/tenants/roles');
}

export async function getDepartments(): Promise<ApiResponse<Department[]>> {
  return request<Department[]>('get', '/tenants/departments');
}

export async function getProjects(params?: { page?: number; pageSize?: number }): Promise<ApiResponse<PageResponse<Project>>> {
  return request<PageResponse<Project>>('get', '/tenants/projects', params);
}
