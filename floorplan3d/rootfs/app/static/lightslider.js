/* The card "Lichtsteuerung" (#597, like the slider-button-card the owner showed): a wide bar per lamp, light group or switch, filled as far
 * as the lamp is bright in its colour, a switch on the right. Dragging sets the brightness (sent when the finger lets go), a tap switches,
 * a long press opens Home Assistant's own window; a lamp that cannot dim and a switch only switch. A light group of Home Assistant opens to
 * its lamps. Pure (unit test: tests/lightslider.test.mjs; boards.py clean_card checks the rows the same way); lightcardui.js draws it. */
import { kelvinRgb } from './kelvin.js';

export const ROW_DOMAINS = ['light', 'switch'];
export const MAX_ROWS = 16;
/** the colour of a lamp that does not say one: a warm yellow */
export const WARM = [255, 181, 71];
const ENTITY = /^[a-z_]+\.[a-z0-9_]+$/;
const text = (v, max) => (typeof v === 'string' ? [...v.replace(/[\u0000-\u001f\u007f]/g, '').trim()].slice(0, max).join('') : '');

/** may this entity be a row: a lamp, a light group or a switch */
export const fitsRow = (e) => typeof e === 'string' && e.length <= 255 && ENTITY.test(e) && ROW_DOMAINS.includes(e.split('.')[0]);
/** the rows of a card made safe: [{ e, name ('' = its name in Home Assistant), icon ('' = 💡 / ⏻) }], each entity once, at most MAX_ROWS */
export function cleanRows(list) {
  const seen = new Set(), out = [];
  (Array.isArray(list) ? list : []).forEach((v) => {
    if (!v || typeof v !== 'object' || !fitsRow(v.e) || seen.has(v.e) || out.length >= MAX_ROWS) return;
    seen.add(v.e);
    out.push({ e: v.e, name: text(v.name, 30), icon: text(v.icon, 8) });
  });
  return out;
}

/**
 * How a row looks now: { kind: 'missing' | 'na' (not available: grey, no taps) | 'off' | 'on', dim (a slider: a lamp that can dim, not a
 * switch), pct (how far it is filled, 0..100), rgb (the colour of the lamp: its colour, else its white tone, else WARM) }. st: the app's
 * state of the entity (brightness in %, rgb, kel, dim: false for a lamp that only switches).
 */
export function rowLook(e, st) {
  const dim = String(e).startsWith('light.') && st?.dim !== false;
  const rgb = Array.isArray(st?.rgb) && st.rgb.length === 3 && st.rgb.every(Number.isFinite) ? st.rgb.map((x) => Math.round(Math.max(0, Math.min(255, x))))
    : Number.isFinite(st?.kel) && st.kel > 0 ? kelvinRgb(st.kel) : WARM;
  if (!st) return { kind: 'missing', dim: false, pct: 0, rgb };
  if (st.state === 'unavailable' || st.state === 'unknown') return { kind: 'na', dim: false, pct: 0, rgb };
  if (st.state !== 'on') return { kind: 'off', dim, pct: 0, rgb };
  const b = Number.isFinite(st.brightness) ? st.brightness : 100;
  return { kind: 'on', dim, pct: dim ? Math.max(1, Math.min(100, Math.round(b))) : 100, rgb };
}
/** what the row says after its name: { key: 'na' | 'off' | 'on' | 'pct', pct } (pct while dragging too) */
export function statusOf(look, dragging = null) {
  if (dragging !== null) return dragging > 0 ? { key: 'pct', pct: dragging } : { key: 'off', pct: 0 };
  if (look.kind === 'missing' || look.kind === 'na') return { key: 'na', pct: 0 };
  if (look.kind === 'off') return { key: 'off', pct: 0 };
  return look.dim ? { key: 'pct', pct: look.pct } : { key: 'on', pct: 100 };
}
/** the brightness under the finger: x on a bar from `left`, `width` wide -> 0..100 (0 at the very left: off) */
export function pctAt(x, left, width) {
  if (!(width > 0)) return 0;
  return Math.round(Math.max(0, Math.min(1, (x - left) / width)) * 100);
}
/** the call when the finger lets go at pct: off at 0, else on at that brightness */
export const dragCall = (pct) => (pct <= 0 ? { service: 'turn_off', data: null } : { service: 'turn_on', data: { brightness_pct: Math.max(1, Math.min(100, Math.round(pct))) } });
/** a finger that moved this far sideways drags the bar (less: a tap, or the page scrolls) */
export const DRAG_PX = 8;

/** the lamps of a light group of Home Assistant (its entity_id attribute; a Zigbee2MQTT group does not say them): rows to open below it */
export const membersOf = (e, st) => (String(e).startsWith('light.') && Array.isArray(st?.members) ? [...new Set(st.members.filter((m) => m !== e && fitsRow(m)))].slice(0, MAX_ROWS) : []);
/** the rows "Alle aus" switches off: the rows that are on now */
export const onRows = (rows, states) => (rows || []).map((r) => r.e).filter((e) => states?.[e]?.state === 'on');

/** every light card of the settings, for a button that opens one and for "💡 n Lichter an": [{ id, name, popup, hook, page, version }] */
export function lightCards(settings) {
  const out = [], seen = new Set();
  const take = (page, version, layout) => (Array.isArray(layout?.cards) ? layout.cards : []).forEach((c) => {
    if (c?.type !== 'lights' || typeof c.id !== 'string' || seen.has(`${c.id}|${page}|${version}`)) return;
    seen.add(`${c.id}|${page}|${version}`);
    out.push({ id: c.id, name: typeof c.name === 'string' ? c.name : '', popup: c.popup === true, hook: c.hook === true, page, version, card: c });
  });
  Object.entries(settings?.pageLayouts || {}).forEach(([page, l]) => take(page, '', l));
  Object.entries(settings?.pageVariants || {}).forEach(([page, list]) => (Array.isArray(list) ? list : []).forEach((v) => take(page, v?.id || '', v?.layout)));
  return out;
}
/**
 * The light card a tap opens: the card with this id (else the first popup card that "💡 n Lichter an" opens), in the version this screen
 * sees first. seen(page): the version of a page this screen shows. -> the card or null
 */
export function pickLightCard(cards, { id = '', hook = false, seen = () => '' } = {}) {
  const fit = cards.filter((c) => (id ? c.id === id : hook && c.popup && c.hook));
  return (fit.find((c) => c.version === seen(c.page)) || fit[0])?.card || null;
}
