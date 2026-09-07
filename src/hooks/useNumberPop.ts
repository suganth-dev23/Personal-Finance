import { useEffect, useRef, useState } from 'react';

export interface UseNumberPopResult {
  popClass: string;
  direction: 'up' | 'down' | null;
}

/**
 * Detects increases/decreases in a numeric value across renders and
 * returns a Tailwind animation class to apply for ~300ms.
 */
export function useNumberPop(value: number): UseNumberPopResult {
  const prevRef = useRef(value);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    let dir: 'up' | 'down' | null = null;
    if (value > prevRef.current) dir = 'up';
    else if (value < prevRef.current) dir = 'down';
    prevRef.current = value;

    if (dir !== null) {
      setDirection(dir);
      const t = setTimeout(() => setDirection(null), 300);
      return () => clearTimeout(t);
    }
  }, [value]);

  return { popClass: direction ? 'animate-number-bump' : '', direction };
}
