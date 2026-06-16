import { request } from './api';
import type { Task, TaskListRequest, TaskCreateRequest, PageResponse, ApiResponse } from '../../shared/types';

export async function getTasks(params?: TaskListRequest): Promise<ApiResponse<PageResponse<Task>>> {
  return request<PageResponse<Task>>('get', '/tasks', params);
}

export async function getTask(id: string): Promise<ApiResponse<Task>> {
  return request<Task>('get', `/tasks/${id}`);
}

export async function createTask(data: TaskCreateRequest): Promise<ApiResponse<Task>> {
  return request<Task>('post', '/tasks', data);
}

export async function updateTask(id: string, data: Partial<Task>): Promise<ApiResponse<Task>> {
  return request<Task>('put', `/tasks/${id}`, data);
}

export async function deleteTask(id: string): Promise<ApiResponse<null>> {
  return request<null>('delete', `/tasks/${id}`);
}

export async function submitApproval(id: string): Promise<ApiResponse<Task>> {
  return request<Task>('post', `/tasks/${id}/approval`);
}

export async function getTaskExecutions(taskId: string, params?: { page?: number; pageSize?: number }): Promise<ApiResponse<PageResponse<any>>> {
  return request<PageResponse<any>>('get', `/tasks/${taskId}/executions`, params);
}

export async function runTask(id: string): Promise<ApiResponse<any>> {
  return request<any>('post', `/tasks/${id}/run`);
}
