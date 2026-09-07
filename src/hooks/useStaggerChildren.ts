import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

/**
 * IntersectionObserver-backed hook. Returns a ref to attach to a container
 * and a function to compute a per-child inline style with a staggered delay,
 * so children animate in with `animate-slide-up` as the container enters view.
 */
export function useStaggerChildren<T extends HTMLElement = HTMLDivElement>(staggerMs = 50) {
  const containerRef = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getChildStyle = (index: number): CSSProperties =>
    isVisible
      ? { animationDelay: `${index * staggerMs}ms` }
      : { opacity: 0 };

  return { containerRef, isVisible, getChildStyle };
}
