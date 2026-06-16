import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

interface ModalProps {
  open: boolean;
  title?: string | ReactNode;
  children: ReactNode;
  onClose: () => void;
  onOk?: () => void;
  okText?: string;
  cancelText?: string;
  okLoading?: boolean;
  width?: string;
  footer?: ReactNode;
  maskClosable?: boolean;
}

export default function Modal({
  open,
  title,
  children,
  onClose,
  onOk,
  okText = '确定',
  cancelText = '取消',
  okLoading = false,
  width = 'max-w-2xl',
  footer,
  maskClosable = true,
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-dark-900/50 backdrop-blur-sm"
        onClick={() => maskClosable && onClose()}
      />
      <div
        className={`relative bg-white rounded-xl shadow-2xl w-full ${width} mx-4 animate-fade-in`}
      >
        {(title || onClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-200">
            {typeof title === 'string' ? (
              <h3 className="text-lg font-semibold text-dark-900">{title}</h3>
            ) : (
              title
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 text-dark-400 hover:text-dark-600 hover:bg-dark-100 rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
        
        {footer !== null && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-dark-200">
            {footer || (
              <>
                <Button variant="secondary" onClick={onClose}>
                  {cancelText}
                </Button>
                <Button variant="primary" loading={okLoading} onClick={onOk}>
                  {okText}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
