import React from 'react';

export interface PageHeaderProps {
 title: string;
 eyebrow?: string;
 subtitle?: string;
 actions?: React.ReactNode;
 className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
 title,
 eyebrow,
 subtitle,
 actions,
 className = '',
}) => {
 return (
 <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ${className}`}>
 <div>
 {eyebrow && (
 <span className="text-xs font-bold uppercase tracking-wider text-ink-3">
 {eyebrow}
 </span>
 )}
 <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-1 tracking-tight">
 {title}
 </h1>
 {subtitle && (
 <p className="text-sm font-medium text-ink-2 mt-1">
 {subtitle}
 </p>
 )}
 </div>
 {actions && (
 <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
 {actions}
 </div>
 )}
 </div>
 );
};
