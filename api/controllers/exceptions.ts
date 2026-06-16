import { Response } from 'express';
import { store, generateIdInternal, nowInternal, STRATEGY_ID } from '../database';
import type { AuthRequest } from '../middleware/auth';
import type { ApiResponse, PageResponse, FailedTask, DeadLetter, Task } from '../../shared/types';

function executeRetryForTask(failedTaskId: string): { success: boolean; execution?: any; message?: string } {
  const failedTask = store.failedTasks.get(failedTaskId);
  if (!failedTask) {
    return { success: false, message: '失败任务不存在' };
  }

  failedTask.status = 'retrying';
  failedTask.retryCount += 1;
  store.failedTasks.set(failedTaskId, failedTask);

  const allNodes = Array.from(store.executionNodes.values());
  const onlineNodes = allNodes.filter(n => n.status === 'online');

  const task = store.tasks.get(failedTask.taskId);
  const strategy = task?.schedulingStrategyId
    ? store.schedulingStrategies.get(task.schedulingStrategyId)
    : store.schedulingStrategies.get(STRATEGY_ID);
  const weights = strategy?.weightConfig || { cpu: 0.4, memory: 0.3, queue: 0.2, priority: 0.1 };

  const priorityMap: Record<string, number> = { low: 1, medium: 2, high: 3, urgent: 4 };
  const taskPriorityScore = task ? (priorityMap[task.priority] || 1) : 2;

  const taskTypeTagMap: Record<string, string[]> = {
    api: ['general'],
    email: ['general'],
    file: ['io-intensive', 'general'],
    cron: ['general', 'data-processing'],
    manual: ['general', 'cpu-intensive'],
  };
  const preferredTags = task ? (taskTypeTagMap[task.type] || ['general']) : ['general'];

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
    return { node, score: finalScore };
  });
  nodesWithScore.sort((a, b) => b.score - a.score);
  const targetNode = nodesWithScore[0]?.node || onlineNodes[0] || allNodes[0];

  const execId = generateIdInternal();
  const execution = {
    id: execId,
    taskId: failedTask.taskId,
    taskName: failedTask.taskName,
    status: 'running',
    nodeId: targetNode.id,
    nodeName: targetNode.name,
    selectedBy: 'retry_intelligent_routing',
    startTime: nowInternal(),
    retryCount: failedTask.retryCount,
    isRetry: true,
  };
  store.taskExecutions.set(execId, execution as any);

  const origNode = store.executionNodes.get(targetNode.id);
  if (origNode) {
    origNode.queueDepth = (origNode.queueDepth || 0) + 1;
    origNode.currentConcurrency = (origNode.currentConcurrency || 0) + 1;
    store.executionNodes.set(targetNode.id, origNode);
  }

  setTimeout(() => {
    const exec = store.taskExecutions.get(execId);
    if (exec) {
      exec.status = Math.random() > 0.25 ? 'success' : 'failed';
      exec.endTime = nowInternal();
      exec.duration = Math.floor(Math.random() * 300) + 30;
      if (exec.status === 'failed') {
        exec.errorMessage = '重试仍然失败，请检查任务配置或节点资源';
        const ft = store.failedTasks.get(failedTaskId);
        if (ft) {
          ft.status = ft.retryCount >= ft.maxRetries ? 'dead_letter' : 'pending_retry';
          ft.lastError = exec.errorMessage;
          ft.nextRetryAt = new Date(Date.now() + Math.pow(2, Math.min(ft.retryCount, 6)) * 60000).toISOString();
          if (ft.status === 'dead_letter') {
            const deadLetterId = generateIdInternal();
            store.deadLetters.set(deadLetterId, {
              id: deadLetterId,
              taskId: ft.taskId,
              executionId: execId,
              taskData: { taskName: ft.taskName, taskType: task?.type },
              errorInfo: {
                type: ft.errorType,
                message: ft.errorMessage,
                lastError: ft.lastError,
              },
              deadAt: nowInternal(),
              handled: false,
              tenantId: task?.tenantId || ft.tenantId,
            } as any);
          }
          store.failedTasks.set(failedTaskId, ft);
        }
      } else {
        store.failedTasks.delete(failedTaskId);
      }
      store.taskExecutions.set(execId, exec);

      const runningNode = store.executionNodes.get(exec.nodeId);
      if (runningNode) {
        runningNode.queueDepth = Math.max(0, (runningNode.queueDepth || 1) - 1);
        runningNode.currentConcurrency = Math.max(0, (runningNode.currentConcurrency || 1) - 1);
        store.executionNodes.set(exec.nodeId, runningNode);
      }
    }
  }, 2500);

  return { success: true, execution };
}

export async function getFailedTasks(req: AuthRequest, res: Response<ApiResponse<PageResponse<FailedTask>>>) {
  const { page = 1, pageSize = 20, status } = req.query as any;
  
  let tasks = Array.from(store.failedTasks.values())
    .sort((a, b) => new Date(b.failedAt).getTime() - new Date(a.failedAt).getTime());
  
  if (status) {
    tasks = tasks.filter(t => t.status === status);
  }

  const total = tasks.length;
  const start = (page - 1) * pageSize;

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      list: tasks.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    },
    timestamp: Date.now(),
  });
}

export async function retryTask(req: AuthRequest, res: Response<ApiResponse<any>>) {
  const { id } = req.params;
  const result = executeRetryForTask(id);

  if (!result.success) {
    return res.status(404).json({
      code: 404,
      message: result.message || '失败任务不存在',
      data: null as any,
      timestamp: Date.now(),
    });
  }

  const failedTask = store.failedTasks.get(id);
  res.json({
    code: 200,
    message: `重试已触发，智能路由分配至：${result.execution?.nodeName}`,
    data: { failedTask, execution: result.execution },
    timestamp: Date.now(),
  });
}

export async function batchRetry(req: AuthRequest, res: Response<ApiResponse<any>>) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      code: 400,
      message: '请选择要重试的任务',
      data: null as any,
      timestamp: Date.now(),
    });
  }

  const results: Array<{ id: string; success: boolean; executionId?: string; nodeName?: string; message?: string }> = [];

  for (const id of ids) {
    const result = executeRetryForTask(id);
    results.push({
      id,
      success: result.success,
      executionId: result.execution?.id,
      nodeName: result.execution?.nodeName,
      message: result.success ? `已分配至 ${result.execution?.nodeName}` : result.message,
    });
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;

  res.json({
    code: 200,
    message: `批量重试处理完成：成功触发 ${successCount} 个，失败 ${failCount} 个`,
    data: {
      count: ids.length,
      successCount,
      failCount,
      results,
    },
    timestamp: Date.now(),
  });
}

export async function getDeadLetters(req: AuthRequest, res: Response<ApiResponse<PageResponse<DeadLetter>>>) {
  const { page = 1, pageSize = 20, handled } = req.query as any;
  
  let letters = Array.from(store.deadLetters.values())
    .sort((a, b) => new Date(b.deadAt).getTime() - new Date(a.deadAt).getTime());
  
  if (handled !== undefined) {
    letters = letters.filter(l => l.handled === (handled === 'true'));
  }

  const total = letters.length;
  const start = (page - 1) * pageSize;

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      list: letters.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    },
    timestamp: Date.now(),
  });
}

export async function handleDeadLetter(req: AuthRequest, res: Response<ApiResponse<DeadLetter>>) {
  const { id } = req.params;
  const { handlerNote, requeue = false } = req.body;
  
  const deadLetter = store.deadLetters.get(id);
  
  if (!deadLetter) {
    return res.status(404).json({
      code: 404,
      message: '死信不存在',
      data: null as any,
      timestamp: Date.now(),
    });
  }

  deadLetter.handled = true;
  deadLetter.handledBy = req.userId;
  deadLetter.handledAt = nowInternal();
  deadLetter.handlerNote = handlerNote;
  store.deadLetters.set(id, deadLetter);

  if (requeue) {
    const failedId = generateIdInternal();
    store.failedTasks.set(failedId, {
      id: failedId,
      taskId: deadLetter.taskId,
      executionId: deadLetter.executionId,
      taskName: deadLetter.taskData?.taskName || '未知任务',
      errorType: deadLetter.errorInfo?.type || 'Unknown',
      errorMessage: deadLetter.errorInfo?.message || '未知错误',
      failedAt: nowInternal(),
      retryCount: 0,
      maxRetries: 3,
      retryStrategy: 'exponential',
      status: 'pending_retry',
    });
  }

  res.json({
    code: 200,
    message: '处理成功',
    data: deadLetter,
    timestamp: Date.now(),
  });
}

export async function getCanaryStrategies(req: AuthRequest, res: Response<ApiResponse<any[]>>) {
  const strategies = Array.from(store.canaryStrategies.values()).filter(s => s.tenantId === req.tenantId);
  
  const defaultStrategies: any[] = strategies.length > 0 ? strategies : [
    {
      id: 'canary-1',
      name: '新调度策略灰度',
      description: '测试新的智能调度算法效果',
      schedulingStrategyId: 'strategy-001',
      trafficPercentage: 20,
      targetUsers: [],
      targetTags: ['experimental'],
      startTime: new Date().toISOString(),
      status: 'running',
      metrics: {
        successRate: 96.5,
        baselineSuccessRate: 95.2,
        avgDuration: 125,
        baselineAvgDuration: 140,
        errorRate: 3.5,
        baselineErrorRate: 4.8,
      },
      createdBy: req.userId,
      tenantId: req.tenantId,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'canary-2',
      name: '高优任务优先级调整',
      description: '调整高优先级任务的权重配置',
      schedulingStrategyId: 'strategy-002',
      trafficPercentage: 10,
      targetUsers: [],
      targetTags: ['high-priority'],
      startTime: new Date(Date.now() - 172800000).toISOString(),
      status: 'draft',
      metrics: {
        successRate: 0,
        baselineSuccessRate: 95.2,
        avgDuration: 0,
        baselineAvgDuration: 140,
        errorRate: 0,
        baselineErrorRate: 4.8,
      },
      createdBy: req.userId,
      tenantId: req.tenantId,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  res.json({
    code: 200,
    message: '获取成功',
    data: defaultStrategies,
    timestamp: Date.now(),
  });
}

export default {
  getFailedTasks,
  retryTask,
  batchRetry,
  getDeadLetters,
  handleDeadLetter,
  getCanaryStrategies,
};
