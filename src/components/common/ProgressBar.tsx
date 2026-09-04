import React from 'react';

interface ProgressBarProps {
  value: number; // Current value
  max: number; // Max / Target value
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  alertThresholds?: boolean; // Changes color automatically (green < 75%, amber 75-100%, rose > 100%)
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  color,
  size = 'md',
  showPercentage = false,
  alertThresholds = false,
  className = '',
}) => {
  const safeMax = max > 0 ? max : 1;
  const rawPercentage = (value / safeMax) * 100;
  const clampedPercentage = Math.min(Math.max(rawPercentage, 0), 100);

  // Determine bar color
  let barColorClass = color || 'bg-emerald-500';
  if (alertThresholds) {
    if (rawPercentage > 100) {
      barColorClass = 'bg-rose-500';
    } else if (rawPercentage >= 80) {
      barColorClass = 'bg-amber-500';
    } else {
      barColorClass = 'bg-emerald-500';
    }
  }

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[size];

  return (
    <div className={`w-full ${className}`}>
      {showPercentage && (
        <div className="flex justify-between items-center text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300 font-numeric">
          <span>{rawPercentage.toFixed(1)}%</span>
          {rawPercentage > 100 && (
            <span className="text-rose-500 font-bold">Over limit (+{(rawPercentage - 100).toFixed(0)}%)</span>
          )}
        </div>
      )}
      <div className={`w-full bg-slate-100 dark:bg-[#171E2A] border border-transparent dark:border-[#202836] rounded-full overflow-hidden ${heightClasses}`}>
        <div
          className={`${heightClasses} rounded-full transition-all duration-500 ${barColorClass}`}
          style={{
            width: `${clampedPercentage}%`,
            ...(color && !alertThresholds ? { backgroundColor: color } : {}),
          }}
        />
      </div>
    </div>
  );
};
