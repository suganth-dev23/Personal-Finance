import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useOverlayTransition } from '../../hooks/useOverlayTransition';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
  const { shouldRender, isAnimatingIn } = useOverlayTransition({
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

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden">
      {/* Backdrop with fade transition */}
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200 ease-out ${
          isAnimatingIn ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal Dialog: Bottom-sheet on mobile, centered modal on desktop */}
      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${maxWidthClasses} bg-white dark:bg-card-dark rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-slate-200/90 dark:border-border-dark flex flex-col max-h-[92dvh] sm:max-h-[calc(100dvh-3.5rem)] overflow-hidden z-10 transition-all duration-200 ease-out transform will-change-transform-opacity ${
          isAnimatingIn
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 sm:scale-95 translate-y-12 sm:translate-y-2'
        }`}
      >
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-10 h-1 rounded-full bg-slate-300 dark:bg-active-dark mx-auto mt-2.5 -mb-2 shrink-0" />

        {/* Header */}
        <div className="shrink-0 flex items-start justify-between p-4 sm:p-6 border-b border-slate-100 dark:border-border-dark">
          <div>
            <h3 id="modal-title" className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-inset-dark transition-colors press shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
