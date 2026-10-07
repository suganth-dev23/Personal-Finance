import { useEffect } from 'react';

let lockCount = 0;
let originalOverflow = '';
let savedScrollY = 0;

/**
 * Ref-counted scroll lock for modal and drawer overlays.
 * Prevents premature body scroll unlocking when multiple overlays are stacked.
 */
export function lockScroll(): void {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockCount++;
}

export function unlockScroll(): void {
  if (typeof document === 'undefined') return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = originalOverflow || '';
    originalOverflow = '';
    // Body overflow:hidden makes the viewport drop its scroll offset when the document (not body) scrolls; restore it.
    window.scrollTo(0, savedScrollY);
  }
}

/**
 * Emergency reset to safely unlock body scroll if an unhandled error occurs
 * or all overlays are unmounted unexpectedly.
 */
export function forceResetScrollLock(): void {
  if (typeof document === 'undefined') return;
  lockCount = 0;
  document.body.style.overflow = originalOverflow || '';
  originalOverflow = '';
  window.scrollTo(0, savedScrollY);
}

/**
 * Returns current lock count (useful for testing and monitoring).
 */
export function getScrollLockCount(): number {
  return lockCount;
}

/**
 * Hook to lock body scroll while `isLocked` is true.
 * Safely releases upon unmount or when `isLocked` changes to false.
 */
export function useScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;
    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [isLocked]);
}
