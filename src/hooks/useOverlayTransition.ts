import { useState, useEffect, useRef } from 'react';
import { useScrollLock } from './useScrollLock';
import { registerOverlay } from '../utils/overlayStack';

let overlayCounter = 0;

export interface UseOverlayTransitionOptions {
  isOpen: boolean;
  onClose?: () => void;
  duration?: number;
}

export interface UseOverlayTransitionResult {
  shouldRender: boolean;
  isAnimatingIn: boolean;
  overlayId: string;
}

/**
 * State machine for modal dialogs and bottom sheets.
 * Coordinates enter/exit transition states, topmost Escape handling via overlayStack,
 * and ref-counted scroll locking.
 */
export function useOverlayTransition({
  isOpen,
  onClose,
  duration = 200,
}: UseOverlayTransitionOptions): UseOverlayTransitionResult {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const timerRef = useRef<number | null>(null);
  const [overlayId] = useState(() => `overlay-${++overlayCounter}`);

  // Adjust state synchronously during render when open state changes to avoid cascading renders
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setShouldRender(true);
    } else {
      setIsAnimatingIn(false);
    }
  }

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Maintain scroll lock while overlay is mounted in DOM
  useScrollLock(shouldRender);

  // Register in overlay stack when open for topmost Escape key handling
  useEffect(() => {
    if (isOpen) {
      const unregister = registerOverlay(overlayId, () => onCloseRef.current?.());
      return () => {
        unregister();
      };
    }
  }, [isOpen, overlayId]);

  useEffect(() => {
    if (isOpen) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // Trigger enter transition on next animation frame
      const frameId = requestAnimationFrame(() => {
        setIsAnimatingIn(true);
      });

      return () => {
        cancelAnimationFrame(frameId);
      };
    } else {
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
      };
    }
  }, [isOpen, duration, shouldRender]);

  return { shouldRender, isAnimatingIn, overlayId };
}
