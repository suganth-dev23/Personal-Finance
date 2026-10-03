import React from 'react';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
 selected?: boolean;
 icon?: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
 selected = false,
 icon,
 children,
 className = '',
 ...props
}) => {
 return (
 <button
 type="button"
 className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold min-h-[38px] sm:min-h-[36px] transition-colors press select-none ${
 selected
 ? 'bg-primary text-on-primary shadow-xs'
 : 'bg-sunken text-ink-2 hover:text-ink-1 hover:bg-line/60'
 } ${className}`}
 {...props}
 >
 {icon && <span className="shrink-0">{icon}</span>}
 <span>{children}</span>
 </button>
 );
};

export interface SegmentedOption<T extends string> {
 id: T;
 label: string;
 icon?: React.ReactNode;
}

export interface SegmentedProps<T extends string> {
 options: SegmentedOption<T>[];
 value: T;
 onChange: (val: T) => void;
 className?: string;
}

export function Segmented<T extends string>({
 options,
 value,
 onChange,
 className = '',
}: SegmentedProps<T>) {
 return (
 <div className={`flex items-center p-1 bg-sunken rounded-xl gap-1 border border-line ${className}`}>
 {options.map(opt => {
 const isSelected = opt.id === value;
 return (
 <button
 key={opt.id}
 type="button"
 onClick={() => onChange(opt.id)}
 className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors min-h-[40px] select-none ${
 isSelected
 ? 'bg-surface text-ink-1 shadow-xs border border-line/60'
 : 'text-ink-3 hover:text-ink-1'
 }`}
 >
 {opt.icon && <span className="shrink-0">{opt.icon}</span>}
 <span>{opt.label}</span>
 </button>
 );
 })}
 </div>
 );
}
