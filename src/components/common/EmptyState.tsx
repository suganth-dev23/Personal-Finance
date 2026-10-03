import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
 icon: LucideIcon;
 title: string;
 description: string;
 actionLabel?: string;
 onAction?: () => void;
 className?: string;
}

/**
 * Unified premium empty state component (Phase 3.2).
 * Provides consistent spacing, elevation, gold accent icon container,
 * responsive typography, and tactile CTA buttons across all app views.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
 icon: Icon,
 title,
 description,
 actionLabel,
 onAction,
 className = '',
}) => {
 return (
 <div
 className={`text-center py-12 sm:py-16 bg-surface rounded-2xl border border-dashed border-line p-6 sm:p-8 shadow-xs animate-fade-in ${className}`}
 >
 <div className="w-14 h-14 rounded-2xl bg-primary-tint text-primary flex items-center justify-center mx-auto mb-4">
 <Icon className="w-7 h-7" />
 </div>
 <h3 className="text-base sm:text-lg font-bold text-ink-1 tracking-tight">
 {title}
 </h3>
 <p className="text-xs sm:text-sm text-ink-3 mt-1 max-w-sm mx-auto leading-relaxed">
 {description}
 </p>
 {actionLabel && onAction && (
 <button
 onClick={onAction}
 className="press mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-95 text-on-primary rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors"
 >
 {actionLabel}
 </button>
 )}
 </div>
 );
};
