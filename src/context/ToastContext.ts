import { createContext, useContext } from 'react';
import type { ToastVariant } from '../components/common/Toast';

export interface ToastContextType {
  showToast: (
    variant: ToastVariant,
    title: string,
    message?: string,
    duration?: number,
    action?: { label: string; onClick: () => void }
  ) => void;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
