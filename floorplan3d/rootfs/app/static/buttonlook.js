/* How a button card looks and what it does (#495, the owner: "mehr Möglichkeiten, Buttons anzupassen"; picture
 * docs/ideen-4.9/7-knoepfe.jpg): its symbol, its colour when on (or the colour of the lamp), its shape (tile, round, pill, only the
 * symbol) and size, what it shows (name, state, brightness as a bar, since when) and what a tap and a long press do (switch, the window
 * with the controls, open a page, open a light card as a window (#597), Home Assistant's own window). Pure (unit test: tests/buttonlook.test.mjs; boards.py checks the card the
 * same way); buttoncardui.js draws it. */
import { TAB_KEYS, CUSTOM_ID } from './tabs.js';

export const BTN_ICONS = ['💡', '🛋', '🛏', '📺', '🎵', '🔥', '❄️', '🪟', '🚪', '🔒', '🌙', '☀️', '🍳', '🧺', '🚗', '🌱', '🎮', '🎬', '⚡', '🏠'];
export const BTN_COLORS = ['amber', 'orange', 'red', 'purple', 'blue', 'green', 'grey', 'lamp'];
export const BTN_HEX = { amber: '#ffb547', orange: '#ff7a3d', red: '#e5484d', purple: '#c678dd', blue: '#3fa9f5', green: '#46a758', grey: '#8b98a5' };
export const BTN_SHAPES = ['tile', 'round', 'pill', 'icon'];
export const BTN_SIZES = ['s', 'm', 'l', 'xl'];
export const BTN_SHOW = ['name', 'state', 'bar', 'since'];
export const BTN_TAP = ['toggle', 'more', 'page', 'lights', 'none'];
export const BTN_HOLD = ['none', 'more', 'details'];
/** a press at least this long is a long press */
export const HOLD_MS = 500;
const ON = new Set(['on', 'open', 'opening', 'playing', 'heat', 'cool', 'heat_cool', 'auto', 'dry', 'fan_only', 'unlocked', 'home', 'cleaning']);

/**
 * The look of a button card made safe: { icon ('' = chosen by its name and entity), onColor, shape, bsize, show: [what it shows], tap,
 * hold, page (the page a tap opens), card (only with the tap 'lights': the light card it opens, #597) }. Missing or wrong values take the
 * usual ones: amber, tile, m, name and state, switch on tap, the window with the controls on a long press.
 */
export function cleanLook(c) {
  const v = c && typeof c === 'object' ? c : {};
  const show = Array.isArray(v.show) ? BTN_SHOW.filter((k) => v.show.includes(k)) : ['name', 'state'];
  const page = typeof v.page === 'string' && (TAB_KEYS.includes(v.page) || CUSTOM_ID.test(v.page)) ? v.page : '';
  const card = typeof v.card === 'string' && /^c_[a-z0-9]{3,16}$/.test(v.card) ? v.card : '';
  let tap = BTN_TAP.includes(v.tap) ? v.tap : 'toggle';
  if ((tap === 'page' && !page) || (tap === 'lights' && !card)) tap = 'toggle';
  return {
    icon: BTN_ICONS.includes(v.icon) ? v.icon : '', onColor: BTN_COLORS.includes(v.onColor) ? v.onColor : 'amber',
    shape: BTN_SHAPES.includes(v.shape) ? v.shape : 'tile', bsize: BTN_SIZES.includes(v.bsize) ? v.bsize : 'm',
    show: v.shape === 'icon' ? [] : show, tap, hold: BTN_HOLD.includes(v.hold) ? v.hold : 'more', page: tap === 'page' ? page : '',
    ...(tap === 'lights' ? { card } : {}),
  };
}

/** is a state "on" for a button (a lamp on, a cover open, a player playing, a thermostat heating …) */
export const isOnState = (s) => ON.has(String(s?.state ?? ''));

/**
 * What a button shows now: { on, color (a CSS colour when on, else null), bar (the brightness 0..100 when it shows the bar and the lamp
 * is on, else null), since (a Date, when it shows since when and the state knows it) }. state: the app's state of its entity (rgb, lc in
 * seconds).
 */
export function buttonFace(look, state) {
  const on = isOnState(state);
  let color = null;
  if (on) {
    const rgb = look.onColor === 'lamp' && Array.isArray(state?.rgb) && state.rgb.length === 3 ? state.rgb : null;
    color = rgb ? `rgb(${rgb.map((x) => Math.round(Math.min(255, Math.max(0, x)))).join(', ')})` : BTN_HEX[look.onColor] || BTN_HEX.amber;
  }
  const bar = look.show.includes('bar') && on && Number.isFinite(state?.brightness) ? Math.max(0, Math.min(100, Math.round(state.brightness))) : null;
  const since = look.show.includes('since') && Number.isFinite(state?.lc) ? new Date(state.lc * 1000) : null;
  return { on, color, bar, since };
}

/** "vor 5 Min." and the like: { key, n } for the texts (now, min, h, d) */
export function agoOf(since, now = new Date()) {
  const s = Math.max(0, Math.round((now - since) / 1000));
  if (s < 60) return { key: 'now', n: 0 };
  if (s < 3600) return { key: 'min', n: Math.floor(s / 60) };
  if (s < 86400) return { key: 'h', n: Math.floor(s / 3600) };
  return { key: 'd', n: Math.floor(s / 86400) };
}
