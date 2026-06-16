import { Response } from 'express';
import { getDashboardStats, getCostData, getHeatmapData, store } from '../database';
import type { AuthRequest } from '../middleware/auth';
import type { ApiResponse, DashboardStats, CostData, HeatmapData, PageResponse, AuditLog } from '../../shared/types';

export async function getDashboard(req: AuthRequest, res: Response<ApiResponse<DashboardStats>>) {
  const stats = getDashboardStats();
  
  res.json({
    code: 200,
    message: '获取成功',
    data: stats,
    timestamp: Date.now(),
  });
}

export async function getSuccessRateTrend(req: AuthRequest, res: Response<ApiResponse<any>>) {
  const { range = '7d' } = req.query as any;
  const ranges: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
  };
  
  const days = ranges[range] || 7;
  const timestamps: number[] = [];
  const successRates: number[] = [];
  const taskCounts: number[] = [];
  const now = Date.now();
  
  for (let i = days; i >= 0; i--) {
    const ts = now - i * 24 * 3600 * 1000;
    timestamps.push(ts);
    const dayOfWeek = new Date(ts).getDay();
    const baseRate = dayOfWeek === 0 || dayOfWeek === 6 ? 92 : 97;
    successRates.push(baseRate + Math.random() * 5);
    taskCounts.push(Math.floor(Math.random() * 80 + 40));
  }

  res.json({
    code: 200,
    message: '获取成功',
    data: { timestamps, successRates, taskCounts },
    timestamp: Date.now(),
  });
}

export async function getCostAnalysis(req: AuthRequest, res: Response<ApiResponse<CostData[]>>) {
  const { groupBy = 'department' } = req.query as any;
  
  let data = getCostData();
  
  if (groupBy === 'project') {
    data = [
      { project: '数据平台项目', cpuHours: 800, memoryHours: 600, cost: 10800, percentage: 25 },
      { project: '营销系统项目', cpuHours: 720, memoryHours: 540, cost: 9720, percentage: 22.5 },
      { project: 'ERP系统项目', cpuHours: 600, memoryHours: 480, cost: 8160, percentage: 19 },
      { project: 'CRM系统项目', cpuHours: 500, memoryHours: 400, cost: 6800, percentage: 15.8 },
      { project: '其他项目', cpuHours: 580, memoryHours: 420, cost: 7620, percentage: 17.7 },
    ];
  } else if (groupBy === 'taskType') {
    data = [
      { taskType: '数据同步', cpuHours: 900, memoryHours: 500, cost: 12000, percentage: 28 },
      { taskType: '报表生成', cpuHours: 750, memoryHours: 650, cost: 11100, percentage: 26 },
      { taskType: '文件处理', cpuHours: 550, memoryHours: 400, cost: 7400, percentage: 17.3 },
      { taskType: '邮件发送', cpuHours: 300, memoryHours: 250, cost: 4200, percentage: 9.8 },
      { taskType: '其他任务', cpuHours: 500, memoryHours: 450, cost: 8100, percentage: 18.9 },
    ];
  }

  res.json({
    code: 200,
    message: '获取成功',
    data,
    timestamp: Date.now(),
  });
}

export async function getHeatmap(req: AuthRequest, res: Response<ApiResponse<HeatmapData[]>>) {
  const data = getHeatmapData();

  res.json({
    code: 200,
    message: '获取成功',
    data,
    timestamp: Date.now(),
  });
}

export async function getAuditLogs(req: AuthRequest, res: Response<ApiResponse<PageResponse<AuditLog>>>) {
  const { page = 1, pageSize = 20, userId, action, resourceType } = req.query as any;
  
  let logs = Array.from(store.auditLogs.values())
    .filter(l => l.tenantId === req.tenantId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  if (userId) logs = logs.filter(l => l.userId === userId);
  if (action) logs = logs.filter(l => l.action === action);
  if (resourceType) logs = logs.filter(l => l.resourceType === resourceType);

  const total = logs.length;
  const start = (page - 1) * pageSize;

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      list: logs.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    },
    timestamp: Date.now(),
  });
}

export default {
  getDashboard,
  getSuccessRateTrend,
  getCostAnalysis,
  getHeatmap,
  getAuditLogs,
};
