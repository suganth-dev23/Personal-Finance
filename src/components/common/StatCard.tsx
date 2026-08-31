import React from 'react';
import { formatINR, formatCompactINR } from '../../utils/currency';

interface StatCardProps {
  title: string;
  amount: number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  trend?: {
    value: number | string;
    isPositive?: boolean;
    label?: string;
  };
  onClick?: () => void;
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  amount,
  subtitle,
  icon,
  iconBgColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  trend,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-100 dark:border-slate-800/80 transition-all duration-200 hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${iconBgColor}`}>
          {icon}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {formatINR(amount)}
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            ({formatCompactINR(amount)})
          </span>
        </div>

        {(subtitle || trend) && (
          <div className="mt-2 flex items-center justify-between text-xs">
            {subtitle && (
              <span className="text-slate-500 dark:text-slate-400">{subtitle}</span>
            )}
            {trend && (
              <span
                className={`font-semibold px-2 py-0.5 rounded-full ${
                  trend.isPositive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value} {trend.label || ''}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
