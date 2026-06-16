import Badge from './Badge';

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'default'; label: string }> = {
  success: { variant: 'success', label: '成功' },
  running: { variant: 'primary', label: '运行中' },
  pending: { variant: 'warning', label: '等待中' },
  failed: { variant: 'danger', label: '失败' },
  cancelled: { variant: 'default', label: '已取消' },
  draft: { variant: 'default', label: '草稿' },
  pending_approval: { variant: 'warning', label: '待审批' },
  active: { variant: 'success', label: '已激活' },
  paused: { variant: 'warning', label: '已暂停' },
  online: { variant: 'success', label: '在线' },
  offline: { variant: 'danger', label: '离线' },
  retrying: { variant: 'warning', label: '重试中' },
  pending_retry: { variant: 'warning', label: '等待重试' },
  dead_letter: { variant: 'danger', label: '死信' },
  approved: { variant: 'success', label: '已通过' },
  rejected: { variant: 'danger', label: '已拒绝' },
  transferred: { variant: 'info', label: '已转交' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { variant: 'default', label: status };
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
