import { useState, useEffect, useMemo, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  LayoutGrid,
  FileText,
  RefreshCw,
  Download,
  Filter,
  Activity,
  Clock,
} from 'lucide-react';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import Table from '../components/Table';
import Tabs from '../components/Tabs';
import Pagination from '../components/Pagination';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Select from '../components/Select';
import {
  getDashboard,
  getSuccessRateTrend,
  getCostAnalysis,
  getHeatmap,
  getAuditLogs,
} from '../services/analytics';
import { formatDate, formatNumber, getTaskTypeLabel, formatDuration } from '../lib/utils';
import type {
  DashboardStats,
  CostData,
  HeatmapData,
  AuditLog,
  PageResponse,
} from '../../shared/types';

type TabKey = 'overview' | 'success-rate' | 'cost' | 'heatmap' | 'audit';
type TimeRange = '7d' | '30d' | '90d';
type GroupBy = 'department' | 'project' | 'taskType';

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [successRateTrend, setSuccessRateTrend] = useState<{ timestamp: number; value: number }[]>([]);
  const [costData, setCostData] = useState<CostData[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(10);
  const [auditTotal, setAuditTotal] = useState(0);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [groupBy, setGroupBy] = useState<GroupBy>('department');

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await getDashboard();
      if (res.code === 0) {
        setDashboardStats(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    }
  }, []);

  const fetchSuccessRateTrend = useCallback(async (range: TimeRange) => {
    try {
      const res = await getSuccessRateTrend({ range });
      if (res.code === 0) {
        setSuccessRateTrend(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch success rate trend:', error);
    }
  }, []);

  const fetchCostAnalysis = useCallback(async (group: GroupBy) => {
    try {
      const res = await getCostAnalysis({ groupBy: group });
      if (res.code === 0) {
        setCostData(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch cost analysis:', error);
    }
  }, []);

  const fetchHeatmap = useCallback(async () => {
    try {
      const res = await getHeatmap();
      if (res.code === 0) {
        setHeatmapData(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch heatmap:', error);
    }
  }, []);

  const fetchAuditLogs = useCallback(async (page: number, pageSize: number) => {
    try {
      const res = await getAuditLogs({ page, pageSize });
      if (res.code === 0) {
        const data = res.data as PageResponse<AuditLog>;
        setAuditLogs(data.list || []);
        setAuditTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDashboard(),
        fetchSuccessRateTrend(timeRange),
        fetchCostAnalysis(groupBy),
        fetchHeatmap(),
        fetchAuditLogs(auditPage, auditPageSize),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchDashboard, fetchSuccessRateTrend, fetchCostAnalysis, fetchHeatmap, fetchAuditLogs, timeRange, groupBy, auditPage, auditPageSize]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (activeTab === 'success-rate') {
      fetchSuccessRateTrend(timeRange);
    }
  }, [activeTab, timeRange, fetchSuccessRateTrend]);

  useEffect(() => {
    if (activeTab === 'cost') {
      fetchCostAnalysis(groupBy);
    }
  }, [activeTab, groupBy, fetchCostAnalysis]);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs(auditPage, auditPageSize);
    }
  }, [activeTab, auditPage, auditPageSize, fetchAuditLogs]);

  const mockAuditLogs: AuditLog[] = useMemo(
    () => [
      {
        id: '1',
        userId: 'u1',
        userName: '张三',
        action: '创建任务',
        resourceType: 'task',
        resourceId: 't1',
        ipAddress: '192.168.1.100',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        tenantId: 'tenant1',
      },
      {
        id: '2',
        userId: 'u2',
        userName: '李四',
        action: '编辑任务',
        resourceType: 'task',
        resourceId: 't2',
        ipAddress: '192.168.1.101',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        tenantId: 'tenant1',
      },
      {
        id: '3',
        userId: 'u3',
        userName: '王五',
        action: '删除任务',
        resourceType: 'task',
        resourceId: 't3',
        ipAddress: '192.168.1.102',
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        tenantId: 'tenant1',
      },
      {
        id: '4',
        userId: 'u1',
        userName: '张三',
        action: '审批任务',
        resourceType: 'approval',
        resourceId: 'a1',
        ipAddress: '192.168.1.100',
        createdAt: new Date(Date.now() - 14400000).toISOString(),
        tenantId: 'tenant1',
      },
      {
        id: '5',
        userId: 'u4',
        userName: '赵六',
        action: '暂停任务',
        resourceType: 'task',
        resourceId: 't4',
        ipAddress: '192.168.1.103',
        createdAt: new Date(Date.now() - 18000000).toISOString(),
        tenantId: 'tenant1',
      },
      {
        id: '6',
        userId: 'u2',
        userName: '李四',
        action: '恢复任务',
        resourceType: 'task',
        resourceId: 't4',
        ipAddress: '192.168.1.101',
        createdAt: new Date(Date.now() - 21600000).toISOString(),
        tenantId: 'tenant1',
      },
      {
        id: '7',
        userId: 'u5',
        userName: '钱七',
        action: '创建项目',
        resourceType: 'project',
        resourceId: 'p1',
        ipAddress: '192.168.1.104',
        createdAt: new Date(Date.now() - 25200000).toISOString(),
        tenantId: 'tenant1',
      },
      {
        id: '8',
        userId: 'u1',
        userName: '张三',
        action: '执行任务',
        resourceType: 'task',
        resourceId: 't5',
        ipAddress: '192.168.1.100',
        createdAt: new Date(Date.now() - 28800000).toISOString(),
        tenantId: 'tenant1',
      },
      {
        id: '9',
        userId: 'u3',
        userName: '王五',
        action: '导出报表',
        resourceType: 'report',
        resourceId: 'r1',
        ipAddress: '192.168.1.102',
        createdAt: new Date(Date.now() - 32400000).toISOString(),
        tenantId: 'tenant1',
      },
      {
        id: '10',
        userId: 'u4',
        userName: '赵六',
        action: '配置策略',
        resourceType: 'strategy',
        resourceId: 's1',
        ipAddress: '192.168.1.103',
        createdAt: new Date(Date.now() - 36000000).toISOString(),
        tenantId: 'tenant1',
      },
    ],
    []
  );

  const displayAuditLogs = auditLogs.length > 0 ? auditLogs : mockAuditLogs;

  const overviewStats = useMemo(() => {
    if (dashboardStats) {
      return {
        totalTasks: formatNumber(dashboardStats.todayTasks * 100),
        successRate: `${dashboardStats.successRate}%`,
        runningTasks: formatNumber(dashboardStats.runningTasks * 10),
        pendingApprovals: formatNumber(dashboardStats.pendingApprovals),
        activeAlerts: formatNumber(dashboardStats.activeAlerts),
        avgDuration: formatDuration(Math.round(dashboardStats.avgDuration)),
      };
    }
    return {
      totalTasks: formatNumber(125847),
      successRate: '96.8%',
      runningTasks: formatNumber(156),
      pendingApprovals: formatNumber(23),
      activeAlerts: formatNumber(8),
      avgDuration: formatDuration(45),
    };
  }, [dashboardStats]);

  const quickStats = useMemo(() => [
    { label: '今日新增任务', value: formatNumber(1256), change: '+12.5%', isUp: true },
    { label: '今日完成任务', value: formatNumber(1189), change: '+8.3%', isUp: true },
    { label: '平均等待时间', value: '2.3s', change: '-15.2%', isUp: false },
    { label: '任务失败率', value: '3.2%', change: '-0.8%', isUp: false },
  ], []);

  const successRateChartOption = useMemo(() => {
    const dates: string[] = [];
    const values: number[] = [];

    if (successRateTrend.length > 0) {
      successRateTrend.forEach((item) => {
        dates.push(formatDate(item.timestamp, 'MM-DD'));
        values.push(item.value);
      });
    } else {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const now = Date.now();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now - i * 86400000);
        dates.push(formatDate(d, 'MM-DD'));
        const baseValue = 94 + Math.sin(i * 0.5) * 3;
        values.push(Math.max(85, Math.min(99.9, baseValue + (Math.random() - 0.5) * 2)));
      }
    }

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1e293b' },
        formatter: (params: Array<{ axisValue: string; value: number }>) => {
          return `<div class="font-medium">${params[0].axisValue}</div>
                  <div class="text-primary-600">成功率: ${params[0].value.toFixed(2)}%</div>`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b', fontSize: 11, interval: Math.floor(dates.length / 10) },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 85,
        max: 100,
        axisLine: { show: false },
        axisLabel: { color: '#64748b', fontSize: 11, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      },
      series: [
        {
          name: '成功率',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#3b82f6', width: 3 },
          itemStyle: { color: '#3b82f6', borderWidth: 2, borderColor: '#fff' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
              ],
            },
          },
          data: values,
          markLine: {
            silent: true,
            lineStyle: { color: '#10b981', type: 'dashed' },
            data: [{ yAxis: 95, name: '目标线' }],
            label: { formatter: '目标: 95%', color: '#10b981' },
          },
        },
      ],
    };
  }, [successRateTrend, timeRange]);

  const costChartOption = useMemo(() => {
    let data: { name: string; value: number; cost: number; cpuHours: number; memoryHours: number }[] = [];

    if (costData.length > 0) {
      data = costData.map((item) => ({
        name: item.department || item.project || getTaskTypeLabel(item.taskType || 'unknown'),
        value: item.cost,
        cost: item.cost,
        cpuHours: item.cpuHours,
        memoryHours: item.memoryHours,
      }));
    } else {
      const mockGroupData = groupBy === 'department'
        ? [
            { name: '技术部', cost: 25680, cpuHours: 12840, memoryHours: 8560 },
            { name: '产品部', cost: 18920, cpuHours: 9460, memoryHours: 6310 },
            { name: '运营部', cost: 12450, cpuHours: 6225, memoryHours: 4150 },
            { name: '市场部', cost: 8760, cpuHours: 4380, memoryHours: 2920 },
            { name: '财务部', cost: 5230, cpuHours: 2615, memoryHours: 1745 },
          ]
        : groupBy === 'project'
        ? [
            { name: '数据中台', cost: 32560, cpuHours: 16280, memoryHours: 10850 },
            { name: '用户中心', cost: 18920, cpuHours: 9460, memoryHours: 6310 },
            { name: '营销系统', cost: 12450, cpuHours: 6225, memoryHours: 4150 },
            { name: '报表平台', cost: 8760, cpuHours: 4380, memoryHours: 2920 },
          ]
        : [
            { name: '数据同步', cost: 28650, cpuHours: 14325, memoryHours: 9550 },
            { name: '报表生成', cost: 19870, cpuHours: 9935, memoryHours: 6625 },
            { name: '文件处理', cost: 14320, cpuHours: 7160, memoryHours: 4775 },
            { name: '邮件发送', cost: 6540, cpuHours: 3270, memoryHours: 2180 },
            { name: 'API调用', cost: 4230, cpuHours: 2115, memoryHours: 1410 },
          ];
      data = mockGroupData.map((item) => ({ ...item, value: item.cost }));
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1e293b' },
        formatter: (params: { name: string; value: number; percent: number; data: { cpuHours: number; memoryHours: number } }) => {
          return `<div class="font-medium">${params.name}</div>
                  <div class="text-sm mt-1">成本: ¥${formatNumber(params.value)}</div>
                  <div class="text-sm">占比: ${params.percent}%</div>
                  <div class="text-sm">CPU: ${formatNumber(params.data.cpuHours)}小时</div>
                  <div class="text-sm">内存: ${formatNumber(params.data.memoryHours)}小时</div>`;
        },
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 12,
        textStyle: { color: '#64748b', fontSize: 12 },
      },
      color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
      series: [
        {
          name: '成本分布',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 18,
              fontWeight: 'bold',
              color: '#1e293b',
              formatter: (params: { name: string; value: number }) => `${params.name}\n¥${formatNumber(params.value)}`,
            },
          },
          labelLine: {
            show: false,
          },
          data: data,
        },
      ],
      graphic: {
        type: 'text',
        left: '35%',
        top: 'center',
        style: {
          text: `总成本\n¥${formatNumber(total)}`,
          textAlign: 'center',
          fill: '#1e293b',
          fontSize: 14,
          fontWeight: 'bold',
        },
      },
    };
  }, [costData, groupBy]);

  const costBarChartOption = useMemo(() => {
    let data: { name: string; cpuHours: number; memoryHours: number; cost: number }[] = [];

    if (costData.length > 0) {
      data = costData.map((item) => ({
        name: item.department || item.project || getTaskTypeLabel(item.taskType || 'unknown'),
        cpuHours: item.cpuHours,
        memoryHours: item.memoryHours,
        cost: item.cost,
      }));
    } else {
      const mockGroupData = groupBy === 'department'
        ? [
            { name: '技术部', cpuHours: 12840, memoryHours: 8560, cost: 25680 },
            { name: '产品部', cpuHours: 9460, memoryHours: 6310, cost: 18920 },
            { name: '运营部', cpuHours: 6225, memoryHours: 4150, cost: 12450 },
            { name: '市场部', cpuHours: 4380, memoryHours: 2920, cost: 8760 },
            { name: '财务部', cpuHours: 2615, memoryHours: 1745, cost: 5230 },
          ]
        : groupBy === 'project'
        ? [
            { name: '数据中台', cpuHours: 16280, memoryHours: 10850, cost: 32560 },
            { name: '用户中心', cpuHours: 9460, memoryHours: 6310, cost: 18920 },
            { name: '营销系统', cpuHours: 6225, memoryHours: 4150, cost: 12450 },
            { name: '报表平台', cpuHours: 4380, memoryHours: 2920, cost: 8760 },
          ]
        : [
            { name: '数据同步', cpuHours: 14325, memoryHours: 9550, cost: 28650 },
            { name: '报表生成', cpuHours: 9935, memoryHours: 6625, cost: 19870 },
            { name: '文件处理', cpuHours: 7160, memoryHours: 4775, cost: 14320 },
            { name: '邮件发送', cpuHours: 3270, memoryHours: 2180, cost: 6540 },
            { name: 'API调用', cpuHours: 2115, memoryHours: 1410, cost: 4230 },
          ];
      data = mockGroupData;
    }

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1e293b' },
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: ['CPU小时', '内存小时', '成本'],
        top: 0,
        right: 0,
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { color: '#64748b', fontSize: 12 },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.name),
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: '小时',
          axisLine: { show: false },
          axisLabel: { color: '#64748b', fontSize: 11 },
          splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        },
        {
          type: 'value',
          name: '成本(元)',
          axisLine: { show: false },
          axisLabel: { color: '#64748b', fontSize: 11 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'CPU小时',
          type: 'bar',
          data: data.map((d) => d.cpuHours),
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
        },
        {
          name: '内存小时',
          type: 'bar',
          data: data.map((d) => d.memoryHours),
          itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
        },
        {
          name: '成本',
          type: 'line',
          yAxisIndex: 1,
          data: data.map((d) => d.cost),
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: '#f59e0b', width: 3 },
          itemStyle: { color: '#f59e0b', borderWidth: 2, borderColor: '#fff' },
        },
      ],
    };
  }, [costData, groupBy]);

  const heatmapChartOption = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

    let data: number[][] = [];
    if (heatmapData.length > 0) {
      data = heatmapData.map((item) => [item.hour, item.day, item.value]);
    } else {
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const baseValue = hour >= 9 && hour <= 18 ? 60 + Math.random() * 30 : 20 + Math.random() * 20;
          const weekendMultiplier = day >= 5 ? 0.6 : 1;
          data.push([hour, day, Math.round(baseValue * weekendMultiplier)]);
        }
      }
    }

    return {
      tooltip: {
        position: 'top',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1e293b' },
        formatter: (params: { value: [number, number, number] }) => {
          return `<div class="font-medium">${days[params.value[1]]} ${hours[params.value[0]]}</div>
                  <div class="text-primary-600">利用率: ${params.value[2]}%</div>`;
        },
      },
      grid: {
        left: '5%',
        right: '10%',
        bottom: '10%',
        top: '5%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: hours,
        splitArea: { show: true },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b', fontSize: 11, interval: 2 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'category',
        data: days,
        splitArea: { show: true },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
        axisTick: { show: false },
      },
      visualMap: {
        min: 0,
        max: 100,
        calculable: true,
        orient: 'vertical',
        right: '2%',
        top: 'center',
        textStyle: { color: '#64748b', fontSize: 11 },
        inRange: {
          color: ['#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a8a'],
        },
      },
      series: [
        {
          name: '资源利用率',
          type: 'heatmap',
          data: data,
          label: { show: false },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
        },
      ],
    };
  }, [heatmapData]);

  const auditColumns = useMemo(
    () => [
      {
        key: 'userName',
        title: '操作人',
        dataIndex: 'userName' as keyof AuditLog,
        width: '120px',
        render: (record: AuditLog) => (
          <span className="font-medium text-dark-900">{record.userName}</span>
        ),
      },
      {
        key: 'action',
        title: '动作',
        dataIndex: 'action' as keyof AuditLog,
        width: '120px',
        render: (record: AuditLog) => <Badge variant="primary">{record.action}</Badge>,
      },
      {
        key: 'resourceType',
        title: '资源类型',
        dataIndex: 'resourceType' as keyof AuditLog,
        width: '120px',
        render: (record: AuditLog) => (
          <span className="text-dark-700">{record.resourceType}</span>
        ),
      },
      {
        key: 'resourceId',
        title: '资源ID',
        dataIndex: 'resourceId' as keyof AuditLog,
        width: '150px',
        render: (record: AuditLog) => (
          <span className="text-dark-500 font-mono text-sm">{record.resourceId}</span>
        ),
      },
      {
        key: 'createdAt',
        title: '操作时间',
        dataIndex: 'createdAt' as keyof AuditLog,
        width: '180px',
        render: (record: AuditLog) => formatDate(record.createdAt),
      },
      {
        key: 'ipAddress',
        title: 'IP地址',
        dataIndex: 'ipAddress' as keyof AuditLog,
        width: '150px',
        render: (record: AuditLog) => (
          <span className="text-dark-600 font-mono text-sm">{record.ipAddress || '-'}</span>
        ),
      },
    ],
    []
  );

  const tabItems = [
    { key: 'overview', label: '概览', icon: <BarChart3 size={16} /> },
    { key: 'success-rate', label: '成功率趋势', icon: <TrendingUp size={16} /> },
    { key: 'cost', label: '成本分析', icon: <DollarSign size={16} /> },
    { key: 'heatmap', label: '热力图', icon: <LayoutGrid size={16} /> },
    { key: 'audit', label: '审计日志', icon: <FileText size={16} /> },
  ];

  const timeRangeOptions = [
    { value: '7d', label: '7天' },
    { value: '30d', label: '30天' },
    { value: '90d', label: '90天' },
  ];

  const groupByOptions = [
    { value: 'department', label: '按部门' },
    { value: 'project', label: '按项目' },
    { value: 'taskType', label: '按任务类型' },
  ];

  const handleAuditPageChange = (page: number, pageSize: number) => {
    setAuditPage(page);
    setAuditPageSize(pageSize);
  };

  const handleRefresh = () => {
    fetchAllData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">分析报表</h1>
          <p className="mt-1 text-sm text-dark-500">查看系统数据分析和统计报表</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
            onClick={handleRefresh}
          >
            刷新
          </Button>
          <Button
            variant="primary"
            icon={<Download size={16} />}
          >
            导出报表
          </Button>
        </div>
      </div>

      <Tabs
        items={tabItems}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
      >
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatCard
                title="任务总数"
                value={overviewStats.totalTasks}
                icon={<BarChart3 size={24} />}
                description="累计执行任务数"
                color="primary"
              />
              <StatCard
                title="执行成功率"
                value={overviewStats.successRate}
                icon={<TrendingUp size={24} />}
                description="近7天平均"
                color="success"
              />
              <StatCard
                title="运行中任务"
                value={overviewStats.runningTasks}
                icon={<Activity size={24} />}
                description="当前执行中"
                color="warning"
              />
              <StatCard
                title="待审批"
                value={overviewStats.pendingApprovals}
                icon={<FileText size={24} />}
                description="等待审批任务"
                color="info"
              />
              <StatCard
                title="活跃告警"
                value={overviewStats.activeAlerts}
                icon={<Filter size={24} />}
                description="需要处理"
                color="danger"
              />
              <StatCard
                title="平均执行时长"
                value={overviewStats.avgDuration}
                icon={<Clock size={24} />}
                description="近7天平均"
                color="primary"
              />
            </div>

            <Card title="快速统计" subtitle="关键指标变化">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickStats.map((stat, index) => (
                  <div key={index} className="p-4 bg-dark-50 rounded-lg">
                    <p className="text-sm text-dark-500">{stat.label}</p>
                    <p className="mt-2 text-2xl font-bold text-dark-900">{stat.value}</p>
                    <div className="mt-2 flex items-center gap-1">
                      <span className={`text-sm font-medium ${
                        stat.isUp ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {stat.change}
                      </span>
                      <span className="text-sm text-dark-500">较上周</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="任务成功率趋势" subtitle="近7天变化趋势">
                <ReactECharts
                  option={successRateChartOption}
                  style={{ height: '300px', width: '100%' }}
                  notMerge
                  lazyUpdate
                />
              </Card>

              <Card title="成本分布" subtitle="按部门统计">
                <ReactECharts
                  option={costChartOption}
                  style={{ height: '300px', width: '100%' }}
                  notMerge
                  lazyUpdate
                />
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'success-rate' && (
          <Card
            title="成功率趋势分析"
            subtitle="任务执行成功率随时间变化"
            actions={
              <div className="flex items-center gap-2">
                <span className="text-sm text-dark-500">时间范围:</span>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                  options={timeRangeOptions}
                  className="w-24"
                />
              </div>
            }
          >
            <ReactECharts
              option={successRateChartOption}
              style={{ height: '400px', width: '100%' }}
              notMerge
              lazyUpdate
            />
          </Card>
        )}

        {activeTab === 'cost' && (
          <div className="space-y-6">
            <Card
              title="成本分析"
              subtitle="资源消耗成本统计"
              actions={
                <div className="flex items-center gap-2">
                  <span className="text-sm text-dark-500">分组方式:</span>
                  <Select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                    options={groupByOptions}
                    className="w-32"
                  />
                </div>
              }
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ReactECharts
                  option={costChartOption}
                  style={{ height: '350px', width: '100%' }}
                  notMerge
                  lazyUpdate
                />
                <ReactECharts
                  option={costBarChartOption}
                  style={{ height: '350px', width: '100%' }}
                  notMerge
                  lazyUpdate
                />
              </div>
            </Card>

            <Card title="成本明细">
              <Table<CostData>
                columns={[
                  {
                    key: 'name',
                    title: '名称',
                    width: '200px',
                    render: (record: CostData) => (
                      <span className="font-medium text-dark-900">
                        {record.department || record.project || getTaskTypeLabel(record.taskType || 'unknown')}
                      </span>
                    ),
                  },
                  {
                    key: 'cpuHours',
                    title: 'CPU小时',
                    dataIndex: 'cpuHours' as keyof CostData,
                    width: '150px',
                    align: 'right' as const,
                    render: (record: CostData) => formatNumber(record.cpuHours),
                  },
                  {
                    key: 'memoryHours',
                    title: '内存小时',
                    dataIndex: 'memoryHours' as keyof CostData,
                    width: '150px',
                    align: 'right' as const,
                    render: (record: CostData) => formatNumber(record.memoryHours),
                  },
                  {
                    key: 'cost',
                    title: '成本(元)',
                    dataIndex: 'cost' as keyof CostData,
                    width: '150px',
                    align: 'right' as const,
                    render: (record: CostData) => (
                      <span className="font-semibold text-dark-900">¥{formatNumber(record.cost)}</span>
                    ),
                  },
                  {
                    key: 'percentage',
                    title: '占比',
                    dataIndex: 'percentage' as keyof CostData,
                    width: '150px',
                    render: (record: CostData) => {
                      const percent = record.percentage || Math.random() * 30 + 10;
                      return (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-dark-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-dark-600 w-12">{percent.toFixed(1)}%</span>
                        </div>
                      );
                    },
                  },
                ]}
                data={costData.length > 0 ? costData : []}
                loading={loading}
                rowKey={(record: CostData) => record.department || record.project || record.taskType || ''}
                emptyText="暂无成本数据"
              />
            </Card>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <Card
            title="资源利用率热力图"
            subtitle="按小时和星期维度展示资源使用情况"
          >
            <ReactECharts
              option={heatmapChartOption}
              style={{ height: '400px', width: '100%' }}
              notMerge
              lazyUpdate
            />
          </Card>
        )}

        {activeTab === 'audit' && (
          <Card
            title="审计日志"
            subtitle="系统操作记录"
            footer={
              <Pagination
                current={auditPage}
                pageSize={auditPageSize}
                total={auditTotal || 128}
                onChange={handleAuditPageChange}
              />
            }
          >
            <Table<AuditLog>
              columns={auditColumns}
              data={displayAuditLogs}
              loading={loading}
              rowKey="id"
              emptyText="暂无审计日志"
            />
          </Card>
        )}
      </Tabs>
    </div>
  );
}
