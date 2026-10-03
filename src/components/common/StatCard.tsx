import React from 'react';
import { formatINR, formatCompactINR } from '../../utils/currency';

interface StatCardProps {
 title: string;
 amount: number;
 subtitle?: string;
 icon?: React.ReactNode;
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
 className={`group relative overflow-hidden rounded-2xl bg-surface p-5 shadow-xs border border-line transition-[transform,box-shadow,background-color] duration-200 hover:border-slate-300 dark:hover:border-line lift ${
 onClick ? 'cursor-pointer press' : ''
 }`}
 >
 {accentColor && (
 <div
 className="absolute top-0 left-0 right-0 h-0.5"
 style={{ backgroundColor: accentColor }}
 />
 )}

 <div className="flex items-center justify-between gap-2">
 <span className="text-xs font-medium text-ink-3">
 {title}
 </span>
 {icon && (
 <div className="text-ink-3 transition-colors group-hover:text-slate-600 dark:group-hover:text-slate-300">
 {icon}
 </div>
 )}
 </div>

 <div className="mt-3">
 <div className="flex items-baseline gap-2">
 <h2 className="font-numeric text-2xl sm:text-3xl font-bold text-ink-1 tracking-tight">
 {formatINR(amount)}
 </h2>
 <span className="font-numeric text-xs text-ink-3">
 {formatCompactINR(amount)}
 </span>
 </div>

 {subtitle && (
 <p className="mt-1 text-xs text-ink-3">
 {subtitle}
 </p>
 )}

 {trend && (
 <div className="mt-2.5 flex items-center gap-1.5 text-xs">
 <span
 className={`font-numeric font-semibold ${
 trend.isPositive
 ? 'text-emerald-600 dark:text-emerald-400'
 : 'text-rose-600 dark:text-rose-400'
 }`}
 >
 {trend.value}
 </span>
 {trend.label && (
 <span className="text-ink-3">
 {trend.label}
 </span>
 )}
 </div>
 )}
 </div>
 </div>
 );
};
