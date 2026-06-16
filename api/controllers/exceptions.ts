import { Response } from 'express';
import { store, generateIdInternal, nowInternal } from '../database';
import type { AuthRequest } from '../middleware/auth';
import type { ApiResponse, PageResponse, FailedTask, DeadLetter } from '../../shared/types';

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
  const failedTask = store.failedTasks.get(id);

  if (!failedTask) {
    return res.status(404).json({
      code: 404,
      message: '失败任务不存在',
      data: null as any,
      timestamp: Date.now(),
    });
  }

  failedTask.status = 'retrying';
  failedTask.retryCount += 1;
  store.failedTasks.set(id, failedTask);

  const execId = generateIdInternal();
  const nodes = Array.from(store.executionNodes.values());
  const targetNode = nodes[Math.floor(Math.random() * nodes.length)];

  const execution = {
    id: execId,
    taskId: failedTask.taskId,
    taskName: failedTask.taskName,
    status: 'running',
    nodeId: targetNode.id,
    startTime: nowInternal(),
    retryCount: failedTask.retryCount,
  };

  store.taskExecutions.set(execId, execution as any);

  setTimeout(() => {
    const exec = store.taskExecutions.get(execId);
    if (exec) {
      exec.status = Math.random() > 0.3 ? 'success' : 'failed';
      exec.endTime = nowInternal();
      exec.duration = Math.floor(Math.random() * 300) + 30;
      if (exec.status === 'failed') {
        exec.errorMessage = '重试仍然失败';
        failedTask.status = failedTask.retryCount >= failedTask.maxRetries ? 'dead_letter' : 'pending_retry';
        failedTask.nextRetryAt = new Date(Date.now() + Math.pow(2, failedTask.retryCount) * 60000).toISOString();
        
        if (failedTask.status === 'dead_letter') {
          const deadLetterId = generateIdInternal();
          store.deadLetters.set(deadLetterId, {
            id: deadLetterId,
            taskId: failedTask.taskId,
            executionId: execId,
            taskData: { taskName: failedTask.taskName },
            errorInfo: {
              type: failedTask.errorType,
              message: failedTask.errorMessage,
            },
            deadAt: nowInternal(),
            handled: false,
          });
        }
        
        store.failedTasks.set(id, failedTask);
      } else {
        store.failedTasks.delete(id);
      }
      store.taskExecutions.set(execId, exec);
    }
  }, 2000);

  res.json({
    code: 200,
    message: '重试已触发',
    data: { failedTask, execution },
    timestamp: Date.now(),
  });
}

export async function batchRetry(req: AuthRequest, res: Response<ApiResponse<any>>) {
  const { ids } = req.body;
  
  const results = ids.map(async (id: string) => {
    const failedTask = store.failedTasks.get(id);
    if (failedTask) {
      failedTask.status = 'retrying';
      failedTask.retryCount += 1;
      store.failedTasks.set(id, failedTask);
      return { id, success: true };
    }
    return { id, success: false, error: '任务不存在' };
  });

  res.json({
    code: 200,
    message: '批量重试已触发',
    data: { count: ids.length },
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
