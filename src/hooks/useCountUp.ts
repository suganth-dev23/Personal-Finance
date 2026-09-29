import { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from './useReducedMotion';
import { rafTicker } from '../utils/rafTicker';

export interface UseCountUpOptions {
  duration?: number;
  animateOnMount?: boolean;
  from?: number;
  onComplete?: () => void;
}

/**
 * High-performance 60fps number counter hook using shared rafTicker
 * with an ease-out expo deceleration curve. Supports reduced motion and animateOnMount.
 */
export function useCountUp(target: number, duration?: number): number;
export function useCountUp(target: number, options?: UseCountUpOptions): number;
export function useCountUp(target: number, arg?: number | UseCountUpOptions): number {
  const duration = typeof arg === 'number' ? arg : arg?.duration ?? 450;
  const animateOnMount = typeof arg === 'object' ? arg?.animateOnMount ?? false : false;
  const from = typeof arg === 'object' ? arg?.from ?? 0 : 0;
  const onComplete = typeof arg === 'object' ? arg?.onComplete : undefined;

  const reducedMotion = useReducedMotion();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const isFirstMount = useRef(true);
  const initialValue = (!reducedMotion && animateOnMount) ? from : target;

  const [value, setValue] = useState(initialValue);
  const prevRef = useRef(initialValue);

  useEffect(() => {
    if (reducedMotion) {
      setValue(target);
      prevRef.current = target;
      onCompleteRef.current?.();
      return;
    }

    // On first mount without animateOnMount, sync directly
    if (isFirstMount.current) {
      isFirstMount.current = false;
      if (!animateOnMount) {
        setValue(target);
        prevRef.current = target;
        return;
      }
    }

    const start = prevRef.current;
    const diff = target - start;

    if (Math.abs(diff) < 0.001) {
      setValue(target);
      prevRef.current = target;
      return;
    }

    const safeDuration = Math.max(duration, 1);
    const startTime = performance.now();

    const unsub = rafTicker.subscribe((now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / safeDuration, 1);
      
      // Ease-out expo formula: 1 - 2^(-10 * progress)
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = start + diff * ease;

      setValue(current);
      prevRef.current = current; // Keep in sync for interrupted transitions

      if (progress >= 1) {
        unsub();
        setValue(target);
        prevRef.current = target;
        onCompleteRef.current?.();
      }
    });

    return () => {
      unsub();
    };
  }, [target, duration, reducedMotion, animateOnMount]);

  return reducedMotion ? target : value;
}
