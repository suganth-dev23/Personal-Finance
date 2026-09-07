import confetti from 'canvas-confetti';

const GOLD_PALETTE = ['#F5B742', '#F59E0B', '#FBBF24', '#D97706', '#FEF3C7', '#FFFFFF'];
const WEALTH_PALETTE = ['#10B981', '#059669', '#F5B742', '#3B82F6', '#8B5CF6'];

// Global cooldown timers to prevent overlapping particle storms
let lastMajorConfettiTime = 0;
let lastSparkleTime = 0;
const MAJOR_CONFETTI_COOLDOWN_MS = 2500;
const SPARKLE_COOLDOWN_MS = 1000;

function canTriggerMajorConfetti(): boolean {
  const now = Date.now();
  if (now - lastMajorConfettiTime < MAJOR_CONFETTI_COOLDOWN_MS) {
    return false;
  }
  lastMajorConfettiTime = now;
  return true;
}

function canTriggerSparkle(): boolean {
  const now = Date.now();
  if (now - lastSparkleTime < SPARKLE_COOLDOWN_MS) {
    return false;
  }
  lastSparkleTime = now;
  return true;
}

/**
 * Cleanly cancel and clear any currently running canvas-confetti animation
 */
export function resetConfetti() {
  try {
    confetti.reset();
  } catch {
    // Ignore
  }
}

/**
 * Standard celebratory burst (e.g. for dream goal achievements)
 * Fast, elegant burst lasting ~1.5s
 */
export function burstConfetti() {
  if (!canTriggerMajorConfetti()) return;
  try {
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.65 },
      colors: WEALTH_PALETTE,
      ticks: 90,
      gravity: 0.95,
      scalar: 1.0,
      disableForReducedMotion: true,
    });
  } catch {
    // Graceful fallback in environments without canvas support
  }
}

/**
 * Suvarna gold shower for financial milestones (emergency fund hit, badge earned)
 * Crisp, smooth, and lightweight — terminates cleanly within ~1.6s
 */
export function goldShower() {
  if (!canTriggerMajorConfetti()) return;
  try {
    confetti({
      particleCount: 50,
      spread: 65,
      origin: { y: 0.6 },
      colors: GOLD_PALETTE,
      ticks: 100,
      gravity: 0.95,
      scalar: 1.0,
      disableForReducedMotion: true,
    });
  } catch {
    // Ignore
  }
}

/**
 * Left corner cannon
 */
export function sideCannonLeft() {
  if (!canTriggerMajorConfetti()) return;
  try {
    confetti({
      particleCount: 35,
      angle: 60,
      spread: 50,
      origin: { x: 0, y: 0.85 },
      colors: GOLD_PALETTE,
      ticks: 85,
      gravity: 0.9,
      disableForReducedMotion: true,
    });
  } catch {
    // Ignore
  }
}

/**
 * Right corner cannon
 */
export function sideCannonRight() {
  if (!canTriggerMajorConfetti()) return;
  try {
    confetti({
      particleCount: 35,
      angle: 120,
      spread: 50,
      origin: { x: 1, y: 0.85 },
      colors: GOLD_PALETTE,
      ticks: 85,
      gravity: 0.9,
      disableForReducedMotion: true,
    });
  } catch {
    // Ignore
  }
}

/**
 * Dual side cannons fired simultaneously for major milestone celebrations
 */
export function dualSideCannons() {
  if (!canTriggerMajorConfetti()) return;
  try {
    confetti({
      particleCount: 30,
      angle: 60,
      spread: 50,
      origin: { x: 0.05, y: 0.85 },
      colors: GOLD_PALETTE,
      ticks: 85,
      gravity: 0.9,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 30,
      angle: 120,
      spread: 50,
      origin: { x: 0.95, y: 0.85 },
      colors: GOLD_PALETTE,
      ticks: 85,
      gravity: 0.9,
      disableForReducedMotion: true,
    });
  } catch {
    // Ignore
  }
}

/**
 * Subtle sparkle for minor wins (streak continued, settlement recorded)
 */
export function subtleSparkle(origin?: { x: number; y: number }) {
  if (!canTriggerSparkle()) return;
  try {
    confetti({
      particleCount: 16,
      spread: 35,
      startVelocity: 14,
      ticks: 60,
      gravity: 0.8,
      scalar: 0.75,
      origin: origin || { x: 0.5, y: 0.7 },
      colors: ['#F5B742', '#10B981', '#FEF3C7'],
      disableForReducedMotion: true,
    });
  } catch {
    // Ignore
  }
}
