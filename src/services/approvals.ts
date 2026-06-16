import { request } from './api';
import type { PendingApproval, ApprovalRecord, ApprovalFlow, ApprovalActionRequest, PageResponse, ApiResponse } from '../../shared/types';

export async function getPendingApprovals(params?: { page?: number; pageSize?: number }): Promise<ApiResponse<PageResponse<PendingApproval>>> {
  return request<PageResponse<PendingApproval>>('get', '/approvals/pending', params);
}

export async function getApprovalHistory(params?: { page?: number; pageSize?: number; taskId?: string }): Promise<ApiResponse<PageResponse<ApprovalRecord>>> {
  return request<PageResponse<ApprovalRecord>>('get', '/approvals/history', params);
}

export async function handleApproval(data: ApprovalActionRequest): Promise<ApiResponse<ApprovalRecord>> {
  return request<ApprovalRecord>('post', '/approvals/handle', data);
}

export async function getApprovalFlows(): Promise<ApiResponse<ApprovalFlow[]>> {
  return request<ApprovalFlow[]>('get', '/approvals/flows');
}

export async function createApprovalFlow(data: Partial<ApprovalFlow>): Promise<ApiResponse<ApprovalFlow>> {
  return request<ApprovalFlow>('post', '/approvals/flows', data);
}
