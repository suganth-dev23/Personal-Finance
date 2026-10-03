import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useReducedMotion } from './useReducedMotion';

export interface UseStaggerOptions {
  staggerMs?: number;
  maxDelayMs?: number;
  fallbackTimeoutMs?: number;
}

/**
 * High-performance IntersectionObserver-backed stagger reveal hook.
 * Arms children with animation-play-state: paused and animation-fill-mode: both,
 * then switches to running with capped stagger delay when scrolled into view.
 * Includes fallback timer and reduced-motion bypass.
 */
export function useStaggerChildren<T extends HTMLElement = HTMLDivElement>(
  staggerOrOptions: number | UseStaggerOptions = 50
) {
  const staggerMs = typeof staggerOrOptions === 'number'
    ? staggerOrOptions
    : staggerOrOptions.staggerMs ?? 50;
  const maxDelayMs = typeof staggerOrOptions === 'object'
    ? staggerOrOptions.maxDelayMs ?? 400
    : 400;
  const fallbackTimeoutMs = typeof staggerOrOptions === 'object'
    ? staggerOrOptions.fallbackTimeoutMs ?? 450
    : 450;

  const containerRef = useRef<T>(null);
  const reducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(
    () => reducedMotion || typeof IntersectionObserver === 'undefined'
  );

  useEffect(() => {
    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const el = containerRef.current;
    if (!el) {
      // If no ref attached yet, ensure fallback runs
      const fallback = setTimeout(() => setIsVisible(true), fallbackTimeoutMs);
      return () => clearTimeout(fallback);
    }

    // Safety fallback timer to guarantee visibility if IO is throttled/skipped
    const fallbackTimer = setTimeout(() => {
      setIsVisible(true);
    }, fallbackTimeoutMs);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          clearTimeout(fallbackTimer);
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: '50px' }
    );

    observer.observe(el);

    return () => {
      clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, [reducedMotion, fallbackTimeoutMs]);

  const getChildStyle = (index: number): CSSProperties => {
    if (reducedMotion) {
      return {
        animationPlayState: 'running',
        animationDelay: '0ms',
        animationDuration: '0.01ms',
      };
    }

    const cappedDelay = Math.min(index * staggerMs, maxDelayMs);

    return {
      animationPlayState: isVisible ? 'running' : 'paused',
      animationDelay: `${cappedDelay}ms`,
      animationFillMode: 'both',
    };
  };

  return { containerRef, isVisible, getChildStyle };
}
