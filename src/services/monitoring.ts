import { request } from './api';
import type { RealtimeMetrics, LoadForecast, ApiResponse } from '../../shared/types';

export async function getRealtimeData(): Promise<ApiResponse<RealtimeMetrics>> {
  return request<RealtimeMetrics>('get', '/monitoring/realtime');
}

export async function getLoadForecast(): Promise<ApiResponse<LoadForecast>> {
  return request<LoadForecast>('get', '/monitoring/forecast');
}

export async function getQueues(): Promise<ApiResponse<any[]>> {
  return request<any[]>('get', '/monitoring/queues');
}

export async function getMetricsHistory(params?: { nodeId?: string; metricType?: string; range?: string }): Promise<ApiResponse<any>> {
  return request<any>('get', '/monitoring/history', params);
}
