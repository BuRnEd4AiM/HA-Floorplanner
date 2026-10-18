/* Swiping a strip sideways with a finger (#438): the room tiles. The iPhone (Safari, also inside the Home Assistant app) did not scroll the
 * strip with a finger at all (Android did), so the finger moves it here, the same on every device: the strip follows the finger, a quick swipe
 * glides on and slows down. The browser keeps only the up and down (touch-action: pan-y in style.css), so it never scrolls the strip at the
 * same time. A tap stays a tap; the click that may follow a swipe is swallowed (no room opens by accident), and so is a tap that only stops
 * the glide. The mouse keeps its wheel and the arrows. How fast the finger was and how the glide slows down: the pure functions below
 * (tests/dragscroll.test.mjs). */

export const SLOP = 8;                 // px: a finger that moved less is a tap

/** how fast the finger moved at the end, px per ms (left is negative): over the samples [{ x, t }] of the last 100 ms before `now` */
export function flingSpeed(samples, now) {
  const recent = samples.filter((s) => now - s.t <= 100);
  if (recent.length < 2) return 0;
  const a = recent[0], b = recent[recent.length - 1];
  return b.t > a.t ? (b.x - a.x) / (b.t - a.t) : 0;
}

/** one frame of the glide after a quick swipe: { dx (px to move now), v (the speed left, 0 when it stops) } after `dt` ms at speed `v`
 *  (px per ms); it loses 5 % per 16 ms and stops below 0.02 px per ms */
export function glideStep(v, dt, friction = 0.95) {
  const t = Math.max(0, Math.min(dt, 64));                      // a frame that came late (a busy tablet) does not jump
  const left = v * friction ** (t / 16);
  return { dx: v * t, v: Math.abs(left) < 0.02 ? 0 : left };
}

/** the strip `el` follows a finger or a pen (not the mouse); only while it has more to show than fits */
export function initDragScroll(el) {
  let id = null, x0 = 0, s0 = 0, moved = false, hold = false, samples = [], raf = 0, until = 0;
  const max = () => Math.max(0, el.scrollWidth - el.clientWidth);
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
  el.addEventListener('pointerdown', (e) => {
    hold = !!raf; stop();                                          // a tap on the gliding strip only stops it
    if (e.pointerType === 'mouse' || !max()) return;
    id = e.pointerId; x0 = e.clientX; s0 = el.scrollLeft; moved = false; samples = [{ x: e.clientX, t: e.timeStamp }];
  });
  el.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - x0;
    if (!moved && Math.abs(dx) < SLOP) return;
    if (!moved) { moved = true; try { el.setPointerCapture(id); } catch { /* a pointer the page made up (tests) */ } }
    el.scrollLeft = Math.max(0, Math.min(max(), s0 - dx));
    samples.push({ x: e.clientX, t: e.timeStamp });
    if (samples.length > 10) samples.shift();
  });
  el.addEventListener('pointerup', (e) => {
    if (e.pointerId !== id) return;
    id = null;
    if (!moved && !hold) return;                                   // a tap: the click opens the room as always
    until = e.timeStamp + 400;
    if (!moved) return;
    let v = -flingSpeed(samples, e.timeStamp), pos = el.scrollLeft, last = performance.now();
    const frame = (now) => {
      const g = glideStep(v, now - last); last = now;
      pos = Math.max(0, Math.min(max(), pos + g.dx)); el.scrollLeft = pos; v = g.v;
      raf = v && pos > 0 && pos < max() ? requestAnimationFrame(frame) : 0;
    };
    if (Math.abs(v) > 0.1) raf = requestAnimationFrame(frame);
  });
  el.addEventListener('pointercancel', (e) => { if (e.pointerId === id) id = null; });   // the page scrolls up or down instead
  el.addEventListener('click', (e) => {                            // the click after a swipe opens nothing
    if (e.timeStamp <= until) { e.stopPropagation(); e.preventDefault(); until = 0; }
  }, true);
}
