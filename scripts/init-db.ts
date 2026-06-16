import { runQuery } from '../api/database';

const tables = [
  `CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    max_concurrency INTEGER NOT NULL DEFAULT 100,
    resource_limit TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expired_at TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT,
    manager_id TEXT,
    tenant_id TEXT NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES departments(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  )`,

  `CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    permissions TEXT NOT NULL,
    data_scope TEXT NOT NULL DEFAULT 'self',
    tenant_id TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  )`,

  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    department_id TEXT,
    tenant_id TEXT NOT NULL,
    role_ids TEXT NOT NULL,
    project_ids TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  )`,

  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  )`,

  `CREATE TABLE IF NOT EXISTS approval_flows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    nodes TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  )`,

  `CREATE TABLE IF NOT EXISTS scheduling_strategies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    algorithm TEXT NOT NULL,
    weight_config TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    tenant_id TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  )`,

  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'draft',
    created_by TEXT NOT NULL,
    project_id TEXT,
    tenant_id TEXT NOT NULL,
    trigger_config TEXT NOT NULL,
    dag_config TEXT NOT NULL,
    approval_flow_id TEXT,
    scheduling_strategy_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (approval_flow_id) REFERENCES approval_flows(id),
    FOREIGN KEY (scheduling_strategy_id) REFERENCES scheduling_strategies(id)
  )`,

  `CREATE TABLE IF NOT EXISTS execution_nodes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    ip TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'offline',
    cpu_usage REAL NOT NULL DEFAULT 0,
    memory_usage REAL NOT NULL DEFAULT 0,
    disk_usage REAL NOT NULL DEFAULT 0,
    queue_depth INTEGER NOT NULL DEFAULT 0,
    tags TEXT NOT NULL,
    max_concurrency INTEGER NOT NULL DEFAULT 10,
    current_concurrency INTEGER NOT NULL DEFAULT 0,
    tenant_id TEXT,
    last_heartbeat TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    load_average TEXT NOT NULL DEFAULT '[]',
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  )`,

  `CREATE TABLE IF NOT EXISTS task_executions (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    task_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    node_id TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT,
    duration INTEGER,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    output_data TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (node_id) REFERENCES execution_nodes(id)
  )`,

  `CREATE TABLE IF NOT EXISTS approval_records (
    id TEXT PRIMARY KEY,
    flow_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    node_id TEXT NOT NULL,
    approver_id TEXT NOT NULL,
    approver_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    comment TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (flow_id) REFERENCES approval_flows(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (approver_id) REFERENCES users(id)
  )`,

  `CREATE TABLE IF NOT EXISTS failed_tasks (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    execution_id TEXT NOT NULL,
    task_name TEXT NOT NULL,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    failed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    retry_strategy TEXT NOT NULL DEFAULT 'exponential',
    next_retry_at TEXT,
    status TEXT NOT NULL DEFAULT 'pending_retry',
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (execution_id) REFERENCES task_executions(id)
  )`,

  `CREATE TABLE IF NOT EXISTS dead_letters (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    execution_id TEXT NOT NULL,
    task_data TEXT NOT NULL,
    error_info TEXT NOT NULL,
    dead_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    handled INTEGER NOT NULL DEFAULT 0,
    handled_by TEXT,
    handled_at TEXT,
    handler_note TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (execution_id) REFERENCES task_executions(id),
    FOREIGN KEY (handled_by) REFERENCES users(id)
  )`,

  `CREATE TABLE IF NOT EXISTS metrics (
    id TEXT PRIMARY KEY,
    node_id TEXT,
    metric_type TEXT NOT NULL,
    value REAL NOT NULL,
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tenant_id TEXT,
    FOREIGN KEY (node_id) REFERENCES execution_nodes(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  )`,

  `CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tenant_id TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  )`,

  `CREATE TABLE IF NOT EXISTS canary_strategies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    scheduling_strategy_id TEXT NOT NULL,
    traffic_percentage INTEGER NOT NULL DEFAULT 10,
    target_users TEXT NOT NULL,
    target_tags TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    metrics TEXT NOT NULL,
    created_by TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scheduling_strategy_id) REFERENCES scheduling_strategies(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  )`,
];

const indexes = [
  'CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(tenant_id)',
  'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)',
  'CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id)',
  'CREATE INDEX IF NOT EXISTS idx_executions_task ON task_executions(task_id)',
  'CREATE INDEX IF NOT EXISTS idx_executions_status ON task_executions(status)',
  'CREATE INDEX IF NOT EXISTS idx_executions_node ON task_executions(node_id)',
  'CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp)',
  'CREATE INDEX IF NOT EXISTS idx_metrics_node ON metrics(node_id)',
  'CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_failed_tasks_status ON failed_tasks(status)',
  'CREATE INDEX IF NOT EXISTS idx_nodes_tenant ON execution_nodes(tenant_id)',
  'CREATE INDEX IF NOT EXISTS idx_nodes_status ON execution_nodes(status)',
];

export function initDatabase() {
  console.log('Initializing database...');
  
  for (const tableSql of tables) {
    try {
      runQuery(tableSql);
      console.log(`Table created successfully`);
    } catch (error) {
      console.error('Error creating table:', error);
    }
  }

  for (const indexSql of indexes) {
    try {
      runQuery(indexSql);
      console.log(`Index created successfully`);
    } catch (error) {
      console.error('Error creating index:', error);
    }
  }

  console.log('Database initialized successfully!');
}

if (require.main === module) {
  initDatabase();
}

export default initDatabase;
