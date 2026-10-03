import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useOverlayTransition } from '../../hooks/useOverlayTransition';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useScrollLock } from '../../hooks/useScrollLock';

export interface ModalProps {
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

  useScrollLock(Boolean(shouldRender));

  const focusTrapRef = useFocusTrap<HTMLDivElement>({
    isActive: Boolean(shouldRender && isAnimatingIn),
    onEscape: onClose,
  });

  const [dragY, setDragY] = useState(0);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0) {
      setDragY(delta);
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (dragY > 80) {
      onClose();
    }
    setDragY(0);
  };

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
        className={`fixed inset-0 bg-black/60 transition-opacity duration-200 ease-out ${
          isAnimatingIn ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog: Bottom-sheet on mobile, centered modal on desktop */}
      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined}
        className={`relative w-full ${maxWidthClasses} bg-surface rounded-t-2xl sm:rounded-2xl shadow-2xl border-t sm:border border-line flex flex-col max-h-[92dvh] sm:max-h-[calc(100dvh-3.5rem)] overflow-hidden z-10 transition-[transform,opacity] duration-200 ease-out transform will-change-transform-opacity ${
          isAnimatingIn
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 sm:scale-95 translate-y-12 sm:translate-y-2'
        }`}
      >
        {/* Mobile Drag Indicator */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="sm:hidden w-12 h-1.5 rounded-full bg-line-input/40 mx-auto mt-2.5 -mb-1 shrink-0 cursor-grab active:cursor-grabbing touch-none"
          aria-hidden="true"
        />

        {/* Header */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="shrink-0 flex items-start justify-between p-4 sm:p-6 border-b border-line select-none"
        >
          <div>
            <h3 id="modal-title" className="text-base sm:text-xl font-bold text-ink-1 tracking-tight leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-ink-3">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 sm:p-2 rounded-xl text-ink-3 hover:text-ink-1 hover:bg-sunken transition-colors press shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
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
