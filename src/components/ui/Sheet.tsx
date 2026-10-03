import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useOverlayTransition } from '../../hooks/useOverlayTransition';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { getOverlayZIndex } from '../../utils/overlayStack';

export interface SheetProps {
 isOpen: boolean;
 onClose: () => void;
 title: string;
 subtitle?: string;
 children: React.ReactNode;
 footer?: React.ReactNode;
 maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Sheet: React.FC<SheetProps> = ({
 isOpen,
 onClose,
 title,
 subtitle,
 children,
 footer,
 maxWidth = 'lg',
}) => {
 const { shouldRender, isAnimatingIn, overlayId } = useOverlayTransition({
 isOpen,
 onClose,
 duration: 200,
 });

 const focusTrapRef = useFocusTrap<HTMLDivElement>({
 isActive: Boolean(shouldRender && isAnimatingIn),
 onEscape: onClose,
 });

 if (!shouldRender || typeof document === 'undefined') return null;

 const maxWidthClasses = {
 sm: 'max-w-sm',
 md: 'max-w-md',
 lg: 'max-w-lg',
 xl: 'max-w-xl',
 '2xl': 'max-w-2xl',
 '4xl': 'max-w-4xl',
 }[maxWidth];

 const content = (
 <div
 style={{ zIndex: getOverlayZIndex(overlayId) }}
 className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden"
 >
 {/* Backdrop */}
 <div
 className={`fixed inset-0 bg-black/60 transition-opacity duration-200 ease-out ${
 isAnimatingIn ? 'opacity-100' : 'opacity-0'
 }`}
 onClick={onClose}
 aria-hidden="true"
 />

 {/* Sheet / Modal Container */}
 <div
 ref={focusTrapRef}
 role="dialog"
 aria-modal="true"
 aria-labelledby="sheet-title"
 className={`relative w-full ${maxWidthClasses} bg-surface text-ink-1 rounded-t-2xl sm:rounded-2xl shadow-2xl border-t sm:border border-line flex flex-col max-h-[92dvh] sm:max-h-[calc(100dvh-3.5rem)] overflow-hidden z-10 transition-[transform,opacity] duration-200 ease-out transform will-change-transform-opacity ${
 isAnimatingIn
 ? 'opacity-100 scale-100 translate-y-0'
 : 'opacity-0 sm:scale-95 translate-y-12 sm:translate-y-2'
 }`}
 >
 {/* Mobile Drag Indicator */}
 <div className="sm:hidden w-10 h-1 rounded-full bg-line-input/40 mx-auto mt-2.5 -mb-2 shrink-0" />

 {/* Header */}
 <div className="shrink-0 flex items-start justify-between p-4 sm:p-6 border-b border-line">
 <div>
 <h3 id="sheet-title" className="text-base sm:text-xl font-bold text-ink-1 tracking-tight leading-tight">
 {title}
 </h3>
 {subtitle && (
 <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-ink-3">{subtitle}</p>
 )}
 </div>
 <button
 onClick={onClose}
 aria-label="Close"
 className="p-1.5 sm:p-2 rounded-xl text-ink-3 hover:text-ink-1 hover:bg-sunken transition-colors press shrink-0"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Body */}
 <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
 {children}
 </div>

 {/* Optional Sticky Footer */}
 {footer && (
 <div className="shrink-0 p-4 sm:p-6 border-t border-line bg-sunken/40 flex items-center justify-end gap-3">
 {footer}
 </div>
 )}
 </div>
 </div>
 );

 return createPortal(content, document.body);
};
