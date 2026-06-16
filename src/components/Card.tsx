import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string | ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  footer?: ReactNode;
}

export default function Card({
  children,
  className = '',
  title,
  subtitle,
  actions,
  footer,
}: CardProps) {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {typeof title === 'string' ? (
              <h3 className="text-lg font-semibold text-dark-900">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="text-sm text-dark-500 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
      {footer && <div className="mt-4 pt-4 border-t border-dark-100">{footer}</div>}
    </div>
  );
}
