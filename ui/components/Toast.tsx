import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  }[toast.type];

  const textColor = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
  }[toast.type];

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  }[toast.type];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${bgColor} ${textColor} animate-slide-in`}
    >
      <Icon size={20} />
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="opacity-60 hover:opacity-100 transition-opacity"
      >
        <X size={16} />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = React.useCallback((type: ToastType, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuccess = React.useCallback((message: string) => addToast('success', message), [addToast]);
  const showError = React.useCallback((message: string) => addToast('error', message), [addToast]);
  const showInfo = React.useCallback((message: string) => addToast('info', message), [addToast]);

  return {
    toasts,
    dismissToast,
    showSuccess,
    showError,
    showInfo,
  };
};
