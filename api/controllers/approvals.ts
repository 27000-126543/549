import { Response } from 'express';
import { store, getPendingApprovals, generateIdInternal, nowInternal } from '../database';
import type { AuthRequest } from '../middleware/auth';
import type { ApiResponse, PageResponse, PendingApproval, ApprovalRecord, ApprovalFlow, ApprovalActionRequest } from '../../shared/types';

export async function getPendingApprovalsList(req: AuthRequest, res: Response<ApiResponse<PageResponse<PendingApproval>>>) {
  const { page = 1, pageSize = 20 } = req.query as any;
  const userId = req.userId!;
  
  const list = getPendingApprovals(userId);
  const total = list.length;
  const start = (page - 1) * pageSize;

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      list: list.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    },
    timestamp: Date.now(),
  });
}

export async function getApprovalHistory(req: AuthRequest, res: Response<ApiResponse<PageResponse<ApprovalRecord>>>) {
  const { page = 1, pageSize = 20, taskId } = req.query as any;
  
  let records = Array.from(store.approvalRecords.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  if (taskId) {
    records = records.filter(r => r.taskId === taskId);
  }

  const total = records.length;
  const start = (page - 1) * pageSize;

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      list: records.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    },
    timestamp: Date.now(),
  });
}

export async function handleApproval(req: AuthRequest, res: Response<ApiResponse<ApprovalRecord>>) {
  const { recordId, status, comment, transferTo }: ApprovalActionRequest = req.body;
  
  const record = store.approvalRecords.get(recordId);
  if (!record) {
    return res.status(404).json({
      code: 404,
      message: '审批记录不存在',
      data: null as any,
      timestamp: Date.now(),
    });
  }

  if (record.approverId !== req.userId) {
    return res.status(403).json({
      code: 403,
      message: '无权处理此审批',
      data: null as any,
      timestamp: Date.now(),
    });
  }

  record.status = status;
  record.comment = comment;
  
  if (status === 'transferred' && transferTo) {
    const newRecordId = generateIdInternal();
    store.approvalRecords.set(newRecordId, {
      id: newRecordId,
      flowId: record.flowId,
      taskId: record.taskId,
      nodeId: record.nodeId,
      approverId: transferTo,
      approverName: '转交用户',
      status: 'pending',
      createdAt: nowInternal(),
    });
  }

  if (status === 'approved') {
    const task = store.tasks.get(record.taskId);
    if (task) {
      task.status = 'active';
      task.updatedAt = nowInternal();
      store.tasks.set(record.taskId, task);
    }
  }

  if (status === 'rejected') {
    const task = store.tasks.get(record.taskId);
    if (task) {
      task.status = 'draft';
      task.updatedAt = nowInternal();
      store.tasks.set(record.taskId, task);
    }
  }

  store.approvalRecords.set(recordId, record);

  res.json({
    code: 200,
    message: '处理成功',
    data: record,
    timestamp: Date.now(),
  });
}

export async function getApprovalFlows(req: AuthRequest, res: Response<ApiResponse<ApprovalFlow[]>>) {
  const flows = Array.from(store.approvalFlows.values()).filter(f => f.tenantId === req.tenantId);

  res.json({
    code: 200,
    message: '获取成功',
    data: flows,
    timestamp: Date.now(),
  });
}

export async function createApprovalFlow(req: AuthRequest, res: Response<ApiResponse<ApprovalFlow>>) {
  const { name, nodes } = req.body;
  const id = 'flow-' + Date.now();

  const flow: ApprovalFlow = {
    id,
    name,
    nodes,
    isDefault: false,
    tenantId: req.tenantId!,
  };

  store.approvalFlows.set(id, flow);

  res.json({
    code: 200,
    message: '创建成功',
    data: flow,
    timestamp: Date.now(),
  });
}

export default {
  getPendingApprovalsList,
  getApprovalHistory,
  handleApproval,
  getApprovalFlows,
  createApprovalFlow,
};
