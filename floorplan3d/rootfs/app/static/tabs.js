/* Tabs (#479): a bar at the bottom of the live view so the add-on can be the only dashboard of a house (the owner's wish, docs/PLAN-4.3.md).
 * 🏠 is the house (the 3D picture as always), the other tabs are pages over it; more come step by step (4.3: the cameras, 4.4: today and
 * the energy, 4.5: the climate, the routines and the family, 4.8: music & TV and the household). Which tabs a user
 * sees and which one a screen starts with is set per user in the users dialog (settings.userTabs, mirrored to users.json). Edit mode, the
 * dashboard card and a screen with only one tab have no bar. Pure rules (unit test: tests/tabs.test.mjs); tabsui.js draws the bar. */

/** the tabs in the order of the bar: key, icon (the name is the text `tab.<key>`); server.py TABS lists the same keys */
export const TABS = [
  ['house', '🏠'],
  ['today', '☀️'],
  ['energy', '⚡'],
  ['climate', '🌡️'],
  ['cameras', '📷'],
  ['media', '🎵'],
  ['household', '🧺'],
  ['routines', '▶️'],
  ['family', '👨‍👩‍👧'],
];
export const TAB_KEYS = TABS.map(([k]) => k);
export const HOME = 'house';
/** own pages of an admin (#484): settings.customTabs [{ id: 'p_…', name, icon }], their place in the bar settings.tabOrder */
export const CUSTOM_ID = /^p_[a-z0-9]{3,16}$/;
export const MAX_CUSTOM = 8;
export const isTabKey = (k) => typeof k === 'string' && (TAB_KEYS.includes(k) || CUSTOM_ID.test(k));
/** a lock of the users dialog (userlocks.js) that takes a tab away as well: no camera page for a user who may not see the cameras, no
 *  energy page for one who may not see the energy, no climate, no routines and no music for one who may not switch (#483, #490) */
export const TAB_LOCK = { cameras: 'cameras', energy: 'energy', climate: 'control', routines: 'control', media: 'control' };

/** one user's entry { hide: [tab], start: tab } with only known tabs (built-in in the order of TABS, then own pages); the house can
 *  never be hidden; null when it says nothing */
export function cleanTabEntry(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const hide = Array.isArray(v.hide) ? [...TAB_KEYS.filter((k) => k !== HOME && v.hide.includes(k)), ...new Set(v.hide.filter((k) => typeof k === 'string' && CUSTOM_ID.test(k)))] : [];
  const start = isTabKey(v.start) && v.start !== HOME && !hide.includes(v.start) ? v.start : '';
  if (!hide.length && !start) return null;
  return { hide, ...(start ? { start } : {}) };
}
/** { user: entry } with at most 50 users, users with an empty entry left out (the same rules as clean_user_tabs in server.py) */
export function cleanUserTabs(val) {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return {};
  const out = {};
  Object.entries(val).slice(0, 50).forEach(([user, v]) => { const e = cleanTabEntry(v), u = String(user).trim().slice(0, 80); if (u && e) out[u] = e; });
  return out;
}
/** rows of the users dialog [{ user, hide, start }] -> settings.userTabs */
export const collectUserTabs = (rows) => cleanUserTabs(Object.fromEntries(rows.filter((r) => (r.user || '').trim()).map((r) => [r.user.trim(), { hide: r.hide, start: r.start }])));

/** the tabs this screen shows, in the order of the bar (keys, normally TABS): the house always; a page only when it has something
 *  (has.cameras: a camera in the plan), the user does not hide it and no lock takes it away */
export function shownTabs({ has = {}, hide = [], locks = [], keys = TAB_KEYS } = {}) {
  return keys.filter((k) => k === HOME || (has[k] && !hide.includes(k) && !(TAB_LOCK[k] && locks.includes(TAB_LOCK[k]))));
}

/** the own pages made safe: [{ id, name (at most 30 characters), icon (one emoji or a few characters) }], ids each once, at most
 *  MAX_CUSTOM (the same rules as clean_custom_tabs in server.py) */
export function cleanCustomTabs(list) {
  const ids = new Set();
  return (Array.isArray(list) ? list : []).filter((x) => x && typeof x === 'object' && CUSTOM_ID.test(x.id) && !ids.has(x.id) && ids.add(x.id))
    .slice(0, MAX_CUSTOM).map((x) => ({ id: x.id, name: (typeof x.name === 'string' && x.name.trim() ? x.name.trim() : '?').slice(0, 30),
      icon: typeof x.icon === 'string' && x.icon.trim() && [...x.icon.trim()].length <= 8 ? x.icon.trim() : '⭐' }));
}
/** the order of the bar made safe: tab keys each once, never the house (it is always first), at most 30 */
export const cleanTabOrder = (list) => [...new Set((Array.isArray(list) ? list : []).filter((k) => isTabKey(k) && k !== HOME))].slice(0, 30);
/**
 * The tabs of the bar in their order: [{ key, icon, name (an own page's; null: the text tab.<key>), own }]. The house first, then the
 * order of settings.tabOrder; a tab not in it keeps its place after the one before it in TABS (own pages: at the end).
 */
export function barTabs(customTabs = [], order = []) {
  const own = cleanCustomTabs(customTabs), ord = cleanTabOrder(order);
  const all = [...TABS.map(([key, icon]) => ({ key, icon, name: null, own: false })), ...own.map((c) => ({ key: c.id, icon: c.icon, name: c.name, own: true }))];
  const rank = (k, i) => (k === HOME ? -1 : ord.includes(k) ? ord.indexOf(k) : 1000 + i);
  return all.map((x, i) => ({ x, r: rank(x.key, i), i })).sort((a, b) => a.r - b.r || a.i - b.i).map(({ x }) => x);
}
/** a new id for an own page that none of `taken` has */
export function newTabId(taken = [], rnd = Math.random) {
  for (let i = 0; i < 50; i++) {
    const id = `p_${Math.floor(rnd() * 36 ** 6).toString(36).padStart(6, '0')}`;
    if (!taken.includes(id)) return id;
  }
  return `p_${Date.now().toString(36)}`;
}
/** the bar is there: live mode, not the dashboard card, not switched off (settings.tabBar) and more than the house to choose */
export const barShown = ({ live, card, on, tabs }) => !!live && !card && on !== false && tabs.length > 1;
/** the tab a screen starts with and comes back to when idle (kiosk.js): the user's start tab while it is shown, else the house */
export const startTab = (start, tabs) => (tabs.includes(start) ? start : HOME);
/** the tab to show after a change (tabs gone, edit mode): the open one while it is still there, else the house */
export const keepTab = (open, tabs, shown) => (shown && tabs.includes(open) ? open : HOME);
