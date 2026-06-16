import { request } from './api';
import type { ExecutionNode, SchedulingStrategy, ScalingRule, PageResponse, ApiResponse } from '../../shared/types';

export async function getNodes(params?: { page?: number; pageSize?: number }): Promise<ApiResponse<PageResponse<ExecutionNode>>> {
  return request<PageResponse<ExecutionNode>>('get', '/scheduling/nodes', params);
}

export async function getNode(id: string): Promise<ApiResponse<ExecutionNode>> {
  return request<ExecutionNode>('get', `/scheduling/nodes/${id}`);
}

export async function updateNodeStatus(id: string, status: string): Promise<ApiResponse<ExecutionNode>> {
  return request<ExecutionNode>('put', `/scheduling/nodes/${id}/status`, { status });
}

export async function getStrategies(): Promise<ApiResponse<SchedulingStrategy[]>> {
  return request<SchedulingStrategy[]>('get', '/scheduling/strategies');
}

export async function createStrategy(data: Partial<SchedulingStrategy>): Promise<ApiResponse<SchedulingStrategy>> {
  return request<SchedulingStrategy>('post', '/scheduling/strategies', data);
}

export async function getScalingRules(): Promise<ApiResponse<ScalingRule[]>> {
  return request<ScalingRule[]>('get', '/scheduling/scaling-rules');
}
