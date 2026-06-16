import { Response } from 'express';
import { store, generateIdInternal, nowInternal, ADMIN_ID, PROJECT_ID, FLOW_ID, STRATEGY_ID } from '../database';
import type { AuthRequest } from '../middleware/auth';
import type { ApiResponse, PageResponse, Task, TaskListRequest, TaskCreateRequest } from '../../shared/types';

export async function getTasks(req: AuthRequest, res: Response<ApiResponse<PageResponse<Task>>>) {
  const {
    page = 1,
    pageSize = 10,
    status,
    type,
    priority,
    keyword,
    projectId,
  }: TaskListRequest = req.query as any;

  let tasks = Array.from(store.tasks.values()).filter(t => t.tenantId === req.tenantId);

  if (status) tasks = tasks.filter(t => t.status === status);
  if (type) tasks = tasks.filter(t => t.type === type);
  if (priority) tasks = tasks.filter(t => t.priority === priority);
  if (projectId) tasks = tasks.filter(t => t.projectId === projectId);
  if (keyword) {
    const kw = keyword.toLowerCase();
    tasks = tasks.filter(t => 
      t.name.toLowerCase().includes(kw) || 
      t.description.toLowerCase().includes(kw)
    );
  }

  const total = tasks.length;
  const start = (page - 1) * pageSize;
  const list = tasks.slice(start, start + pageSize);

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      list,
      total,
      page,
      pageSize,
    },
    timestamp: Date.now(),
  });
}

export async function getTask(req: AuthRequest, res: Response<ApiResponse<Task>>) {
  const { id } = req.params;
  const task = store.tasks.get(id);

  if (!task || task.tenantId !== req.tenantId) {
    return res.status(404).json({
      code: 404,
      message: '任务不存在',
      data: null as any,
      timestamp: Date.now(),
    });
  }

  res.json({
    code: 200,
    message: '获取成功',
    data: task,
    timestamp: Date.now(),
  });
}

export async function createTask(req: AuthRequest, res: Response<ApiResponse<Task>>) {
  const taskData: TaskCreateRequest = req.body;
  
  const taskId = generateIdInternal();
  const now = nowInternal();
  
  const task: Task = {
    id: taskId,
    name: taskData.name,
    description: taskData.description,
    type: taskData.type,
    priority: taskData.priority,
    status: 'draft',
    triggerConfig: taskData.triggerConfig,
    dagConfig: taskData.dagConfig,
    approvalFlowId: taskData.approvalFlowId || FLOW_ID,
    schedulingStrategyId: taskData.schedulingStrategyId || STRATEGY_ID,
    createdBy: req.userId || ADMIN_ID,
    projectId: taskData.projectId || PROJECT_ID,
    tenantId: req.tenantId!,
    createdAt: now,
    updatedAt: now,
  };

  store.tasks.set(taskId, task);

  res.json({
    code: 200,
    message: '创建成功',
    data: task,
    timestamp: Date.now(),
  });
}

export async function updateTask(req: AuthRequest, res: Response<ApiResponse<Task>>) {
  const { id } = req.params;
  const task = store.tasks.get(id);

  if (!task || task.tenantId !== req.tenantId) {
    return res.status(404).json({
      code: 404,
      message: '任务不存在',
      data: null as any,
      timestamp: Date.now(),
    });
  }

  const updatedTask: Task = {
    ...task,
    ...req.body,
    id,
    updatedAt: nowInternal(),
  };

  store.tasks.set(id, updatedTask);

  res.json({
    code: 200,
    message: '更新成功',
    data: updatedTask,
    timestamp: Date.now(),
  });
}

export async function deleteTask(req: AuthRequest, res: Response<ApiResponse<null>>) {
  const { id } = req.params;
  const task = store.tasks.get(id);

  if (!task || task.tenantId !== req.tenantId) {
    return res.status(404).json({
      code: 404,
      message: '任务不存在',
      data: null,
      timestamp: Date.now(),
    });
  }

  store.tasks.delete(id);

  res.json({
    code: 200,
    message: '删除成功',
    data: null,
    timestamp: Date.now(),
  });
}

export async function submitApproval(req: AuthRequest, res: Response<ApiResponse<Task>>) {
  const { id } = req.params;
  const task = store.tasks.get(id);

  if (!task || task.tenantId !== req.tenantId) {
    return res.status(404).json({
      code: 404,
      message: '任务不存在',
      data: null as any,
      timestamp: Date.now(),
    });
  }

  task.status = 'pending_approval';
  task.updatedAt = nowInternal();
  store.tasks.set(id, task);

  const approvalRecordId = generateIdInternal();
  store.approvalRecords.set(approvalRecordId, {
    id: approvalRecordId,
    flowId: task.approvalFlowId || FLOW_ID,
    taskId: id,
    nodeId: 'node-1',
    approverId: ADMIN_ID,
    approverName: 'admin',
    status: 'pending',
    createdAt: nowInternal(),
  });

  res.json({
    code: 200,
    message: '提交审批成功',
    data: task,
    timestamp: Date.now(),
  });
}

export async function getTaskExecutions(req: AuthRequest, res: Response<ApiResponse<PageResponse<any>>>) {
  const { taskId } = req.params;
  const { page = 1, pageSize = 20 } = req.query as any;

  let executions = Array.from(store.taskExecutions.values())
    .filter(e => e.taskId === taskId)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const total = executions.length;
  const start = (page - 1) * pageSize;
  const list = executions.slice(start, start + pageSize);

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      list,
      total,
      page,
      pageSize,
    },
    timestamp: Date.now(),
  });
}

export async function runTask(req: AuthRequest, res: Response<ApiResponse<any>>) {
  const { id } = req.params;
  const task = store.tasks.get(id);

  if (!task || task.tenantId !== req.tenantId) {
    return res.status(404).json({
      code: 404,
      message: '任务不存在',
      data: null as any,
      timestamp: Date.now(),
    });
  }

  const execId = generateIdInternal();
  const nodes = Array.from(store.executionNodes.values());
  const targetNode = nodes[Math.floor(Math.random() * nodes.length)];

  const execution = {
    id: execId,
    taskId: id,
    taskName: task.name,
    status: 'running',
    nodeId: targetNode.id,
    startTime: nowInternal(),
    retryCount: 0,
  };

  store.taskExecutions.set(execId, execution as any);

  setTimeout(() => {
    const exec = store.taskExecutions.get(execId);
    if (exec) {
      exec.status = Math.random() > 0.2 ? 'success' : 'failed';
      exec.endTime = nowInternal();
      exec.duration = Math.floor(Math.random() * 300) + 30;
      if (exec.status === 'failed') {
        exec.errorMessage = '模拟执行失败';
      }
      store.taskExecutions.set(execId, exec);
    }
  }, 3000);

  res.json({
    code: 200,
    message: '任务已触发执行',
    data: execution,
    timestamp: Date.now(),
  });
}

export default {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  submitApproval,
  getTaskExecutions,
  runTask,
};
