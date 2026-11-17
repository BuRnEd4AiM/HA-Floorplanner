/* What the wall tablet's screen shows while it rests (kiosk.js decides when): the dimmed screen (as dark as set in ⚙ → Wandtablet, with a
 * clock if wanted) and the screen saver: a big clock with the date and the weather, a black screen, or a small clock over the turning house.
 * Also keeps the screen on (the browser's Screen Wake Lock, only over https). clockLines and clockShift are pure (tests/kiosk.test.mjs). */
import { weatherId, weatherText } from './sky.js';

/** the lines of the clock: { time: "21:05", day: "Sonntag, 15. November" } in the language of the screen */
export function clockLines(date, lang) {
  const l = lang || undefined;
  return {
    time: date.toLocaleTimeString(l, { hour: 'numeric', minute: '2-digit' }),
    day: date.toLocaleDateString(l, { weekday: 'long', day: 'numeric', month: 'long' }),
  };
}

/** where the big clock stands in minute `n`: a few percent off the middle, a new place every minute, so a clock that stands for hours
 *  does not burn into the screen; { x, y } in % of the screen width / height (-6..6, -5..5) */
export function clockShift(n) {
  const k = Math.abs(Math.floor(n)) || 0;
  return { x: ((k * 7) % 13) - 6, y: ((k * 5) % 11) - 5 };
}

/** how dark the dimmed screen is: the setting (0.2..0.95, default 0.7) is the opacity of the black layer */
export const dimAlpha = (level) => (Number.isFinite(level) ? Math.min(0.95, Math.max(0.2, level)) : 0.7);

/** ctx: $, t, lang(), settings(), states(), onTouch() (the first touch on a full-screen saver only wakes the screen) */
export function initKioskScreen(ctx) {
  const { $ } = ctx;
  const dimEl = $('#nightDim');
  const saverEl = document.createElement('div'); saverEl.id = 'saverScreen'; saverEl.hidden = true;
  document.body.append(saverEl);
  const makeClock = (cls) => {
    const c = document.createElement('div'); c.className = `kClock ${cls}`; c.hidden = true;
    c.append(document.createElement('b'), document.createElement('span'), document.createElement('small'));
    return c;
  };
  const dimClock = makeClock('kClockDim'), saverClock = makeClock('kClockBig');
  dimEl.append(dimClock); saverEl.append(saverClock);
  /* while the house turns the clock is only a strip: this clear sheet over the whole page takes the touch that wakes the screen, so it
   * never opens a room or switches a light under the finger (5.13.1) */
  const catchEl = document.createElement('div'); catchEl.id = 'saverCatch'; catchEl.hidden = true;
  document.body.append(catchEl);
  let kind = null, timer = 0, lock = null, asking = false;
  function fill(c, move) {
    const now = new Date(), l = clockLines(now, ctx.lang?.()), [b, span, small] = c.children;
    b.textContent = l.time; span.textContent = l.day;
    const st = ctx.settings(), states = ctx.states() || {}, id = weatherId(states, st.weatherEntity);
    small.textContent = (id && weatherText(states[id], ctx.t)) || '';
    const s = move ? clockShift(now.getTime() / 60000) : { x: 0, y: 0 };
    c.style.transform = `translate(${s.x}vw, ${s.y}vh)`;
  }
  function draw() {
    const st = ctx.settings();
    saverClock.hidden = !kind || kind === 'black' || ((kind === 'orbit' || kind === 'floors') && !st.saverClock);   // over the turning house only when wanted
    if (!saverClock.hidden) fill(saverClock, kind === 'clock');
    if (!dimEl.hidden && !dimClock.hidden) fill(dimClock, true);
  }
  /** the clocks are drawn every few seconds while one is to be seen */
  function run() {
    const on = !!kind || !dimEl.hidden;
    if (on) draw();
    if (on && !timer) timer = setInterval(draw, 5000);
    else if (!on && timer) { clearInterval(timer); timer = 0; }
  }
  [dimEl, saverEl, catchEl].forEach((el) => el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); ctx.onTouch(); }));   // the first touch only wakes the screen
  return {
    /** the screen saver: null (none), 'orbit' or 'floors' (only the clock over the house, the house turns in kiosk.js), 'clock', 'black' */
    saver(k) {
      if (k === kind) return;
      kind = k || null;
      saverEl.hidden = !kind;
      saverEl.className = kind === 'floors' ? 'orbit' : kind || '';   // the floors one after another: like the turning house
      catchEl.hidden = !(kind === 'orbit' || kind === 'floors');
      run();
    },
    /** dim the screen (on) or not; `saverKind`: the screen saver running now (a big clock or black: no second clock on the dim layer) */
    dim(on, saverKind = kind) {
      const st = ctx.settings();
      if (on) {
        dimEl.style.background = `rgba(0, 0, 0, ${dimAlpha(st.dimLevel)})`;
        dimClock.hidden = !st.dimClock || saverKind === 'clock' || saverKind === 'black';
      }
      if (dimEl.hidden === !on) { if (on) draw(); return; }
      dimEl.hidden = !on;
      run();
    },
    dimmed: () => !dimEl.hidden,
    /** keep the screen on while `on` (and the page is seen): the browser lets go of it when the page is hidden, the next call asks again */
    keepAwake(on) {
      const wl = navigator.wakeLock;
      if (!wl) return;
      if (on && !lock && !asking && document.visibilityState === 'visible') {
        asking = true;
        wl.request('screen').then((l) => { lock = l; l.addEventListener('release', () => { if (lock === l) lock = null; }); })
          .catch(() => { /* not allowed here (http, battery saver) */ }).finally(() => { asking = false; });
      } else if (!on && lock) {
        const l = lock; lock = null;
        l.release().catch(() => {});
      }
    },
    awake: () => !!lock,
  };
}
