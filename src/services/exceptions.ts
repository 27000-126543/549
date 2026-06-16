import { request } from './api';
import type { FailedTask, DeadLetter, PageResponse, ApiResponse } from '../../shared/types';

export async function getFailedTasks(params?: { page?: number; pageSize?: number; status?: string }): Promise<ApiResponse<PageResponse<FailedTask>>> {
  return request<PageResponse<FailedTask>>('get', '/exceptions/failed-tasks', params);
}

export async function retryTask(id: string): Promise<ApiResponse<any>> {
  return request<any>('post', `/exceptions/failed-tasks/${id}/retry`);
}

export async function batchRetry(ids: string[]): Promise<ApiResponse<any>> {
  return request<any>('post', '/exceptions/failed-tasks/batch-retry', { ids });
}

export async function getDeadLetters(params?: { page?: number; pageSize?: number; handled?: boolean }): Promise<ApiResponse<PageResponse<DeadLetter>>> {
  return request<PageResponse<DeadLetter>>('get', '/exceptions/dead-letters', params);
}

export async function handleDeadLetter(id: string, data: { handlerNote?: string; requeue?: boolean }): Promise<ApiResponse<DeadLetter>> {
  return request<DeadLetter>('post', `/exceptions/dead-letters/${id}/handle`, data);
}

export async function getCanaryStrategies(): Promise<ApiResponse<any[]>> {
  return request<any[]>('get', '/exceptions/canary-strategies');
}
