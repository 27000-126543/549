import { v4 as uuidv4 } from 'uuid';
import { store, initDatabase, generateIdInternal, nowInternal, TENANT_ID, ADMIN_ID, FLOW_ID, STRATEGY_ID } from '../api/database';
import type { FailedTask, TaskExecution } from '../shared/types';

export function seedData() {
  console.log('========================================');
  console.log('  企业级任务调度平台 - 演示数据填充');
  console.log('========================================');
  console.log('');

  initDatabase();

  const taskTypes: any[] = ['api', 'email', 'file', 'cron', 'manual'];
  const priorities: any[] = ['low', 'medium', 'high', 'urgent'];
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
    '性能测试任务',
    '月度财务报表',
    '客户积分结算',
    '数据仓库ETL',
    'CDN缓存刷新',
    'SSL证书巡检',
  ];

  const existingTaskCount = store.tasks.size;
  console.log(`现有任务数: ${existingTaskCount}，开始追加演示数据...`);

  for (let i = 0; i < 15; i++) {
    const taskId = generateIdInternal();
    const taskType = taskTypes[i % taskTypes.length];
    const priority = priorities[i % priorities.length];
    const statusCycle: any[] = ['active', 'paused', 'pending_approval', 'draft', 'active'];
    const status = statusCycle[i % statusCycle.length];

    const triggerConfig: any = { type: taskType };
    if (taskType === 'cron') triggerConfig.cronExpression = '0 0 2 * * ?';
    if (taskType === 'email') triggerConfig.emailRules = [{ subjectContains: '订单通知' }];
    if (taskType === 'file') triggerConfig.fileRules = [{ directory: '/data/input', pattern: '*.csv' }];

    const dagConfig = {
      nodes: [
        { id: 'start', name: '开始', type: 'start' as const, config: {}, position: { x: 100, y: 200 } },
        { id: 'task-1', name: '数据处理', type: 'task' as const, config: { command: 'process_data.sh', timeout: 3600 }, position: { x: 300, y: 200 } },
        { id: 'end', name: '结束', type: 'end' as const, config: {}, position: { x: 500, y: 200 } },
      ],
      edges: [
        { source: 'start', target: 'task-1' },
        { source: 'task-1', target: 'end' },
      ],
    };

    const task = {
      id: taskId,
      name: taskNames[i % taskNames.length],
      description: `这是${taskNames[i % taskNames.length]}的演示描述信息（种子数据）`,
      type: taskType,
      priority,
      status,
      triggerConfig,
      dagConfig,
      approvalFlowId: FLOW_ID,
      schedulingStrategyId: STRATEGY_ID,
      createdBy: ADMIN_ID,
      projectId: 'project-001',
      tenantId: TENANT_ID,
      createdAt: new Date(Date.now() - (i + 1) * 3600000 * 6).toISOString(),
      updatedAt: new Date(Date.now() - (i + 1) * 3600000 * 3).toISOString(),
    };
    store.tasks.set(taskId, task as any);

    if (i < 10) {
      const execId = generateIdInternal();
      const execStatuses: any[] = ['success', 'failed', 'running', 'success', 'success', 'success', 'failed', 'running'];
      const execStatus = execStatuses[i % execStatuses.length];
      const startTime = new Date(Date.now() - (i + 1) * 3600000).toISOString();
      const duration = Math.floor(Math.random() * 300) + 30;
      const endTime = execStatus !== 'running' ? new Date(Date.now() - (i + 1) * 3600000 + duration * 1000).toISOString() : undefined;

      const nodeArr = Array.from(store.executionNodes.keys());
      const nodeId = nodeArr[i % nodeArr.length];

      const execution: TaskExecution = {
        id: execId,
        taskId,
        taskName: task.name,
        status: execStatus,
        nodeId,
        startTime,
        endTime,
        duration: execStatus !== 'running' ? duration : undefined,
        errorMessage: execStatus === 'failed' ? '连接超时，请检查网络配置' : undefined,
        retryCount: 0,
        outputData: { processedRecords: 1000 + i * 100 },
      };
      store.taskExecutions.set(execId, execution);

      if (execStatus === 'failed' && i < 5) {
        const failedId = generateIdInternal();
        const failedTask: FailedTask = {
          id: failedId,
          taskId,
          executionId: execId,
          taskName: task.name,
          errorType: 'NetworkError',
          errorMessage: '连接超时，请检查网络配置',
          failedAt: new Date(Date.now() - i * 1800000).toISOString(),
          retryCount: i % 3,
          maxRetries: 3,
          retryStrategy: 'exponential',
          nextRetryAt: new Date(Date.now() + (i + 1) * 60000).toISOString(),
          status: i % 3 === 0 ? 'pending_retry' : i % 3 === 1 ? 'pending_retry' : 'pending_retry',
          tenantId: TENANT_ID,
        };
        store.failedTasks.set(failedId, failedTask);
      }
    }
  }

  for (let i = 0; i < 15; i++) {
    const auditId = generateIdInternal();
    const actions = ['create', 'update', 'delete', 'login', 'execute', 'approve', 'reject'];
    const resourceTypes = ['task', 'user', 'project', 'system', 'approval', 'schedule'];
    const log = {
      id: auditId,
      userId: ADMIN_ID,
      userName: 'admin',
      action: actions[i % actions.length],
      resourceType: resourceTypes[i % resourceTypes.length],
      resourceId: uuidv4(),
      ipAddress: `192.168.1.${(i % 254) + 1}`,
      userAgent: 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36',
      createdAt: new Date(Date.now() - (i + 1) * 3600000 * 2).toISOString(),
      tenantId: TENANT_ID,
    };
    store.auditLogs.set(auditId, log);
  }

  console.log('');
  console.log('✓ 种子数据填充完成！新增统计：');
  console.log(`  - 新增任务: ~15 条`);
  console.log(`  - 新增执行记录: ~10 条`);
  console.log(`  - 新增失败任务: ~5 条`);
  console.log(`  - 新增审计日志: ~15 条`);
  console.log('');
  console.log('  当前总数据量：');
  console.log(`  - 任务总数: ${store.tasks.size}`);
  console.log(`  - 执行记录总数: ${store.taskExecutions.size}`);
  console.log(`  - 失败任务总数: ${store.failedTasks.size}`);
  console.log(`  - 审计日志总数: ${store.auditLogs.size}`);
  console.log('');
  console.log('========================================');
}

if (process.argv[1] && process.argv[1].includes('seed-data')) {
  seedData();
}

export default seedData;
