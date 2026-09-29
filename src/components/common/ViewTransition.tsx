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

/**
 * High-performance, zero-flicker view transition orchestrator.
 * Keeps previous view snapshotted during exit to allow incoming lazy chunks to resolve,
 * eliminates double-mount DOM node destruction, restores scroll positions, and respects prefers-reduced-motion.
 */
export const ViewTransition: React.FC<ViewTransitionProps> = ({ viewKey, children }) => {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<'idle' | 'exit' | 'enter'>('idle');
  const [displayedChildren, setDisplayedChildren] = useState<React.ReactNode>(children);
  const [activeKey, setActiveKey] = useState<string>(viewKey);

  const pendingChildrenRef = useRef<React.ReactNode>(children);
  pendingChildrenRef.current = children;

  const scrollMapRef = useRef<Record<string, number>>({});
  const timerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (!ENABLE_VIEW_TRANSITION || reducedMotion) {
      setDisplayedChildren(children);
      setActiveKey(viewKey);
      setPhase('idle');
      return;
    }

    if (isFirstMount.current) {
      isFirstMount.current = false;
      setDisplayedChildren(children);
      setActiveKey(viewKey);
      return;
    }

    if (viewKey !== activeKey) {
      // 1. Capture current scroll position for the exiting view
      if (typeof window !== 'undefined') {
        scrollMapRef.current[activeKey] = window.scrollY;
      }

      // 2. Clear any pending transition timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // 3. Begin exit phase while keeping old snapshot painted
      setPhase('exit');

      // Exit transition duration is 140ms
      timerRef.current = window.setTimeout(() => {
        // 4. Commit incoming view
        setActiveKey(viewKey);
        setDisplayedChildren(pendingChildrenRef.current);
        setPhase('enter');

        // 5. Restore saved scroll position
        requestAnimationFrame(() => {
          if (typeof window !== 'undefined') {
            const savedScroll = scrollMapRef.current[viewKey] ?? 0;
            window.scrollTo({ top: savedScroll, behavior: 'instant' });
          }

          // 6. Settle to idle state
          timerRef.current = window.setTimeout(() => {
            setPhase('idle');
          }, 160);
        });
      }, 140);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [viewKey, activeKey, children, reducedMotion]);

  if (!ENABLE_VIEW_TRANSITION || reducedMotion) {
    return <div className="w-full">{children}</div>;
  }

  // Derive transition classes based on active state machine phase
  let phaseClasses = 'opacity-100 translate-y-0 scale-100';
  if (phase === 'exit') {
    phaseClasses = 'opacity-0 translate-y-1.5 scale-[0.995] pointer-events-none';
  } else if (phase === 'enter') {
    phaseClasses = 'opacity-100 translate-y-0 scale-100';
  }

  return (
    <div
      ref={containerRef}
      className={`w-full transition-all duration-150 ease-out transform will-change-transform-opacity ${phaseClasses}`}
    >
      {displayedChildren}
    </div>
  );
};
