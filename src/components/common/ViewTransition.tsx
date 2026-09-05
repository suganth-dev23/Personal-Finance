import React, { useState, useEffect, useRef } from 'react';

interface ViewTransitionProps {
  viewKey: string;
  children: React.ReactNode;
}

/**
 * Lightweight, zero-dependency view transition container.
 * Provides soft fade-out and slide-up transition between view switches without layout flashing.
 */
export const ViewTransition: React.FC<ViewTransitionProps> = ({ viewKey, children }) => {
  const [displayKey, setDisplayKey] = useState(viewKey);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (viewKey !== displayKey) {
      setIsTransitioning(true);

      timerRef.current = window.setTimeout(() => {
        setDisplayKey(viewKey);
        setIsTransitioning(false);
      }, 120);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [viewKey, displayKey]);

  return (
    <div
      key={displayKey}
      className={`transition-opacity duration-200 ease-out ${
        isTransitioning
          ? 'opacity-0'
          : 'opacity-100'
      }`}
    >
      {children}
    </div>
  );
};
