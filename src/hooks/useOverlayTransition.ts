import { useState, useEffect, useRef } from 'react';
import { useScrollLock } from './useScrollLock';

export interface UseOverlayTransitionOptions {
  isOpen: boolean;
  onClose?: () => void;
  duration?: number;
}

export interface UseOverlayTransitionResult {
  shouldRender: boolean;
  isAnimatingIn: boolean;
}

/**
 * State machine for modal dialogs and bottom sheets.
 * Coordinates enter/exit transition states, Escape key handling, and ref-counted scroll locking.
 */
export function useOverlayTransition({
  isOpen,
  onClose,
  duration = 200,
}: UseOverlayTransitionOptions): UseOverlayTransitionResult {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Maintain scroll lock while overlay is mounted in DOM
  useScrollLock(shouldRender);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setShouldRender(true);
      window.addEventListener('keydown', handleKeyDown);

      // Trigger enter transition on next animation frame
      const frameId = requestAnimationFrame(() => {
        setIsAnimatingIn(true);
      });

      return () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      setIsAnimatingIn(false);

      if (shouldRender) {
        timerRef.current = window.setTimeout(() => {
          setShouldRender(false);
        }, duration);
      }

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose, duration, shouldRender]);

  return { shouldRender, isAnimatingIn };
}
