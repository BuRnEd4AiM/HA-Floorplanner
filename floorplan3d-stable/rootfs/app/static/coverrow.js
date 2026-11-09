/* The quick positions of a roller shutter (the owner, 2026-11-01: "bei der Rollladensteuerungskarte in diesem Dashboard hätte ich gern
 * auch so eine Voreinstellung mit 50 %, 75 %, 100 % und 0 % zusätzlich zu dem Hoch- und Runterfahren"): a row of buttons under ▲ ■ ▼ on
 * the own card 🪟 Rollladen (cardsui.js) and in the window of a button card (ctlwindow.js). Which positions a card offers: cards.js
 * cleanPresets (tested); 100 % = all the way open, as in Home Assistant. Only for a cover that says its position. */
import { COVER_PRESETS } from './cards.js';

/** the row for cover e (state s) or null; presets: the card's positions (undefined: COVER_PRESETS); callService(entity, service, data) */
export function presetRow(e, s, presets, { t, callService }) {
  const list = Array.isArray(presets) ? presets : COVER_PRESETS;
  if (s?.position == null || !list.length) return null;
  const row = document.createElement('div');
  row.className = 'ocBtns ocPresets';
  const at = Math.round(s.position);
  list.forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `${p} %`;
    b.title = t('shutter.partly', { n: p });
    b.dataset.pos = String(p);
    if (p === at) b.classList.add('on');
    b.addEventListener('click', (ev) => {
      ev.stopPropagation();
      row.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));   // shown at once, the cover answers later
      callService(e, 'set_cover_position', { position: p });
    });
    row.append(b);
  });
  return row;
}
