import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

export interface UseNumberPopResult {
  popClass: string;
  direction: 'up' | 'down' | null;
}

/**
 * Detects increases/decreases in a numeric value across renders and
 * returns a Tailwind animation class to apply for ~300ms.
 * Supports rapid re-triggering and respects prefers-reduced-motion.
 */
export function useNumberPop(value: number): UseNumberPopResult {
  const reducedMotion = useReducedMotion();
  const prevRef = useRef(value);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);
  const [active, setActive] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      prevRef.current = value;
      return;
    }

    let dir: 'up' | 'down' | null = null;
    if (value > prevRef.current) dir = 'up';
    else if (value < prevRef.current) dir = 'down';
    prevRef.current = value;

    if (dir !== null) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      const raf = requestAnimationFrame(() => {
        setDirection(dir);
        setActive(true);
        timerRef.current = window.setTimeout(() => {
          setActive(false);
          setDirection(null);
        }, 300);
      });

      return () => {
        cancelAnimationFrame(raf);
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [value, reducedMotion]);

  if (reducedMotion) {
    return { popClass: '', direction: null };
  }

  return {
    popClass: active && direction ? 'animate-number-bump' : '',
    direction,
  };
}
