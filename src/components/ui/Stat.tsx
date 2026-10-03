import React from 'react';
import { Money, MoneyProps } from './Money';
import { Delta } from './Delta';

export interface StatProps {
 label: string;
 value: number | React.ReactNode;
 moneyProps?: Partial<MoneyProps>;
 sub?: React.ReactNode;
 delta?: number;
 deltaInverse?: boolean;
 icon?: React.ReactNode;
 className?: string;
}

export const Stat: React.FC<StatProps> = ({
 label,
 value,
 moneyProps,
 sub,
 delta,
 deltaInverse,
 icon,
 className = '',
}) => {
 return (
 <div className={`flex flex-col min-w-0 ${className}`}>
 <div className="flex items-center justify-between gap-1 mb-1">
 <span className="text-xs font-semibold text-ink-3 tracking-wide truncate uppercase">
 {label}
 </span>
 {icon && <span className="text-ink-3 shrink-0">{icon}</span>}
 </div>

 <div className="flex items-baseline gap-2 flex-wrap">
 {typeof value === 'number' ? (
 <Money value={value} size="lg" {...moneyProps} />
 ) : (
 <span className="text-lg sm:text-xl font-extrabold text-ink-1 truncate">{value}</span>
 )}

 {delta !== undefined && (
 <Delta value={delta} inverse={deltaInverse} />
 )}
 </div>

 {sub && (
 <div className="mt-1 text-xs text-ink-3 truncate">
 {sub}
 </div>
 )}
 </div>
 );
};
