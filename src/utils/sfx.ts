// Tiny synthesized sound effects (no audio files). Browsers only allow sound after a click,
// which always happens before a reveal here (the user taps "Make my power card").

const MUTE_KEY = 'power-card-muted';

let ctx: AudioContext | null = null;

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // storage blocked: mute only lasts for this page load
  }
}

function audio(): AudioContext | null {
  if (isMuted()) return null;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx ??= new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  c: AudioContext,
  { from, to, start = 0, dur, type = 'sine', gain = 0.12 }: { from: number; to?: number; start?: number; dur: number; type?: OscillatorType; gain?: number }
) {
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** Rising "charging up" sweep while the card is being generated. */
export function playCharge() {
  const c = audio();
  if (!c) return;
  tone(c, { from: 110, to: 520, dur: 1.4, type: 'sawtooth', gain: 0.05 });
  tone(c, { from: 220, to: 1040, dur: 1.4, type: 'triangle', gain: 0.05 });
}

/** Whoosh + sparkle arpeggio when the card flips over. */
export function playReveal() {
  const c = audio();
  if (!c) return;
  tone(c, { from: 160, to: 1400, dur: 0.55, type: 'sawtooth', gain: 0.06 });
  [784, 988, 1175, 1568, 1976].forEach((f, i) => tone(c, { from: f, start: 0.5 + i * 0.07, dur: 0.35, gain: 0.09 }));
  tone(c, { from: 392, to: 392, start: 0.5, dur: 0.9, type: 'triangle', gain: 0.07 });
}

export function playTick(final = false) {
  const c = audio();
  if (!c) return;
  tone(c, { from: final ? 1320 : 880, dur: final ? 0.28 : 0.12, gain: 0.1 });
}
