import React, { useEffect, useState, useRef } from 'react';
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
  const [isPaused, setIsPaused] = useState(false);
  const totalDuration = toast.duration || 3500;
  
  const remainingTimeRef = useRef(totalDuration);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPaused) {
      // Calculate how much time elapsed before pause
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    const currentRemaining = remainingTimeRef.current;

    const exitTimer = window.setTimeout(() => {
      setIsExiting(true);
    }, Math.max(0, currentRemaining - 200));

    timerRef.current = window.setTimeout(() => {
      onDismiss(toast.id);
    }, currentRemaining);

    return () => {
      clearTimeout(exitTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, totalDuration, onDismiss, isPaused]);

  const handleManualDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 180);
  };

  const getVariantStyles = () => {
    switch (toast.variant) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
          iconBg: 'bg-emerald-500/10 border border-emerald-500/20',
          hairline: 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent',
          barColor: 'bg-emerald-500',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
          iconBg: 'bg-amber-500/10 border border-amber-500/20',
          hairline: 'bg-gradient-to-r from-transparent via-amber-500 to-transparent',
          barColor: 'bg-amber-500',
        };
      case 'danger':
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
          iconBg: 'bg-rose-500/10 border border-rose-500/20',
          hairline: 'bg-gradient-to-r from-transparent via-rose-500 to-transparent',
          barColor: 'bg-rose-500',
        };
      case 'milestone':
        return {
          icon: <Trophy className="w-5 h-5 text-[#F5B742]" />,
          iconBg: 'bg-amber-500/15 border border-amber-500/30',
          hairline: 'bg-gradient-to-r from-transparent via-[#F5B742] to-transparent',
          barColor: 'bg-[#F5B742]',
        };
      case 'badge':
        return {
          icon: <Award className="w-5 h-5 text-[#F5B742]" />,
          iconBg: 'bg-amber-500/15 border border-amber-500/30',
          hairline: 'bg-gradient-to-r from-transparent via-[#F5B742] to-transparent',
          barColor: 'bg-[#F5B742]',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-slate-500 dark:text-slate-400" />,
          iconBg: 'bg-slate-100 dark:bg-inset-dark border border-slate-200 dark:border-border-dark',
          hairline: 'bg-gradient-to-r from-transparent via-slate-400 to-transparent opacity-40',
          barColor: 'bg-slate-400',
        };
    }
  };

  const { icon, iconBg, hairline, barColor } = getVariantStyles();

  return (
    <div
      role="alert"
      aria-live="polite"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden w-full max-w-sm rounded-2xl bg-white dark:bg-card-dark border border-slate-200/90 dark:border-border-dark p-3.5 sm:p-4 shadow-xl shadow-slate-900/10 dark:shadow-black/40 flex items-start gap-3 will-change-transform-opacity transition-all duration-200 ${
        isExiting ? 'animate-slide-out-right opacity-0 max-h-0 py-0 -my-1 border-transparent' : 'animate-slide-in-right max-h-40'
      }`}
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
        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-inset-dark transition-colors press shrink-0"
        aria-label="Close notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Bottom auto-dismiss progress countdown indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-100 dark:bg-inset-dark">
        <div
          className={`h-full ${barColor} opacity-70 origin-left`}
          style={{
            animation: `shrink-progress ${totalDuration}ms linear forwards`,
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        />
      </div>
    </div>
  );
};
