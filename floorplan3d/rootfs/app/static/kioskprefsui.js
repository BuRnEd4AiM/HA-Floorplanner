/* The form of the wall tablet settings (5.12.0, the rules in kioskprefs.js and userrights.js): in ⚙ → 📱 Wandtablet the values for every
 * screen (a part of settings.js: fill / read), and in ⚙ → 👥 Benutzer & Tablets → ⚙ of a user two folds for that tablet alone: "📱 Wandtablet"
 * (each value "Wie allgemein" or its own, the entities of its Fully Kiosk app) and "🎚 Schalten je Geräteart" (✋ / 💡 / 🎚 per kind).
 * What a row reads is pure (readKioskFields, readRightFields: tests/kioskprefs.test.mjs). */
import { saverMode, cleanKiosk, KIOSK_FIELDS } from './kioskprefs.js';
import { RIGHT_KINDS, cleanRights } from './userrights.js';

const NUMS = new Set(['idleReturn', 'saverAfter', 'nightLevel', 'nightAfter', 'cleanSecs', 'brightDay', 'brightNight']);
const BOOLS = new Set(['nightClock', 'cleanBtn', 'screenOff']);
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

/** the choices of a tablet's own values: [value, text key or text]; '' (as everybody) comes first */
function choices(key, t) {
  const min = (n) => [String(n), `${n} min`], pct = (n) => [String(n), `${n} %`];
  const yesNo = [['true', t('ks.on')], ['false', t('ks.off')]];
  return {
    idleReturn: [['0', t('ks.never')], ...[1, 2, 5, 10, 15, 30, 60].map(min)],
    saver: ['off', 'orbit', 'floors', 'clock', 'black'].map((v) => [v, t(`ks.saver.${v}`)]),
    saverSpeed: ['slow', 'mid', 'fast'].map((v) => [v, t(`ks.speed.${v}`)]),
    saverAfter: [['0', t('ks.withStart')], ...[1, 2, 5, 10, 15, 30, 60].map(min)],
    nightDim: ['off', 'sun', 'time'].map((v) => [v, t(`set.nightDim.${v}`)]),
    nightLevel: [30, 50, 70, 85, 95].map(pct),
    nightAfter: [1, 2, 5, 10, 30].map(min),
    nightClock: yesNo,
    reloadAt: [['off', t('ks.off')], ...['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00'].map((h) => [h, h])],
    cleanBtn: yesNo,
    cleanSecs: [15, 30, 60, 120].map((n) => [String(n), `${n} s`]),
    brightDay: [30, 50, 70, 80, 90, 100].map(pct),
    brightNight: [0, 5, 10, 20, 30, 50].map(pct),
    screenOff: yesNo,
  }[key];
}
/** the fields of the fold "📱 Wandtablet" of a user: [key, kind] (select, text with a list, time) */
const KIOSK_ROWS = [['idleReturn', 'select'], ['saver', 'select'], ['saverSpeed', 'select'], ['saverAfter', 'select'], ['wakeSensor', 'wakeList'],
  ['nightDim', 'select'], ['nightFrom', 'time'], ['nightTo', 'time'], ['nightLevel', 'select'], ['nightAfter', 'select'], ['nightClock', 'select'],
  ['reloadAt', 'select'], ['cleanBtn', 'select'], ['cleanSecs', 'select']];
const FULLY_ROWS = [['fullyBright', 'fullyBrightList'], ['fullyScreen', 'fullyScreenList'], ['brightDay', 'select'], ['brightNight', 'select'], ['screenOff', 'select']];

/** ctx: $, t, entities() ([{ entity_id, name }]), states() */
export function initKioskForm(ctx) {
  const { $, t } = ctx;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  /** the lists the entity fields offer: motion and presence sensors first; Fully Kiosk's brightness and screen */
  function fillLists() {
    const ents = ctx.entities(), st = ctx.states?.() || {};
    const opt = (e) => { const o = document.createElement('option'); o.value = e.entity_id; o.label = e.name || e.entity_id; return o; };
    const people = (e) => ['motion', 'occupancy', 'presence'].includes(st[e.entity_id]?.dc) ? 0 : 1;
    const wake = ents.filter((e) => /^(binary_sensor|input_boolean)\./.test(e.entity_id)).sort((a, b) => people(a) - people(b));
    $('#wakeList')?.replaceChildren(...wake.map(opt));
    $('#fullyBrightList')?.replaceChildren(...ents.filter((e) => /^number\..*bright/.test(e.entity_id)).map(opt));
    $('#fullyScreenList')?.replaceChildren(...ents.filter((e) => /^(switch|light)\..*screen/.test(e.entity_id)).map(opt));
  }
  const speedRow = () => { const r = $('[data-ks=speed]'); if (r) r.hidden = !['orbit', 'floors'].includes($('#setSaver').value); };
  $('#setSaver')?.addEventListener('change', speedRow);

  /** a part of the settings form (settings.js ctx.parts): the general values in ⚙ → 📱 Wandtablet */
  const part = {
    fill(s) {
      if (!$('#setSaver')) return;
      $('#setSaver').value = saverMode(s);
      $('#setSaverSpeed').value = s.saverSpeed || 'mid';
      $('#setSaverAfter').value = String(s.saverAfter || 0);
      $('#setWakeSensor').value = s.wakeSensor || '';
      $('#setNightLevel').value = String((s.nightLevel ?? 72) / 100);
      $('#setNightAfter').value = String(s.nightAfter ?? 1);
      $('#setNightClock').checked = !!s.nightClock;
      $('#setReloadAt').value = s.reloadAt || '';
      $('#setCleanBtn').checked = s.cleanBtn !== false;
      $('#setCleanSecs').value = String(s.cleanSecs ?? 30);
      fillLists(); speedRow();
    },
    read(next) {
      if (!$('#setSaver')) return;
      const num = (sel, lo, hi, d) => { const v = parseFloat($(sel).value); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
      next.saver = $('#setSaver').value;
      next.idleOrbit = next.saver === 'orbit';                       // what the settings said before 5.12.0
      next.saverSpeed = $('#setSaverSpeed').value;
      next.saverAfter = num('#setSaverAfter', 0, 240, 0);
      const wake = $('#setWakeSensor').value.trim();
      next.wakeSensor = KIOSK_FIELDS.wakeSensor(wake) ? wake : '';
      next.nightLevel = Math.round(num('#setNightLevel', 0.1, 0.95, 0.72) * 100);
      next.nightAfter = num('#setNightAfter', 1, 60, 1);
      next.nightClock = $('#setNightClock').checked;
      next.reloadAt = $('#setReloadAt').value || '';
      next.cleanBtn = $('#setCleanBtn').checked;
      next.cleanSecs = num('#setCleanSecs', 10, 300, 30);
    },
  };

  /** one field of a user's fold: a drop-down with "Wie allgemein" first, or a text / time field (empty = as everybody) */
  function field(key, kind, value) {
    const lab = el('label', null, t(`ks.f.${key}`));
    let f;
    if (kind === 'select') {
      f = document.createElement('select');
      f.add(new Option(t('ks.asAll'), ''));
      choices(key, t).forEach(([v, txt]) => f.add(new Option(txt, v)));
      const cur = value === undefined ? '' : key === 'reloadAt' && value === '' ? 'off' : String(value);
      if (cur && ![...f.options].some((o) => o.value === cur)) f.add(new Option(NUMS.has(key) ? `${cur}` : cur, cur));
      f.value = cur;
    } else {
      f = document.createElement('input');
      f.type = kind === 'time' ? 'time' : 'text';
      if (kind !== 'time') { f.setAttribute('list', kind); f.autocomplete = 'off'; f.placeholder = t('ks.asAllPh'); }
      f.value = value ?? '';
    }
    f.dataset.ks = key;
    lab.append(f);
    return lab;
  }
  /** the fold "📱 Wandtablet" of a user row: own values of this tablet, its Fully Kiosk */
  function kioskBox(entry = {}) {
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
  return { part, kioskBox, rightsBox, readKiosk, readRights, fillLists };
}
