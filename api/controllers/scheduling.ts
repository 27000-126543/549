import { Response } from 'express';
import { store } from '../database';
import type { AuthRequest } from '../middleware/auth';
import type { ApiResponse, PageResponse, ExecutionNode, SchedulingStrategy, ScalingRule } from '../../shared/types';

export async function getNodes(req: AuthRequest, res: Response<ApiResponse<PageResponse<ExecutionNode>>>) {
  const { page = 1, pageSize = 20 } = req.query as any;
  
  let nodes = Array.from(store.executionNodes.values()).filter(n => !n.tenantId || n.tenantId === req.tenantId);
  
  const total = nodes.length;
  const start = (page - 1) * pageSize;
  const list = nodes.slice(start, start + pageSize);

  res.json({
    code: 200,
    message: '获取成功',
    data: { list, total, page, pageSize },
    timestamp: Date.now(),
  });
}

export async function getNode(req: AuthRequest, res: Response<ApiResponse<ExecutionNode>>) {
  const { id } = req.params;
  const node = store.executionNodes.get(id);

  if (!node || (node.tenantId && node.tenantId !== req.tenantId)) {
    return res.status(404).json({
      code: 404,
      message: '节点不存在',
      data: null as any,
      timestamp: Date.now(),
    });
  }

  res.json({
    code: 200,
    message: '获取成功',
    data: node,
    timestamp: Date.now(),
  });
}

export async function updateNodeStatus(req: AuthRequest, res: Response<ApiResponse<ExecutionNode>>) {
  const { id } = req.params;
  const { status } = req.body;
  const node = store.executionNodes.get(id);

  if (!node || (node.tenantId && node.tenantId !== req.tenantId)) {
    return res.status(404).json({
      code: 404,
      message: '节点不存在',
      data: null as any,
      timestamp: Date.now(),
    });
  }

  node.status = status;
  node.lastHeartbeat = new Date().toISOString();
  store.executionNodes.set(id, node);

  res.json({
    code: 200,
    message: '更新成功',
    data: node,
    timestamp: Date.now(),
  });
}

export async function getStrategies(req: AuthRequest, res: Response<ApiResponse<SchedulingStrategy[]>>) {
  const strategies = Array.from(store.schedulingStrategies.values()).filter(
    s => !s.tenantId || s.tenantId === req.tenantId
  );

  res.json({
    code: 200,
    message: '获取成功',
    data: strategies,
    timestamp: Date.now(),
  });
}

export async function createStrategy(req: AuthRequest, res: Response<ApiResponse<SchedulingStrategy>>) {
  const { name, algorithm, weightConfig } = req.body;
  const id = 'strategy-' + Date.now();
  
  const strategy: SchedulingStrategy = {
    id,
    name,
    algorithm,
    weightConfig,
    isDefault: false,
    tenantId: req.tenantId,
  };

  store.schedulingStrategies.set(id, strategy);

  res.json({
    code: 200,
    message: '创建成功',
    data: strategy,
    timestamp: Date.now(),
  });
}

export async function getScalingRules(req: AuthRequest, res: Response<ApiResponse<ScalingRule[]>>) {
  const rules: ScalingRule[] = [
    {
      id: 'rule-1',
      name: 'CPU使用率扩容',
      metric: 'cpu',
      threshold: 70,
      scaleUpThreshold: 80,
      scaleDownThreshold: 30,
      minNodes: 2,
      maxNodes: 10,
      cooldownPeriod: 300,
      enabled: true,
    },
    {
      id: 'rule-2',
      name: '内存使用率扩容',
      metric: 'memory',
      threshold: 75,
      scaleUpThreshold: 85,
      scaleDownThreshold: 40,
      minNodes: 2,
      maxNodes: 10,
      cooldownPeriod: 300,
      enabled: true,
    },
    {
      id: 'rule-3',
      name: '队列深度扩容',
      metric: 'queue',
      threshold: 50,
      scaleUpThreshold: 100,
      scaleDownThreshold: 10,
      minNodes: 2,
      maxNodes: 10,
      cooldownPeriod: 120,
      enabled: false,
    },
  ];

  res.json({
    code: 200,
    message: '获取成功',
    data: rules,
    timestamp: Date.now(),
  });
}

export default {
  getNodes,
  getNode,
  updateNodeStatus,
  getStrategies,
  createStrategy,
  getScalingRules,
};
