/* Room panel (live mode, roompanel.js): the controls of a roller shutter or curtain in the list at the right (the owner, 2026-11-12: "ich will
 * bei den Rollo-Sachen, wenn man es in der Leiste rechts hat, dass man auch das mit den voreingestellten Sachen wie 50 % machen kann und dass
 * es besser aussieht"). Like the card of a shutter (shuttercard.js): ▲ Hoch · ■ Stopp · ▼ Runter as one row of equal buttons (a cloth
 * curtain: the sides it opens to), the slider and the quick positions 0 · 25 · 50 · 75 · 100 %. Also the slider of a row of the room panel:
 * after a tap or a drag it gives the focus back, so the panel follows the states again (app.js does not draw it anew while one of its
 * fields has the focus: the text stayed "Offen" at 89 %). */
import { coverActions, curtainStyle, SHUTTER_PRESETS } from './shutters.js';
import { ACTION_LABEL } from './livecontrols.js';
import { coverIcon } from './shuttercard.js';
import { presetRow } from './coverrow.js';

/** a slider 0..100 for a row of the room panel; onChange(value) when it is let go */
export function rpSlider(val, onChange, title = '') {
  const r = document.createElement('input');
  r.type = 'range'; r.min = 0; r.max = 100; r.value = val ?? 0;
  if (title) { r.title = title; r.setAttribute('aria-label', title); }
  let byPointer = false;                                  // the keys keep the focus: the arrows go on moving it
  r.addEventListener('pointerdown', () => { byPointer = true; });
  r.addEventListener('keydown', () => { byPointer = false; });
  r.addEventListener('change', () => { onChange(+r.value); if (byPointer) r.blur(); });
  return r;
}

/** the controls under the row of cover e (state st): the three buttons, and when it says its position the slider and the quick
 *  positions; opening: its window (a cloth curtain gets its own buttons); plain: a door or gate, only Öffnen · Stopp · Schließen */
export function coverControls(e, st, { t, callService, opening = null, plain = false }) {
  const wrap = document.createElement('div');
  wrap.className = 'rpCover';
  const acts = document.createElement('div');
  acts.className = 'rpCoverActs';
  const list = plain ? ['open_cover', 'stop_cover', 'close_cover'].map((a) => [a, ACTION_LABEL[a], '']) : coverActions(curtainStyle(opening));
  list.forEach(([svc, key, icon]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.svc = svc;
    if (icon) b.append(coverIcon(icon));
    b.append(document.createTextNode(t(key)));
    b.addEventListener('click', () => callService(e, svc));
    acts.append(b);
  });
  wrap.append(acts);
  if (!plain && st?.position != null) {
    wrap.append(rpSlider(Math.round(st.position), (p) => callService(e, 'set_cover_position', { position: p }), t('shutter.pos')));
    const pre = presetRow(e, st, SHUTTER_PRESETS, { t, callService });   // 0 · 25 · 50 · 75 · 100 %, the one it is at lit
    if (pre) { pre.classList.add('rpCoverPresets'); wrap.append(pre); }
  }
  return wrap;
}
