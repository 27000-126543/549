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

  if (record.status !== 'pending') {
    return res.status(400).json({
      code: 400,
      message: '此审批已被处理',
      data: null as any,
      timestamp: Date.now(),
    });
  }

  record.status = status;
  record.comment = comment;
  record.processedAt = nowInternal();
  
  if (status === 'transferred' && transferTo) {
    const newRecordId = generateIdInternal();
    const transferUser = store.users.get(transferTo);
    store.approvalRecords.set(newRecordId, {
      id: newRecordId,
      flowId: record.flowId,
      taskId: record.taskId,
      nodeId: record.nodeId,
      approverId: transferTo,
      approverName: transferUser?.username || '转交用户',
      status: 'pending',
      createdAt: nowInternal(),
    });
    store.approvalRecords.set(recordId, record);
    return res.json({
      code: 200,
      message: '转交成功',
      data: record,
      timestamp: Date.now(),
    });
  }

  store.approvalRecords.set(recordId, record);

  const flow = store.approvalFlows.get(record.flowId);
  const task = store.tasks.get(record.taskId);
  if (!flow || !task) {
    return res.json({
      code: 200,
      message: '处理成功',
      data: record,
      timestamp: Date.now(),
    });
  }

  const sortedNodes = [...flow.nodes].sort((a, b) => a.order - b.order);
  const currentNodeDef = sortedNodes.find(n => n.id === record.nodeId);
  if (!currentNodeDef) {
    return res.json({
      code: 200,
      message: '处理成功',
      data: record,
      timestamp: Date.now(),
    });
  }

  const nodeRecords = Array.from(store.approvalRecords.values()).filter(
    r => r.taskId === record.taskId && r.nodeId === record.nodeId
  );

  let nodePassed = false;
  let nodeRejected = false;

  if (status === 'rejected') {
    nodeRejected = true;
  } else if (status === 'approved') {
    if (currentNodeDef.type === 'or_sign') {
      nodePassed = true;
    } else if (currentNodeDef.type === 'sequential' || currentNodeDef.type === 'countersign') {
      const approvedCount = nodeRecords.filter(r => r.status === 'approved').length;
      const totalApprovers = currentNodeDef.approvers.length;
      const allProcessed = nodeRecords.every(r => r.status !== 'pending');
      if (currentNodeDef.type === 'sequential') {
        nodePassed = approvedCount >= totalApprovers;
      } else {
        nodePassed = allProcessed && approvedCount >= totalApprovers;
      }
      if (allProcessed && !nodePassed) {
        nodeRejected = true;
      }
    }
  }

  if (nodeRejected) {
    task.status = 'draft';
    task.updatedAt = nowInternal();
    store.tasks.set(record.taskId, task);
    return res.json({
      code: 200,
      message: '审批被拒绝，任务已退回草稿',
      data: record,
      timestamp: Date.now(),
    });
  }

  if (nodePassed) {
    const currentIndex = sortedNodes.findIndex(n => n.id === record.nodeId);
    const hasNext = currentIndex < sortedNodes.length - 1;

    if (hasNext) {
      const nextNode = sortedNodes[currentIndex + 1];
      for (const approverId of nextNode.approvers) {
        const approver = store.users.get(approverId);
        const newRecordId = generateIdInternal();
        store.approvalRecords.set(newRecordId, {
          id: newRecordId,
          flowId: flow.id,
          taskId: record.taskId,
          nodeId: nextNode.id,
          approverId: approverId,
          approverName: approver?.username || approverId,
          status: 'pending',
          createdAt: nowInternal(),
        });
      }
      return res.json({
        code: 200,
        message: `节点「${currentNodeDef.name}」审批通过，进入下一节点：${nextNode.name}`,
        data: record,
        timestamp: Date.now(),
      });
    } else {
      task.status = 'active';
      task.updatedAt = nowInternal();
      store.tasks.set(record.taskId, task);
      return res.json({
        code: 200,
        message: '所有审批通过，任务已激活',
        data: record,
        timestamp: Date.now(),
      });
    }
  }

  res.json({
    code: 200,
    message: currentNodeDef.type === 'countersign' ? '会签记录已提交，等待其他审批人' : '处理成功',
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
