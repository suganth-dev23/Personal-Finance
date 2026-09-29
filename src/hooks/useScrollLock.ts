import { useEffect } from 'react';

let lockCount = 0;
let originalOverflow = '';

/**
 * Ref-counted scroll lock for modal and drawer overlays.
 * Prevents premature body scroll unlocking when multiple overlays are stacked.
 */
export function lockScroll(): void {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) {
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
  }
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
