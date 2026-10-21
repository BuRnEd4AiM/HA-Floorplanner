/* Tabs (#479): a bar at the bottom of the live view so the add-on can be the only dashboard of a house (the owner's wish, docs/PLAN-4.3.md).
 * 🏠 is the house (the 3D picture as always), the other tabs are pages over it; more come step by step (4.3: the cameras, 4.4: today and
 * the energy). Which tabs a user
 * sees and which one a screen starts with is set per user in the users dialog (settings.userTabs, mirrored to users.json). Edit mode, the
 * dashboard card and a screen with only one tab have no bar. Pure rules (unit test: tests/tabs.test.mjs); tabsui.js draws the bar. */

/** the tabs in the order of the bar: key, icon (the name is the text `tab.<key>`); server.py TABS lists the same keys */
export const TABS = [
  ['house', '🏠'],
  ['today', '☀️'],
  ['energy', '⚡'],
  ['cameras', '📷'],
];
export const TAB_KEYS = TABS.map(([k]) => k);
export const HOME = 'house';
/** a lock of the users dialog (userlocks.js) that takes a tab away as well: no camera page for a user who may not see the cameras, no
 *  energy page for one who may not see the energy */
export const TAB_LOCK = { cameras: 'cameras', energy: 'energy' };

/** one user's entry { hide: [tab], start: tab } with only known tabs; the house can never be hidden; null when it says nothing */
export function cleanTabEntry(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const hide = Array.isArray(v.hide) ? TAB_KEYS.filter((k) => k !== HOME && v.hide.includes(k)) : [];
  const start = TAB_KEYS.includes(v.start) && v.start !== HOME && !hide.includes(v.start) ? v.start : '';
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

/** the tabs this screen shows, in the order of TABS: the house always; a page only when it has something (has.cameras: a camera in the
 *  plan), the user does not hide it and no lock takes it away */
export function shownTabs({ has = {}, hide = [], locks = [] } = {}) {
  return TAB_KEYS.filter((k) => k === HOME || (has[k] && !hide.includes(k) && !(TAB_LOCK[k] && locks.includes(TAB_LOCK[k]))));
}
/** the bar is there: live mode, not the dashboard card, not switched off (settings.tabBar) and more than the house to choose */
export const barShown = ({ live, card, on, tabs }) => !!live && !card && on !== false && tabs.length > 1;
/** the tab a screen starts with and comes back to when idle (kiosk.js): the user's start tab while it is shown, else the house */
export const startTab = (start, tabs) => (tabs.includes(start) ? start : HOME);
/** the tab to show after a change (tabs gone, edit mode): the open one while it is still there, else the house */
export const keepTab = (open, tabs, shown) => (shown && tabs.includes(open) ? open : HOME);
