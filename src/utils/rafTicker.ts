/**
 * Global high-performance requestAnimationFrame ticker (Phase D.1).
 * Consolidates multiple animation loops into a single shared RAF loop,
 * eliminating frame churn and thread contention across views.
 */
export type TickCallback = (now: number, delta: number) => void;

class RaFTicker {
  private subscribers = new Set<TickCallback>();
  private rafId: number | null = null;
  private lastTime = 0;

  public subscribe(cb: TickCallback): () => void {
    this.subscribers.add(cb);
    if (this.subscribers.size === 1) {
      this.start();
    }
    return () => {
      this.unsubscribe(cb);
    };
  }

  public unsubscribe(cb: TickCallback): void {
    this.subscribers.delete(cb);
    if (this.subscribers.size === 0) {
      this.stop();
    }
  }

  private start() {
    this.lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const tick = (now: number) => {
      const delta = now - this.lastTime;
      this.lastTime = now;

      for (const cb of [...this.subscribers]) {
        cb(now, delta);
      }

      if (this.subscribers.size > 0) {
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.rafId = null;
      }
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

export const rafTicker = new RaFTicker();
