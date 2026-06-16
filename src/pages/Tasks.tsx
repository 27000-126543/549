import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Send,
  Play,
  Filter,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import type { Task, TaskListRequest, TaskCreateRequest, TaskStatus, TaskType, TaskPriority } from '../../shared/types';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  submitApproval,
  runTask,
} from '../services/tasks';
import Card from '../components/Card';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Badge from '../components/Badge';
import StatusBadge from '../components/StatusBadge';
import {
  formatDate,
  getTaskTypeLabel,
  getTaskPriorityLabel,
  getPriorityColor,
} from '../lib/utils';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<TaskType | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<TaskCreateRequest>>({
    name: '',
    description: '',
    type: 'api',
    priority: 'medium',
    projectId: 'default',
    triggerConfig: {
      type: 'api',
    },
    dagConfig: {
      nodes: [],
      edges: [],
    },
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params: TaskListRequest = {
        page,
        pageSize,
        keyword: keyword || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        priority: priorityFilter || undefined,
      };
      const response = await getTasks(params);
      if (response.code === 200) {
        setTasks(response.data.list);
        setTotal(response.data.total);
      } else {
        showToast('error', response.message || '获取任务列表失败');
      }
    } catch (error) {
      showToast('error', '获取任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [page, pageSize]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSearch = () => {
    setPage(1);
    fetchTasks();
  };

  const handleReset = () => {
    setKeyword('');
    setStatusFilter('');
    setTypeFilter('');
    setPriorityFilter('');
    setPage(1);
    fetchTasks();
  };

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };

  const handleCreate = () => {
    setEditingTask(null);
    setFormData({
      name: '',
      description: '',
      type: 'api',
      priority: 'medium',
      projectId: 'default',
      triggerConfig: {
        type: 'api',
      },
      dagConfig: {
        nodes: [],
        edges: [],
      },
    });
    setShowCreateModal(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      description: task.description,
      type: task.type,
      priority: task.priority,
      projectId: task.projectId,
      triggerConfig: task.triggerConfig,
      dagConfig: task.dagConfig,
    });
    setShowCreateModal(true);
  };

  const handleViewDetail = (task: Task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleDelete = (task: Task) => {
    setSelectedTask(task);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedTask) return;
    setActionLoading('delete');
    try {
      const response = await deleteTask(selectedTask.id);
      if (response.code === 200) {
        showToast('success', '删除成功');
        setShowDeleteConfirm(false);
        fetchTasks();
      } else {
        showToast('error', response.message || '删除失败');
      }
    } catch (error) {
      showToast('error', '删除失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitApproval = async (task: Task) => {
    setActionLoading(`approval-${task.id}`);
    try {
      const response = await submitApproval(task.id);
      if (response.code === 200) {
        showToast('success', '提交审批成功');
        fetchTasks();
      } else {
        showToast('error', response.message || '提交审批失败');
      }
    } catch (error) {
      showToast('error', '提交审批失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRunTask = async (task: Task) => {
    setActionLoading(`run-${task.id}`);
    try {
      const response = await runTask(task.id);
      if (response.code === 200) {
        showToast('success', '任务已启动');
        fetchTasks();
      } else {
        showToast('error', response.message || '任务执行失败');
      }
    } catch (error) {
      showToast('error', '任务执行失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFormSubmit = async () => {
    if (!formData.name?.trim()) {
      showToast('error', '请输入任务名称');
      return;
    }
    if (!formData.description?.trim()) {
      showToast('error', '请输入任务描述');
      return;
    }

    setFormLoading(true);
    try {
      if (editingTask) {
        const response = await updateTask(editingTask.id, formData as Partial<Task>);
        if (response.code === 200) {
          showToast('success', '更新成功');
          setShowCreateModal(false);
          fetchTasks();
        } else {
          showToast('error', response.message || '更新失败');
        }
      } else {
        const response = await createTask(formData as TaskCreateRequest);
        if (response.code === 200) {
          showToast('success', '创建成功');
          setShowCreateModal(false);
          fetchTasks();
        } else {
          showToast('error', response.message || '创建失败');
        }
      }
    } catch (error) {
      showToast('error', editingTask ? '更新失败' : '创建失败');
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      title: '任务名称',
      dataIndex: 'name' as keyof Task,
      render: (record: Task) => (
        <div className="font-medium text-dark-900">{record.name}</div>
      ),
    },
    {
      key: 'type',
      title: '类型',
      dataIndex: 'type' as keyof Task,
      render: (record: Task) => (
        <Badge variant="primary">{getTaskTypeLabel(record.type)}</Badge>
      ),
    },
    {
      key: 'priority',
      title: '优先级',
      dataIndex: 'priority' as keyof Task,
      render: (record: Task) => (
        <span className={getPriorityColor(record.priority)}>
          {getTaskPriorityLabel(record.priority)}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status' as keyof Task,
      render: (record: Task) => <StatusBadge status={record.status} />,
    },
    {
      key: 'projectId',
      title: '所属项目',
      dataIndex: 'projectId' as keyof Task,
      render: (record: Task) => (
        <span className="text-dark-600">{record.projectId || '-'}</span>
      ),
    },
    {
      key: 'createdAt',
      title: '创建时间',
      dataIndex: 'createdAt' as keyof Task,
      render: (record: Task) => (
        <span className="text-dark-600">{formatDate(record.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '240px',
      align: 'right' as const,
      render: (record: Task) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetail(record);
            }}
            title="查看详情"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(record);
            }}
            title="编辑"
          />
          {record.status === 'draft' && (
            <Button
              variant="ghost"
              size="sm"
              icon={
                actionLoading === `approval-${record.id}` ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )
              }
              onClick={(e) => {
                e.stopPropagation();
                handleSubmitApproval(record);
              }}
              disabled={actionLoading === `approval-${record.id}`}
              title="提交审批"
            />
          )}
          {(record.status === 'active' || record.status === 'paused') && (
            <Button
              variant="ghost"
              size="sm"
              icon={
                actionLoading === `run-${record.id}` ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Play size={16} />
                )
              }
              onClick={(e) => {
                e.stopPropagation();
                handleRunTask(record);
              }}
              disabled={actionLoading === `run-${record.id}`}
              title="手动执行"
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 size={16} className="text-danger-600" />}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(record);
            }}
            title="删除"
          />
        </div>
      ),
    },
  ];

  const statusOptions = [
    { label: '全部状态', value: '' },
    { label: '草稿', value: 'draft' },
    { label: '待审批', value: 'pending_approval' },
    { label: '已激活', value: 'active' },
    { label: '已暂停', value: 'paused' },
    { label: '已禁用', value: 'disabled' },
  ];

  const typeOptions = [
    { label: '全部类型', value: '' },
    { label: 'API调用', value: 'api' },
    { label: '邮件发送', value: 'email' },
    { label: '文件处理', value: 'file' },
    { label: '手动触发', value: 'manual' },
    { label: '定时任务', value: 'cron' },
  ];

  const priorityOptions = [
    { label: '全部优先级', value: '' },
    { label: '低', value: 'low' },
    { label: '中', value: 'medium' },
    { label: '高', value: 'high' },
    { label: '紧急', value: 'urgent' },
  ];

  const formTypeOptions = [
    { label: 'API调用', value: 'api' },
    { label: '邮件发送', value: 'email' },
    { label: '文件处理', value: 'file' },
    { label: '手动触发', value: 'manual' },
    { label: '定时任务', value: 'cron' },
  ];

  const formPriorityOptions = [
    { label: '低', value: 'low' },
    { label: '中', value: 'medium' },
    { label: '高', value: 'high' },
    { label: '紧急', value: 'urgent' },
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
            <h1 className="text-xl font-bold text-dark-900">任务管理</h1>
            <Badge variant="info">{total} 个任务</Badge>
          </div>
        }
        actions={
          <Button icon={<Plus size={18} />} onClick={handleCreate}>
            创建任务
          </Button>
        }
      >
        <div className="mb-6 p-4 bg-dark-50 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-dark-500" />
            <span className="font-medium text-dark-700">筛选条件</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <Input
              placeholder="搜索任务名称..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              icon={<Search size={18} />}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
              options={statusOptions}
            />
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TaskType | '')}
              options={typeOptions}
            />
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
              options={priorityOptions}
            />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSearch}>
                搜索
              </Button>
              <Button variant="secondary" onClick={handleReset} icon={<X size={18} />}>
                重置
              </Button>
            </div>
          </div>
        </div>

        <Table
          columns={columns}
          data={tasks}
          loading={loading}
          rowKey="id"
          onRowClick={handleViewDetail}
        />

        {total > 0 && (
          <div className="mt-4">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={handlePageChange}
            />
          </div>
        )}
      </Card>

      <Modal
        open={showCreateModal}
        title={editingTask ? '编辑任务' : '创建任务'}
        onClose={() => setShowCreateModal(false)}
        onOk={handleFormSubmit}
        okText={editingTask ? '保存' : '创建'}
        okLoading={formLoading}
        width="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="任务名称"
              placeholder="请输入任务名称"
              value={formData.name || ''}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <Select
              label="任务类型"
              value={formData.type || 'api'}
              onChange={(e) => {
                const type = e.target.value as TaskType;
                setFormData({
                  ...formData,
                  type,
                  triggerConfig: { ...formData.triggerConfig!, type },
                });
              }}
              options={formTypeOptions}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="优先级"
              value={formData.priority || 'medium'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priority: e.target.value as TaskPriority,
                })
              }
              options={formPriorityOptions}
            />
            <Input
              label="所属项目"
              placeholder="请输入项目ID"
              value={formData.projectId || ''}
              onChange={(e) =>
                setFormData({ ...formData, projectId: e.target.value })
              }
            />
          </div>
          <Input
            label="任务描述"
            placeholder="请输入任务描述"
            value={formData.description || ''}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>
      </Modal>

      <Modal
        open={showDetailModal}
        title="任务详情"
        onClose={() => setShowDetailModal(false)}
        footer={
          selectedTask && (
            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                关闭
              </Button>
              <Button icon={<Edit size={18} />} onClick={() => {
                setShowDetailModal(false);
                handleEdit(selectedTask);
              }}>
                编辑
              </Button>
            </div>
          )
        }
        width="max-w-3xl"
      >
        {selectedTask && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-dark-900">{selectedTask.name}</h3>
                <p className="text-sm text-dark-500 mt-1">{selectedTask.description}</p>
              </div>
              <StatusBadge status={selectedTask.status} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-dark-50 rounded-lg">
                <p className="text-xs text-dark-500 mb-1">任务类型</p>
                <Badge variant="primary">{getTaskTypeLabel(selectedTask.type)}</Badge>
              </div>
              <div className="p-3 bg-dark-50 rounded-lg">
                <p className="text-xs text-dark-500 mb-1">优先级</p>
                <span className={`font-medium ${getPriorityColor(selectedTask.priority)}`}>
                  {getTaskPriorityLabel(selectedTask.priority)}
                </span>
              </div>
              <div className="p-3 bg-dark-50 rounded-lg">
                <p className="text-xs text-dark-500 mb-1">所属项目</p>
                <p className="text-dark-800 font-medium">{selectedTask.projectId || '-'}</p>
              </div>
              <div className="p-3 bg-dark-50 rounded-lg">
                <p className="text-xs text-dark-500 mb-1">创建人</p>
                <p className="text-dark-800 font-medium">{selectedTask.createdBy || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-dark-50 rounded-lg">
                <p className="text-xs text-dark-500 mb-1">创建时间</p>
                <p className="text-dark-800 font-medium">{formatDate(selectedTask.createdAt)}</p>
              </div>
              <div className="p-3 bg-dark-50 rounded-lg">
                <p className="text-xs text-dark-500 mb-1">更新时间</p>
                <p className="text-dark-800 font-medium">{formatDate(selectedTask.updatedAt)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-dark-500 mb-2">触发器配置</p>
              <pre className="p-3 bg-dark-50 rounded-lg text-xs text-dark-700 overflow-x-auto">
                {JSON.stringify(selectedTask.triggerConfig, null, 2)}
              </pre>
            </div>

            <div>
              <p className="text-xs text-dark-500 mb-2">DAG配置</p>
              <pre className="p-3 bg-dark-50 rounded-lg text-xs text-dark-700 overflow-x-auto">
                {JSON.stringify(selectedTask.dagConfig, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showDeleteConfirm}
        title="确认删除"
        onClose={() => setShowDeleteConfirm(false)}
        onOk={confirmDelete}
        okText="删除"
        okLoading={actionLoading === 'delete'}
        width="max-w-md"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-danger-50 rounded-full">
            <AlertCircle size={24} className="text-danger-600" />
          </div>
          <div>
            <p className="font-medium text-dark-900">确定要删除这个任务吗？</p>
            <p className="text-sm text-dark-500 mt-1">
              任务 &quot;{selectedTask?.name}&quot; 将被永久删除，此操作不可撤销。
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
