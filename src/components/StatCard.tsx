import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  description?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  description,
  color = 'primary',
}: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
    info: 'bg-info-50 text-info-600',
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-dark-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-dark-900">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              {trend.isUp ? (
                <TrendingUp size={16} className="text-success-600" />
              ) : (
                <TrendingDown size={16} className="text-danger-600" />
              )}
              <span
                className={`text-sm font-medium ${
                  trend.isUp ? 'text-success-600' : 'text-danger-600'
                }`}
              >
                {trend.value}%
              </span>
              <span className="text-sm text-dark-500 ml-1">较上周</span>
            </div>
          )}
          {description && (
            <p className="mt-1 text-sm text-dark-500">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
