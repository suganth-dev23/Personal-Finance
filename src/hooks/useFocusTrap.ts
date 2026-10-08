import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface UseFocusTrapOptions {
  isActive: boolean;
  onEscape?: () => void;
  returnFocus?: boolean;
}

/**
 * Traps keyboard focus within the referenced element when active,
 * cycles Tab and Shift+Tab, handles Escape key dismissal, and returns focus
 * to the trigger element upon deactivation.
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>({
  isActive,
  onEscape,
  returnFocus = true,
}: UseFocusTrapOptions) {
  const containerRef = useRef<T | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const onEscapeRef = useRef(onEscape);
  const prevIsActiveRef = useRef(false);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  });

  useEffect(() => {
    if (!isActive || typeof document === 'undefined') {
      if (prevIsActiveRef.current && returnFocus && triggerElementRef.current && document.contains(triggerElementRef.current)) {
        triggerElementRef.current.focus();
        triggerElementRef.current = null;
      }
      prevIsActiveRef.current = false;
      return;
    }

    // Only on initial activation: capture trigger and focus the first input or focusable
    if (!prevIsActiveRef.current) {
      prevIsActiveRef.current = true;
      triggerElementRef.current = document.activeElement as HTMLElement | null;

      const container = containerRef.current;
      if (container) {
        const autofocusEl = container.querySelector<HTMLElement>('[autofocus]');
        const firstInput = container.querySelector<HTMLElement>(
          'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled])'
        );
        const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        const targetToFocus = autofocusEl || firstInput || (focusable.length > 0 ? focusable[0] : null);

        if (targetToFocus) {
          requestAnimationFrame(() => {
            targetToFocus.focus();
          });
        }
      }
    }

    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If focus is inside a different container (e.g. a stacked child modal), do not intercept
      if (container && document.activeElement && !container.contains(document.activeElement) && document.activeElement !== document.body) {
        return;
      }

      if (e.key === 'Escape') {
        if (onEscapeRef.current) {
          e.stopPropagation();
          onEscapeRef.current();
        }
        return;
      }

      if (e.key === 'Tab') {
        const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (elements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = elements[0];
        const lastElement = elements[elements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab: if on first element or container, wrap to last
          if (document.activeElement === firstElement || document.activeElement === container) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: if on last element, wrap to first
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isActive, returnFocus]);

  // Return focus on unmount
  useEffect(() => {
    return () => {
      if (returnFocus && triggerElementRef.current && document.contains(triggerElementRef.current)) {
        triggerElementRef.current.focus();
      }
    };
  }, [returnFocus]);

  return containerRef;
}
