import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface DeltaProps {
 value: number; // positive or negative percentage or absolute value
 isPercent?: boolean;
 inverse?: boolean; // If true, negative is positive/healthy (e.g., lower expenses)
 className?: string;
}

export const Delta: React.FC<DeltaProps> = ({
 value,
 isPercent = true,
 inverse = false,
 className = '',
}) => {
 const isZero = Math.abs(value) < 0.001;
 const isPositive = value > 0;
 const isHealthy = inverse ? !isPositive : isPositive;

 if (isZero) {
 return (
 <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-sunken text-ink-3 ${className}`}>
 <Minus className="w-3 h-3" />
 <span>0{isPercent ? '%' : ''}</span>
 </span>
 );
 }

 const badgeBg = isHealthy ? 'bg-positive-tint text-positive' : 'bg-negative-tint text-negative';
 const Icon = isPositive ? TrendingUp : TrendingDown;
 const sign = isPositive ? '+' : '';

 return (
 <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${badgeBg} ${className}`}>
 <Icon className="w-3 h-3 shrink-0" />
 <span>
 {sign}{value.toFixed(1)}{isPercent ? '%' : ''}
 </span>
 </span>
 );
};
