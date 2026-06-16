import { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  ClipboardList,
  CheckCircle,
  Calendar,
  Clock,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import { getDashboard, getSuccessRateTrend, getHeatmap } from '../services/analytics';
import { formatDate, formatNumber, getTaskTypeLabel, formatDuration } from '../lib/utils';
import type { DashboardStats, TrendData, HeatmapData, TaskExecution } from '../../shared/types';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [successRateTrend, setSuccessRateTrend] = useState<TrendData[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);

  const mockRecentTasks: TaskExecution[] = useMemo(
    () => [
      {
        id: '1',
        taskId: 't1',
        taskName: '用户数据同步',
        status: 'success',
        nodeId: 'node-01',
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() - 3500000).toISOString(),
        duration: 100,
        retryCount: 0,
      },
      {
        id: '2',
        taskId: 't2',
        taskName: '销售报表生成',
        status: 'running',
        nodeId: 'node-02',
        startTime: new Date(Date.now() - 1800000).toISOString(),
        duration: 1800,
        retryCount: 0,
      },
      {
        id: '3',
        taskId: 't3',
        taskName: '邮件批量发送',
        status: 'success',
        nodeId: 'node-01',
        startTime: new Date(Date.now() - 7200000).toISOString(),
        endTime: new Date(Date.now() - 7000000).toISOString(),
        duration: 200,
        retryCount: 0,
      },
      {
        id: '4',
        taskId: 't4',
        taskName: '订单文件处理',
        status: 'failed',
        nodeId: 'node-03',
        startTime: new Date(Date.now() - 10800000).toISOString(),
        endTime: new Date(Date.now() - 10700000).toISOString(),
        duration: 100,
        errorMessage: '文件格式错误',
        retryCount: 2,
      },
      {
        id: '5',
        taskId: 't5',
        taskName: 'API数据拉取',
        status: 'success',
        nodeId: 'node-02',
        startTime: new Date(Date.now() - 14400000).toISOString(),
        endTime: new Date(Date.now() - 14300000).toISOString(),
        duration: 100,
        retryCount: 0,
      },
    ],
    []
  );

  const mockTaskTypeDistribution = useMemo(
    () => [
      { name: 'data_sync', value: 35 },
      { name: 'report', value: 25 },
      { name: 'file_process', value: 20 },
      { name: 'email', value: 12 },
      { name: 'api_call', value: 8 },
    ],
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashboardRes, trendRes, heatmapRes] = await Promise.all([
          getDashboard(),
          getSuccessRateTrend({ range: '7d' }),
          getHeatmap(),
        ]);

        if (dashboardRes.code === 200) {
          setDashboardStats(dashboardRes.data);
        }
        if (trendRes.code === 200) {
          setSuccessRateTrend(trendRes.data);
        }
        if (heatmapRes.code === 200) {
          setHeatmapData(heatmapRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const lineChartOption = useMemo(() => {
    const dates = successRateTrend.length > 0
      ? successRateTrend.map((item) => formatDate(item.timestamp, 'MM-DD'))
      : Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return formatDate(d, 'MM-DD');
        });

    const values = successRateTrend.length > 0
      ? successRateTrend.map((item) => item.value)
      : [92.5, 95.2, 94.8, 96.1, 93.7, 97.3, 96.8];

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1e293b' },
        formatter: (params: Array<{ axisValue: string; value: number }>) => {
          return `<div class="font-medium">${params[0].axisValue}</div>
                  <div class="text-primary-600">成功率: ${params[0].value}%</div>`;
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
        axisLabel: { color: '#64748b', fontSize: 12 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 85,
        max: 100,
        axisLine: { show: false },
        axisLabel: { color: '#64748b', fontSize: 12, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      },
      series: [
        {
          name: '成功率',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: '#3b82f6', width: 3 },
          itemStyle: { color: '#3b82f6', borderWidth: 2, borderColor: '#fff' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
              ],
            },
          },
          data: values,
        },
      ],
    };
  }, [successRateTrend]);

  const pieChartOption = useMemo(() => {
    const data = mockTaskTypeDistribution.map((item) => ({
      name: getTaskTypeLabel(item.name),
      value: item.value,
    }));

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1e293b' },
        formatter: '{b}: {c} ({d}%)',
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
      color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
      series: [
        {
          name: '任务类型',
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
              fontSize: 16,
              fontWeight: 'bold',
              color: '#1e293b',
            },
          },
          labelLine: {
            show: false,
          },
          data: data,
        },
      ],
    };
  }, [mockTaskTypeDistribution]);

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
          label: {
            show: false,
          },
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

  const columns = useMemo(
    () => [
      {
        key: 'taskName',
        title: '任务名称',
        dataIndex: 'taskName' as keyof TaskExecution,
        render: (record: TaskExecution) => (
          <span className="font-medium text-dark-900">{record.taskName}</span>
        ),
      },
      {
        key: 'status',
        title: '状态',
        dataIndex: 'status' as keyof TaskExecution,
        width: '100px',
        render: (record: TaskExecution) => <StatusBadge status={record.status} />,
      },
      {
        key: 'nodeId',
        title: '执行节点',
        dataIndex: 'nodeId' as keyof TaskExecution,
        width: '120px',
      },
      {
        key: 'startTime',
        title: '开始时间',
        dataIndex: 'startTime' as keyof TaskExecution,
        width: '180px',
        render: (record: TaskExecution) => formatDate(record.startTime),
      },
      {
        key: 'duration',
        title: '执行时长',
        dataIndex: 'duration' as keyof TaskExecution,
        width: '120px',
        render: (record: TaskExecution) =>
          record.duration ? formatDuration(Math.round(record.duration)) : '-',
      },
      {
        key: 'retryCount',
        title: '重试次数',
        dataIndex: 'retryCount' as keyof TaskExecution,
        width: '100px',
        align: 'center' as const,
      },
    ],
    []
  );

  const stats = useMemo(() => {
    if (dashboardStats) {
      return {
        totalTasks: formatNumber(dashboardStats.todayTasks * 10),
        successRate: `${dashboardStats.successRate}%`,
        todayExecutions: formatNumber(dashboardStats.todayTasks),
        avgDuration: formatDuration(Math.round(dashboardStats.avgDuration)),
      };
    }
    return {
      totalTasks: formatNumber(12847),
      successRate: '96.8%',
      todayExecutions: formatNumber(256),
      avgDuration: formatDuration(45),
    };
  }, [dashboardStats]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">仪表盘</h1>
          <p className="mt-1 text-sm text-dark-500">查看系统概览和关键指标</p>
        </div>
        <Button
          variant="secondary"
          icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
        >
          刷新数据
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="任务总数"
          value={stats.totalTasks}
          icon={<ClipboardList size={24} />}
          trend={{ value: 12.5, isUp: true }}
          description="累计任务执行次数"
          color="primary"
        />
        <StatCard
          title="执行成功率"
          value={stats.successRate}
          icon={<CheckCircle size={24} />}
          trend={{ value: 2.3, isUp: true }}
          description="近7天平均成功率"
          color="success"
        />
        <StatCard
          title="今日执行数"
          value={stats.todayExecutions}
          icon={<Calendar size={24} />}
          trend={{ value: 8.1, isUp: true }}
          description="较昨日增长"
          color="warning"
        />
        <StatCard
          title="平均执行时长"
          value={stats.avgDuration}
          icon={<Clock size={24} />}
          trend={{ value: 5.2, isUp: false }}
          description="较上周优化"
          color="info"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="任务成功率趋势"
          subtitle="近7天执行成功率变化"
          className="lg:col-span-2"
        >
          <ReactECharts
            option={lineChartOption}
            style={{ height: '320px', width: '100%' }}
            notMerge
            lazyUpdate
          />
        </Card>

        <Card
          title="任务类型分布"
          subtitle="各类型任务占比"
        >
          <ReactECharts
            option={pieChartOption}
            style={{ height: '320px', width: '100%' }}
            notMerge
            lazyUpdate
          />
        </Card>
      </div>

      <Card
        title="资源利用率热力图"
        subtitle="按小时和星期维度展示"
      >
        <ReactECharts
          option={heatmapChartOption}
          style={{ height: '380px', width: '100%' }}
          notMerge
          lazyUpdate
        />
      </Card>

      <Card
        title="最近执行任务"
        subtitle="最新的任务执行记录"
        actions={
          <Button variant="ghost" size="sm" icon={<ArrowRight size={16} />}>
            查看全部
          </Button>
        }
      >
        <Table<TaskExecution>
          columns={columns}
          data={mockRecentTasks}
          loading={loading}
          rowKey="id"
          emptyText="暂无执行记录"
        />
      </Card>
    </div>
  );
}
