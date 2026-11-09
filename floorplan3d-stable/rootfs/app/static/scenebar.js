/* The scene bar (#597, the owner: "über dieser Leiste … Szenen reinmachen … pro Dashboard verknüpfen"): a row of scene and script tiles
 * right above the tab bar, one tap starts one. One list for every page, a page (or one version of a page, #507) may have its own list or
 * none. Stored in settings.sceneBar = { on, items: [item], pages: { <page> or <page>@<version>: { mode: 'own' | 'off', items } } }, an item
 * is { e (scene.* / script.*), name ('' = its name in Home Assistant), icon ('' = chosen by its name), color ('' or a button colour) }.
 * Pure (unit test: tests/scenebar.test.mjs; boards.py clean_scene_bar checks the same); scenebarui.js draws the bar and its window. */
import { isTabKey, HOME, VARIANT_ID } from './tabs.js';

export const BAR_DOMAINS = ['scene', 'script'];
/** the accent colours of a tile: the colours of a button card (buttonlook.js) without the lamp's */
export const BAR_COLORS = ['amber', 'orange', 'red', 'purple', 'blue', 'green', 'grey'];
export const MAX_ITEMS = 24;
export const MAX_PAGES = 40;
export const MODES = ['own', 'off'];
const ENTITY = /^[a-z_]+\.[a-z0-9_]+$/;
const text = (v, max) => (typeof v === 'string' ? [...v.replace(/[\u0000-\u001f\u007f]/g, '').trim()].slice(0, max).join('') : '');

/** may this entity stand in the bar: a scene or a script */
export const fitsBar = (e) => typeof e === 'string' && e.length <= 255 && ENTITY.test(e) && BAR_DOMAINS.includes(e.split('.')[0]);

/** one tile made safe, null when it cannot be one */
export function cleanItem(v) {
  if (!v || typeof v !== 'object' || !fitsBar(v.e)) return null;
  const icon = text(v.icon, 8);
  return { e: v.e, name: text(v.name, 30), icon, color: BAR_COLORS.includes(v.color) ? v.color : '' };
}
/** a list of tiles: each entity once, at most MAX_ITEMS */
export function cleanItems(list) {
  const seen = new Set(), out = [];
  (Array.isArray(list) ? list : []).forEach((v) => { const x = cleanItem(v); if (x && !seen.has(x.e) && out.length < MAX_ITEMS) { seen.add(x.e); out.push(x); } });
  return out;
}
/** the key of a page or of one version of it: 'today', 'today@v_kids01' (the house has no versions) */
export const barKey = (page, version = '') => (version && page !== HOME ? `${page}@${version}` : page);
/** a key split up: { page, version } or null when it is none */
export function splitKey(k) {
  if (typeof k !== 'string') return null;
  const [page, version = '', more] = k.split('@');
  if (more !== undefined || !isTabKey(page) || (version && (page === HOME || !VARIANT_ID.test(version)))) return null;
  return { page, version };
}

/**
 * The bar made safe (the same rules as clean_scene_bar in boards.py). known: { pages: [tab keys there are], versions: { page: [ids] } }
 * leaves out the keys of own pages and versions that are gone (without it every well-formed key stays).
 */
export function cleanSceneBar(v, known = null) {
  const o = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  const pages = {};
  Object.entries(o.pages && typeof o.pages === 'object' && !Array.isArray(o.pages) ? o.pages : {}).slice(0, MAX_PAGES).forEach(([k, p]) => {
    const at = splitKey(k);
    if (!at || !p || typeof p !== 'object' || !MODES.includes(p.mode)) return;
    if (known && (!known.pages.includes(at.page) || (at.version && !(known.versions?.[at.page] || []).includes(at.version)))) return;
    pages[k] = { mode: p.mode, items: cleanItems(p.items) };
  });
  return { on: o.on !== false, items: cleanItems(o.items), pages };
}

/** what a page shows: 'all' (the list for every page), 'own' or 'off' – for a version first its own setting, then the page's */
export function modeOf(bar, key) {
  const p = cleanSceneBar(bar).pages[key];
  return p ? p.mode : 'all';
}
/** the tiles a screen shows on a page in a version ('' = "Für alle"): [] when the bar is off there */
export function itemsFor(bar, page, version = '') {
  const b = cleanSceneBar(bar);
  if (!b.on) return [];
  for (const k of [...new Set([barKey(page, version), page])]) {
    const p = b.pages[k];
    if (p) return p.mode === 'off' ? [] : p.items;
  }
  return b.items;
}
/** the list the window edits for a key: '' = the list for every page */
export const listOf = (bar, key) => { const b = cleanSceneBar(bar); return key ? b.pages[key]?.items || [] : b.items; };
/** the bar with a page's (or version's) mode set: 'all' takes its own setting away; 'own' starts with a copy of what it showed before */
export function withMode(bar, key, mode, version = '') {
  const b = cleanSceneBar(bar), pages = { ...b.pages };
  if (mode === 'all' || !MODES.includes(mode)) delete pages[key];
  else {
    const at = splitKey(key);
    const before = pages[key]?.items?.length ? pages[key].items : at ? itemsFor({ ...b, on: true }, at.page, at.version || version) : b.items;
    pages[key] = { mode, items: before };
  }
  return { ...b, pages };
}
/** the bar with the list of a key ('' = for every page) replaced */
export function withItems(bar, key, items) {
  const b = cleanSceneBar(bar);
  if (!key) return { ...b, items: cleanItems(items) };
  return { ...b, pages: { ...b.pages, [key]: { mode: b.pages[key]?.mode || 'own', items: cleanItems(items) } } };
}

/** when an entity of the bar last ran, in ms: a scene's state is the time it was last turned on, a script has its last run (at, seconds) */
export function firedAt(e, st) {
  if (!st) return null;
  if (e.startsWith('script.')) return Number.isFinite(st.at) ? st.at * 1000 : null;
  const ms = typeof st.state === 'string' && /^\d{4}-\d\d-\d\dT/.test(st.state) ? Date.parse(st.state) : NaN;
  return Number.isFinite(ms) ? ms : null;
}
/** the entity of these tiles that ran last (it is marked), null when none says */
export function lastFired(items, states) {
  let best = null, at = -Infinity;
  (items || []).forEach((i) => { const t = firedAt(i.e, states?.[i.e]); if (t !== null && t > at) { at = t; best = i.e; } });
  return best;
}
/** a tile's name, icon and colour as shown: names = { entity: name in Home Assistant }, auto(name, entity) picks an icon */
export function tileOf(item, names = {}, auto = () => '▶️') {
  const name = item.name || names[item.e] || item.e.split('.')[1].replace(/_/g, ' ');
  return { e: item.e, name, icon: item.icon || auto(name, item.e), color: item.color };
}
