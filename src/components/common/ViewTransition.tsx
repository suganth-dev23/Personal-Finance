import React, { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { ENABLE_VIEW_TRANSITION } from '../../constants/uiFlags';

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

  // Snapshot of previous view during transition so outgoing view remains visible
  const [currentView, setCurrentView] = useState({ key: viewKey, children });
  const [previousView, setPreviousView] = useState<{ key: string; children: React.ReactNode } | null>(null);

  if (viewKey !== currentView.key) {
    setPreviousView(currentView);
    setCurrentView({ key: viewKey, children });
  }

  if ((!ENABLE_VIEW_TRANSITION || reducedMotion) && (activeKey !== viewKey || phase !== 'idle')) {
    setActiveKey(viewKey);
    setPhase('idle');
  }

  const scrollMapRef = useRef<Record<string, number>>({});
  const transitionTimerRef = useRef<number | null>(null);
  const ceilingTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFirstMount = useRef(true);
  const lastViewKeyRef = useRef(viewKey);

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
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (!ENABLE_VIEW_TRANSITION || reducedMotion) {
      clearAllTimers();
      if (typeof window !== 'undefined' && viewKey !== lastViewKeyRef.current) {
        scrollMapRef.current[lastViewKeyRef.current] = window.scrollY;
        const savedScroll = scrollMapRef.current[viewKey] ?? 0;
        window.scrollTo({ top: savedScroll, behavior: 'instant' });
      }
      lastViewKeyRef.current = viewKey;
      return;
    }

 if (viewKey !== activeKey) {
 // 1. Capture current scroll position for the exiting view
 if (typeof window !== 'undefined') {
 scrollMapRef.current[activeKey] = window.scrollY;
 }

  // View Exit Optimization: skip exit animation delay when lite perf or outgoing tree > 3000 nodes
  const isLitePerf = typeof document !== 'undefined' && document.body?.getAttribute('data-perf') === 'lite';
  const outgoingNodes = containerRef.current?.getElementsByTagName('*').length ?? 0;
  if (isLitePerf || outgoingNodes > 3000) {
   clearAllTimers();
   setActiveKey(viewKey);
   setPhase('idle');
   if (typeof window !== 'undefined') {
     const savedScroll = scrollMapRef.current[viewKey] ?? 0;
     window.scrollTo({ top: savedScroll, behavior: 'instant' });
   }
   return;
  }

 // 2. Determine slide direction from VIEW_ORDER (captured at exit start)
 const fromIdx = VIEW_ORDER[activeKey] ?? 0;
 const toIdx = VIEW_ORDER[viewKey] ?? 0;
 const navDirection = toIdx >= fromIdx ? 'forward' : 'backward';
 setDirection(navDirection);

 // 3. displayedChildrenRef keeps rendering the outgoing view until the exit timer fires

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
 // No effect cleanup here on purpose: the exit timer itself changes `activeKey`, which
 // re-runs this effect, and a cleanup would cancel the enter rAF (scroll restore, heading
 // focus) and the settle timer. Timers are cleared at the start of the next transition
 // (step 4) and on unmount (separate effect above).
 }
 }, [viewKey, activeKey, reducedMotion]);

 if (!ENABLE_VIEW_TRANSITION || reducedMotion) {
 return <div className="w-full">{children}</div>;
 }

  const isSwitching = viewKey !== activeKey || phase === 'exit';
  const contentToRender = isSwitching ? (previousView?.children ?? children) : children;

 // No transform at rest: a resting transform creates a containing block for fixed
 // descendants and an extra compositor layer. Enter uses a one-shot keyframe instead.
 let phaseClasses = '';
 let phaseStyle: React.CSSProperties | undefined;
 if (isSwitching) {
 const exitOffset = direction === 'forward' ? '-translate-x-2.5' : 'translate-x-2.5';
 phaseClasses = `transition-[opacity,transform] duration-150 ease-out opacity-0 ${exitOffset} pointer-events-none`;
 } else if (phase === 'enter') {
 phaseStyle = {
 animation: `${direction === 'forward' ? 'view-enter-forward' : 'view-enter-backward'} ${ENTER_SETTLE_MS}ms cubic-bezier(0.22, 1, 0.36, 1) backwards`,
 };
 }

 return (
 <div ref={containerRef} className={`w-full ${phaseClasses}`} style={phaseStyle}>
 {contentToRender}
 </div>
 );
};
