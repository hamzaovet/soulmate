/**
 * Soulmate Dessert & Coffee — 100% Embedded Loud Web Audio Notification Engine
 * No external MP3 dependencies (never fails with 404 or broken audio!).
 * Auto-unlocks AudioContext on first user interaction.
 */

let sharedCtx: AudioContext | null = null;
let unlocked = false;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedCtx) {
    sharedCtx = new AudioCtx();
  }
  if (sharedCtx.state === "suspended") {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

/**
 * Call once inside a useEffect to attach passive gesture listeners
 * so browsers immediately allow loud repeating audio alerts.
 */
export function registerAudioUnlockListeners(): () => void {
  if (typeof window === "undefined") return () => {};
  const unlock = () => {
    const ctx = getAudioCtx();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    unlocked = true;
  };
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("keydown", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });
  return () => {
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
    window.removeEventListener("touchstart", unlock);
  };
}

export function unlockAlertAudio() {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  unlocked = true;
}

export function isAudioUnlocked() {
  return unlocked || (sharedCtx?.state === "running");
}

function playBellTone(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  startTime: number,
  duration: number,
  peakGain: number
) {
  // Fundamental + bright metallic bell overtone
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = "triangle";
  osc1.frequency.setValueAtTime(freq, startTime);

  osc2.type = "sine";
  osc2.frequency.setValueAtTime(freq * 2.0, startTime);

  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(dest);

  osc1.start(startTime);
  osc2.start(startTime);
  osc1.stop(startTime + duration + 0.02);
  osc2.stop(startTime + duration + 0.02);
}

/**
 * Loud, high-clarity repeating café service bell for POS & KDS Staff
 * Designed to cut through café background noise until staff responds.
 */
export function playStaffUrgentRing() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-12, ctx.currentTime);
    compressor.ratio.setValueAtTime(6, ctx.currentTime);
    compressor.connect(ctx.destination);

    const now = ctx.currentTime;
    // Urgent loud triple-tone bell burst (A5 -> D6 -> F#6 -> A6)
    playBellTone(ctx, compressor, 880, now, 0.28, 0.9);
    playBellTone(ctx, compressor, 1174.66, now + 0.16, 0.30, 0.95);
    playBellTone(ctx, compressor, 1479.98, now + 0.32, 0.42, 0.98);
    // Second quick echo burst for unmistakable attention
    playBellTone(ctx, compressor, 1174.66, now + 0.62, 0.25, 0.85);
    playBellTone(ctx, compressor, 1567.98, now + 0.78, 0.48, 0.98);

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([180, 90, 180]);
    }
  } catch {
    // non-fatal
  }
}

/**
 * Distinct loud cash-register double bell for table BILL_REQUESTED
 */
export function playBillRequestRing() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;

    const compressor = ctx.createDynamicsCompressor();
    compressor.connect(ctx.destination);

    const now = ctx.currentTime;
    playBellTone(ctx, compressor, 1046.5, now, 0.32, 0.95);
    playBellTone(ctx, compressor, 1567.98, now + 0.18, 0.45, 0.98);
    playBellTone(ctx, compressor, 2093.0, now + 0.42, 0.50, 0.95);
  } catch {
    // non-fatal
  }
}

/**
 * Pleasant, clear customer notification chime (when barista accepts/prepares/finishes order)
 */
export function playCustomerUpdateChime() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;

    const compressor = ctx.createDynamicsCompressor();
    compressor.connect(ctx.destination);

    const now = ctx.currentTime;
    playBellTone(ctx, compressor, 587.33, now, 0.28, 0.75);      // D5
    playBellTone(ctx, compressor, 880.0, now + 0.16, 0.35, 0.85); // A5
    playBellTone(ctx, compressor, 1174.66, now + 0.34, 0.55, 0.9); // D6

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([120, 60, 160]);
    }
  } catch {
    // non-fatal
  }
}

export function requestBrowserNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

export function showBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
      });
    } catch {
      // ignore SW-only environments
    }
  }
}
