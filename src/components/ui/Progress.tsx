import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export type ProgressTone = 'auto' | 'positive' | 'warning' | 'negative' | 'primary' | 'reward';

export interface ProgressProps {
 value: number; // 0 to 100+
 max?: number;
 tone?: ProgressTone;
 showIcon?: boolean;
 size?: 'sm' | 'md' | 'lg';
 className?: string;
 type?: 'linear' | 'ring';
}

export const Progress: React.FC<ProgressProps> = ({
 value,
 max = 100,
 tone = 'auto',
 showIcon = false,
 size = 'md',
 className = '',
 type = 'linear',
}) => {
 const safeVal = Number.isFinite(value) ? value : 0;
 const safeMax = Number.isFinite(max) && max > 0 ? max : 0;
 const rawPercent = safeMax > 0 ? (safeVal / safeMax) * 100 : 0;
 const percent = Number.isFinite(rawPercent) ? rawPercent : 0;
 const clampedPercent = Math.min(Math.max(percent, 0), 100);

 // Auto tone calculation:
 // <80% healthy (positive), 80-100% near (warning), >100% over (negative)
 let resolvedTone: ProgressTone = tone;
 if (tone === 'auto') {
 if (percent > 100) resolvedTone = 'negative';
 else if (percent >= 80) resolvedTone = 'warning';
 else resolvedTone = 'positive';
 }

 const toneColorMap: Record<ProgressTone, string> = {
 positive: 'bg-positive text-positive',
 warning: 'bg-warning text-warning',
 negative: 'bg-negative text-negative',
 primary: 'bg-primary text-primary',
 reward: 'bg-reward-fill text-reward',
 auto: 'bg-primary text-primary',
 };

 const ringStrokeMap: Record<ProgressTone, string> = {
 positive: 'var(--positive)',
 warning: 'var(--warning)',
 negative: 'var(--negative)',
 primary: 'var(--primary)',
 reward: 'var(--reward-fill)',
 auto: 'var(--primary)',
 };

 if (type === 'ring') {
 const dim = size === 'sm' ? 40 : size === 'md' ? 56 : 72;
 const strokeWidth = size === 'sm' ? 4 : size === 'md' ? 5 : 6;
 const radius = (dim - strokeWidth) / 2;
 const circumference = 2 * Math.PI * radius;
 const offset = circumference - (clampedPercent / 100) * circumference;

 return (
 <div
 role="progressbar"
 aria-valuenow={Math.round(percent)}
 aria-valuemin={0}
 aria-valuemax={100}
 className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
 style={{ width: dim, height: dim }}
 >
 <svg width={dim} height={dim} className="transform -rotate-90">
 <circle
 cx={dim / 2}
 cy={dim / 2}
 r={radius}
 stroke="currentColor"
 strokeWidth={strokeWidth}
 fill="transparent"
 className="text-line opacity-60"
 />
 <circle
 cx={dim / 2}
 cy={dim / 2}
 r={radius}
 stroke={ringStrokeMap[resolvedTone]}
 strokeWidth={strokeWidth}
 strokeDasharray={circumference}
 strokeDashoffset={offset}
 strokeLinecap="round"
 fill="transparent"
 className="transition-[stroke-dashoffset] duration-500 ease-out"
 />
 </svg>
 <div className="absolute inset-0 flex items-center justify-center">
 {showIcon ? (
 resolvedTone === 'negative' ? (
 <AlertCircle className="w-4 h-4 text-negative" />
 ) : resolvedTone === 'warning' ? (
 <AlertTriangle className="w-4 h-4 text-warning" />
 ) : (
 <CheckCircle className="w-4 h-4 text-positive" />
 )
 ) : (
 <span className="text-xs font-bold text-ink-1">
 {Math.round(percent)}%
 </span>
 )}
 </div>
 </div>
 );
 }

 const heightClasses = size === 'sm' ? 'h-1.5' : size === 'md' ? 'h-2' : 'h-3';

 return (
 <div className={`w-full flex items-center gap-2 ${className}`}>
 <div
 role="progressbar"
 aria-valuenow={Math.round(percent)}
 aria-valuemin={0}
 aria-valuemax={100}
 className={`w-full bg-sunken rounded-full overflow-hidden ${heightClasses}`}
 >
 <div
 className={`h-full rounded-full transition-[width] duration-300 ${toneColorMap[resolvedTone].split(' ')[0]}`}
 style={{ width: `${clampedPercent}%` }}
 />
 </div>
 {showIcon && (
 <span className="shrink-0">
 {resolvedTone === 'negative' ? (
 <AlertCircle className="w-4 h-4 text-negative" />
 ) : resolvedTone === 'warning' ? (
 <AlertTriangle className="w-4 h-4 text-warning" />
 ) : (
 <CheckCircle className="w-4 h-4 text-positive" />
 )}
 </span>
 )}
 </div>
 );
};
