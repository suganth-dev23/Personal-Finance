import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Trophy,
  Award,
  Info,
  X,
} from 'lucide-react';

export type ToastVariant = 'success' | 'warning' | 'danger' | 'milestone' | 'badge' | 'info';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration || 3500;
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 220); // start exit animation slightly before unmount

    const unmountTimer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(unmountTimer);
    };
  }, [toast, onDismiss]);

  const handleManualDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  const getVariantStyles = () => {
    switch (toast.variant) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
          iconBg: 'bg-emerald-500/10 border border-emerald-500/20',
          hairline: 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
          iconBg: 'bg-amber-500/10 border border-amber-500/20',
          hairline: 'bg-gradient-to-r from-transparent via-amber-500 to-transparent',
        };
      case 'danger':
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
          iconBg: 'bg-rose-500/10 border border-rose-500/20',
          hairline: 'bg-gradient-to-r from-transparent via-rose-500 to-transparent',
        };
      case 'milestone':
        return {
          icon: <Trophy className="w-5 h-5 text-[#F5B742]" />,
          iconBg: 'bg-amber-500/15 border border-amber-500/30',
          hairline: 'bg-gradient-to-r from-transparent via-[#F5B742] to-transparent',
        };
      case 'badge':
        return {
          icon: <Award className="w-5 h-5 text-[#F5B742]" />,
          iconBg: 'bg-amber-500/15 border border-amber-500/30',
          hairline: 'bg-gradient-to-r from-transparent via-[#F5B742] to-transparent',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-slate-500 dark:text-slate-400" />,
          iconBg: 'bg-slate-100 dark:bg-[#171E2A] border border-slate-200 dark:border-[#202836]',
          hairline: 'bg-gradient-to-r from-transparent via-slate-400 to-transparent opacity-40',
        };
    }
  };

  const { icon, iconBg, hairline } = getVariantStyles();

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden w-full max-w-sm rounded-2xl bg-white dark:bg-[#131822] border border-slate-200/90 dark:border-[#202836] p-3.5 sm:p-4 shadow-xl shadow-slate-900/10 dark:shadow-black/40 flex items-start gap-3 transition-all ${
        isExiting ? 'animate-slide-out-right opacity-0' : 'animate-slide-in-right'
      }`}
      role="alert"
    >
      {/* Top accent hairline */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${hairline}`} />

      {/* Icon */}
      <div className={`p-2 rounded-xl shrink-0 flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
          {toast.title}
        </h4>
        {toast.message && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed truncate">
            {toast.message}
          </p>
        )}
      </div>

      {/* Dismiss Button */}
      <button
        onClick={handleManualDismiss}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#171E2A] transition-colors shrink-0"
        aria-label="Close notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
