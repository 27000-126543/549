import { request } from './api';
import type { DashboardStats, CostData, HeatmapData, AuditLog, PageResponse, ApiResponse } from '../../shared/types';

export async function getDashboard(): Promise<ApiResponse<DashboardStats>> {
  return request<DashboardStats>('get', '/analytics/dashboard');
}

export async function getSuccessRateTrend(params?: { range?: string }): Promise<ApiResponse<any>> {
  return request<any>('get', '/analytics/success-rate', params);
}

export async function getCostAnalysis(params?: { groupBy?: string }): Promise<ApiResponse<CostData[]>> {
  return request<CostData[]>('get', '/analytics/cost', params);
}

export async function getHeatmap(): Promise<ApiResponse<HeatmapData[]>> {
  return request<HeatmapData[]>('get', '/analytics/heatmap');
}

export async function getAuditLogs(params?: { page?: number; pageSize?: number; userId?: string; action?: string; resourceType?: string }): Promise<ApiResponse<PageResponse<AuditLog>>> {
  return request<PageResponse<AuditLog>>('get', '/analytics/audit-logs', params);
}
