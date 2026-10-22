/* Own cards on the pages of the tab bar (#484, like the cards of a Home Assistant dashboard): thirteen kinds, each with what it needs
 * (an entity of a fitting kind, several entities, a room, a text, calendars (calcard.js, #495) or a ready card of another page), its
 * name, width and colour. Pure
 * (unit test: tests/cards.test.mjs; server.py clean_card checks the same); cardsui.js draws a card, cardeditor.js makes and changes one. */
import { FAV_SERVICE } from './favorites.js';
import { SIZES } from './thermostat.js';
import { CAL_DAYS, CAL_VIEWS, cleanCals } from './calcard.js';

export const CARD_TYPES = ['button', 'switch', 'value', 'graph', 'light', 'thermostat', 'cover', 'camera', 'calendar', 'entities', 'room', 'text', 'builtin'];
export const TYPE_ICON = { button: '🔘', switch: '⏻', value: '🔢', graph: '📈', light: '💡', thermostat: '🌡️', cover: '🪟', camera: '📷', calendar: '📅', entities: '🧩', room: '🏠', text: '📝', builtin: '☀️' };
/** the entities a kind of card takes, by domain (null: any entity); kinds without an entity are not listed */
export const TYPE_DOMAINS = {
  button: ['scene', 'script', 'button', 'input_button', 'light', 'switch', 'input_boolean', 'fan', 'cover', 'media_player'],
  switch: ['light', 'switch', 'input_boolean', 'fan'],
  value: null,
  graph: ['sensor', 'input_number', 'number'],
  light: ['light'],
  thermostat: ['climate', 'water_heater'],
  cover: ['cover'],
  camera: ['camera'],
};
/** the ready cards of other pages a card can show (page:card) */
export const BUILTINS = ['today:clock', 'today:weather', 'today:agenda', 'today:waste', 'today:people', 'today:house', 'today:power', 'today:pinboard'];
export const COLORS = ['blue', 'orange', 'green', 'red'];
export const COLOR_HEX = { blue: '#3fa9f5', orange: '#f5a623', green: '#46a758', red: '#e5484d' };
/** the time spans of a history card, in hours */
export const HOURS = [6, 24, 168, 720];
export const MAX_ENTITIES = 12;
/** a history card with several sensors in one chart (#495: the power of several houses): at most this many, each in its own colour */
export const MAX_SERIES = 6;
export const SERIES_COLORS = ['#3fa9f5', '#f5a623', '#c678dd', '#46a758', '#e5484d', '#8b98a5'];
export const OWN_ID = /^c_[a-z0-9]{3,16}$/;
const ENTITY = /^[a-z_]+\.[a-z0-9_]+$/;
const domainOf = (id) => String(id).split('.')[0];

/** does this entity fit this kind of card */
export function fitsType(type, entity) {
  if (typeof entity !== 'string' || entity.length > 255 || !ENTITY.test(entity) || !(type in TYPE_DOMAINS)) return false;
  const doms = TYPE_DOMAINS[type];
  return !doms || doms.includes(domainOf(entity));
}
const text = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim().slice(0, max) : '');
const int = (v, lo, hi, dflt) => (Number.isInteger(v) && v >= lo && v <= hi ? v : dflt);

/** how wide a new card of a kind is (columns of the page) */
export const defaultWidth = (type) => (type === 'calendar' ? 3 : type === 'graph' || type === 'text' ? 2 : 1);

/** a card made safe: { id, type, name, width, ...what its kind needs } or null when it cannot be one (the same rules as clean_card in
 *  server.py) */
export function cleanCard(c) {
  if (!c || typeof c !== 'object' || typeof c.id !== 'string' || !OWN_ID.test(c.id) || !CARD_TYPES.includes(c.type)) return null;
  const out = { id: c.id, type: c.type, name: text(c.name, 60), width: int(c.width, 1, 4, defaultWidth(c.type)) };
  if (c.type in TYPE_DOMAINS) {
    if (!fitsType(c.type, c.entity)) return null;
    out.entity = c.entity;
  }
  if (c.type === 'graph') {
    out.hours = HOURS.includes(c.hours) ? c.hours : 24;
    const more = [...new Set((Array.isArray(c.more) ? c.more : []).filter((e) => e !== out.entity && fitsType('graph', e)))].slice(0, MAX_SERIES - 1);
    if (more.length) out.more = more;                 // more sensors in the same chart (#495)
  }
  if (c.type === 'graph' || c.type === 'value') out.color = COLORS.includes(c.color) ? c.color : 'blue';
  if (c.type === 'thermostat') out.size = SIZES.includes(c.size) ? c.size : 'big';      // the circle big or small (#495)
  if (c.type === 'calendar') {                       // several calendars, each in its colour (#495)
    out.cals = cleanCals(c.cals);
    if (!out.cals.length) return null;
    out.days = CAL_DAYS.includes(c.days) ? c.days : 7;
    out.view = CAL_VIEWS.includes(c.view) ? c.view : 'week';
    out.add = c.add !== false;                       // "＋ Termin" on the card
  }
  if (c.type === 'entities') {
    out.entities = [...new Set((Array.isArray(c.entities) ? c.entities : []).filter((e) => typeof e === 'string' && e.length <= 255 && ENTITY.test(e)))].slice(0, MAX_ENTITIES);
    if (!out.entities.length) return null;
  }
  if (c.type === 'room') {
    out.room = text(c.room, 80);
    if (!out.room) return null;
  }
  if (c.type === 'text') {
    out.text = text(c.text, 500);
    if (!out.text && !out.name) return null;
  }
  if (c.type === 'builtin') {
    if (!BUILTINS.includes(c.builtin)) return null;
    out.builtin = c.builtin;
  }
  return out;
}

/** the entities a card shows (its states make it draw again) */
export const cardEntities = (c) => (c?.entities ? c.entities : c?.entity ? [c.entity, ...(c.more || [])] : []);
/** the colour of the n-th line of a history card: the card's own colour first, then the others in the order of SERIES_COLORS */
export function seriesColor(c, n) {
  const first = COLOR_HEX[c?.color] || COLOR_HEX.blue;
  return n === 0 ? first : SERIES_COLORS.filter((x) => x !== first)[(n - 1) % (SERIES_COLORS.length - 1)];
}

/** what a tap on a button card does: the service of its domain (favorites.js), null for one that cannot be tapped */
export const tapService = (entity) => FAV_SERVICE[domainOf(entity)] || null;

/** the kind of card that suits an entity best (a page made from the devices of an area), null for one that gets none */
export function suggestType(entity, state) {
  const d = domainOf(entity);
  if (d === 'light') return 'light';
  if (['switch', 'input_boolean', 'fan'].includes(d)) return 'switch';
  if (d === 'climate' || d === 'water_heater') return 'thermostat';
  if (d === 'cover') return 'cover';
  if (d === 'camera') return 'camera';
  if (['scene', 'script', 'button', 'input_button', 'media_player'].includes(d)) return 'button';
  if (d === 'sensor' || d === 'binary_sensor') return state === undefined || state === null ? null : 'value';
  return null;
}
/** cards for the devices of an area (a new page "Anfangen mit: Geräte des Bereichs"): at most 20, by kind (lights first) */
export function suggestCards(entities, states, makeId) {
  const order = ['light', 'switch', 'thermostat', 'cover', 'button', 'camera', 'value'];
  const taken = [];
  return (entities || []).map((e) => ({ e, type: suggestType(e, states?.[e]?.state) })).filter((x) => x.type)
    .sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type)).slice(0, 20)
    .map(({ e, type }) => { const id = makeId(taken); taken.push(id); return cleanCard({ id, type, entity: e, width: defaultWidth(type) }); }).filter(Boolean);
}

/** the value of a state to show: { v (the number with one decimal in the language, or the state), unit, num (the number or null) } */
export function valueOf(s, lang = 'de') {
  if (!s) return { v: '–', unit: '', num: null };
  const n = parseFloat(s.state);
  if (s.state !== '' && Number.isFinite(n) && /^-?[\d.]+(e-?\d+)?$/i.test(String(s.state).trim())) {
    const digits = Math.abs(n) >= 100 || Number.isInteger(n) ? 0 : 1;
    let v;
    try { v = n.toLocaleString(lang, { maximumFractionDigits: digits, minimumFractionDigits: digits }); } catch { v = n.toFixed(digits); }
    return { v, unit: s.unit || '', num: n };
  }
  return { v: s.state ?? '–', unit: '', num: null };
}

/**
 * A history as an SVG line: points [[ms, value]] (in their order, null values skipped) in a box w × h with `pad` for the labels on the
 * left and below -> { line (the path), area (closed down to the bottom), min, max, last, ticks: [values for the grid lines] }, or null
 * without two points.
 */
export function chartPaths(points, w = 340, h = 120, pad = { l: 28, r: 8, t: 8, b: 18 }) {
  const pts = (points || []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (pts.length < 2) return null;
  const t0 = pts[0][0], t1 = pts[pts.length - 1][0] || t0 + 1;
  let min = Math.min(...pts.map((p) => p[1])), max = Math.max(...pts.map((p) => p[1]));
  const lo = min === max ? min - 1 : min, hi = min === max ? max + 1 : max;
  const step = niceStep((hi - lo) / 3), ticks = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) ticks.push(Math.round(v * 1000) / 1000);
  const x = (t) => pad.l + ((t - t0) / (t1 - t0 || 1)) * (w - pad.l - pad.r), y = (v) => h - pad.b - ((v - lo) / (hi - lo)) * (h - pad.t - pad.b);
  const line = pts.map(([t, v], i) => `${i ? 'L' : 'M'}${x(t).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(t1).toFixed(1)},${h - pad.b} L${x(t0).toFixed(1)},${h - pad.b} Z`;
  return { line, area, min, max, last: pts[pts.length - 1][1], ticks, y };
}
/**
 * Several histories on one scale (#495): series [[points]] -> { lines: [path or null], min, max, ticks, y } over the time of all of them,
 * or null when none has two points.
 */
export function chartMany(series, w = 340, h = 120, pad = { l: 28, r: 8, t: 8, b: 18 }) {
  const all = (series || []).map((pts) => (pts || []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1])));
  const flat = all.filter((pts) => pts.length >= 2).flat();
  if (!flat.length) return null;
  const t0 = Math.min(...flat.map((p) => p[0])), t1 = Math.max(...flat.map((p) => p[0])) || t0 + 1;
  const min = Math.min(...flat.map((p) => p[1])), max = Math.max(...flat.map((p) => p[1]));
  const lo = min === max ? min - 1 : min, hi = min === max ? max + 1 : max;
  const step = niceStep((hi - lo) / 3), ticks = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) ticks.push(Math.round(v * 1000) / 1000);
  const x = (t) => pad.l + ((t - t0) / (t1 - t0 || 1)) * (w - pad.l - pad.r), y = (v) => h - pad.b - ((v - lo) / (hi - lo)) * (h - pad.t - pad.b);
  const lines = all.map((pts) => (pts.length >= 2 ? pts.map(([t, v], i) => `${i ? 'L' : 'M'}${x(t).toFixed(1)},${y(v).toFixed(1)}`).join(' ') : null));
  return { lines, min, max, ticks, y };
}
function niceStep(raw) {
  const p = 10 ** Math.floor(Math.log10(raw || 1)), f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}
