import React from 'react';

export interface SectionHeaderProps {
 title: string;
 badge?: React.ReactNode;
 action?: React.ReactNode;
 className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
 title,
 badge,
 action,
 className = '',
}) => {
 return (
 <div className={`flex items-center justify-between gap-2 mb-3.5 ${className}`}>
 <div className="flex items-center gap-2">
 <h2 className="text-base sm:text-lg font-bold text-ink-1 tracking-tight">
 {title}
 </h2>
 {badge && <div>{badge}</div>}
 </div>
 {action && (
 <div className="text-xs sm:text-sm font-semibold text-primary hover:underline">
 {action}
 </div>
 )}
 </div>
 );
};
