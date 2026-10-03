/**
 * Global overlay stack manager.
 * Coordinates modal dialogs, sheets, and drawers to guarantee:
 * 1. Escape key only closes the topmost active overlay.
 * 2. Underlying overlays are not dismissed accidentally when stacked (e.g. AddContactModal opened from SettleSplitModal).
 * 3. Dynamic z-index stacking order so nested overlays are visually on top.
 */

type EscapeHandler = () => void;

interface OverlayEntry {
  id: string;
  onEscape?: EscapeHandler;
}

const stack: OverlayEntry[] = [];
let listenerAttached = false;

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && stack.length > 0) {
    const top = stack[stack.length - 1];
    if (top.onEscape) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      top.onEscape();
    }
  }
}

function ensureListener() {
  if (typeof window === 'undefined') return;
  if (stack.length > 0 && !listenerAttached) {
    window.addEventListener('keydown', onKeyDown, true); // Capture phase
    listenerAttached = true;
  } else if (stack.length === 0 && listenerAttached) {
    window.removeEventListener('keydown', onKeyDown, true);
    listenerAttached = false;
  }
}

/**
 * Registers an active overlay into the stack.
 * Returns an unregister function to remove it upon close or unmount.
 */
export function registerOverlay(id: string, onEscape?: EscapeHandler): () => void {
  // If overlay is already in stack, remove it first to re-push at the top
  const existingIdx = stack.findIndex(item => item.id === id);
  if (existingIdx !== -1) {
    stack.splice(existingIdx, 1);
  }

  stack.push({ id, onEscape });
  ensureListener();

  return () => {
    unregisterOverlay(id);
  };
}

/**
 * Removes an overlay from the stack by ID.
 */
export function unregisterOverlay(id: string): void {
  const idx = stack.findIndex(item => item.id === id);
  if (idx !== -1) {
    stack.splice(idx, 1);
  }
  ensureListener();
}

/**
 * Returns true if the overlay with the given ID is the topmost one on the stack.
 */
export function isTopmostOverlay(id: string): boolean {
  if (stack.length === 0) return false;
  return stack[stack.length - 1].id === id;
}

/**
 * Gets the 0-based depth of the overlay in the stack (-1 if not in stack).
 */
export function getOverlayDepth(id: string): number {
  return stack.findIndex(item => item.id === id);
}

/**
 * Computes a z-index for an overlay based on its position in the stack.
 * Base z-index is 9999, adding +10 per stack layer.
 */
export function getOverlayZIndex(id: string, baseZ = 9999): number {
  const depth = getOverlayDepth(id);
  return depth >= 0 ? baseZ + depth * 10 : baseZ;
}

/**
 * Returns the current total count of active stacked overlays.
 */
export function getActiveOverlayCount(): number {
  return stack.length;
}
