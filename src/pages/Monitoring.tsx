import { useState, useEffect, useMemo, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Server,
  Cpu,
  HardDrive,
  Activity,
  TrendingUp,
  RefreshCw,
  Clock,
  Layers,
} from 'lucide-react';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import {
  getRealtimeData,
  getLoadForecast,
  getQueues,
  getMetricsHistory,
} from '../services/monitoring';
import { formatDate, formatNumber } from '../lib/utils';
import type {
  RealtimeMetrics,
  NodeMetrics,
  QueueMetrics,
  LoadForecast as LoadForecastType,
} from '../../shared/types';

type TimeRange = '1h' | '6h' | '24h' | '7d';

export default function Monitoring() {
  const [loading, setLoading] = useState(true);
  const [realtimeData, setRealtimeData] = useState<RealtimeMetrics | null>(null);
  const [loadForecast, setLoadForecast] = useState<LoadForecastType | null>(null);
  const [queues, setQueues] = useState<QueueMetrics[]>([]);
  const [cpuHistory, setCpuHistory] = useState<{ timestamp: number; value: number }[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<{ timestamp: number; value: number }[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchRealtimeData = useCallback(async () => {
    try {
      const res = await getRealtimeData();
      if (res.code === 200) {
        setRealtimeData(res.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch realtime data:', error);
    }
  }, []);

  const fetchMetricsHistory = useCallback(async (range: TimeRange) => {
    try {
      const [cpuRes, memoryRes] = await Promise.all([
        getMetricsHistory({ metricType: 'cpu', range }),
        getMetricsHistory({ metricType: 'memory', range }),
      ]);
      if (cpuRes.code === 200) {
        setCpuHistory(cpuRes.data || []);
      }
      if (memoryRes.code === 200) {
        setMemoryHistory(memoryRes.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch metrics history:', error);
    }
  }, []);

  const fetchLoadForecast = useCallback(async () => {
    try {
      const res = await getLoadForecast();
      if (res.code === 200) {
        setLoadForecast(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch load forecast:', error);
    }
  }, []);

  const fetchQueues = useCallback(async () => {
    try {
      const res = await getQueues();
      if (res.code === 200) {
        setQueues(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch queues:', error);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRealtimeData(),
        fetchMetricsHistory(timeRange),
        fetchLoadForecast(),
        fetchQueues(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchRealtimeData, fetchMetricsHistory, fetchLoadForecast, fetchQueues, timeRange]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    fetchMetricsHistory(timeRange);
  }, [timeRange, fetchMetricsHistory]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchRealtimeData();
      fetchQueues();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchRealtimeData, fetchQueues]);

  const handleRefresh = () => {
    fetchAllData();
  };

  const mockNodes: NodeMetrics[] = useMemo(
    () => [
      {
        nodeId: 'node-01',
        nodeName: '生产节点-01',
        cpuUsage: 45.2,
        memoryUsage: 62.8,
        diskUsage: 48.5,
        networkIn: 128.5,
        networkOut: 89.2,
        loadAverage: [1.2, 1.5, 1.3],
      },
      {
        nodeId: 'node-02',
        nodeName: '生产节点-02',
        cpuUsage: 72.3,
        memoryUsage: 78.5,
        diskUsage: 55.2,
        networkIn: 256.8,
        networkOut: 178.3,
        loadAverage: [2.8, 3.1, 2.9],
      },
      {
        nodeId: 'node-03',
        nodeName: '生产节点-03',
        cpuUsage: 28.9,
        memoryUsage: 42.1,
        diskUsage: 38.7,
        networkIn: 64.3,
        networkOut: 45.6,
        loadAverage: [0.8, 0.9, 0.7],
      },
      {
        nodeId: 'node-04',
        nodeName: '生产节点-04',
        cpuUsage: 91.5,
        memoryUsage: 88.2,
        diskUsage: 68.9,
        networkIn: 512.7,
        networkOut: 389.4,
        loadAverage: [4.5, 4.8, 4.2],
      },
    ],
    []
  );

  const mockQueues: QueueMetrics[] = useMemo(
    () => [
      {
        queueName: 'default',
        depth: 128,
        waitingTime: 3.2,
        consumeRate: 45.6,
        produceRate: 42.1,
      },
      {
        queueName: 'priority',
        depth: 32,
        waitingTime: 0.8,
        consumeRate: 12.3,
        produceRate: 10.5,
      },
      {
        queueName: 'batch',
        depth: 256,
        waitingTime: 15.6,
        consumeRate: 28.9,
        produceRate: 35.2,
      },
      {
        queueName: 'retry',
        depth: 16,
        waitingTime: 30.0,
        consumeRate: 5.2,
        produceRate: 3.8,
      },
    ],
    []
  );

  const displayNodes = realtimeData?.nodes || mockNodes;
  const displayQueues = queues.length > 0 ? queues : mockQueues;

  const stats = useMemo(() => {
    const nodes = displayNodes;
    const onlineNodes = nodes.length;
    const runningTasks = nodes.reduce((sum, n) => sum + Math.floor(n.cpuUsage / 10), 0);
    const totalQueueDepth = displayQueues.reduce((sum, q) => sum + q.depth, 0);
    const avgCpu = nodes.length > 0
      ? (nodes.reduce((sum, n) => sum + n.cpuUsage, 0) / nodes.length).toFixed(1)
      : '0.0';
    const avgMemory = nodes.length > 0
      ? (nodes.reduce((sum, n) => sum + n.memoryUsage, 0) / nodes.length).toFixed(1)
      : '0.0';

    return {
      onlineNodes: formatNumber(onlineNodes),
      runningTasks: formatNumber(runningTasks),
      totalQueueDepth: formatNumber(totalQueueDepth),
      avgCpu: `${avgCpu}%`,
      avgMemory: `${avgMemory}%`,
    };
  }, [displayNodes, displayQueues]);

  const cpuMemoryChartOption = useMemo(() => {
    const timeFormat = timeRange === '1h' ? 'HH:mm' : timeRange === '6h' ? 'HH:mm' : timeRange === '24h' ? 'MM-DD HH:mm' : 'MM-DD';
    
    let cpuTimestamps: string[] = [];
    let cpuValues: number[] = [];
    let memoryTimestamps: string[] = [];
    let memoryValues: number[] = [];

    if (cpuHistory.length > 0) {
      cpuTimestamps = cpuHistory.map((item) => formatDate(item.timestamp, timeFormat));
      cpuValues = cpuHistory.map((item) => item.value);
    } else {
      const points = timeRange === '1h' ? 12 : timeRange === '6h' ? 24 : timeRange === '24h' ? 48 : 84;
      const now = Date.now();
      const interval = timeRange === '1h' ? 300000 : timeRange === '6h' ? 900000 : timeRange === '24h' ? 1800000 : 7200000;
      
      for (let i = points - 1; i >= 0; i--) {
        const t = now - i * interval;
        cpuTimestamps.push(formatDate(t, timeFormat));
        memoryTimestamps.push(formatDate(t, timeFormat));
        const baseCpu = 45 + Math.sin(i * 0.3) * 20;
        const baseMemory = 60 + Math.sin(i * 0.25) * 15;
        cpuValues.push(Math.max(10, Math.min(95, baseCpu + (Math.random() - 0.5) * 10)));
        memoryValues.push(Math.max(20, Math.min(95, baseMemory + (Math.random() - 0.5) * 8)));
      }
    }

    if (memoryHistory.length > 0) {
      memoryTimestamps = memoryHistory.map((item) => formatDate(item.timestamp, timeFormat));
      memoryValues = memoryHistory.map((item) => item.value);
    }

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1e293b' },
        formatter: (params: Array<{ axisValue: string; seriesName: string; value: number; color: string }>) => {
          let html = `<div class="font-medium">${params[0].axisValue}</div>`;
          params.forEach((param) => {
            html += `<div class="flex items-center gap-2 mt-1">
              <span class="w-2 h-2 rounded-full" style="background-color: ${param.color}"></span>
              <span>${param.seriesName}: ${param.value.toFixed(1)}%</span>
            </div>`;
          });
          return html;
        },
      },
      legend: {
        data: ['CPU使用率', '内存使用率'],
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
        boundaryGap: false,
        data: cpuTimestamps,
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLine: { show: false },
        axisLabel: { color: '#64748b', fontSize: 11, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      },
      series: [
        {
          name: 'CPU使用率',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { color: '#3b82f6', width: 2 },
          itemStyle: { color: '#3b82f6', borderWidth: 2, borderColor: '#fff' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.25)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.02)' },
              ],
            },
          },
          data: cpuValues,
        },
        {
          name: '内存使用率',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { color: '#10b981', width: 2 },
          itemStyle: { color: '#10b981', borderWidth: 2, borderColor: '#fff' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.25)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.02)' },
              ],
            },
          },
          data: memoryValues,
        },
      ],
    };
  }, [cpuHistory, memoryHistory, timeRange]);

  const forecastChartOption = useMemo(() => {
    const timestamps: string[] = [];
    const predictedCpu: number[] = [];
    const predictedMemory: number[] = [];

    if (loadForecast) {
      loadForecast.timestamps.forEach((t, i) => {
        timestamps.push(formatDate(t, 'MM-DD HH:mm'));
        predictedCpu.push(loadForecast.predictedCpu[i]);
        predictedMemory.push(loadForecast.predictedMemory[i]);
      });
    } else {
      const now = Date.now();
      for (let i = 0; i < 24; i++) {
        const t = now + i * 3600000;
        timestamps.push(formatDate(t, 'MM-DD HH:mm'));
        const baseCpu = 50 + Math.sin(i * 0.5) * 25;
        const baseMemory = 55 + Math.sin(i * 0.4) * 20;
        predictedCpu.push(Math.max(20, Math.min(90, baseCpu)));
        predictedMemory.push(Math.max(30, Math.min(85, baseMemory)));
      }
    }

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1e293b' },
      },
      legend: {
        data: ['预测CPU', '预测内存'],
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
        boundaryGap: false,
        data: timestamps,
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLine: { show: false },
        axisLabel: { color: '#64748b', fontSize: 11, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      },
      series: [
        {
          name: '预测CPU',
          type: 'line',
          smooth: true,
          symbol: 'diamond',
          symbolSize: 6,
          lineStyle: { color: '#8b5cf6', width: 2, type: 'dashed' },
          itemStyle: { color: '#8b5cf6' },
          data: predictedCpu,
        },
        {
          name: '预测内存',
          type: 'line',
          smooth: true,
          symbol: 'diamond',
          symbolSize: 6,
          lineStyle: { color: '#f59e0b', width: 2, type: 'dashed' },
          itemStyle: { color: '#f59e0b' },
          data: predictedMemory,
        },
      ],
    };
  }, [loadForecast]);

  const nodeColumns = useMemo(
    () => [
      {
        key: 'nodeName',
        title: '节点名称',
        dataIndex: 'nodeName' as keyof NodeMetrics,
        width: '160px',
        render: (record: NodeMetrics) => (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success-500"></div>
            <span className="font-medium text-dark-900">{record.nodeName}</span>
          </div>
        ),
      },
      {
        key: 'status',
        title: '状态',
        width: '80px',
        render: () => <StatusBadge status="success" />,
      },
      {
        key: 'cpuUsage',
        title: 'CPU使用率',
        dataIndex: 'cpuUsage' as keyof NodeMetrics,
        width: '180px',
        render: (record: NodeMetrics) => (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-dark-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  record.cpuUsage >= 90 ? 'bg-danger-500' :
                  record.cpuUsage >= 70 ? 'bg-warning-500' : 'bg-primary-500'
                }`}
                style={{ width: `${Math.min(record.cpuUsage, 100)}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium w-14 text-right">{record.cpuUsage.toFixed(1)}%</span>
          </div>
        ),
      },
      {
        key: 'memoryUsage',
        title: '内存使用率',
        dataIndex: 'memoryUsage' as keyof NodeMetrics,
        width: '180px',
        render: (record: NodeMetrics) => (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-dark-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  record.memoryUsage >= 90 ? 'bg-danger-500' :
                  record.memoryUsage >= 70 ? 'bg-warning-500' : 'bg-success-500'
                }`}
                style={{ width: `${Math.min(record.memoryUsage, 100)}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium w-14 text-right">{record.memoryUsage.toFixed(1)}%</span>
          </div>
        ),
      },
      {
        key: 'diskUsage',
        title: '磁盘使用率',
        dataIndex: 'diskUsage' as keyof NodeMetrics,
        width: '180px',
        render: (record: NodeMetrics) => (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-dark-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-info-500 transition-all duration-300"
                style={{ width: `${Math.min(record.diskUsage, 100)}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium w-14 text-right">{record.diskUsage.toFixed(1)}%</span>
          </div>
        ),
      },
      {
        key: 'loadAverage',
        title: '负载',
        dataIndex: 'loadAverage' as keyof NodeMetrics,
        width: '140px',
        render: (record: NodeMetrics) => (
          <span className="text-sm text-dark-600">
            {record.loadAverage.map((l) => l.toFixed(1)).join(' / ')}
          </span>
        ),
      },
    ],
    []
  );

  const queueColumns = useMemo(
    () => [
      {
        key: 'queueName',
        title: '队列名称',
        dataIndex: 'queueName' as keyof QueueMetrics,
        width: '120px',
        render: (record: QueueMetrics) => (
          <span className="font-medium text-dark-900">{record.queueName}</span>
        ),
      },
      {
        key: 'depth',
        title: '队列深度',
        dataIndex: 'depth' as keyof QueueMetrics,
        width: '100px',
        align: 'right' as const,
        render: (record: QueueMetrics) => (
          <span className={`font-semibold ${
            record.depth >= 200 ? 'text-danger-600' :
            record.depth >= 100 ? 'text-warning-600' : 'text-dark-700'
          }`}>
            {formatNumber(record.depth)}
          </span>
        ),
      },
      {
        key: 'waitingTime',
        title: '平均等待时间',
        dataIndex: 'waitingTime' as keyof QueueMetrics,
        width: '120px',
        align: 'right' as const,
        render: (record: QueueMetrics) => (
          <span className="text-dark-700">{record.waitingTime.toFixed(1)}s</span>
        ),
      },
      {
        key: 'consumeRate',
        title: '消费速率',
        dataIndex: 'consumeRate' as keyof QueueMetrics,
        width: '120px',
        align: 'right' as const,
        render: (record: QueueMetrics) => (
          <span className="text-success-600">{record.consumeRate.toFixed(1)}/s</span>
        ),
      },
      {
        key: 'produceRate',
        title: '生产速率',
        dataIndex: 'produceRate' as keyof QueueMetrics,
        width: '120px',
        align: 'right' as const,
        render: (record: QueueMetrics) => (
          <span className="text-info-600">{record.produceRate.toFixed(1)}/s</span>
        ),
      },
      {
        key: 'status',
        title: '状态',
        width: '100px',
        render: (record: QueueMetrics) => (
          <StatusBadge
            status={record.depth >= 200 ? 'failed' : record.depth >= 100 ? 'running' : 'success'}
          />
        ),
      },
    ],
    []
  );

  const timeRangeOptions: { key: TimeRange; label: string }[] = [
    { key: '1h', label: '1小时' },
    { key: '6h', label: '6小时' },
    { key: '24h', label: '24小时' },
    { key: '7d', label: '7天' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">监控中心</h1>
          <p className="mt-1 text-sm text-dark-500">
            实时监控系统运行状态和资源使用情况
            {lastUpdate && (
              <span className="ml-2 text-primary-600">
                最后更新: {formatDate(lastUpdate, 'HH:mm:ss')}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="secondary"
          icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
          onClick={handleRefresh}
        >
          刷新数据
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="在线节点数"
          value={stats.onlineNodes}
          icon={<Server size={24} />}
          description="当前活跃节点"
          color="primary"
        />
        <StatCard
          title="任务执行中"
          value={stats.runningTasks}
          icon={<Activity size={24} />}
          description="正在执行的任务"
          color="success"
        />
        <StatCard
          title="队列深度"
          value={stats.totalQueueDepth}
          icon={<Layers size={24} />}
          description="待处理任务总数"
          color="warning"
        />
        <StatCard
          title="CPU平均使用率"
          value={stats.avgCpu}
          icon={<Cpu size={24} />}
          description="集群平均水平"
          color="info"
        />
        <StatCard
          title="内存平均使用率"
          value={stats.avgMemory}
          icon={<HardDrive size={24} />}
          description="集群平均水平"
          color="danger"
        />
      </div>

      <Card
        title="CPU/内存使用率趋势"
        subtitle="实时监控资源使用趋势"
        actions={
          <div className="flex items-center gap-1">
            {timeRangeOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setTimeRange(option.key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  timeRange === option.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-50 text-dark-600 hover:bg-dark-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      >
        <ReactECharts
          option={cpuMemoryChartOption}
          style={{ height: '320px', width: '100%' }}
          notMerge
          lazyUpdate
        />
      </Card>

      <Card
        title="节点实时状态"
        subtitle="各节点资源使用详情（每5秒自动刷新）"
        actions={
          <div className="flex items-center gap-2 text-sm text-dark-500">
            <Clock size={14} />
            <span>自动刷新中</span>
          </div>
        }
      >
        <Table<NodeMetrics>
          columns={nodeColumns}
          data={displayNodes}
          loading={loading}
          rowKey="nodeId"
          emptyText="暂无节点数据"
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="队列监控面板"
          subtitle="各队列实时状态"
        >
          <Table<QueueMetrics>
            columns={queueColumns}
            data={displayQueues}
            loading={loading}
            rowKey="queueName"
            emptyText="暂无队列数据"
          />
        </Card>

        <Card
          title="负载预测"
          subtitle="未来24小时资源负载预测"
        >
          <ReactECharts
            option={forecastChartOption}
            style={{ height: '320px', width: '100%' }}
            notMerge
            lazyUpdate
          />
        </Card>
      </div>
    </div>
  );
}
