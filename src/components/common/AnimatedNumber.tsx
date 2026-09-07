import React from 'react';
import { useCountUp } from '../../hooks/useCountUp';
import { useNumberPop } from '../../hooks/useNumberPop';
import { formatINR } from '../../utils/currency';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  prefix?: string;
  className?: string;
  showDirection?: boolean;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 450,
  format = formatINR,
  prefix = '',
  className = '',
  showDirection = false,
}) => {
  const animated = useCountUp(value, duration);
  const { popClass, direction } = useNumberPop(value);

  const directionClass = showDirection && direction
    ? direction === 'up'
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-rose-600 dark:text-rose-400'
    : '';

  return (
    <span className={`font-numeric transition-colors duration-300 ${directionClass} ${popClass} ${className}`}>
      {prefix}{format(animated)}
    </span>
  );
};
