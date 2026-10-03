import { useCallback, useSyncExternalStore } from 'react';

/**
 * Custom hook to track CSS media query state using useSyncExternalStore and window.matchMedia.
 * Synchronous and SSR-safe, avoids tearing and unnecessary re-renders.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) {
        return () => {};
      }
      const mediaQueryList = window.matchMedia(query);
      if (mediaQueryList.addEventListener) {
        mediaQueryList.addEventListener('change', callback);
        return () => {
          mediaQueryList.removeEventListener('change', callback);
        };
      } else {
        // Fallback for older browsers
        mediaQueryList.addListener(callback);
        return () => {
          mediaQueryList.removeListener(callback);
        };
      }
    },
    [query]
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default useMediaQuery;
