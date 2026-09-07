import { useEffect, useRef, useState } from 'react';

export interface UseAnimatedProgressResult {
  displayPercent: number;
  isAnimating: boolean;
}

/**
 * Animates a percentage from its previous value to `targetPercent` with a
 * slight spring overshoot (target + 2%, settling back to target).
 * Duration scales with the distance travelled: small deltas finish in
 * fast-scale time, large fills take up to dramatic duration.
 * Rising phase uses ease-out expo curve for organic spring acceleration.
 */
export function useAnimatedProgress(targetPercent: number): UseAnimatedProgressResult {
  const clamped = Math.min(Math.max(targetPercent, 0), 100);
  const [displayPercent, setDisplayPercent] = useState(clamped);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevRef = useRef(clamped);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = prevRef.current;
    const distance = Math.abs(clamped - start);
    if (distance < 0.1) return;

    const duration = 250 + Math.min(distance, 100) * 3.5; // ~250ms-600ms
    const overshoot = clamped + (clamped < 100 ? 2 : 0);
    const startTime = performance.now();
    setIsAnimating(true);

    const step = (now: number) => {
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

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplayPercent(clamped);
        prevRef.current = clamped;
        setIsAnimating(false);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [clamped]);

  return { displayPercent, isAnimating };
}
