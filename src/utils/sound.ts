/**
 * Safe, graceful audio feedback utilities for gamification achievements.
 * Guarantees zero unhandled exceptions or noisy console logs if AudioContext is
 * blocked by browser autoplay policies, unsupported, or if calm mode is enabled.
 */

export function isCalmModeActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('dhanveda_calm_mode') === 'true';
  } catch {
    return false;
  }
}

/**
 * Plays an elegant micro-chime for badge milestone unlocks.
 * Fails completely silently if AudioContext is restricted by browser autoplay policy.
 */
export function playBadgeChime(): void {
  if (typeof window === 'undefined') return;
  if (isCalmModeActive()) return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {
        // Autoplay policy prevented audio resumption; fail silently
      });
    }

    const startTime = ctx.currentTime;
    // Harmonic celebratory chime: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.07);

      gain.gain.setValueAtTime(0.001, startTime + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.07, startTime + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + idx * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + idx * 0.07);
      osc.stop(startTime + idx * 0.07 + 0.38);
    });

    // Clean up AudioContext resource
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1500);
  } catch {
    // Autoplay policy or hardware restriction: fail silently
  }
}
