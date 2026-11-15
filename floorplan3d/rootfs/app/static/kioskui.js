/* The screens of a wall tablet (5.12.0, the rules in kioskprefs.js, kiosk.js decides when): the screen saver (the house turning at its
 * speed, the floors one after another, a big clock with the weather, black), the dimmed night with its strength and a clock, the 🧽
 * cleaning button (the screen ignores every touch for half a minute, so it can be wiped), and the real brightness of a tablet with Fully
 * Kiosk (the add-on sets its entities: api/tablet/screen). */
import { SPEEDS, FLOOR_SECONDS, saverFloors, nextSaverFloor, screenWant } from './kioskprefs.js';
import { wxIcon, weatherEntity } from './today.js';
import { currentLanguage } from './i18n.js';

/** the time, the date and the weather now as the clock shows them; wx: the weather entity's state ({ state, wx: { t, tu } }) or null */
export function clockText(now, lang, wx) {
  const time = now.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' });
  const temp = wx?.wx?.t;
  const weather = wx && wx.state && wx.state !== 'unavailable' ? `${wxIcon(wx.state)}${Number.isFinite(temp) ? ` ${Math.round(temp)}${wx.wx.tu || '°'}` : ''}` : '';
  return { time, date, weather };
}
/** a few pixels away every minute, so a screen that is on all night keeps no picture of the clock (burn-in) */
export const clockShift = (minute) => [((minute % 7) - 3) * 8, ((minute % 5) - 2) * 8];

/** ctx: $, t, controls, layout(), floorIdx(), switchFloor(i), settings(), states(), isPhone(), closePopups() */
export function initKioskScreens(ctx) {
  const { $, t } = ctx;
  const screen = $('#saverScreen'), dim = $('#nightDim'), btn = $('#cleanBtn'), clean = $('#cleanScreen');
  let mode = null, floorTimer = 0, sent = null, cleanTimer = 0;

  function drawClock(box) {
    const now = new Date(), st = ctx.states(), id = weatherEntity(ctx.settings(), st);
    const c = clockText(now, currentLanguage(), id ? st[id] : null), [x, y] = clockShift(now.getMinutes());
    let el = box.querySelector('.ksClock');
    if (!el) {
      el = document.createElement('div'); el.className = 'ksClock';
      ['ksTime', 'ksDate', 'ksWx'].forEach((k) => { const d = document.createElement('div'); d.className = k; el.append(d); });
      box.append(el);
    }
    el.style.transform = `translate(${x}px, ${y}px)`;
    el.querySelector('.ksTime').textContent = c.time;
    el.querySelector('.ksDate').textContent = c.date;
    el.querySelector('.ksWx').textContent = c.weather;
  }
  const turning = (m) => m === 'orbit' || m === 'floors';
  function stop() {
    if (turning(mode)) ctx.controls.autoRotate = false;
    clearInterval(floorTimer); floorTimer = 0;
    screen.hidden = true; screen.replaceChildren(); screen.classList.remove('black');
    mode = null;
  }
  /** the screen saver shown now (null: none) */
  function saver(next, p) {
    if (next !== mode) {
      stop();
      mode = next;
      if (turning(mode)) ctx.controls.autoRotate = true;
      if (mode === 'floors') {
        floorTimer = setInterval(() => {
          const n = nextSaverFloor(saverFloors(ctx.layout().floors), ctx.floorIdx());
          if (n != null && n !== ctx.floorIdx()) ctx.switchFloor(n);
        }, FLOOR_SECONDS * 1000);
      }
      if (mode === 'clock' || mode === 'black') { screen.hidden = false; screen.classList.toggle('black', mode === 'black'); }
    }
    if (turning(mode)) ctx.controls.autoRotateSpeed = SPEEDS[p.saverSpeed] ?? SPEEDS.mid;
    if (mode === 'clock') drawClock(screen);
  }
  /** the dimmed night: how dark, and the clock in it (not when the clock screen saver is under it anyway) */
  function night(shown, p) {
    dim.hidden = !shown;
    if (!shown) return;
    dim.style.background = `rgba(0, 0, 0, ${(p.nightLevel / 100).toFixed(2)})`;
    if (p.nightClock && mode !== 'clock' && mode !== 'black') drawClock(dim);
    else dim.replaceChildren();
  }
  /** Fully Kiosk: bright by day, dim at night, off while the screen saver runs (when wanted); sent when it changes */
  function fully(want) {
    if (!want || want === sent) return;
    sent = want;
    fetch('api/tablet/screen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: want }) })
      .catch(() => { sent = null; });                              // not reached: again with the next tick
  }
  /** a tablet's screen (a finger, not a mouse; not a phone): the cleaning button is for it */
  const tabletScreen = () => !ctx.isPhone() && matchMedia('(pointer: coarse)').matches;
  function update({ live, saver: s, dim: d, p }) {
    saver(s, p);
    night(d, p);
    fully(screenWant(p, { saverShown: !!s, dimShown: d }));
    btn.hidden = !(live && p.cleanBtn && tabletScreen());
    btn.dataset.secs = String(p.cleanSecs);
  }

  /* ---- 🧽 cleaning: the screen ignores every touch for a while ---- */
  function drawClean(left, all) {
    clean.replaceChildren();
    const box = document.createElement('div'); box.className = 'ksClean';
    const big = document.createElement('div'); big.className = 'ksCleanIcon'; big.textContent = '🧽';
    const txt = document.createElement('div'); txt.className = 'ksCleanText'; txt.textContent = t('ks.cleaning', { n: left });
    const bar = document.createElement('div'); bar.className = 'ksCleanBar';
    const fill = document.createElement('i'); fill.style.width = `${Math.round((left / all) * 100)}%`; bar.append(fill);
    box.append(big, txt, bar); clean.append(box);
  }
  function startClean(secs) {
    ctx.closePopups?.();
    clearInterval(cleanTimer);
    let left = secs;
    clean.hidden = false; drawClean(left, secs);
    cleanTimer = setInterval(() => {
      left -= 1;
      if (left > 0) { drawClean(left, secs); return; }
      clearInterval(cleanTimer); clean.hidden = true; clean.replaceChildren();
    }, 1000);
  }
  ['pointerdown', 'pointerup', 'click', 'dblclick', 'contextmenu', 'touchstart', 'touchend', 'wheel'].forEach((ev) =>
    clean.addEventListener(ev, (e) => { if (e.cancelable) e.preventDefault(); e.stopPropagation(); }, { passive: false }));
  btn.addEventListener('click', () => startClean(parseFloat(btn.dataset.secs) || 30));
  // the clock or black screen saver: the first touch only wakes the screen (kiosk.js hears it and ends the screen saver)
  screen.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); });

  return { update, wake: stop, startClean, cleaning: () => !clean.hidden, mode: () => mode };
}
