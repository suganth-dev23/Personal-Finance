import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';
import { rafTicker } from '../utils/rafTicker';

export interface UseAnimatedProgressResult {
  displayPercent: number;
  isAnimating: boolean;
}

export interface UseAnimatedProgressOptions {
  animateOnMount?: boolean;
  from?: number;
}

/**
 * Animates a percentage from its previous value to `targetPercent` with a
 * slight spring overshoot (target + 2% on rise, target - 2% on drop, settling back).
 * Duration scales with distance travelled. Supports reduced motion.
 */
export function useAnimatedProgress(
  targetPercent: number,
  options?: UseAnimatedProgressOptions
): UseAnimatedProgressResult {
  const clamped = Math.min(Math.max(targetPercent, 0), 100);
  const reducedMotion = useReducedMotion();
  const animateOnMount = options?.animateOnMount ?? false;
  const from = options?.from ?? 0;

  const isFirstMount = useRef(true);
  const initialValue = (!reducedMotion && animateOnMount) ? from : clamped;

  const [displayPercent, setDisplayPercent] = useState(initialValue);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevRef = useRef(initialValue);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayPercent(clamped);
      prevRef.current = clamped;
      setIsAnimating(false);
      return;
    }

    // On first mount without animateOnMount, sync directly
    if (isFirstMount.current) {
      isFirstMount.current = false;
      if (!animateOnMount) {
        setDisplayPercent(clamped);
        prevRef.current = clamped;
        return;
      }
    }

    const start = prevRef.current;
    const distance = Math.abs(clamped - start);
    if (distance < 0.1) {
      setDisplayPercent(clamped);
      prevRef.current = clamped;
      setIsAnimating(false);
      return;
    }

    const duration = 250 + Math.min(distance, 100) * 3.5; // ~250ms-600ms
    const isIncreasing = clamped >= start;
    const overshoot = isIncreasing
      ? clamped + (clamped < 100 ? 2 : 0)
      : clamped - (clamped > 0 ? 2 : 0);

    const startTime = performance.now();
    setIsAnimating(true);

    const unsub = rafTicker.subscribe((now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      let current: number;
      if (progress < 0.8) {
        const t = progress / 0.8;
        const ease = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        current = start + (overshoot - start) * ease;
      } else {
        const settleT = (progress - 0.8) / 0.2;
        const smoothSettle = settleT * settleT * (3 - 2 * settleT);
        current = overshoot + (clamped - overshoot) * smoothSettle;
      }

      setDisplayPercent(current);
      prevRef.current = current; // Keep in sync for interrupted transitions

      if (progress >= 1) {
        unsub();
        setDisplayPercent(clamped);
        prevRef.current = clamped;
        setIsAnimating(false);
      }
    });

    return () => {
      unsub();
    };
  }, [clamped, reducedMotion, animateOnMount]);

  return {
    displayPercent: reducedMotion ? clamped : displayPercent,
    isAnimating: reducedMotion ? false : isAnimating,
  };
}
