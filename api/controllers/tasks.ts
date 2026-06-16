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

  const flow = store.approvalFlows.get(task.approvalFlowId || FLOW_ID);
  if (!flow || flow.nodes.length === 0) {
    task.status = 'active';
    task.updatedAt = nowInternal();
    store.tasks.set(id, task);
    return res.json({
      code: 200,
      message: '无审批流配置，任务自动激活',
      data: task,
      timestamp: Date.now(),
    });
  }

  const sortedNodes = [...flow.nodes].sort((a, b) => a.order - b.order);
  const firstNode = sortedNodes[0];

  task.status = 'pending_approval';
  task.updatedAt = nowInternal();
  store.tasks.set(id, task);

  for (const approverId of firstNode.approvers) {
    const approver = store.users.get(approverId);
    const approvalRecordId = generateIdInternal();
    store.approvalRecords.set(approvalRecordId, {
      id: approvalRecordId,
      flowId: flow.id,
      taskId: id,
      nodeId: firstNode.id,
      approverId: approverId,
      approverName: approver?.username || approverId,
      status: 'pending',
      createdAt: nowInternal(),
    });
  }

  res.json({
    code: 200,
    message: `提交审批成功，等待${firstNode.approvers.length}人处理（${firstNode.type === 'sequential' ? '顺序' : firstNode.type === 'countersign' ? '会签' : '或签'}模式）`,
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
  const allNodes = Array.from(store.executionNodes.values());
  const onlineNodes = allNodes.filter(n => n.status === 'online');

  const strategy = store.schedulingStrategies.get(task.schedulingStrategyId || STRATEGY_ID);
  const weights = strategy?.weightConfig || { cpu: 0.4, memory: 0.3, queue: 0.2, priority: 0.1 };

  const priorityMap: Record<string, number> = { low: 1, medium: 2, high: 3, urgent: 4 };
  const taskPriorityScore = priorityMap[task.priority] || 1;

  const taskTypeTagMap: Record<string, string[]> = {
    api: ['general'],
    email: ['general'],
    file: ['io-intensive', 'general'],
    cron: ['general', 'data-processing'],
    manual: ['general', 'cpu-intensive'],
  };
  const preferredTags = taskTypeTagMap[task.type] || ['general'];

  const nodesWithScore = onlineNodes.map(node => {
    const tagMatchScore = preferredTags.some(tag => node.tags.includes(tag)) ? 1 : 0.3;
    const cpuScore = Math.max(0, 100 - node.cpuUsage) / 100;
    const memoryScore = Math.max(0, 100 - node.memoryUsage) / 100;
    const queueScore = Math.max(0, 1 - node.queueDepth / (node.maxConcurrency || 20));
    const concurrencyScore = Math.max(0, 1 - node.currentConcurrency / (node.maxConcurrency || 20));
    const priorityBoost = (taskPriorityScore / 4) * weights.priority;

    const resourceScore = (
      cpuScore * weights.cpu +
      memoryScore * weights.memory +
      (queueScore * 0.5 + concurrencyScore * 0.5) * weights.queue
    );

    const finalScore = (resourceScore + priorityBoost) * tagMatchScore;

    return {
      node,
      score: finalScore,
      details: {
        cpuScore: cpuScore.toFixed(3),
        memoryScore: memoryScore.toFixed(3),
        queueScore: queueScore.toFixed(3),
        tagMatchScore: tagMatchScore.toFixed(3),
        priorityBoost: priorityBoost.toFixed(3),
      },
    };
  });

  nodesWithScore.sort((a, b) => b.score - a.score);

  const targetNode = nodesWithScore[0]?.node || onlineNodes[0] || allNodes[0];
  const scheduleDetails = nodesWithScore.map(n => ({
    nodeId: n.node.id,
    nodeName: n.node.name,
    score: n.score.toFixed(4),
    details: n.details,
  }));

  const execution = {
    id: execId,
    taskId: id,
    taskName: task.name,
    status: 'running',
    nodeId: targetNode.id,
    nodeName: targetNode.name,
    scheduleDetails,
    selectedBy: 'intelligent_routing',
    startTime: nowInternal(),
    retryCount: 0,
  };

  store.taskExecutions.set(execId, execution as any);

  const originalNode = store.executionNodes.get(targetNode.id);
  if (originalNode) {
    originalNode.queueDepth = (originalNode.queueDepth || 0) + 1;
    originalNode.currentConcurrency = (originalNode.currentConcurrency || 0) + 1;
    store.executionNodes.set(targetNode.id, originalNode);
  }

  setTimeout(() => {
    const exec = store.taskExecutions.get(execId);
    if (exec) {
      exec.status = Math.random() > 0.15 ? 'success' : 'failed';
      exec.endTime = nowInternal();
      exec.duration = Math.floor(Math.random() * 300) + 30;
      if (exec.status === 'failed') {
        exec.errorMessage = '模拟执行失败，请检查任务配置';
      }
      store.taskExecutions.set(execId, exec);

      const runningNode = store.executionNodes.get(exec.nodeId);
      if (runningNode) {
        runningNode.queueDepth = Math.max(0, (runningNode.queueDepth || 1) - 1);
        runningNode.currentConcurrency = Math.max(0, (runningNode.currentConcurrency || 1) - 1);
        store.executionNodes.set(exec.nodeId, runningNode);
      }
    }
  }, 3000);

  res.json({
    code: 200,
    message: `任务已触发执行，智能路由分配至：${targetNode.name}`,
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
