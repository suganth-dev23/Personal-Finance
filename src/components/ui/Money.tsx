import React from 'react';
import { formatINR } from '../../utils/currency';

export type MoneyTone = 'auto' | 'income' | 'expense' | 'neutral' | 'negative' | 'positive';
export type MoneySize = 'xs' | 'sm' | 'md' | 'lg' | '2xl' | 'display';

export interface MoneyProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  sign?: 'auto' | 'always' | 'never';
  tone?: MoneyTone;
  size?: MoneySize;
  compact?: boolean;
  blurPrivacy?: boolean;
}

export const Money: React.FC<MoneyProps> = ({
  value,
  sign = 'auto',
  tone = 'auto',
  size = 'md',
  compact = false,
  blurPrivacy = false,
  className = '',
  ...props
}) => {
  const isZero = value === 0;
  const isPositive = value > 0;
  const isNegative = value < 0;

  // Determine displayed sign
  let signPrefix = '';
  if (sign === 'always') {
    if (tone === 'expense' || tone === 'negative') signPrefix = '-';
    else if (isPositive) signPrefix = '+';
    else if (isNegative) signPrefix = '-';
  } else if (sign === 'auto') {
    if (tone === 'income' && isPositive) signPrefix = '+';
    else if (tone === 'expense' && isPositive) signPrefix = '-';
    else if (isNegative) signPrefix = '-';
  }

  // Determine tone color
  let toneClass = 'text-ink-1';
  if (isZero) {
    toneClass = 'text-ink-2';
  } else if (tone === 'positive' || (tone === 'auto' && isPositive && signPrefix === '+')) {
    toneClass = 'text-positive';
  } else if (tone === 'negative' || (tone === 'auto' && isNegative)) {
    toneClass = 'text-negative';
  } else if (tone === 'expense') {
    // Ordinary spending is neutral ink with leading minus (WCAG calm principle)
    toneClass = 'text-ink-1';
  } else if (tone === 'neutral') {
    toneClass = 'text-ink-1';
  }

  const sizeClasses: Record<MoneySize, string> = {
    xs: 'text-xs',
    sm: 'text-sm font-semibold',
    md: 'text-base font-bold',
    lg: 'text-lg sm:text-xl font-extrabold',
    '2xl': 'text-2xl sm:text-3xl font-extrabold tracking-tight',
    display: 'text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight',
  };

  const formattedAbs = formatINR(Math.abs(value), { compact, showSymbol: true });

  return (
    <span
      data-money="true"
      className={`font-numeric tabular-nums inline-flex items-baseline ${toneClass} ${sizeClasses[size]} ${blurPrivacy ? 'select-none blur-sm' : ''} ${className}`}
      {...props}
    >
      {signPrefix && <span className="mr-0.5 select-none">{signPrefix}</span>}
      <span>{formattedAbs}</span>
    </span>
  );
};
