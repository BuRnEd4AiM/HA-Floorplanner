/* The sound of the voice search's 🎤 for Home Assistant's Assist (#509): the microphone's samples (floats at the rate of the browser,
 * mostly 44.1 or 48 kHz) made into 16-bit mono at 16 kHz, and when to stop listening (a pause after speech, or nothing said). Pure (unit
 * test: tests/voiceaudio.test.mjs); voiceinput.js records. */

export const RATE = 16000;
/** stop after this long quiet once something was said, after this long in all, or when nothing was said for this long (ms) */
export const PAUSE_MS = 1200;
export const MAX_MS = 9000;
export const WAIT_MS = 6000;

/** floats (-1..1) at rate `from` -> 16-bit samples at RATE: the mean of the samples that make up one new sample */
export function toPcm16(floats, from) {
  const ratio = from / RATE, n = Math.floor(floats.length / ratio), out = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.floor(i * ratio), b = Math.max(a + 1, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = a; j < b && j < floats.length; j++) sum += floats[j];
    const v = Math.max(-1, Math.min(1, sum / (b - a)));
    out[i] = v < 0 ? Math.round(v * 0x8000) : Math.round(v * 0x7fff);
  }
  return out;
}

/** pieces of Int16Array as one */
export function joinPcm(parts) {
  const out = new Int16Array(parts.reduce((s, p) => s + p.length, 0));
  let at = 0;
  parts.forEach((p) => { out.set(p, at); at += p.length; });
  return out;
}

/** how loud a piece is (root mean square, 0..1) */
export function loudness(floats) {
  if (!floats.length) return 0;
  let s = 0;
  for (let i = 0; i < floats.length; i++) s += floats[i] * floats[i];
  return Math.sqrt(s / floats.length);
}

/** a new listener: { start, floor (the quietest piece so far, the room's noise; 0.01 until a quieter one came: who speaks at once is
 *  not taken for noise), heard (something was said), quiet (since when it is quiet again) } */
export const listener = (now) => ({ start: now, floor: 0.01, heard: false, quiet: null });

/** one piece of loudness rms at time now: -> 'go' | 'done' (said something, then a pause; or too long) | 'nothing' (nobody spoke).
 *  Speech is louder than 0.02 and three times the room's noise */
export function step(s, rms, now) {
  s.floor = Math.min(s.floor, rms);
  if (rms > Math.max(0.02, s.floor * 3)) { s.heard = true; s.quiet = null; } else if (s.heard && s.quiet === null) s.quiet = now;
  if (s.heard && s.quiet !== null && now - s.quiet >= PAUSE_MS) return 'done';
  if (now - s.start >= MAX_MS) return s.heard ? 'done' : 'nothing';
  if (!s.heard && now - s.start >= WAIT_MS) return 'nothing';
  return 'go';
}
