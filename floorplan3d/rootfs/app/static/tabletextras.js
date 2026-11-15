/* Two more things for a wall tablet (5.13.0, the owner's choice: "Putz-Modus" and "Echte Helligkeit (Fully)"): the 🧽 button in the top
 * bar of "Live" on touch screens (the screen ignores every touch for half a minute, so it can be wiped without switching anything) and the
 * real brightness of a tablet with Fully Kiosk: bright by day, dim while the screen is dimmed, off while the screen saver runs (when
 * wanted); the add-on sets the tablet's own entities (api/tablet/screen). kiosk.js tells it what the screen does (onScreen). */
import { screenWant } from './kioskprefs.js';

/** ctx: $, t, settings() (this tablet's: kioskprefs.js kioskFor), isPhone(), closePopups() */
export function initTabletExtras(ctx) {
  const { $, t } = ctx;
  const btn = $('#cleanBtn'), clean = $('#cleanScreen');
  let sent = null, cleanTimer = 0;

  /** Fully Kiosk: what the screen should do now, sent when it changes (again with the next tick when the add-on was not reached) */
  function fully(want) {
    if (!want || want === sent) return;
    sent = want;
    fetch('api/tablet/screen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: want }) })
      .catch(() => { sent = null; });
  }
  /** a tablet's screen (a finger, not a mouse; not a phone): the cleaning button is for it */
  const tabletScreen = () => !ctx.isPhone() && matchMedia('(pointer: coarse)').matches;
  /** what the screen does now: { live, saver (the screen saver running, or null), dim } */
  function onScreen({ live, saver, dim }) {
    const p = ctx.settings();
    fully(screenWant(p, { saver, dim }));
    btn.hidden = !(live && p.cleanBtn !== false && tabletScreen());
  }

  function drawClean(left, all) {
    clean.replaceChildren();
    const box = document.createElement('div'); box.className = 'ksClean';
    const big = document.createElement('div'); big.className = 'ksCleanIcon'; big.textContent = '🧽';
    const txt = document.createElement('div'); txt.className = 'ksCleanText'; txt.textContent = t('ks.cleaning', { n: left });
    const bar = document.createElement('div'); bar.className = 'ksCleanBar';
    const fill = document.createElement('i'); fill.style.width = `${Math.round((left / all) * 100)}%`; bar.append(fill);
    box.append(big, txt, bar); clean.append(box);
  }
  /** 🧽: every touch is swallowed for `secs` seconds */
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
  btn.addEventListener('click', () => startClean(Math.min(300, Math.max(10, ctx.settings().cleanSecs || 30))));

  return { onScreen, startClean, cleaning: () => !clean.hidden };
}
