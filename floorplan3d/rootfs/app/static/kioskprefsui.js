/* ⚙ → 👥 Benutzer & Tablets → ⚙ of a user: two folds for that tablet alone (5.13.0, the rules in kioskprefs.js and userrights.js):
 * "📱 Wandtablet: mehr eigene Werte" (each value "Wie allgemein" or its own, the entities of its Fully Kiosk app) and "🎚 Schalten je
 * Geräteart" (✋ / 💡 / 🎚 per kind). The screen saver, the dimming and "keep the screen on" stay among the presets above (5.12.0).
 * What a row reads is pure (readKioskFields, readRightFields: tests/kioskprefs.test.mjs). */
import { cleanKiosk, KIOSK_FIELDS } from './kioskprefs.js';
import { RIGHT_KINDS, cleanRights } from './userrights.js';

const NUMS = new Set(['saverAfter', 'dimAfter', 'dimLevel', 'cleanSecs', 'brightDay', 'brightNight']);
const BOOLS = new Set(['saverClock', 'dimClock', 'cleanBtn', 'screenOff']);
/** the fields of a tablet's own values [{ key, value }] ('' = as everybody; "off" of the nightly reload = none) -> its values (cleanKiosk) */
export function readKioskFields(fields) {
  const out = {};
  fields.forEach(({ key, value }) => {
    const v = String(value ?? '').trim();
    if (!v || !(key in KIOSK_FIELDS)) return;
    out[key] = NUMS.has(key) ? parseFloat(v) : BOOLS.has(key) ? v === 'true' : key === 'reloadAt' && v === 'off' ? '' : v;
  });
  return cleanKiosk(out);
}
/** the drop-downs of the kinds [{ key, value }] ('' = everything) -> the rights (cleanRights) */
export const readRightFields = (fields) => cleanRights(Object.fromEntries(fields.filter((f) => f.value).map((f) => [f.key, f.value])));

/** the choices of a tablet's own values: [value, text]; '' (as everybody) comes first */
function choices(key, t) {
  const min = (n) => [String(n), `${n} min`], pct = (n) => [String(n), `${n} %`];
  const yesNo = [['true', t('ks.on')], ['false', t('ks.off')]];
  return {
    saverAfter: [1, 2, 5, 10, 15, 30, 60].map(min),
    saverSpeed: ['slow', 'normal', 'fast'].map((v) => [v, t(`set.saverSpeed.${v}`)]),
    saverClock: yesNo,
    dimAfter: [1, 2, 5, 10, 30].map(min),
    dimLevel: [0.3, 0.5, 0.7, 0.85, 0.95].map((v) => [String(v), `${Math.round(v * 100)} %`]),
    dimClock: yesNo,
    reloadAt: [['off', t('ks.off')], ...['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00'].map((h) => [h, h])],
    cleanBtn: yesNo,
    cleanSecs: [15, 30, 60, 120].map((n) => [String(n), `${n} s`]),
    brightDay: [30, 50, 70, 80, 90, 100].map(pct),
    brightNight: [0, 5, 10, 20, 30, 50].map(pct),
    screenOff: yesNo,
  }[key];
}
/** the fields of the fold "📱 Wandtablet" of a user: [key, kind] (a drop-down, or a text field with its list) */
const KIOSK_ROWS = [['saverAfter', 'select'], ['saverSpeed', 'select'], ['saverClock', 'select'], ['dimAfter', 'select'], ['dimLevel', 'select'],
  ['dimClock', 'select'], ['wakeEntity', 'wakeList'], ['reloadAt', 'select'], ['cleanBtn', 'select'], ['cleanSecs', 'select']];
const FULLY_ROWS = [['fullyBright', 'fullyBrightList'], ['fullyScreen', 'fullyScreenList'], ['brightDay', 'select'], ['brightNight', 'select'], ['screenOff', 'select']];

/** ctx: $, t, entities() ([{ entity_id, name }]) */
export function initKioskForm(ctx) {
  const { $, t } = ctx;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  /** the lists of the Fully Kiosk fields: its brightness and its screen switch (the motion sensors are ⚙ → Wandtablet's #wakeList) */
  function fillLists() {
    const ents = ctx.entities();
    const opt = (e) => { const o = document.createElement('option'); o.value = e.entity_id; o.label = e.name || e.entity_id; return o; };
    $('#fullyBrightList')?.replaceChildren(...ents.filter((e) => /^number\..*bright/.test(e.entity_id)).map(opt));
    $('#fullyScreenList')?.replaceChildren(...ents.filter((e) => /^(switch|light)\..*screen/.test(e.entity_id)).map(opt));
  }
  /** one field of a user's fold: a drop-down with "Wie allgemein" first, or a text field (empty = as everybody) */
  function field(key, kind, value) {
    const lab = el('label', null, t(`ks.f.${key}`));
    let f;
    if (kind === 'select') {
      f = document.createElement('select');
      f.add(new Option(t('ks.asAll'), ''));
      choices(key, t).forEach(([v, txt]) => f.add(new Option(txt, v)));
      const cur = value === undefined ? '' : key === 'reloadAt' && value === '' ? 'off' : String(value);
      if (cur && ![...f.options].some((o) => o.value === cur)) f.add(new Option(cur, cur));
      f.value = cur;
    } else {
      f = document.createElement('input');
      f.type = 'text'; f.setAttribute('list', kind); f.autocomplete = 'off'; f.placeholder = t('ks.asAllPh');
      f.value = value ?? '';
    }
    f.dataset.ks = key;
    lab.append(f);
    return lab;
  }
  /** the fold "📱 Wandtablet: mehr eigene Werte" of a user row: own values of this tablet, its Fully Kiosk */
  function kioskBox(entry = {}) {
    fillLists();
    const box = el('details', 'ksBox'), body = el('div', 'ksGrid');      // the grid inside: a <details> itself lays out only its summary and one box
    box.append(el('summary', null, t('ks.userHead')), body);
    body.append(el('p', 'sub', t('ks.userHelp')));
    KIOSK_ROWS.forEach(([k, kind]) => body.append(field(k, kind, entry[k])));
    body.append(el('div', 'lockHead', t('ks.fullyHead')), el('p', 'sub', t('ks.fullyHelp')));
    FULLY_ROWS.forEach(([k, kind]) => body.append(field(k, kind, entry[k])));
    if (Object.keys(entry).length) box.open = true;
    return box;
  }
  /** the fold "🎚 Schalten je Geräteart" of a user row */
  function rightsBox(rights = {}) {
    const box = el('details', 'rtBox'), body = el('div', 'ksGrid');
    box.append(el('summary', null, t('ur.head')), body);
    body.append(el('p', 'sub', t('ur.help')));
    RIGHT_KINDS.forEach(([k, icon, n]) => {
      const lab = el('label', null, `${icon} ${t(`ur.kind.${k}`)}`);
      const sel = document.createElement('select'); sel.dataset.right = k;
      sel.add(new Option(t('ur.all'), ''));
      if (n === 3) sel.add(new Option(t('ur.onoff'), 'onoff'));
      sel.add(new Option(t('ur.view'), 'view'));
      sel.value = rights[k] || '';
      lab.append(sel); body.append(lab);
    });
    if (Object.keys(rights).length) box.open = true;
    return box;
  }
  const readKiosk = (row) => readKioskFields([...row.querySelectorAll('[data-ks]')].map((x) => ({ key: x.dataset.ks, value: x.value })));
  const readRights = (row) => readRightFields([...row.querySelectorAll('[data-right]')].map((x) => ({ key: x.dataset.right, value: x.value })));
  return { kioskBox, rightsBox, readKiosk, readRights };
}
