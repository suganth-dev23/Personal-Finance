import { useState, useEffect, useRef } from 'react';

export interface UseCountUpOptions {
  duration?: number;
  onComplete?: () => void;
}

/**
 * High-performance 60fps number counter hook using requestAnimationFrame
 * with an ease-out expo deceleration curve.
 */
export function useCountUp(target: number, duration?: number): number;
export function useCountUp(target: number, options?: UseCountUpOptions): number;
export function useCountUp(target: number, arg?: number | UseCountUpOptions): number {
  const duration = typeof arg === 'number' ? arg : arg?.duration ?? 450;
  const onComplete = typeof arg === 'object' ? arg?.onComplete : undefined;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [value, setValue] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = prevRef.current;
    const diff = target - start;

    if (diff === 0) return;

    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out expo formula: 1 - 2^(-10 * progress)
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = start + diff * ease;

      setValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setValue(target);
        prevRef.current = target;
        onCompleteRef.current?.();
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, duration]);

  return value;
}
