import { Response } from 'express';
import { getRealtimeMetrics, getLoadForecast, store } from '../database';
import type { AuthRequest } from '../middleware/auth';
import type { ApiResponse, RealtimeMetrics, LoadForecast } from '../../shared/types';

export async function getRealtimeData(req: AuthRequest, res: Response<ApiResponse<RealtimeMetrics>>) {
  const metrics = getRealtimeMetrics();
  
  metrics.nodes = metrics.nodes.map(n => {
    const node = store.executionNodes.get(n.nodeId);
    return {
      ...n,
      cpuUsage: node ? node.cpuUsage + (Math.random() - 0.5) * 10 : n.cpuUsage,
      memoryUsage: node ? node.memoryUsage + (Math.random() - 0.5) * 5 : n.memoryUsage,
    };
  });

  res.json({
    code: 200,
    message: '获取成功',
    data: metrics,
    timestamp: Date.now(),
  });
}

export async function getLoadForecastData(req: AuthRequest, res: Response<ApiResponse<LoadForecast>>) {
  const forecast = getLoadForecast();

  res.json({
    code: 200,
    message: '获取成功',
    data: forecast,
    timestamp: Date.now(),
  });
}

export async function getQueues(req: AuthRequest, res: Response<ApiResponse<any[]>>) {
  const metrics = getRealtimeMetrics();
  
  res.json({
    code: 200,
    message: '获取成功',
    data: metrics.queues,
    timestamp: Date.now(),
  });
}

export async function getMetricsHistory(req: AuthRequest, res: Response<ApiResponse<any>>) {
  const { nodeId, metricType = 'cpu', range = '1h' } = req.query as any;
  
  const ranges: Record<string, number> = {
    '1h': 60,
    '6h': 360,
    '24h': 1440,
    '7d': 10080,
  };
  
  const points = ranges[range] || 60;
  const timestamps: number[] = [];
  const values: number[] = [];
  const now = Date.now();
  
  for (let i = points; i >= 0; i--) {
    const ts = now - i * 60 * 1000;
    timestamps.push(ts);
    
    let baseValue = 50;
    if (metricType === 'cpu') baseValue = 45;
    if (metricType === 'memory') baseValue = 55;
    if (metricType === 'queue') baseValue = 20;
    
    const hour = new Date(ts).getHours();
    if (hour >= 9 && hour <= 18) baseValue += 20;
    if (hour >= 1 && hour <= 5) baseValue -= 20;
    
    values.push(Math.max(5, baseValue + Math.sin(i / 10) * 15 + (Math.random() - 0.5) * 10));
  }

  res.json({
    code: 200,
    message: '获取成功',
    data: { timestamps, values },
    timestamp: Date.now(),
  });
}

export default {
  getRealtimeData,
  getLoadForecastData,
  getQueues,
  getMetricsHistory,
};
