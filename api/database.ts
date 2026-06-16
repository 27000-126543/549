import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import type {
  User, Tenant, Department, Role, Project, Task, TaskExecution,
  ExecutionNode, ApprovalFlow, ApprovalRecord, SchedulingStrategy,
  FailedTask, DeadLetter, AuditLog, CanaryStrategy, DashboardStats,
  PendingApproval, RealtimeMetrics, LoadForecast, CostData, HeatmapData,
  TrendData, ChartData
} from '../shared/types';

interface DataStore {
  tenants: Map<string, Tenant>;
  departments: Map<string, Department>;
  roles: Map<string, Role>;
  users: Map<string, User>;
  projects: Map<string, Project>;
  tasks: Map<string, Task>;
  taskExecutions: Map<string, TaskExecution>;
  executionNodes: Map<string, ExecutionNode>;
  approvalFlows: Map<string, ApprovalFlow>;
  approvalRecords: Map<string, ApprovalRecord>;
  schedulingStrategies: Map<string, SchedulingStrategy>;
  failedTasks: Map<string, FailedTask>;
  deadLetters: Map<string, DeadLetter>;
  auditLogs: Map<string, AuditLog>;
  canaryStrategies: Map<string, CanaryStrategy>;
  metrics: Array<{ nodeId: string; metricType: string; value: number; timestamp: string; tenantId: string }>;
}

export const store: DataStore = {
  tenants: new Map(),
  departments: new Map(),
  roles: new Map(),
  users: new Map(),
  projects: new Map(),
  tasks: new Map(),
  taskExecutions: new Map(),
  executionNodes: new Map(),
  approvalFlows: new Map(),
  approvalRecords: new Map(),
  schedulingStrategies: new Map(),
  failedTasks: new Map(),
  deadLetters: new Map(),
  auditLogs: new Map(),
  canaryStrategies: new Map(),
  metrics: []
};

export const TENANT_ID = 'tenant-001';
export const ADMIN_ID = 'user-admin';
export const DEPT_ID = 'dept-001';
export const ROLE_ID = 'role-admin';
export const PROJECT_ID = 'project-001';
export const FLOW_ID = 'flow-001';
export const STRATEGY_ID = 'strategy-001';

function generateId(): string {
  return uuidv4();
}

function now(): string {
  return new Date().toISOString();
}

export function initDatabase() {
  console.log('Initializing database...');
  
  if (store.tenants.size > 0) {
    console.log('Database already initialized');
    return;
  }

  const hashedPassword = bcrypt.hashSync('admin123', 10);

  store.tenants.set(TENANT_ID, {
    id: TENANT_ID,
    name: '默认企业',
    code: 'DEFAULT',
    status: 'active',
    maxConcurrency: 100,
    resourceLimit: {
      cpuCores: 64,
      memoryGB: 256,
      storageGB: 2048,
      maxTasks: 1000
    },
    createdAt: now(),
  });

  store.departments.set(DEPT_ID, {
    id: DEPT_ID,
    name: '技术部',
    parentId: null,
    managerId: ADMIN_ID,
    tenantId: TENANT_ID,
  });

  const allPermissions = [
    'task.view', 'task.create', 'task.edit', 'task.delete', 'task.execute',
    'scheduling.view', 'scheduling.edit',
    'approval.view', 'approval.approve',
    'monitoring.view',
    'analytics.view',
    'exception.view', 'exception.handle',
    'canary.manage',
    'tenant.manage',
    'permission.manage',
    'settings.view', 'settings.edit',
    'audit.view'
  ];

  store.roles.set(ROLE_ID, {
    id: ROLE_ID,
    name: '超级管理员',
    code: 'SUPER_ADMIN',
    permissions: allPermissions,
    dataScope: 'all',
    tenantId: TENANT_ID,
  });

  store.users.set(ADMIN_ID, {
    id: ADMIN_ID,
    username: 'admin',
    email: 'admin@example.com',
    departmentId: DEPT_ID,
    roleIds: [ROLE_ID],
    projectIds: [PROJECT_ID],
    tenantId: TENANT_ID,
    status: 'active',
    createdAt: now(),
  });

  store.projects.set(PROJECT_ID, {
    id: PROJECT_ID,
    name: '默认项目',
    description: '系统默认项目',
    ownerId: ADMIN_ID,
    tenantId: TENANT_ID,
    createdAt: now(),
  });

  store.approvalFlows.set(FLOW_ID, {
    id: FLOW_ID,
    name: '默认审批流',
    nodes: [
      {
        id: 'node-1',
        name: '部门经理审批',
        type: 'sequential',
        approvers: [ADMIN_ID],
        timeout: 86400,
        order: 0
      }
    ],
    isDefault: true,
    tenantId: TENANT_ID,
  });

  store.schedulingStrategies.set(STRATEGY_ID, {
    id: STRATEGY_ID,
    name: '默认调度策略',
    algorithm: 'least_load',
    weightConfig: {
      cpu: 0.4,
      memory: 0.3,
      queue: 0.2,
      priority: 0.1
    },
    isDefault: true,
    tenantId: TENANT_ID,
  });

  const nodeIds = ['node-exec-1', 'node-exec-2', 'node-exec-3'];
  const nodeNames = ['执行节点-01', '执行节点-02', '执行节点-03'];
  const nodeIps = ['192.168.1.101', '192.168.1.102', '192.168.1.103'];

  for (let i = 0; i < 3; i++) {
    store.executionNodes.set(nodeIds[i], {
      id: nodeIds[i],
      name: nodeNames[i],
      ip: nodeIps[i],
      status: 'online',
      cpuUsage: Math.random() * 60 + 20,
      memoryUsage: Math.random() * 50 + 30,
      diskUsage: Math.random() * 40 + 20,
      loadAverage: [Math.random() * 2, Math.random() * 2, Math.random() * 2],
      queueDepth: Math.floor(Math.random() * 10),
      tags: ['general', 'cpu-intensive'],
      maxConcurrency: 20,
      currentConcurrency: Math.floor(Math.random() * 10),
      tenantId: TENANT_ID,
      lastHeartbeat: now(),
    });
  }

  const taskTypes: any[] = ['api', 'email', 'file', 'cron', 'manual'];
  const priorities: any[] = ['low', 'medium', 'high', 'urgent'];
  const statuses: any[] = ['active', 'paused', 'pending_approval', 'draft'];
  const taskNames = [
    '每日数据同步任务',
    '用户行为分析报表',
    '数据库备份任务',
    '邮件营销发送',
    '文件转换处理',
    '系统健康检查',
    '订单超时处理',
    '库存预警通知',
    '日志清理任务',
    '性能测试任务'
  ];

  for (let i = 0; i < 15; i++) {
    const taskId = generateId();
    const taskType = taskTypes[i % taskTypes.length];
    const priority = priorities[i % priorities.length];
    const status = statuses[i % statuses.length];
    
    const triggerConfig: any = {
      type: taskType,
    };
    if (taskType === 'cron') triggerConfig.cronExpression = '0 0 2 * * ?';
    if (taskType === 'email') triggerConfig.emailRules = [{ subjectContains: '订单通知' }];
    if (taskType === 'file') triggerConfig.fileRules = [{ directory: '/data/input', pattern: '*.csv' }];

    const dagConfig = {
      nodes: [
        {
          id: 'start',
          name: '开始',
          type: 'start' as const,
          config: {},
          position: { x: 100, y: 200 }
        },
        {
          id: 'task-1',
          name: '数据处理',
          type: 'task' as const,
          config: { command: 'process_data.sh', timeout: 3600 },
          position: { x: 300, y: 200 }
        },
        {
          id: 'end',
          name: '结束',
          type: 'end' as const,
          config: {},
          position: { x: 500, y: 200 }
        }
      ],
      edges: [
        { source: 'start', target: 'task-1' },
        { source: 'task-1', target: 'end' }
      ]
    };

    store.tasks.set(taskId, {
      id: taskId,
      name: taskNames[i % taskNames.length],
      description: `这是${taskNames[i % taskNames.length]}的描述信息`,
      type: taskType,
      priority,
      status,
      createdBy: ADMIN_ID,
      projectId: PROJECT_ID,
      tenantId: TENANT_ID,
      triggerConfig,
      dagConfig,
      approvalFlowId: FLOW_ID,
      schedulingStrategyId: STRATEGY_ID,
      createdAt: now(),
      updatedAt: now(),
    });

    if (i < 10) {
      const execId = generateId();
      const execStatus: any = ['success', 'failed', 'running', 'success', 'success'][i % 5];
      const startTime = new Date(Date.now() - i * 3600000).toISOString();
      const duration = Math.floor(Math.random() * 300) + 30;
      const endTime = execStatus !== 'running' ? new Date(Date.now() - i * 3600000 + duration * 1000).toISOString() : undefined;

      store.taskExecutions.set(execId, {
        id: execId,
        taskId,
        taskName: taskNames[i % taskNames.length],
        status: execStatus,
        nodeId: nodeIds[i % 3],
        startTime,
        endTime,
        duration: execStatus !== 'running' ? duration : undefined,
        errorMessage: execStatus === 'failed' ? '连接超时，请检查网络配置' : undefined,
        retryCount: 0,
        outputData: { processedRecords: 1000 + i * 100 },
      });

      if (execStatus === 'failed' && i < 3) {
        const failedId = generateId();
        store.failedTasks.set(failedId, {
          id: failedId,
          taskId,
          executionId: execId,
          taskName: taskNames[i % taskNames.length],
          errorType: 'NetworkError',
          errorMessage: '连接超时，请检查网络配置',
          failedAt: now(),
          retryCount: 1,
          maxRetries: 3,
          retryStrategy: 'exponential',
          nextRetryAt: new Date(Date.now() + 60000).toISOString(),
          status: 'pending_retry',
        });
      }
    }
  }

  for (let i = 0; i < 5; i++) {
    const recordId = generateId();
    const taskIds = Array.from(store.tasks.keys());
    store.approvalRecords.set(recordId, {
      id: recordId,
      flowId: FLOW_ID,
      taskId: taskIds[i] || generateId(),
      nodeId: 'node-1',
      approverId: ADMIN_ID,
      approverName: 'admin',
      status: i === 0 ? 'pending' : 'approved',
      comment: i === 0 ? undefined : '同意执行',
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    });
  }

  const timestamp = Date.now();
  for (let i = 0; i < 100; i++) {
    const ts = new Date(timestamp - i * 60000).toISOString();
    for (let j = 0; j < 3; j++) {
      store.metrics.push({
        nodeId: nodeIds[j],
        metricType: 'cpu',
        value: Math.random() * 80 + 10,
        timestamp: ts,
        tenantId: TENANT_ID,
      });
      store.metrics.push({
        nodeId: nodeIds[j],
        metricType: 'memory',
        value: Math.random() * 70 + 20,
        timestamp: ts,
        tenantId: TENANT_ID,
      });
    }
  }

  for (let i = 0; i < 15; i++) {
    const logId = generateId();
    store.auditLogs.set(logId, {
      id: logId,
      userId: ADMIN_ID,
      userName: 'admin',
      action: ['create', 'update', 'delete', 'login', 'execute'][i % 5],
      resourceType: ['task', 'user', 'project', 'system'][i % 4],
      resourceId: generateId(),
      ipAddress: '192.168.1.' + (i + 1),
      createdAt: new Date(Date.now() - i * 3600000 * 2).toISOString(),
      tenantId: TENANT_ID,
    });
  }

  console.log('Database initialized successfully!');
  console.log('Default user: admin / admin123');
}

export function getDashboardStats(): DashboardStats {
  const now = Date.now();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  
  const todayTasks = Array.from(store.taskExecutions.values()).filter(
    e => new Date(e.startTime).getTime() > dayStart.getTime()
  ).length;

  const successCount = Array.from(store.taskExecutions.values()).filter(e => e.status === 'success').length;
  const totalCount = Array.from(store.taskExecutions.values()).filter(e => e.status !== 'running').length;
  const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 95.5;

  const durations = Array.from(store.taskExecutions.values())
    .filter(e => e.duration)
    .map(e => e.duration!);
  const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 120;

  const nodes = Array.from(store.executionNodes.values());
  const resourceUsage = nodes.length > 0 
    ? nodes.reduce((sum, n) => sum + n.cpuUsage, 0) / nodes.length 
    : 45;

  const runningTasks = Array.from(store.taskExecutions.values()).filter(e => e.status === 'running').length;
  const pendingApprovals = Array.from(store.approvalRecords.values()).filter(r => r.status === 'pending').length;

  const tasksTrend: TrendData[] = [];
  const successRateTrend: TrendData[] = [];
  const resourceTrend: TrendData[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const ts = now - i * 24 * 3600 * 1000;
    tasksTrend.push({ timestamp: ts, value: Math.floor(Math.random() * 50) + 100 });
    successRateTrend.push({ timestamp: ts, value: Math.random() * 10 + 90 });
    resourceTrend.push({ timestamp: ts, value: Math.random() * 20 + 40 });
  }

  const taskTypeDistribution: ChartData[] = [
    { name: 'API触发', value: 35 },
    { name: '邮件触发', value: 20 },
    { name: '文件监控', value: 15 },
    { name: '定时任务', value: 25 },
    { name: '手动触发', value: 5 },
  ];

  return {
    todayTasks,
    successRate,
    avgDuration,
    resourceUsage,
    runningTasks,
    pendingApprovals,
    activeAlerts: 3,
    tasksTrend,
    successRateTrend,
    resourceTrend,
    taskTypeDistribution,
  };
}

export function getRealtimeMetrics(): RealtimeMetrics {
  const nodes = Array.from(store.executionNodes.values());
  
  return {
    timestamp: Date.now(),
    nodes: nodes.map(n => ({
      nodeId: n.id,
      nodeName: n.name,
      cpuUsage: n.cpuUsage + (Math.random() - 0.5) * 10,
      memoryUsage: n.memoryUsage + (Math.random() - 0.5) * 5,
      diskUsage: n.diskUsage,
      networkIn: Math.random() * 100,
      networkOut: Math.random() * 80,
      loadAverage: n.loadAverage,
    })),
    queues: [
      { queueName: 'default', depth: Math.floor(Math.random() * 20), waitingTime: Math.random() * 60, consumeRate: Math.random() * 10 + 5, produceRate: Math.random() * 8 + 3 },
      { queueName: 'high_priority', depth: Math.floor(Math.random() * 5), waitingTime: Math.random() * 10, consumeRate: Math.random() * 20 + 10, produceRate: Math.random() * 15 + 5 },
      { queueName: 'low_priority', depth: Math.floor(Math.random() * 50), waitingTime: Math.random() * 300, consumeRate: Math.random() * 3 + 1, produceRate: Math.random() * 5 + 2 },
    ],
  };
}

export function getLoadForecast(): LoadForecast {
  const now = Date.now();
  const timestamps: number[] = [];
  const predictedCpu: number[] = [];
  const predictedMemory: number[] = [];
  const predictedQueue: number[] = [];
  const confidence: number[] = [];

  for (let i = 0; i < 24; i++) {
    const ts = now + i * 3600 * 1000;
    timestamps.push(ts);
    const hour = new Date(ts).getHours();
    const baseLoad = hour >= 9 && hour <= 18 ? 60 : 30;
    predictedCpu.push(baseLoad + Math.sin(i / 6) * 20 + Math.random() * 10);
    predictedMemory.push(baseLoad * 0.8 + Math.sin(i / 6) * 15 + Math.random() * 5);
    predictedQueue.push(baseLoad * 0.3 + Math.sin(i / 6) * 10 + Math.random() * 5);
    confidence.push(Math.max(50, 95 - i * 2));
  }

  return { timestamps, predictedCpu, predictedMemory, predictedQueue, confidence };
}

export function getCostData(): CostData[] {
  return [
    { department: '技术部', cpuHours: 1200, memoryHours: 800, cost: 15600, percentage: 35 },
    { department: '数据部', cpuHours: 950, memoryHours: 1200, cost: 14800, percentage: 33 },
    { department: '运营部', cpuHours: 600, memoryHours: 400, cost: 7200, percentage: 16 },
    { department: '市场部', cpuHours: 400, memoryHours: 300, cost: 4500, percentage: 10 },
    { department: '财务部', cpuHours: 200, memoryHours: 150, cost: 2700, percentage: 6 },
  ];
}

export function getHeatmapData(): HeatmapData[] {
  const data: HeatmapData[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      let value = 20;
      if (hour >= 9 && hour <= 18) value = 60 + Math.random() * 30;
      if (hour >= 1 && hour <= 5) value = 10 + Math.random() * 15;
      if (day >= 5) value *= 0.6;
      data.push({ day, hour, value });
    }
  }
  return data;
}

export function getPendingApprovals(userId: string): PendingApproval[] {
  return Array.from(store.approvalRecords.values())
    .filter(r => r.status === 'pending' && r.approverId === userId)
    .map(r => {
      const task = store.tasks.get(r.taskId);
      return {
        id: r.id,
        taskId: r.taskId,
        taskName: task?.name || '未知任务',
        taskType: task?.type || 'manual',
        submitter: task?.createdBy || ADMIN_ID,
        submitterName: 'admin',
        submitTime: r.createdAt,
        nodeName: '部门经理审批',
        deadline: new Date(new Date(r.createdAt).getTime() + 86400000).toISOString(),
      };
    });
}

export function generateIdInternal(): string {
  return generateId();
}

export function nowInternal(): string {
  return now();
}

export default {
  initDatabase,
  store,
  getDashboardStats,
  getRealtimeMetrics,
  getLoadForecast,
  getCostData,
  getHeatmapData,
  getPendingApprovals,
};
