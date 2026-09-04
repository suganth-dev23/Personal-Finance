import React from 'react';
import { formatINR, formatCompactINR } from '../../utils/currency';

interface StatCardProps {
  title: string;
  amount: number;
  subtitle?: string;
  icon?: React.ReactNode;
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
  trend,
  onClick,
  accentColor,
}) => {
  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-[#131822] p-5 shadow-xs border border-slate-200/80 dark:border-[#202836] transition-all duration-200 hover:border-slate-300 dark:hover:border-[#2D394C] hover:shadow-sm ${
        onClick ? 'cursor-pointer active:scale-[0.99]' : ''
      }`}
    >
      {accentColor && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ backgroundColor: accentColor }}
        />
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {icon && (
          <div className="text-slate-400 dark:text-slate-500 transition-colors group-hover:text-slate-600 dark:group-hover:text-slate-300">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <h2 className="font-numeric text-2xl sm:text-[1.75rem] font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {formatINR(amount)}
          </h2>
          <span className="font-numeric text-xs text-slate-400 dark:text-slate-500">
            {formatCompactINR(amount)}
          </span>
        </div>

        {(subtitle || trend) && (
          <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-[#1A212D]">
            {subtitle && (
              <span className="text-slate-500 dark:text-slate-400 truncate pr-2">
                {subtitle}
              </span>
            )}
            {trend && (
              <span
                className={`font-numeric text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                  trend.isPositive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value} {trend.label || ''}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
