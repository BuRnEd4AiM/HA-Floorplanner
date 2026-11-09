/* Swiping a strip sideways with a finger: the room tiles. The browser scrolls the strip itself (smooth, it glides on by itself), only
 * sideways (touch-action: pan-x in style.css). In 3.99.5 the finger always moved it here (#438), and on the iPhone that jerked and got stuck
 * (#441): every move had to pass the page while it draws the 3D view, and a slanted swipe went to the iPhone, up and down. Now the strip
 * takes touches as soon as it has more than fits (style.css), which is what the iPhone needed to scroll it (#438). The page moves it only
 * as a stand-in, when the browser did not take over after WAIT px: it says so with pointercancel, or the strip moved by itself. Then the
 * strip follows the finger from there, a quick swipe glides on and slows down. A tap stays a tap; the click that may follow a swipe is
 * swallowed (no room opens by accident), and so is a tap that only stops the glide. The mouse keeps its wheel and the arrows. How fast the
 * finger was, how far the strip moves and how the glide slows down: the pure functions below (tests/dragscroll.test.mjs). */

export const SLOP = 8;                 // px: a finger that moved less is a tap
export const WAIT = 24;                // px: a browser that scrolls the strip itself has taken over by then

/** how far the page moves the strip with the finger (px, like dx) when the browser did not: from the point where it took over, no jump */
export function dragOffset(dx) {
  return Math.abs(dx) <= WAIT ? 0 : dx - Math.sign(dx) * WAIT;
}

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

/** the strip `el` follows a finger or a pen (not the mouse) where the browser does not scroll it; only while it has more to show than fits */
export function initDragScroll(el) {
  let id = null, x0 = 0, s0 = 0, far = false, moved = false, hold = false, samples = [], raf = 0, until = 0;
  const max = () => Math.max(0, el.scrollWidth - el.clientWidth);
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
  el.addEventListener('pointerdown', (e) => {
    hold = !!raf; stop();                                          // a tap on the gliding strip only stops it
    if (e.pointerType === 'mouse' || !max()) return;
    id = e.pointerId; x0 = e.clientX; s0 = el.scrollLeft; far = moved = false; samples = [{ x: e.clientX, t: e.timeStamp }];
  });
  el.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - x0;
    samples.push({ x: e.clientX, t: e.timeStamp });
    if (samples.length > 10) samples.shift();
    if (Math.abs(dx) >= SLOP) far = true;                          // no tap any more
    if (!moved) {
      if (el.scrollLeft !== s0) { id = null; return; }             // the browser scrolls it (it may not have said so yet)
      if (Math.abs(dx) <= WAIT) return;                            // a tap, or the browser is about to take over
      moved = true; try { el.setPointerCapture(id); } catch { /* a pointer the page made up (tests) */ }
    }
    el.scrollLeft = Math.max(0, Math.min(max(), s0 - dragOffset(dx)));
  });
  el.addEventListener('pointerup', (e) => {
    if (e.pointerId !== id) return;
    id = null;
    if (!far && !hold) return;                                     // a tap: the click opens the room as always
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
  el.addEventListener('pointercancel', (e) => { if (e.pointerId === id) id = null; });   // the browser scrolls the strip itself
  el.addEventListener('click', (e) => {                            // the click after a swipe opens nothing
    if (e.timeStamp <= until) { e.stopPropagation(); e.preventDefault(); until = 0; }
  }, true);
}
