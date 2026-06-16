import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Skull,
  Rocket,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Activity,
  Clock,
} from 'lucide-react';
import type { FailedTask, DeadLetter, CanaryStrategy, FailedTaskStatus } from '../../shared/types';
import {
  getFailedTasks,
  retryTask,
  batchRetry,
  getDeadLetters,
  handleDeadLetter,
  getCanaryStrategies,
} from '../services/exceptions';
import Card from '../components/Card';
import Table from '../components/Table';
import Tabs from '../components/Tabs';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Badge from '../components/Badge';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../lib/utils';

export default function Exceptions() {
  const [activeTab, setActiveTab] = useState('failed');

  const [failedTasks, setFailedTasks] = useState<FailedTask[]>([]);
  const [failedLoading, setFailedLoading] = useState(false);
  const [failedPage, setFailedPage] = useState(1);
  const [failedPageSize, setFailedPageSize] = useState(10);
  const [failedTotal, setFailedTotal] = useState(0);
  const [selectedFailedTasks, setSelectedFailedTasks] = useState<string[]>([]);
  const [retryLoading, setRetryLoading] = useState<string | null>(null);

  const [deadLetters, setDeadLetters] = useState<DeadLetter[]>([]);
  const [deadLoading, setDeadLoading] = useState(false);
  const [deadPage, setDeadPage] = useState(1);
  const [deadPageSize, setDeadPageSize] = useState(10);
  const [deadTotal, setDeadTotal] = useState(0);
  const [handleLoading, setHandleLoading] = useState<string | null>(null);
  const [showHandleModal, setShowHandleModal] = useState(false);
  const [selectedDeadLetter, setSelectedDeadLetter] = useState<DeadLetter | null>(null);
  const [handlerNote, setHandlerNote] = useState('');
  const [requeue, setRequeue] = useState(false);

  const [canaryStrategies, setCanaryStrategies] = useState<CanaryStrategy[]>([]);
  const [canaryLoading, setCanaryLoading] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchFailedTasks = async () => {
    setFailedLoading(true);
    try {
      const response = await getFailedTasks({ page: failedPage, pageSize: failedPageSize });
      if (response.code === 200) {
        setFailedTasks(response.data.list);
        setFailedTotal(response.data.total);
      } else {
        showToast('error', response.message || '获取失败任务列表失败');
      }
    } catch (error) {
      showToast('error', '获取失败任务列表失败');
    } finally {
      setFailedLoading(false);
    }
  };

  const fetchDeadLetters = async () => {
    setDeadLoading(true);
    try {
      const response = await getDeadLetters({ page: deadPage, pageSize: deadPageSize });
      if (response.code === 200) {
        setDeadLetters(response.data.list);
        setDeadTotal(response.data.total);
      } else {
        showToast('error', response.message || '获取死信队列失败');
      }
    } catch (error) {
      showToast('error', '获取死信队列失败');
    } finally {
      setDeadLoading(false);
    }
  };

  const fetchCanaryStrategies = async () => {
    setCanaryLoading(true);
    try {
      const response = await getCanaryStrategies();
      if (response.code === 200) {
        setCanaryStrategies(response.data);
      } else {
        showToast('error', response.message || '获取灰度发布策略失败');
      }
    } catch (error) {
      showToast('error', '获取灰度发布策略失败');
    } finally {
      setCanaryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'failed') {
      fetchFailedTasks();
    } else if (activeTab === 'dead') {
      fetchDeadLetters();
    } else if (activeTab === 'canary') {
      fetchCanaryStrategies();
    }
  }, [activeTab, failedPage, failedPageSize, deadPage, deadPageSize]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRetry = async (task: FailedTask) => {
    setRetryLoading(task.id);
    try {
      const response = await retryTask(task.id);
      if (response.code === 200) {
        showToast('success', '重试成功');
        fetchFailedTasks();
      } else {
        showToast('error', response.message || '重试失败');
      }
    } catch (error) {
      showToast('error', '重试失败');
    } finally {
      setRetryLoading(null);
    }
  };

  const handleBatchRetry = async () => {
    if (selectedFailedTasks.length === 0) {
      showToast('error', '请先选择要重试的任务');
      return;
    }
    setRetryLoading('batch');
    try {
      const response = await batchRetry(selectedFailedTasks);
      if (response.code === 200) {
        showToast('success', `成功重试 ${selectedFailedTasks.length} 个任务`);
        setSelectedFailedTasks([]);
        fetchFailedTasks();
      } else {
        showToast('error', response.message || '批量重试失败');
      }
    } catch (error) {
      showToast('error', '批量重试失败');
    } finally {
      setRetryLoading(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFailedTasks(failedTasks.map((t) => t.id));
    } else {
      setSelectedFailedTasks([]);
    }
  };

  const handleSelectTask = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedFailedTasks([...selectedFailedTasks, id]);
    } else {
      setSelectedFailedTasks(selectedFailedTasks.filter((taskId) => taskId !== id));
    }
  };

  const openHandleModal = (letter: DeadLetter, requeueFlag: boolean) => {
    setSelectedDeadLetter(letter);
    setRequeue(requeueFlag);
    setHandlerNote('');
    setShowHandleModal(true);
  };

  const confirmHandle = async () => {
    if (!selectedDeadLetter) return;
    setHandleLoading(selectedDeadLetter.id);
    try {
      const response = await handleDeadLetter(selectedDeadLetter.id, {
        handlerNote,
        requeue,
      });
      if (response.code === 200) {
        showToast('success', requeue ? '重新入队成功' : '处理成功');
        setShowHandleModal(false);
        fetchDeadLetters();
      } else {
        showToast('error', response.message || '处理失败');
      }
    } catch (error) {
      showToast('error', '处理失败');
    } finally {
      setHandleLoading(null);
    }
  };

  const getErrorTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      timeout: '超时',
      network_error: '网络错误',
      api_error: 'API错误',
      data_error: '数据错误',
      system_error: '系统错误',
      unknown: '未知错误',
    };
    return labels[type] || type;
  };

  const getCanaryStatusLabel = (status: string): { variant: string; label: string } => {
    const config: Record<string, { variant: string; label: string }> = {
      draft: { variant: 'default', label: '草稿' },
      running: { variant: 'primary', label: '运行中' },
      paused: { variant: 'warning', label: '已暂停' },
      completed: { variant: 'success', label: '已完成' },
      rolled_back: { variant: 'danger', label: '已回滚' },
    };
    return config[status] || { variant: 'default', label: status };
  };

  const failedColumns = [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={selectedFailedTasks.length === failedTasks.length && failedTasks.length > 0}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="w-4 h-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
        />
      ),
      width: '50px',
      render: (record: FailedTask) => (
        <input
          type="checkbox"
          checked={selectedFailedTasks.includes(record.id)}
          onChange={(e) => handleSelectTask(record.id, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
        />
      ),
    },
    {
      key: 'taskName',
      title: '任务名称',
      dataIndex: 'taskName' as keyof FailedTask,
      render: (record: FailedTask) => (
        <div className="font-medium text-dark-900">{record.taskName}</div>
      ),
    },
    {
      key: 'errorType',
      title: '错误类型',
      dataIndex: 'errorType' as keyof FailedTask,
      render: (record: FailedTask) => (
        <Badge variant="warning">{getErrorTypeLabel(record.errorType)}</Badge>
      ),
    },
    {
      key: 'errorMessage',
      title: '错误信息',
      dataIndex: 'errorMessage' as keyof FailedTask,
      render: (record: FailedTask) => (
        <span className="text-dark-600 truncate max-w-xs" title={record.errorMessage}>
          {record.errorMessage}
        </span>
      ),
    },
    {
      key: 'failedAt',
      title: '失败时间',
      dataIndex: 'failedAt' as keyof FailedTask,
      render: (record: FailedTask) => (
        <span className="text-dark-600">{formatDate(record.failedAt)}</span>
      ),
    },
    {
      key: 'retryCount',
      title: '重试次数',
      dataIndex: 'retryCount' as keyof FailedTask,
      render: (record: FailedTask) => (
        <span className="text-dark-700">
          {record.retryCount} / {record.maxRetries}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status' as keyof FailedTask,
      render: (record: FailedTask) => <StatusBadge status={record.status} />,
    },
    {
      key: 'actions',
      title: '操作',
      width: '120px',
      align: 'right' as const,
      render: (record: FailedTask) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={
              retryLoading === record.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )
            }
            onClick={(e) => {
              e.stopPropagation();
              handleRetry(record);
            }}
            disabled={retryLoading === record.id || record.status === 'retrying'}
            title="重试"
          />
        </div>
      ),
    },
  ];

  const deadColumns = [
    {
      key: 'taskId',
      title: '任务ID',
      dataIndex: 'taskId' as keyof DeadLetter,
      render: (record: DeadLetter) => (
        <span className="font-mono text-sm text-dark-700">{record.taskId}</span>
      ),
    },
    {
      key: 'errorInfo',
      title: '错误信息',
      dataIndex: 'errorInfo' as keyof DeadLetter,
      render: (record: DeadLetter) => (
        <div>
          <Badge variant="danger" className="mb-1">
            {record.errorInfo?.type || '未知错误'}
          </Badge>
          <p className="text-sm text-dark-600 truncate max-w-md" title={record.errorInfo?.message}>
            {record.errorInfo?.message || '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'deadAt',
      title: '死信时间',
      dataIndex: 'deadAt' as keyof DeadLetter,
      render: (record: DeadLetter) => (
        <span className="text-dark-600">{formatDate(record.deadAt)}</span>
      ),
    },
    {
      key: 'handled',
      title: '处理状态',
      dataIndex: 'handled' as keyof DeadLetter,
      render: (record: DeadLetter) => (
        <Badge variant={record.handled ? 'success' : 'warning'}>
          {record.handled ? '已处理' : '待处理'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '180px',
      align: 'right' as const,
      render: (record: DeadLetter) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={
              handleLoading === record.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle size={16} className="text-success-600" />
              )
            }
            onClick={(e) => {
              e.stopPropagation();
              openHandleModal(record, false);
            }}
            disabled={handleLoading === record.id || record.handled}
            title="处理"
          >
            处理
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={
              handleLoading === record.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ArrowRight size={16} className="text-primary-600" />
              )
            }
            onClick={(e) => {
              e.stopPropagation();
              openHandleModal(record, true);
            }}
            disabled={handleLoading === record.id || record.handled}
            title="重新入队"
          >
            重新入队
          </Button>
        </div>
      ),
    },
  ];

  const canaryColumns = [
    {
      key: 'name',
      title: '策略名称',
      dataIndex: 'name' as keyof CanaryStrategy,
      render: (record: CanaryStrategy) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <Rocket size={16} className="text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-dark-900">{record.name}</p>
            <p className="text-xs text-dark-500">{record.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'trafficPercentage',
      title: '流量比例',
      dataIndex: 'trafficPercentage' as keyof CanaryStrategy,
      render: (record: CanaryStrategy) => (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-dark-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${record.trafficPercentage}%` }}
            />
          </div>
          <span className="text-dark-700 font-medium">{record.trafficPercentage}%</span>
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status' as keyof CanaryStrategy,
      render: (record: CanaryStrategy) => {
        const config = getCanaryStatusLabel(record.status);
        return <Badge variant={config.variant as any}>{config.label}</Badge>;
      },
    },
    {
      key: 'runtime',
      title: '运行时间',
      render: (record: CanaryStrategy) => (
        <div className="text-dark-600">
          {record.startTime ? formatDate(record.startTime) : '-'}
          {record.endTime && (
            <span className="text-dark-400">
              {' → '}
              {formatDate(record.endTime)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'metrics',
      title: '核心指标对比',
      dataIndex: 'metrics' as keyof CanaryStrategy,
      render: (record: CanaryStrategy) => {
        const metrics = record.metrics;
        if (!metrics) return <span className="text-dark-400">-</span>;
        const successDiff = metrics.successRate - metrics.baselineSuccessRate;
        const durationDiff = metrics.avgDuration - metrics.baselineAvgDuration;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity size={12} className="text-dark-400" />
              <span className="text-xs text-dark-500">成功率:</span>
              <span className="text-xs font-medium text-dark-700">
                {metrics.successRate.toFixed(1)}%
              </span>
              <span
                className={`text-xs ${
                  successDiff >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}
              >
                ({successDiff >= 0 ? '+' : ''}
                {successDiff.toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-dark-400" />
              <span className="text-xs text-dark-500">耗时:</span>
              <span className="text-xs font-medium text-dark-700">
                {metrics.avgDuration.toFixed(0)}ms
              </span>
              <span
                className={`text-xs ${
                  durationDiff <= 0 ? 'text-success-600' : 'text-danger-600'
                }`}
              >
                ({durationDiff <= 0 ? '' : '+'}
                {durationDiff.toFixed(0)}ms)
              </span>
            </div>
          </div>
        );
      },
    },
  ];

  const tabItems = [
    { key: 'failed', label: '失败任务', icon: <AlertTriangle size={16} /> },
    { key: 'dead', label: '死信队列', icon: <Skull size={16} /> },
    { key: 'canary', label: '灰度发布', icon: <Rocket size={16} /> },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'success'
              ? 'bg-success-500 text-white'
              : 'bg-danger-500 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <Card
        title={
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-dark-900">异常处理</h1>
            {activeTab === 'failed' && failedTotal > 0 && (
              <Badge variant="danger">{failedTotal} 个失败任务</Badge>
            )}
            {activeTab === 'dead' && deadTotal > 0 && (
              <Badge variant="warning">{deadTotal} 条死信</Badge>
            )}
          </div>
        }
        actions={
          activeTab === 'failed' && (
            <div className="flex items-center gap-2">
              {selectedFailedTasks.length > 0 && (
                <Button
                  icon={
                    retryLoading === 'batch' ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <RefreshCw size={18} />
                    )
                  }
                  onClick={handleBatchRetry}
                  disabled={retryLoading === 'batch'}
                >
                  批量重试 ({selectedFailedTasks.length})
                </Button>
              )}
            </div>
          )
        }
      >
        <Tabs items={tabItems} activeKey={activeTab} onChange={setActiveTab}>
          {activeTab === 'failed' && (
            <div>
              <Table
                columns={failedColumns}
                data={failedTasks}
                loading={failedLoading}
                rowKey="id"
              />
              {failedTotal > 0 && (
                <div className="mt-4">
                  <Pagination
                    current={failedPage}
                    pageSize={failedPageSize}
                    total={failedTotal}
                    onChange={(newPage, newPageSize) => {
                      setFailedPage(newPage);
                      setFailedPageSize(newPageSize);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'dead' && (
            <div>
              <Table
                columns={deadColumns}
                data={deadLetters}
                loading={deadLoading}
                rowKey="id"
              />
              {deadTotal > 0 && (
                <div className="mt-4">
                  <Pagination
                    current={deadPage}
                    pageSize={deadPageSize}
                    total={deadTotal}
                    onChange={(newPage, newPageSize) => {
                      setDeadPage(newPage);
                      setDeadPageSize(newPageSize);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'canary' && (
            <Table
              columns={canaryColumns}
              data={canaryStrategies}
              loading={canaryLoading}
              rowKey="id"
            />
          )}
        </Tabs>
      </Card>

      <Modal
        open={showHandleModal}
        title={requeue ? '重新入队' : '处理死信'}
        onClose={() => setShowHandleModal(false)}
        onOk={confirmHandle}
        okText={requeue ? '重新入队' : '标记已处理'}
        okLoading={handleLoading === selectedDeadLetter?.id}
        width="max-w-lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-dark-50 rounded-lg">
            <p className="text-sm text-dark-500 mb-1">任务ID</p>
            <p className="font-mono text-dark-800">{selectedDeadLetter?.taskId}</p>
          </div>
          <div className="p-3 bg-dark-50 rounded-lg">
            <p className="text-sm text-dark-500 mb-1">错误信息</p>
            <p className="text-dark-800">{selectedDeadLetter?.errorInfo?.message}</p>
          </div>
          <div className="p-3 bg-dark-50 rounded-lg">
            <p className="text-sm text-dark-500 mb-1">死信时间</p>
            <p className="text-dark-800">
              {selectedDeadLetter && formatDate(selectedDeadLetter.deadAt)}
            </p>
          </div>
          {requeue && (
            <div className="p-3 bg-primary-50 rounded-lg border border-primary-100">
              <p className="text-sm text-primary-700">
                此操作将把任务重新加入执行队列，系统会重新执行该任务。
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              处理备注
            </label>
            <textarea
              value={handlerNote}
              onChange={(e) => setHandlerNote(e.target.value)}
              placeholder="请输入处理备注（可选）"
              className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
