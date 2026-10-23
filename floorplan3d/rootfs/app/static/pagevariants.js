/* Versions of a page of the tab bar (#507, the owner's wish of 2026-10-23: "bei unterschiedlichen Benutzern unterschiedliche Sachen
 * anzeigen"). Besides its normal layout ("Für alle", settings.pageLayouts, #484) a page can have own versions, e.g. "Kinder" or
 * "Tablet Flur", each with its own cards (settings.pageVariants { page: [{ id, name, icon, layout }] }); a user gets one version per page
 * (settings.userTabs.<user>.variants { page: id }), who has none sees "Für alle". A version is no lock: what a user may not do the locks
 * of the users dialog say (userlocks.js). Pure (unit test: tests/pagevariants.test.mjs; the same rules as clean_page_variants in
 * boards.py); variantsui.js draws the strip in the edit mode, the window of a version, "Ansehen als …" and "Wer sieht was". */
import { cleanLayout, emptyLayout } from './pagelayout.js';
import { VARIANT_ID, HOME, isTabKey, cleanTabEntry, cleanUserTabs } from './tabs.js';

export { VARIANT_ID };
export const MAX_VARIANTS = 6;       // per page, besides "Für alle"
export const ALL = '';               // the id of "Für alle": the page's normal layout
export const OFF = 'off';            // a cell of "Wer sieht was": the tab is not in the user's bar
const CONTROL = /[\x00-\x1f\x7f]/g;
const cut = (s, n) => [...s].slice(0, n).join('');

/** one version made safe: { id, name (at most 30 characters), icon (an emoji or a few characters), layout (cleanLayout) }, or null */
export function cleanVariant(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v) || typeof v.id !== 'string' || !VARIANT_ID.test(v.id)) return null;
  const name = typeof v.name === 'string' ? v.name.replace(CONTROL, '').trim() : '';
  const icon = typeof v.icon === 'string' ? v.icon.replace(CONTROL, '').trim() : '';
  return { id: v.id, name: name ? cut(name, 30) : '?', icon: icon && [...icon].length <= 8 ? icon : '🗂', layout: cleanLayout(v.layout) };
}
/** every page's versions: { page: [version] } for the known pages (not the house), ids each once, at most MAX_VARIANTS, empty lists left out */
export function cleanVariants(val, pages) {
  const out = {};
  if (!val || typeof val !== 'object' || Array.isArray(val)) return out;
  Object.entries(val).slice(0, 40).forEach(([page, list]) => {
    if (page === HOME || !pages.includes(page) || !Array.isArray(list)) return;
    const ids = new Set(), vs = [];
    list.forEach((v) => { const x = cleanVariant(v); if (x && !ids.has(x.id) && vs.length < MAX_VARIANTS) { ids.add(x.id); vs.push(x); } });
    if (vs.length) out[page] = vs;
  });
  return out;
}
/** the own versions of a page */
export function variantsOf(settings, page) {
  const list = settings?.pageVariants?.[page];
  return Array.isArray(list) ? list.map(cleanVariant).filter(Boolean).slice(0, MAX_VARIANTS) : [];
}
/** a new id for a version that none of `taken` has */
export function newVariantId(taken = [], rnd = Math.random) {
  for (let i = 0; i < 50; i++) {
    const id = `v_${Math.floor(rnd() * 36 ** 6).toString(36).padStart(6, '0')}`;
    if (!taken.includes(id)) return id;
  }
  return `v_${Date.now().toString(36)}`;
}

/** the entry of a user in settings.userTabs (cleanTabEntry), the name matched without case like the server does; null: none */
export function entryOf(userTabs, user) {
  const u = String(user || '').trim().toLowerCase();
  if (!u || !userTabs || typeof userTabs !== 'object') return null;
  const k = Object.keys(userTabs).find((x) => x.trim().toLowerCase() === u);
  return k ? cleanTabEntry(userTabs[k]) : null;
}
/** the version of a page somebody sees (entry: his entry of settings.userTabs, or api/me's tabs): his own while it exists, else ALL */
export function pickedVariant(settings, entry, page) {
  const id = entry?.variants?.[page];
  return id && variantsOf(settings, page).some((v) => v.id === id) ? id : ALL;
}
/** a cell of "Wer sieht was": OFF (the tab is hidden for him), the id of his version or ALL */
export const cellOf = (settings, entry, page) => (entry?.hide?.includes(page) ? OFF : pickedVariant(settings, entry, page));

/** the layout of a version of a page (ALL or a version that is gone: the page's normal layout) */
export function layoutIn(settings, page, id) {
  const v = id ? variantsOf(settings, page).find((x) => x.id === id) : null;
  return v ? v.layout : cleanLayout((settings?.pageLayouts || {})[page]);
}
/** the changed fields of the settings after the layout of a version changed: { pageLayouts } (ALL: empty layouts left out, like before)
 *  or { pageVariants }; new objects, the settings themselves stay as they are */
export function withLayoutIn(settings, page, id, layout) {
  const l = cleanLayout(layout), list = variantsOf(settings, page);
  if (id && list.some((x) => x.id === id)) return { pageVariants: { ...(settings.pageVariants || {}), [page]: list.map((x) => (x.id === id ? { ...x, layout: l } : x)) } };
  const all = { ...(settings.pageLayouts || {}) };
  if (emptyLayout(l)) delete all[page]; else all[page] = l;
  return { pageLayouts: all };
}
/** the start of a version "Leer": the page's built-in cards now (keys) hidden, no own cards; a card that comes later (a new room) shows */
export const emptyStart = (keys) => cleanLayout({ hidden: keys });
/** { pageVariants } with a new version of a page (its layout a copy of `from`), or null: the page has MAX_VARIANTS already, the id is taken */
export function addVariant(settings, page, { id, name, icon }, from) {
  const list = variantsOf(settings, page);
  if (page === HOME || !isTabKey(page) || list.length >= MAX_VARIANTS || !VARIANT_ID.test(id || '') || list.some((x) => x.id === id)) return null;
  const v = cleanVariant({ id, name, icon, layout: JSON.parse(JSON.stringify(cleanLayout(from))) });
  return { pageVariants: { ...(settings.pageVariants || {}), [page]: [...list, v] } };
}
/** { pageVariants } with a version's name and icon changed */
export function renameVariant(settings, page, id, { name, icon }) {
  const list = variantsOf(settings, page).map((x) => (x.id === id ? cleanVariant({ ...x, name, icon }) : x));
  return { pageVariants: { ...(settings.pageVariants || {}), [page]: list } };
}
/** { pageVariants, userTabs } without a version: who had it sees "Für alle" again; a page without versions is left out */
export function dropVariant(settings, page, id) {
  const all = { ...(settings.pageVariants || {}) }, list = variantsOf(settings, page).filter((x) => x.id !== id);
  if (list.length) all[page] = list; else delete all[page];
  const tabs = cleanUserTabs(settings.userTabs);
  const userTabs = Object.fromEntries(Object.entries(tabs).map(([u, e]) => {
    if (e.variants?.[page] !== id) return [u, e];
    const variants = { ...e.variants }; delete variants[page];
    return [u, cleanTabEntry({ ...e, variants })];
  }).filter(([, e]) => e));
  return { pageVariants: all, userTabs };
}

/** settings.userTabs after a user got `id` on a page: a version's id, ALL (his own version taken away) or OFF (the tab not in his bar);
 *  choosing a version or ALL shows the tab again. The user keeps his place in the list (a new one comes last). */
export function setPick(userTabs, user, page, id) {
  const all = cleanUserTabs(userTabs), u = String(user || '').trim().slice(0, 80);
  if (!u || page === HOME || !isTabKey(page) || (id !== ALL && id !== OFF && !VARIANT_ID.test(id || ''))) return all;
  const key = Object.keys(all).find((k) => k.toLowerCase() === u.toLowerCase()) || u;
  const e = all[key] || { hide: [] };
  const hide = id === OFF ? [...e.hide, page] : e.hide.filter((k) => k !== page);
  const variants = { ...(e.variants || {}) }; delete variants[page];
  if (id !== ALL && id !== OFF) variants[page] = id;
  const next = cleanTabEntry({ hide, start: e.start, variants });
  const out = Object.fromEntries(Object.entries(all).map(([k, v]) => [k, k === key ? next : v]).filter(([, v]) => v));
  if (!(key in all) && next) out[key] = next;
  return cleanUserTabs(out);
}
/** the window of a version: `chosen` of `users` get the version `id` of a page (and the tab, if it was hidden for them), the others that
 *  had it get "Für alle" (a hidden tab stays hidden) */
export function withUsers(settings, users, page, id, chosen) {
  const pick = new Set(chosen.map((u) => String(u).trim().toLowerCase()));
  return users.reduce((tabs, u) => {
    const e = entryOf(tabs, u);
    if (pick.has(String(u).trim().toLowerCase())) return cellOf(settings, e, page) === id ? tabs : setPick(tabs, u, page, id);
    if (e?.variants?.[page] !== id) return tabs;
    return setPick(tabs, u, page, e.hide.includes(page) ? OFF : ALL);
  }, cleanUserTabs(settings.userTabs));
}
/** who of `users` sees the version `id` of a page (ALL: those without an own one); a user who does not have the tab is left out */
export const usersOf = (settings, users, page, id) => users.filter((u) => cellOf(settings, entryOf(settings.userTabs, u), page) === id);
/** the users for the windows: Home Assistant's (api/users) and every name in the settings of users, each once (without case), in that order */
export function knownUsers(haUsers, settings) {
  const s = settings || {}, seen = new Set(), out = [];
  const names = [...(haUsers || []).map((u) => (typeof u === 'string' ? u : u?.username)),
    ...['userTabs', 'userRooms', 'userViews', 'userPresets', 'userLocks', 'userBuildings'].flatMap((k) => Object.keys(s[k] || {})),
    ...Object.keys(s.startViews || {}).filter((u) => u !== '*')];
  names.forEach((n) => { const u = String(n || '').trim(), l = u.toLowerCase(); if (u && !seen.has(l)) { seen.add(l); out.push(u); } });
  return out;
}
