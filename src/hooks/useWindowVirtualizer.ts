import { useState, useEffect, useMemo, useCallback } from 'react';

export interface UseWindowVirtualizerOptions {
  itemCount?: number;
  count?: number;
  estimateHeight?: number;
  overscan?: number;
  threshold?: number;
  containerRef?: React.RefObject<HTMLElement | null>;
}

export interface WindowVirtualizerResult {
  startIndex: number;
  endIndex: number;
  topSpacerHeight: number;
  bottomSpacerHeight: number;
  isVirtual: boolean;
  virtualItems: Array<{ index: number }>;
}

/**
 * Windowed virtualizer hook for large lists and tables.
 * Calculates visible range [startIndex, endIndex] and spacer heights
 * based on window scroll position and the container element's offset.
 */
export function useWindowVirtualizer(options: UseWindowVirtualizerOptions): WindowVirtualizerResult {
  const total = options.itemCount ?? options.count ?? 0;
  const estimateHeight = options.estimateHeight ?? 52;
  const overscan = options.overscan ?? 10;
  const threshold = options.threshold ?? 40;
  const containerRef = options.containerRef;

  const [range, setRange] = useState<{
    startIndex: number;
    endIndex: number;
    topSpacerHeight: number;
    bottomSpacerHeight: number;
  }>(() => {
    if (total <= threshold) {
      return {
        startIndex: 0,
        endIndex: total,
        topSpacerHeight: 0,
        bottomSpacerHeight: 0,
      };
    }
    const initialEnd = Math.min(total, Math.ceil(900 / estimateHeight) + overscan);
    return {
      startIndex: 0,
      endIndex: initialEnd,
      topSpacerHeight: 0,
      bottomSpacerHeight: Math.max(0, (total - initialEnd) * estimateHeight),
    };
  });

  const computeRange = useCallback(() => {
    if (total <= threshold) {
      return {
        startIndex: 0,
        endIndex: total,
        topSpacerHeight: 0,
        bottomSpacerHeight: 0,
      };
    }

    if (typeof window === 'undefined') {
      return {
        startIndex: 0,
        endIndex: total,
        topSpacerHeight: 0,
        bottomSpacerHeight: 0,
      };
    }

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const viewportHeight = window.innerHeight || 800;

    let offsetTop = 0;
    if (containerRef?.current) {
      const rect = containerRef.current.getBoundingClientRect();
      offsetTop = rect.top + scrollY;
    }

    const visibleTop = Math.max(0, scrollY - offsetTop);
    const visibleBottom = Math.max(0, scrollY + viewportHeight - offsetTop);

    const rawStart = Math.floor(visibleTop / estimateHeight);
    const rawEnd = Math.ceil(visibleBottom / estimateHeight);

    const startIndex = Math.max(0, Math.min(total, rawStart - overscan));
    const endIndex = Math.min(total, Math.max(startIndex, rawEnd + overscan));

    const topSpacerHeight = startIndex * estimateHeight;
    const bottomSpacerHeight = Math.max(0, (total - endIndex) * estimateHeight);

    return {
      startIndex,
      endIndex,
      topSpacerHeight,
      bottomSpacerHeight,
    };
  }, [total, threshold, estimateHeight, overscan, containerRef]);

  useEffect(() => {
    const initial = computeRange();
    setRange(initial);

    if (total <= threshold) return;

    let rafId: number | null = null;
    const onScrollOrResize = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        const next = computeRange();
        setRange(prev => {
          if (
            prev.startIndex === next.startIndex &&
            prev.endIndex === next.endIndex &&
            prev.topSpacerHeight === next.topSpacerHeight &&
            prev.bottomSpacerHeight === next.bottomSpacerHeight
          ) {
            return prev;
          }
          return next;
        });
      });
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef?.current) {
      resizeObserver = new ResizeObserver(() => {
        onScrollOrResize();
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      resizeObserver?.disconnect();
    };
  }, [total, threshold, computeRange, containerRef]);

  const effectiveResult = useMemo(() => {
    if (total <= threshold) {
      return {
        startIndex: 0,
        endIndex: total,
        topSpacerHeight: 0,
        bottomSpacerHeight: 0,
        isVirtual: false,
      };
    }

    const clampedStart = Math.min(range.startIndex, Math.max(0, total));
    const clampedEnd = Math.min(total, Math.max(clampedStart, range.endIndex));
    const topSpacer = clampedStart * estimateHeight;
    const bottomSpacer = Math.max(0, (total - clampedEnd) * estimateHeight);

    return {
      startIndex: clampedStart,
      endIndex: clampedEnd,
      topSpacerHeight: topSpacer,
      bottomSpacerHeight: bottomSpacer,
      isVirtual: true,
    };
  }, [total, threshold, range, estimateHeight]);

  const virtualItems = useMemo(() => {
    const count = Math.max(0, effectiveResult.endIndex - effectiveResult.startIndex);
    return Array.from({ length: count }, (_, i) => ({
      index: effectiveResult.startIndex + i,
    }));
  }, [effectiveResult.startIndex, effectiveResult.endIndex]);

  return {
    startIndex: effectiveResult.startIndex,
    endIndex: effectiveResult.endIndex,
    topSpacerHeight: effectiveResult.topSpacerHeight,
    bottomSpacerHeight: effectiveResult.bottomSpacerHeight,
    isVirtual: effectiveResult.isVirtual,
    virtualItems,
  };
}

export default useWindowVirtualizer;
