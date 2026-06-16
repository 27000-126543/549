export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type TaskType = 'api' | 'email' | 'file' | 'manual' | 'cron';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'draft' | 'pending_approval' | 'active' | 'paused' | 'disabled';
export type ExecutionStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
export type NodeStatus = 'online' | 'offline' | 'maintenance';
export type ApprovalStatus = 'approved' | 'rejected' | 'transferred' | 'pending';
export type ApprovalNodeType = 'sequential' | 'countersign' | 'or_sign';
export type SchedulingAlgorithm = 'round_robin' | 'least_load' | 'priority_based' | 'tag_match';
export type DataScope = 'self' | 'department' | 'project' | 'all';
export type RetryStrategy = 'fixed' | 'exponential' | 'linear';
export type FailedTaskStatus = 'pending_retry' | 'retrying' | 'dead_letter' | 'manual';

export interface User {
  id: string;
  username: string;
  email: string;
  departmentId: string;
  roleIds: string[];
  projectIds: string[];
  tenantId: string;
  status: 'active' | 'disabled';
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  permissions: string[];
}

export interface Tenant {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'disabled' | 'expired';
  maxConcurrency: number;
  resourceLimit: ResourceLimit;
  createdAt: string;
  expiredAt?: string;
}

export interface ResourceLimit {
  cpuCores: number;
  memoryGB: number;
  storageGB: number;
  maxTasks: number;
}

export interface Department {
  id: string;
  name: string;
  parentId: string | null;
  managerId: string | null;
  tenantId: string;
  children?: Department[];
}

export interface Role {
  id: string;
  name: string;
  code: string;
  permissions: string[];
  dataScope: DataScope;
  tenantId: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  tenantId: string;
  createdAt: string;
}

export interface TriggerConfig {
  type: TaskType;
  cronExpression?: string;
  emailRules?: EmailRule[];
  fileRules?: FileRule[];
}

export interface EmailRule {
  sender?: string;
  subjectContains?: string;
  bodyContains?: string;
  attachmentPattern?: string;
}

export interface FileRule {
  directory: string;
  pattern: string;
  minSize?: number;
  maxSize?: number;
}

export interface DagConfig {
  nodes: DagNode[];
  edges: DagEdge[];
}

export interface DagNode {
  id: string;
  name: string;
  type: 'task' | 'condition' | 'loop' | 'start' | 'end';
  config: NodeConfig;
  position?: { x: number; y: number };
}

export interface NodeConfig {
  script?: string;
  command?: string;
  timeout?: number;
  condition?: string;
  maxLoopCount?: number;
}

export interface DagEdge {
  source: string;
  target: string;
  condition?: string;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  triggerConfig: TriggerConfig;
  dagConfig: DagConfig;
  approvalFlowId?: string;
  schedulingStrategyId?: string;
  createdBy: string;
  projectId: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskExecution {
  id: string;
  taskId: string;
  taskName: string;
  status: ExecutionStatus;
  nodeId?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  errorMessage?: string;
  retryCount: number;
  outputData?: any;
}

export interface ExecutionNode {
  id: string;
  name: string;
  ip: string;
  status: NodeStatus;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  loadAverage: number[];
  queueDepth: number;
  tags: string[];
  maxConcurrency: number;
  currentConcurrency: number;
  tenantId?: string;
  lastHeartbeat: string;
}

export interface SchedulingStrategy {
  id: string;
  name: string;
  algorithm: SchedulingAlgorithm;
  weightConfig: WeightConfig;
  isDefault: boolean;
  tenantId?: string;
}

export interface WeightConfig {
  cpu: number;
  memory: number;
  queue: number;
  priority: number;
}

export interface ScalingRule {
  id: string;
  name: string;
  metric: 'cpu' | 'memory' | 'queue' | 'custom';
  threshold: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  minNodes: number;
  maxNodes: number;
  cooldownPeriod: number;
  enabled: boolean;
}

export interface ApprovalFlow {
  id: string;
  name: string;
  nodes: ApprovalNode[];
  isDefault: boolean;
  tenantId: string;
}

export interface ApprovalNode {
  id: string;
  name: string;
  type: ApprovalNodeType;
  approvers: string[];
  timeout: number;
  autoTransferTo?: string;
  order: number;
}

export interface ApprovalRecord {
  id: string;
  flowId: string;
  taskId: string;
  nodeId: string;
  approverId: string;
  approverName: string;
  status: ApprovalStatus;
  comment?: string;
  createdAt: string;
  processedAt?: string;
}

export interface PendingApproval {
  id: string;
  taskId: string;
  taskName: string;
  taskType: TaskType;
  submitter: string;
  submitterName: string;
  submitTime: string;
  nodeName: string;
  deadline: string;
}

export interface RealtimeMetrics {
  timestamp: number;
  nodes: NodeMetrics[];
  queues: QueueMetrics[];
}

export interface NodeMetrics {
  nodeId: string;
  nodeName: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  loadAverage: number[];
}

export interface QueueMetrics {
  queueName: string;
  depth: number;
  waitingTime: number;
  consumeRate: number;
  produceRate: number;
}

export interface LoadForecast {
  timestamps: number[];
  predictedCpu: number[];
  predictedMemory: number[];
  predictedQueue: number[];
  confidence: number[];
}

export interface FailedTask {
  id: string;
  taskId: string;
  executionId: string;
  taskName: string;
  errorType: string;
  errorMessage: string;
  failedAt: string;
  retryCount: number;
  maxRetries: number;
  retryStrategy: RetryStrategy;
  nextRetryAt?: string;
  status: FailedTaskStatus;
  lastError?: string;
  tenantId?: string;
}

export interface DeadLetter {
  id: string;
  taskId: string;
  executionId: string;
  taskData: any;
  errorInfo: ErrorInfo;
  deadAt: string;
  handled: boolean;
  handledBy?: string;
  handledAt?: string;
  handlerNote?: string;
}

export interface ErrorInfo {
  type: string;
  message: string;
  stack?: string;
  context?: any;
}

export interface RetryConfig {
  maxRetries: number;
  strategy: RetryStrategy;
  initialDelay: number;
  multiplier: number;
  maxDelay: number;
}

export interface CanaryStrategy {
  id: string;
  name: string;
  description: string;
  schedulingStrategyId: string;
  trafficPercentage: number;
  targetUsers: string[];
  targetTags: string[];
  startTime?: string;
  endTime?: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'rolled_back';
  metrics: CanaryMetrics;
  createdBy: string;
  tenantId: string;
  createdAt: string;
}

export interface CanaryMetrics {
  successRate: number;
  baselineSuccessRate: number;
  avgDuration: number;
  baselineAvgDuration: number;
  errorRate: number;
  baselineErrorRate: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  tenantId: string;
}

export interface DashboardStats {
  todayTasks: number;
  successRate: number;
  avgDuration: number;
  resourceUsage: number;
  runningTasks: number;
  pendingApprovals: number;
  activeAlerts: number;
  tasksTrend: TrendData[];
  successRateTrend: TrendData[];
  resourceTrend: TrendData[];
  taskTypeDistribution: ChartData[];
}

export interface TrendData {
  timestamp: number;
  value: number;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface CostData {
  department?: string;
  project?: string;
  taskType?: string;
  cpuHours: number;
  memoryHours: number;
  cost: number;
  percentage: number;
}

export interface HeatmapData {
  hour: number;
  day: number;
  value: number;
}

export interface TaskListRequest {
  page: number;
  pageSize: number;
  status?: TaskStatus;
  type?: TaskType;
  priority?: TaskPriority;
  keyword?: string;
  projectId?: string;
}

export interface TaskCreateRequest {
  name: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  triggerConfig: TriggerConfig;
  dagConfig: DagConfig;
  projectId: string;
  approvalFlowId?: string;
  schedulingStrategyId?: string;
}

export interface ApprovalActionRequest {
  recordId: string;
  status: ApprovalStatus;
  comment?: string;
  transferTo?: string;
}
