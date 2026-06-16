import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { runQuery, getOne, beginTransaction, commitTransaction, rollbackTransaction } from '../api/database';
import { initDatabase } from './init-db';

const TENANT_ID = 'tenant-001';
const ADMIN_ID = 'user-admin';
const DEPT_ID = 'dept-001';
const ROLE_ID = 'role-admin';
const PROJECT_ID = 'project-001';
const FLOW_ID = 'flow-001';
const STRATEGY_ID = 'strategy-001';

function jsonStringify(obj: any): string {
  return JSON.stringify(obj);
}

function jsonParse(str: string): any {
  return JSON.parse(str);
}

export function seedData() {
  console.log('Seeding database...');
  
  beginTransaction();
  
  try {
    const existingTenant = getOne('SELECT id FROM tenants WHERE id = ?', [TENANT_ID]);
    if (existingTenant) {
      console.log('Database already seeded, skipping...');
      rollbackTransaction();
      return;
    }

    const hashedPassword = bcrypt.hashSync('admin123', 10);

    runQuery(
      'INSERT INTO tenants (id, name, code, status, max_concurrency, resource_limit) VALUES (?, ?, ?, ?, ?, ?)',
      [
        TENANT_ID,
        '默认企业',
        'DEFAULT',
        'active',
        100,
        jsonStringify({
          cpuCores: 64,
          memoryGB: 256,
          storageGB: 2048,
          maxTasks: 1000
        })
      ]
    );

    runQuery(
      'INSERT INTO departments (id, name, parent_id, manager_id, tenant_id) VALUES (?, ?, ?, ?, ?)',
      [DEPT_ID, '技术部', null, ADMIN_ID, TENANT_ID]
    );

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

    runQuery(
      'INSERT INTO roles (id, name, code, permissions, data_scope, tenant_id) VALUES (?, ?, ?, ?, ?, ?)',
      [
        ROLE_ID,
        '超级管理员',
        'SUPER_ADMIN',
        jsonStringify(allPermissions),
        'all',
        TENANT_ID
      ]
    );

    runQuery(
      'INSERT INTO users (id, username, email, password_hash, department_id, tenant_id, role_ids, project_ids, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        ADMIN_ID,
        'admin',
        'admin@example.com',
        hashedPassword,
        DEPT_ID,
        TENANT_ID,
        jsonStringify([ROLE_ID]),
        jsonStringify([PROJECT_ID]),
        'active'
      ]
    );

    runQuery(
      'INSERT INTO projects (id, name, description, owner_id, tenant_id) VALUES (?, ?, ?, ?, ?)',
      [
        PROJECT_ID,
        '默认项目',
        '系统默认项目',
        ADMIN_ID,
        TENANT_ID
      ]
    );

    runQuery(
      'INSERT INTO approval_flows (id, name, tenant_id, nodes, is_default) VALUES (?, ?, ?, ?, ?)',
      [
        FLOW_ID,
        '默认审批流',
        TENANT_ID,
        jsonStringify([
          {
            id: 'node-1',
            name: '部门经理审批',
            type: 'sequential',
            approvers: [ADMIN_ID],
            timeout: 86400,
            order: 0
          }
        ]),
        1
      ]
    );

    runQuery(
      'INSERT INTO scheduling_strategies (id, name, algorithm, weight_config, is_default, tenant_id) VALUES (?, ?, ?, ?, ?, ?)',
      [
        STRATEGY_ID,
        '默认调度策略',
        'least_load',
        jsonStringify({
          cpu: 0.4,
          memory: 0.3,
          queue: 0.2,
          priority: 0.1
        }),
        1,
        TENANT_ID
      ]
    );

    const nodeIds = ['node-exec-1', 'node-exec-2', 'node-exec-3'];
    const nodeNames = ['执行节点-01', '执行节点-02', '执行节点-03'];
    const nodeIps = ['192.168.1.101', '192.168.1.102', '192.168.1.103'];

    for (let i = 0; i < 3; i++) {
      runQuery(
        'INSERT INTO execution_nodes (id, name, ip, status, cpu_usage, memory_usage, disk_usage, queue_depth, tags, max_concurrency, current_concurrency, tenant_id, load_average) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          nodeIds[i],
          nodeNames[i],
          nodeIps[i],
          'online',
          Math.random() * 60 + 20,
          Math.random() * 50 + 30,
          Math.random() * 40 + 20,
          Math.floor(Math.random() * 10),
          jsonStringify(['general', 'cpu-intensive']),
          20,
          Math.floor(Math.random() * 10),
          TENANT_ID,
          jsonStringify([Math.random() * 2, Math.random() * 2, Math.random() * 2])
        ]
      );
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
      const taskId = uuidv4();
      const taskType = taskTypes[i % taskTypes.length];
      const priority = priorities[i % priorities.length];
      const status = statuses[i % statuses.length];
      
      const triggerConfig = {
        type: taskType,
        cronExpression: taskType === 'cron' ? '0 0 2 * * ?' : undefined,
        emailRules: taskType === 'email' ? [{ subjectContains: '订单通知' }] : undefined,
        fileRules: taskType === 'file' ? [{ directory: '/data/input', pattern: '*.csv' }] : undefined
      };

      const dagConfig = {
        nodes: [
          {
            id: 'start',
            name: '开始',
            type: 'start',
            config: {},
            position: { x: 100, y: 200 }
          },
          {
            id: 'task-1',
            name: '数据处理',
            type: 'task',
            config: { command: 'process_data.sh', timeout: 3600 },
            position: { x: 300, y: 200 }
          },
          {
            id: 'end',
            name: '结束',
            type: 'end',
            config: {},
            position: { x: 500, y: 200 }
          }
        ],
        edges: [
          { source: 'start', target: 'task-1' },
          { source: 'task-1', target: 'end' }
        ]
      };

      runQuery(
        'INSERT INTO tasks (id, name, description, type, priority, status, created_by, project_id, tenant_id, trigger_config, dag_config, approval_flow_id, scheduling_strategy_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          taskId,
          taskNames[i % taskNames.length],
          `这是${taskNames[i % taskNames.length]}的描述信息`,
          taskType,
          priority,
          status,
          ADMIN_ID,
          PROJECT_ID,
          TENANT_ID,
          jsonStringify(triggerConfig),
          jsonStringify(dagConfig),
          FLOW_ID,
          STRATEGY_ID
        ]
      );

      if (i < 10) {
        const execId = uuidv4();
        const execStatus = ['success', 'failed', 'running', 'success', 'success'][i % 5];
        const startTime = new Date(Date.now() - i * 3600000).toISOString();
        const duration = Math.floor(Math.random() * 300) + 30;
        const endTime = execStatus !== 'running' ? new Date(Date.now() - i * 3600000 + duration * 1000).toISOString() : null;

        runQuery(
          'INSERT INTO task_executions (id, task_id, task_name, status, node_id, start_time, end_time, duration, error_message, retry_count, output_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            execId,
            taskId,
            taskNames[i % taskNames.length],
            execStatus,
            nodeIds[i % 3],
            startTime,
            endTime,
            execStatus !== 'running' ? duration : null,
            execStatus === 'failed' ? '连接超时，请检查网络配置' : null,
            0,
            jsonStringify({ processedRecords: 1000 + i * 100 })
          ]
        );

        if (execStatus === 'failed' && i < 3) {
          runQuery(
            'INSERT INTO failed_tasks (id, task_id, execution_id, task_name, error_type, error_message, failed_at, retry_count, max_retries, retry_strategy, next_retry_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              uuidv4(),
              taskId,
              execId,
              taskNames[i % taskNames.length],
              'NetworkError',
              '连接超时，请检查网络配置',
              new Date().toISOString(),
              1,
              3,
              'exponential',
              new Date(Date.now() + 60000).toISOString(),
              'pending_retry'
            ]
          );
        }
      }
    }

    for (let i = 0; i < 2; i++) {
      const taskId = uuidv4();
      runQuery(
        'INSERT INTO approval_records (id, flow_id, task_id, node_id, approver_id, approver_name, status, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          uuidv4(),
          FLOW_ID,
          taskId,
          'node-1',
          ADMIN_ID,
          'admin',
          i === 0 ? 'pending' : 'approved',
          i === 0 ? null : '同意执行',
          new Date(Date.now() - i * 3600000).toISOString()
        ]
      );
    }

    const now = Date.now();
    for (let i = 0; i < 100; i++) {
      const timestamp = new Date(now - i * 60000).toISOString();
      for (let j = 0; j < 3; j++) {
        runQuery(
          'INSERT INTO metrics (id, node_id, metric_type, value, timestamp, tenant_id) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), nodeIds[j], 'cpu', Math.random() * 80 + 10, timestamp, TENANT_ID]
        );
        runQuery(
          'INSERT INTO metrics (id, node_id, metric_type, value, timestamp, tenant_id) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), nodeIds[j], 'memory', Math.random() * 70 + 20, timestamp, TENANT_ID]
        );
      }
    }

    for (let i = 0; i < 10; i++) {
      runQuery(
        'INSERT INTO audit_logs (id, user_id, user_name, action, resource_type, resource_id, ip_address, created_at, tenant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          uuidv4(),
          ADMIN_ID,
          'admin',
          ['create', 'update', 'delete', 'login', 'execute'][i % 5],
          ['task', 'user', 'project', 'system'][i % 4],
          uuidv4(),
          '192.168.1.' + (i + 1),
          new Date(Date.now() - i * 3600000 * 2).toISOString(),
          TENANT_ID
        ]
      );
    }

    commitTransaction();
    console.log('Database seeded successfully!');
    console.log('Default user: admin / admin123');
    
  } catch (error) {
    rollbackTransaction();
    console.error('Error seeding database:', error);
    throw error;
  }
}

if (require.main === module) {
  initDatabase();
  seedData();
}

export default seedData;
