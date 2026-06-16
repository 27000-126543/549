import { useState, useEffect } from 'react';
import { CheckSquare, Clock, Check, X, Send, User, FileText, RefreshCw } from 'lucide-react';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Tabs from '@/components/Tabs';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import StatusBadge from '@/components/StatusBadge';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { getPendingApprovals, getApprovalHistory, handleApproval } from '@/services/approvals';
import type { PendingApproval, ApprovalRecord, ApprovalStatus } from '../../shared/types';
import dayjs from 'dayjs';

const taskTypeLabels: Record<string, string> = {
  api: 'API任务',
  email: '邮件任务',
  file: '文件任务',
  manual: '手动任务',
  cron: '定时任务',
};

interface ApprovalModalData {
  record: PendingApproval | null;
  action: 'approve' | 'reject' | 'transfer' | null;
}

export default function Approvals() {
  const [pendingList, setPendingList] = useState<PendingApproval[]>([]);
  const [historyList, setHistoryList] = useState<ApprovalRecord[]>([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState({
    pending: false,
    history: false,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<ApprovalModalData>({
    record: null,
    action: null,
  });
  const [comment, setComment] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPendingApprovals = async () => {
    setLoading((prev) => ({ ...prev, pending: true }));
    try {
      const res = await getPendingApprovals({ page: 1, pageSize: 100 });
      setPendingList(res.data.list || []);
    } catch (error) {
      console.error('Failed to fetch pending approvals:', error);
    } finally {
      setLoading((prev) => ({ ...prev, pending: false }));
    }
  };

  const fetchApprovalHistory = async () => {
    setLoading((prev) => ({ ...prev, history: true }));
    try {
      const res = await getApprovalHistory({ page: 1, pageSize: 100 });
      setHistoryList(res.data.list || []);
    } catch (error) {
      console.error('Failed to fetch approval history:', error);
    } finally {
      setLoading((prev) => ({ ...prev, history: false }));
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
    fetchApprovalHistory();
  }, []);

  const openModal = (record: PendingApproval, action: 'approve' | 'reject' | 'transfer') => {
    setModalData({ record, action });
    setComment('');
    setTransferTo('');
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!modalData.record || !modalData.action) return;

    setSubmitting(true);
    try {
      let status: ApprovalStatus;
      let transferToValue: string | undefined;

      switch (modalData.action) {
        case 'approve':
          status = 'approved';
          break;
        case 'reject':
          status = 'rejected';
          break;
        case 'transfer':
          status = 'transferred';
          transferToValue = transferTo;
          break;
        default:
          return;
      }

      await handleApproval({
        recordId: modalData.record.id,
        status,
        comment: comment || undefined,
        transferTo: transferToValue,
      });

      setModalVisible(false);
      fetchPendingApprovals();
      fetchApprovalHistory();
    } catch (error) {
      console.error('Failed to handle approval:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getModalTitle = () => {
    switch (modalData.action) {
      case 'approve':
        return '通过审批';
      case 'reject':
        return '拒绝审批';
      case 'transfer':
        return '转交审批';
      default:
        return '审批操作';
    }
  };

  const getModalOkText = () => {
    switch (modalData.action) {
      case 'approve':
        return '确认通过';
      case 'reject':
        return '确认拒绝';
      case 'transfer':
        return '确认转交';
      default:
        return '确定';
    }
  };

  const pendingColumns = [
    {
      key: 'taskName',
      title: '任务名称',
      dataIndex: 'taskName' as keyof PendingApproval,
      render: (record: PendingApproval) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <FileText size={16} className="text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-dark-900">{record.taskName}</p>
            <p className="text-xs text-dark-500">{record.nodeName}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'taskType',
      title: '审批类型',
      dataIndex: 'taskType' as keyof PendingApproval,
      render: (record: PendingApproval) => (
        <Badge variant="info">{taskTypeLabels[record.taskType] || record.taskType}</Badge>
      ),
    },
    {
      key: 'submitter',
      title: '申请人',
      dataIndex: 'submitterName' as keyof PendingApproval,
      render: (record: PendingApproval) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-dark-100 rounded-full flex items-center justify-center">
            <User size={12} className="text-dark-500" />
          </div>
          <span className="text-dark-700">{record.submitterName}</span>
        </div>
      ),
    },
    {
      key: 'submitTime',
      title: '申请时间',
      dataIndex: 'submitTime' as keyof PendingApproval,
      render: (record: PendingApproval) => (
        <span className="text-dark-500 text-sm">
          {dayjs(record.submitTime).format('YYYY-MM-DD HH:mm:ss')}
        </span>
      ),
    },
    {
      key: 'deadline',
      title: '截止时间',
      dataIndex: 'deadline' as keyof PendingApproval,
      render: (record: PendingApproval) => {
        const isOverdue = dayjs(record.deadline).isBefore(dayjs());
        return (
          <span className={`text-sm ${isOverdue ? 'text-danger-600' : 'text-dark-500'}`}>
            {dayjs(record.deadline).format('YYYY-MM-DD HH:mm')}
          </span>
        );
      },
    },
    {
      key: 'actions',
      title: '操作',
      width: '240px',
      render: (record: PendingApproval) => (
        <div className="flex items-center gap-2">
          <Button
            variant="success"
            size="sm"
            icon={<Check size={14} />}
            onClick={() => openModal(record, 'approve')}
          >
            通过
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<X size={14} />}
            onClick={() => openModal(record, 'reject')}
          >
            拒绝
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Send size={14} />}
            onClick={() => openModal(record, 'transfer')}
          >
            转交
          </Button>
        </div>
      ),
    },
  ];

  const historyColumns = [
    {
      key: 'taskId',
      title: '任务ID',
      dataIndex: 'taskId' as keyof ApprovalRecord,
      render: (record: ApprovalRecord) => (
        <span className="text-dark-700 font-mono text-sm">{record.taskId}</span>
      ),
    },
    {
      key: 'approver',
      title: '审批人',
      dataIndex: 'approverName' as keyof ApprovalRecord,
      render: (record: ApprovalRecord) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-dark-100 rounded-full flex items-center justify-center">
            <User size={12} className="text-dark-500" />
          </div>
          <span className="text-dark-700">{record.approverName}</span>
        </div>
      ),
    },
    {
      key: 'status',
      title: '审批结果',
      dataIndex: 'status' as keyof ApprovalRecord,
      render: (record: ApprovalRecord) => <StatusBadge status={record.status} />,
    },
    {
      key: 'comment',
      title: '审批意见',
      dataIndex: 'comment' as keyof ApprovalRecord,
      render: (record: ApprovalRecord) => (
        <span className="text-dark-500 text-sm">{record.comment || '-'}</span>
      ),
    },
    {
      key: 'createdAt',
      title: '审批时间',
      dataIndex: 'createdAt' as keyof ApprovalRecord,
      render: (record: ApprovalRecord) => (
        <span className="text-dark-500 text-sm">
          {dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss')}
        </span>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'pending',
      label: '待办审批',
      icon: <Clock size={16} />,
    },
    {
      key: 'history',
      label: '审批历史',
      icon: <CheckSquare size={16} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">审批中心</h1>
          <p className="text-dark-500 mt-1">处理待办审批和查看审批历史记录</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            icon={<RefreshCw size={18} />}
            onClick={() => {
              if (activeTab === 'pending') {
                fetchPendingApprovals();
              } else {
                fetchApprovalHistory();
              }
            }}
          >
            刷新
          </Button>
        </div>
      </div>

      <Card>
        <Tabs
          items={tabItems}
          activeKey={activeTab}
          onChange={setActiveTab}
        >
          {activeTab === 'pending' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="warning">{pendingList.length} 条待处理</Badge>
              </div>
              <Table<PendingApproval>
                columns={pendingColumns}
                data={pendingList}
                loading={loading.pending}
                rowKey="id"
                emptyText="暂无待办审批"
              />
            </div>
          )}
          {activeTab === 'history' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="info">{historyList.length} 条历史记录</Badge>
              </div>
              <Table<ApprovalRecord>
                columns={historyColumns}
                data={historyList}
                loading={loading.history}
                rowKey="id"
                emptyText="暂无审批历史"
              />
            </div>
          )}
        </Tabs>
      </Card>

      <Modal
        open={modalVisible}
        title={getModalTitle()}
        width="max-w-lg"
        onClose={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText={getModalOkText()}
        okLoading={submitting}
      >
        {modalData.record && (
          <div className="space-y-4">
            <div className="p-4 bg-dark-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-dark-900">{modalData.record.taskName}</p>
                  <p className="text-sm text-dark-500 mt-1">
                    {taskTypeLabels[modalData.record.taskType] || modalData.record.taskType}
                  </p>
                </div>
                <Badge variant="warning">{modalData.record.nodeName}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm text-dark-500">
                <span>申请人: {modalData.record.submitterName}</span>
                <span>申请时间: {dayjs(modalData.record.submitTime).format('YYYY-MM-DD HH:mm')}</span>
              </div>
            </div>

            {modalData.action === 'transfer' && (
              <div>
                <label className="label">转交人员</label>
                <Select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  options={[
                    { label: '请选择转交人员', value: '' },
                    { label: '张三', value: 'user1' },
                    { label: '李四', value: 'user2' },
                    { label: '王五', value: 'user3' },
                  ]}
                />
              </div>
            )}

            <div>
              <label className="label">
                审批意见
                {modalData.action === 'reject' && (
                  <span className="text-danger-500 ml-1">*</span>
                )}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={modalData.action === 'reject' ? '请输入拒绝原因' : '请输入审批意见（可选）'}
                className="input min-h-[100px] resize-y"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
