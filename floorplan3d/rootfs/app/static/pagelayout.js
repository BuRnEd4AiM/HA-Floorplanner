/* The pages of the tab bar arranged by an admin like a Home Assistant dashboard (#484): per page the order of its cards, the ones hidden,
 * the size of a built-in card that can be big or small (a thermostat on 🌡 Klima, #495) and own cards (cards.js), the same for everybody (settings.pageLayouts, server.py clean_page_layouts); own pages are tabs.js
 * customTabs. Pure (unit test: tests/pagelayout.test.mjs); pageboard.js draws the cards and the edit mode. */
import { cleanCard, OWN_ID } from './cards.js';
import { SIZES } from './thermostat.js';
import { cleanSections, cleanWidths } from './sections.js';

export const MAX_ORDER = 120;
export const MAX_OWN = 40;
const KEY = /^[a-z0-9_:.-]{1,80}$/;

/** one page's layout made safe: { order: [key], hidden: [key], sizes: { key: 'big' | 'small' }, sections: [{ id, title, icon, wide,
 *  keys }], widths: { key: 1..4 } (#495, sections.js), cards: [card] }; keys each once, own cards valid (cleanCard) and each id once */
export function cleanLayout(v) {
  const o = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  const keys = (list, max) => [...new Set((Array.isArray(list) ? list : []).filter((k) => typeof k === 'string' && KEY.test(k)))].slice(0, max);
  const ids = new Set(), cards = [];
  (Array.isArray(o.cards) ? o.cards : []).forEach((c) => { const x = cleanCard(c); if (x && !ids.has(x.id) && cards.length < MAX_OWN) { ids.add(x.id); cards.push(x); } });
  const sizes = Object.fromEntries((o.sizes && typeof o.sizes === 'object' && !Array.isArray(o.sizes) ? Object.entries(o.sizes) : [])
    .filter(([k, x]) => KEY.test(k) && SIZES.includes(x)).slice(0, MAX_ORDER));
  return { order: keys(o.order, MAX_ORDER), hidden: keys(o.hidden, MAX_ORDER), sizes, sections: cleanSections(o.sections), widths: cleanWidths(o.widths), cards };
}
/** a layout with nothing in it (left out of the settings) */
export const emptyLayout = (l) => !l.order.length && !l.hidden.length && !l.cards.length && !Object.keys(l.sizes).length && !l.sections.length
  && !Object.keys(l.widths).length;
/** every page's layout: { page: layout } for the known pages (built-in or own), empty ones left out */
export function cleanLayouts(val, pages) {
  const out = {};
  if (!val || typeof val !== 'object' || Array.isArray(val)) return out;
  Object.entries(val).forEach(([page, v]) => {
    if (!pages.includes(page)) return;
    const l = cleanLayout(v);
    if (!emptyLayout(l)) out[page] = l;
  });
  return out;
}

/**
 * The cards of a page in their order: [{ key, own (the card's spec for an own card, else null), hidden }]. builtin: the keys of the
 * page's own cards in their natural order; layout: cleanLayout. Keys in layout.order come first in that order; a built-in card that is
 * not in it (new: a room added to the plan) keeps its natural place after the card before it; own cards not in the order come last.
 * A key of the order that is no card (any more) is left out.
 */
export function arrange(builtin, layout) {
  const l = cleanLayout(layout), own = new Map(l.cards.map((c) => [c.id, c])), have = new Set([...builtin, ...own.keys()]);
  const out = l.order.filter((k) => have.has(k));
  builtin.forEach((k, i) => {
    if (out.includes(k)) return;
    const prev = builtin.slice(0, i).reverse().find((p) => out.includes(p));
    out.splice(prev ? out.indexOf(prev) + 1 : 0, 0, k);
  });
  l.cards.forEach((c) => { if (!out.includes(c.id)) out.push(c.id); });
  const hidden = new Set(l.hidden);
  return out.map((key) => ({ key, own: own.get(key) || null, hidden: hidden.has(key) }));
}

/** the layout after a card was moved: keys (the page's cards in their new order, from arrange or the screen) become the order */
export const withOrder = (layout, keys) => ({ ...cleanLayout(layout), order: [...new Set(keys)].slice(0, MAX_ORDER) });
/** key moved in keys before `before` (null: to the end) */
export function moveKey(keys, key, before) {
  const rest = keys.filter((k) => k !== key);
  const i = before == null ? -1 : rest.indexOf(before);
  rest.splice(i < 0 ? rest.length : i, 0, key);
  return rest;
}
/** 👁: a card hidden or shown again */
export function toggleHidden(layout, key) {
  const l = cleanLayout(layout);
  return { ...l, hidden: l.hidden.includes(key) ? l.hidden.filter((k) => k !== key) : [...l.hidden, key] };
}
/** the size of a built-in card ('big' | 'small') set */
export function withSize(layout, key, size) {
  const l = cleanLayout(layout);
  return KEY.test(key) && SIZES.includes(size) ? { ...l, sizes: { ...l.sizes, [key]: size } } : l;
}
/** the size of a card in a layout, `dflt` when none is set */
export const sizeOf = (layout, key, dflt = 'big') => cleanLayout(layout).sizes[key] || dflt;
/** an own card added (at the end) or changed (in its place) */
export function putCard(layout, card) {
  const l = cleanLayout(layout), c = cleanCard(card);
  if (!c) return l;
  const i = l.cards.findIndex((x) => x.id === c.id);
  if (i >= 0) { const cards = [...l.cards]; cards[i] = c; return { ...l, cards }; }
  if (l.cards.length >= MAX_OWN) return l;
  return { ...l, cards: [...l.cards, c], order: l.order.length ? [...l.order.filter((k) => k !== c.id), c.id] : l.order };
}
/** 🗑: an own card taken away */
export function dropCard(layout, id) {
  const l = cleanLayout(layout);
  const sizes = { ...l.sizes }, widths = { ...l.widths }; delete sizes[id]; delete widths[id];
  return { order: l.order.filter((k) => k !== id), hidden: l.hidden.filter((k) => k !== id), sizes, widths,
    sections: l.sections.map((s) => ({ ...s, keys: s.keys.filter((k) => k !== id) })), cards: l.cards.filter((c) => c.id !== id) };
}
/** "Wie am Anfang": the built-in cards in their order again, all shown, in their first size and width, no sections; the own cards stay
 *  (at the end) */
export const resetLayout = (layout) => ({ order: [], hidden: [], sizes: {}, sections: [], widths: {}, cards: cleanLayout(layout).cards });

/** a new id for an own card that none of `taken` has */
export function newCardId(taken = [], rnd = Math.random) {
  for (let i = 0; i < 50; i++) {
    const id = `c_${Math.floor(rnd() * 36 ** 6).toString(36).padStart(6, '0')}`;
    if (!taken.includes(id) && OWN_ID.test(id)) return id;
  }
  return `c_${Date.now().toString(36)}`;
}

/** how many rows of the masonry grid a card of `height` px fills (rows of `row` px with `gap` px between them) */
export const rowSpan = (height, row = 8, gap = 14) => Math.max(1, Math.ceil((height + gap) / (row + gap)));
