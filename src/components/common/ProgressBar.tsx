import React, { useState, useEffect, useRef } from 'react';
import { useAnimatedProgress } from '../../hooks/useAnimatedProgress';

interface ProgressBarProps {
  value: number; // Current value
  max: number; // Max / Target value
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  alertThresholds?: boolean; // Changes color automatically (green < 75%, amber 75-100%, rose > 100%)
  showMilestones?: boolean; // Subtle 25/50/75% notches
  glowOnMilestone?: boolean; // Pulse glow when crossing 50% or 100%
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  color,
  size = 'md',
  showPercentage = false,
  alertThresholds = false,
  showMilestones = false,
  glowOnMilestone = false,
  className = '',
}) => {
  const safeMax = max > 0 ? max : 1;
  const rawPercentage = (value / safeMax) * 100;
  const clampedPercentage = Math.min(Math.max(rawPercentage, 0), 100);
  const { displayPercent } = useAnimatedProgress(clampedPercentage);

  const firedMilestones = useRef<Set<number>>(new Set());
  const [glowClass, setGlowClass] = useState('');

  useEffect(() => {
    if (!glowOnMilestone) return;

    if (displayPercent >= 100 && !firedMilestones.current.has(100)) {
      firedMilestones.current.add(100);
      firedMilestones.current.add(50);
      if (alertThresholds && rawPercentage > 100) {
        setGlowClass('animate-pulse-danger');
      } else {
        setGlowClass('animate-pulse-gold');
      }
      const timer = setTimeout(() => setGlowClass(''), 1200);
      return () => clearTimeout(timer);
    } else if (displayPercent >= 50 && !firedMilestones.current.has(50)) {
      firedMilestones.current.add(50);
      setGlowClass('animate-pulse-success');
      const timer = setTimeout(() => setGlowClass(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [displayPercent, glowOnMilestone, alertThresholds, rawPercentage]);

  // Determine bar color
  let barColorClass = color || 'bg-emerald-500';
  if (alertThresholds) {
    if (rawPercentage > 100) {
      barColorClass = 'bg-rose-500 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:14px_14px]';
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
      <div className={`relative w-full bg-slate-100 dark:bg-[#171E2A] border border-transparent dark:border-[#202836] rounded-full overflow-hidden ${heightClasses} ${glowClass}`}>
        {showMilestones && (
          <>
            <div className="absolute top-0 bottom-0 w-[1px] bg-slate-300/50 dark:bg-slate-700/50 pointer-events-none z-10" style={{ left: '25%' }} />
            <div className="absolute top-0 bottom-0 w-[1px] bg-slate-300/50 dark:bg-slate-700/50 pointer-events-none z-10" style={{ left: '50%' }} />
            <div className="absolute top-0 bottom-0 w-[1px] bg-slate-300/50 dark:bg-slate-700/50 pointer-events-none z-10" style={{ left: '75%' }} />
          </>
        )}
        <div
          className={`${heightClasses} rounded-full ${barColorClass}`}
          style={{
            width: `${displayPercent}%`,
            ...(color && !alertThresholds ? { backgroundColor: color } : {}),
          }}
        />
      </div>
    </div>
  );
};
