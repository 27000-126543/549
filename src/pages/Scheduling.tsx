import { useState, useEffect } from 'react';
import { Server, GitBranch, Scale, Plus, RefreshCw, Settings } from 'lucide-react';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Badge from '@/components/Badge';
import StatusBadge from '@/components/StatusBadge';
import Button from '@/components/Button';
import { getNodes, getStrategies, getScalingRules } from '@/services/scheduling';
import type { ExecutionNode, SchedulingStrategy, ScalingRule } from '../../shared/types';
import dayjs from 'dayjs';

const algorithmLabels: Record<string, string> = {
  round_robin: '轮询调度',
  least_load: '最小负载',
  priority_based: '优先级调度',
  tag_match: '标签匹配',
};

const metricLabels: Record<string, string> = {
  cpu: 'CPU使用率',
  memory: '内存使用率',
  queue: '队列深度',
  custom: '自定义指标',
};

export default function Scheduling() {
  const [nodes, setNodes] = useState<ExecutionNode[]>([]);
  const [strategies, setStrategies] = useState<SchedulingStrategy[]>([]);
  const [scalingRules, setScalingRules] = useState<ScalingRule[]>([]);
  const [loading, setLoading] = useState({
    nodes: false,
    strategies: false,
    rules: false,
  });

  const fetchData = async () => {
    setLoading({ nodes: true, strategies: true, rules: true });
    try {
      const [nodesRes, strategiesRes, rulesRes] = await Promise.all([
        getNodes({ page: 1, pageSize: 100 }),
        getStrategies(),
        getScalingRules(),
      ]);
      setNodes(nodesRes.data.list || []);
      setStrategies(strategiesRes.data || []);
      setScalingRules(rulesRes.data || []);
    } catch (error) {
      console.error('Failed to fetch scheduling data:', error);
    } finally {
      setLoading({ nodes: false, strategies: false, rules: false });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const nodeColumns = [
    {
      key: 'name',
      title: '节点名称',
      dataIndex: 'name' as keyof ExecutionNode,
      render: (record: ExecutionNode) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <Server size={16} className="text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-dark-900">{record.name}</p>
            <p className="text-xs text-dark-500">{record.ip}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'ip',
      title: 'IP地址',
      dataIndex: 'ip' as keyof ExecutionNode,
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status' as keyof ExecutionNode,
      render: (record: ExecutionNode) => <StatusBadge status={record.status} />,
    },
    {
      key: 'cpuUsage',
      title: 'CPU使用率',
      dataIndex: 'cpuUsage' as keyof ExecutionNode,
      render: (record: ExecutionNode) => {
        const cpu = record.cpuUsage || 0;
        const color = cpu > 80 ? 'text-danger-600' : cpu > 60 ? 'text-warning-600' : 'text-success-600';
        return (
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-dark-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${cpu > 80 ? 'bg-danger-500' : cpu > 60 ? 'bg-warning-500' : 'bg-success-500'}`}
                style={{ width: `${Math.min(cpu, 100)}%` }}
              />
            </div>
            <span className={`text-sm font-medium ${color}`}>{cpu.toFixed(1)}%</span>
          </div>
        );
      },
    },
    {
      key: 'memoryUsage',
      title: '内存使用率',
      dataIndex: 'memoryUsage' as keyof ExecutionNode,
      render: (record: ExecutionNode) => {
        const mem = record.memoryUsage || 0;
        const color = mem > 80 ? 'text-danger-600' : mem > 60 ? 'text-warning-600' : 'text-success-600';
        return (
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-dark-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${mem > 80 ? 'bg-danger-500' : mem > 60 ? 'bg-warning-500' : 'bg-success-500'}`}
                style={{ width: `${Math.min(mem, 100)}%` }}
              />
            </div>
            <span className={`text-sm font-medium ${color}`}>{mem.toFixed(1)}%</span>
          </div>
        );
      },
    },
    {
      key: 'queueDepth',
      title: '队列深度',
      dataIndex: 'queueDepth' as keyof ExecutionNode,
      render: (record: ExecutionNode) => (
        <Badge variant={record.queueDepth > 10 ? 'warning' : 'info'}>
          {record.queueDepth}
        </Badge>
      ),
    },
    {
      key: 'concurrency',
      title: '并发数',
      render: (record: ExecutionNode) => (
        <span className="text-dark-700">
          {record.currentConcurrency} / {record.maxConcurrency}
        </span>
      ),
    },
    {
      key: 'lastHeartbeat',
      title: '最后心跳',
      dataIndex: 'lastHeartbeat' as keyof ExecutionNode,
      render: (record: ExecutionNode) => (
        <span className="text-dark-500 text-sm">
          {dayjs(record.lastHeartbeat).format('YYYY-MM-DD HH:mm:ss')}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '120px',
      render: () => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" icon={<Settings size={16} />}>
            配置
          </Button>
        </div>
      ),
    },
  ];

  const strategyColumns = [
    {
      key: 'name',
      title: '策略名称',
      dataIndex: 'name' as keyof SchedulingStrategy,
      render: (record: SchedulingStrategy) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <GitBranch size={16} className="text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-dark-900 flex items-center gap-2">
              {record.name}
              {record.isDefault && <Badge variant="primary">默认</Badge>}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'algorithm',
      title: '调度算法',
      dataIndex: 'algorithm' as keyof SchedulingStrategy,
      render: (record: SchedulingStrategy) => (
        <Badge variant="info">{algorithmLabels[record.algorithm] || record.algorithm}</Badge>
      ),
    },
    {
      key: 'weightConfig',
      title: '权重配置',
      render: (record: SchedulingStrategy) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant="default">CPU: {record.weightConfig.cpu}</Badge>
          <Badge variant="default">内存: {record.weightConfig.memory}</Badge>
          <Badge variant="default">队列: {record.weightConfig.queue}</Badge>
          <Badge variant="default">优先级: {record.weightConfig.priority}</Badge>
        </div>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '120px',
      render: () => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" icon={<Settings size={16} />}>
            编辑
          </Button>
        </div>
      ),
    },
  ];

  const ruleColumns = [
    {
      key: 'name',
      title: '规则名称',
      dataIndex: 'name' as keyof ScalingRule,
      render: (record: ScalingRule) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <Scale size={16} className="text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-dark-900">{record.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'metric',
      title: '指标类型',
      dataIndex: 'metric' as keyof ScalingRule,
      render: (record: ScalingRule) => (
        <Badge variant="info">{metricLabels[record.metric] || record.metric}</Badge>
      ),
    },
    {
      key: 'thresholds',
      title: '阈值配置',
      render: (record: ScalingRule) => (
        <div className="flex items-center gap-2">
          <Badge variant="danger">扩容: {record.scaleUpThreshold}%</Badge>
          <Badge variant="success">缩容: {record.scaleDownThreshold}%</Badge>
        </div>
      ),
    },
    {
      key: 'nodeRange',
      title: '节点范围',
      render: (record: ScalingRule) => (
        <span className="text-dark-700">
          {record.minNodes} ~ {record.maxNodes} 台
        </span>
      ),
    },
    {
      key: 'cooldownPeriod',
      title: '冷却周期',
      dataIndex: 'cooldownPeriod' as keyof ScalingRule,
      render: (record: ScalingRule) => (
        <span className="text-dark-700">{record.cooldownPeriod} 秒</span>
      ),
    },
    {
      key: 'enabled',
      title: '状态',
      dataIndex: 'enabled' as keyof ScalingRule,
      render: (record: ScalingRule) => (
        <Badge variant={record.enabled ? 'success' : 'default'}>
          {record.enabled ? '已启用' : '已禁用'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '120px',
      render: () => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" icon={<Settings size={16} />}>
            编辑
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">调度管理</h1>
          <p className="text-dark-500 mt-1">管理执行节点、调度策略和自动扩缩容规则</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={<RefreshCw size={18} />}
            onClick={fetchData}
          >
            刷新
          </Button>
          <Button variant="primary" icon={<Plus size={18} />}>
            新增节点
          </Button>
        </div>
      </div>

      <Card
        title={
          <div className="flex items-center gap-2">
            <Server size={20} className="text-primary-600" />
            <span>执行节点列表</span>
            <Badge variant="info">{nodes.length} 台</Badge>
          </div>
        }
      >
        <Table<ExecutionNode>
          columns={nodeColumns}
          data={nodes}
          loading={loading.nodes}
          rowKey="id"
        />
      </Card>

      <Card
        title={
          <div className="flex items-center gap-2">
            <GitBranch size={20} className="text-primary-600" />
            <span>调度策略列表</span>
            <Badge variant="info">{strategies.length} 条</Badge>
          </div>
        }
        actions={
          <Button variant="secondary" size="sm" icon={<Plus size={16} />}>
            新增策略
          </Button>
        }
      >
        <Table<SchedulingStrategy>
          columns={strategyColumns}
          data={strategies}
          loading={loading.strategies}
          rowKey="id"
        />
      </Card>

      <Card
        title={
          <div className="flex items-center gap-2">
            <Scale size={20} className="text-primary-600" />
            <span>扩缩容规则列表</span>
            <Badge variant="info">{scalingRules.length} 条</Badge>
          </div>
        }
        actions={
          <Button variant="secondary" size="sm" icon={<Plus size={16} />}>
            新增规则
          </Button>
        }
      >
        <Table<ScalingRule>
          columns={ruleColumns}
          data={scalingRules}
          loading={loading.rules}
          rowKey="id"
        />
      </Card>
    </div>
  );
}
