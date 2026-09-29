import React, { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface ViewTransitionProps {
  viewKey: string;
  children: React.ReactNode;
}

const VIEW_ORDER: Record<string, number> = {
  dashboard: 0,
  transactions: 1,
  people: 2,
  budgets: 3,
  recurring: 4,
  categories: 5,
  emergency: 6,
  investments: 7,
  dreams: 8,
  badges: 9,
  ai: 10,
  import: 11,
  settings: 12,
};

// Feature flag for instant bisect or fallback if needed
const ENABLE_VIEW_TRANSITION = true;
const EXIT_DURATION_MS = 140;
const ENTER_SETTLE_MS = 160;
const CEILING_TIMEOUT_MS = 600;

/**
 * High-performance, zero-flicker view transition orchestrator.
 * - Renders live children when idle (so prop updates from App are never frozen)
 * - Snapshots previous view during exit to allow incoming lazy chunks to resolve
 * - Directional enter and exit transitions driven by VIEW_ORDER
 * - Restores per-view scroll position and moves focus to view heading on enter
 * - Hard ceiling timer and single unified cleanup preventing hung transitions
 */
export const ViewTransition: React.FC<ViewTransitionProps> = ({ viewKey, children }) => {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<'idle' | 'exit' | 'enter'>('idle');
  const [activeKey, setActiveKey] = useState<string>(viewKey);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const pendingChildrenRef = useRef<React.ReactNode>(children);
  pendingChildrenRef.current = children;

  const snapshottedChildrenRef = useRef<React.ReactNode>(children);
  const scrollMapRef = useRef<Record<string, number>>({});
  const transitionTimerRef = useRef<number | null>(null);
  const ceilingTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFirstMount = useRef(true);

  const clearAllTimers = () => {
    if (transitionTimerRef.current !== null) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (ceilingTimerRef.current !== null) {
      clearTimeout(ceilingTimerRef.current);
      ceilingTimerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  useEffect(() => {
    if (!ENABLE_VIEW_TRANSITION || reducedMotion) {
      clearAllTimers();
      setActiveKey(viewKey);
      setPhase('idle');
      return;
    }

    if (isFirstMount.current) {
      isFirstMount.current = false;
      setActiveKey(viewKey);
      setPhase('idle');
      return;
    }

    if (viewKey !== activeKey) {
      // 1. Capture current scroll position for the exiting view
      if (typeof window !== 'undefined') {
        scrollMapRef.current[activeKey] = window.scrollY;
      }

      // 2. Determine slide direction from VIEW_ORDER (captured at exit start)
      const fromIdx = VIEW_ORDER[activeKey] ?? 0;
      const toIdx = VIEW_ORDER[viewKey] ?? 0;
      const navDirection = toIdx >= fromIdx ? 'forward' : 'backward';
      setDirection(navDirection);

      // 3. Snapshot exiting view to display while incoming chunk loads
      snapshottedChildrenRef.current = pendingChildrenRef.current;

      // 4. Clear any active transition timers
      clearAllTimers();

      // 5. Begin exit phase
      setPhase('exit');

      // Hard ceiling timeout: force idle state if transition hangs
      ceilingTimerRef.current = window.setTimeout(() => {
        setActiveKey(viewKey);
        setPhase('idle');
      }, CEILING_TIMEOUT_MS);

      // 6. Settle exit and commit incoming view
      transitionTimerRef.current = window.setTimeout(() => {
        setActiveKey(viewKey);
        setPhase('enter');

        // Restore scroll position and focus view heading
        rafRef.current = requestAnimationFrame(() => {
          if (typeof window !== 'undefined') {
            const savedScroll = scrollMapRef.current[viewKey] ?? 0;
            window.scrollTo({ top: savedScroll, behavior: 'instant' });
          }

          // Move focus to view heading for screen readers & keyboard navigation
          const heading = containerRef.current?.querySelector<HTMLElement>(
            'h1, h2, [data-view-heading]'
          );
          if (heading) {
            if (!heading.hasAttribute('tabindex')) {
              heading.setAttribute('tabindex', '-1');
            }
            heading.focus({ preventScroll: true });
          }

          // Complete enter phase to idle
          transitionTimerRef.current = window.setTimeout(() => {
            setPhase('idle');
            if (ceilingTimerRef.current !== null) {
              clearTimeout(ceilingTimerRef.current);
              ceilingTimerRef.current = null;
            }
          }, ENTER_SETTLE_MS);
        });
      }, EXIT_DURATION_MS);

      return () => {
        clearAllTimers();
      };
    }
  }, [viewKey, activeKey, reducedMotion]);

  if (!ENABLE_VIEW_TRANSITION || reducedMotion) {
    return <div className="w-full">{children}</div>;
  }

  // Derive transition classes based on active state machine phase & direction
  let phaseClasses = 'opacity-100 translate-x-0 scale-100';
  if (phase === 'exit') {
    const exitOffset = direction === 'forward' ? '-translate-x-2.5' : 'translate-x-2.5';
    phaseClasses = `opacity-0 ${exitOffset} scale-[0.995] pointer-events-none`;
  } else if (phase === 'enter') {
    phaseClasses = 'opacity-100 translate-x-0 scale-100';
  }

  // When idle, render live children directly so parent re-renders and prop changes are never blocked.
  // Snapshot is only rendered during exit.
  const contentToRender = phase === 'exit' ? snapshottedChildrenRef.current : children;

  return (
    <div
      ref={containerRef}
      className={`w-full transition-all duration-150 ease-out transform will-change-transform-opacity ${phaseClasses}`}
    >
      {contentToRender}
    </div>
  );
};
