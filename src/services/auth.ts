import { request } from './api';
import type { LoginRequest, LoginResponse, User, ApiResponse } from '../../shared/types';

export async function login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  return request<LoginResponse>('post', '/auth/login', data);
}

export async function getCurrentUser(): Promise<ApiResponse<{ user: User; permissions: string[] }>> {
  return request<{ user: User; permissions: string[] }>('get', '/auth/me');
}

export async function logout(): Promise<ApiResponse<null>> {
  return request<null>('post', '/auth/logout');
}
