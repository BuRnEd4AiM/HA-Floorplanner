/* Free places for the cards of a page (the owner, 2026-10-30: "das man die karte platzieren kann wo man will … ein unsichtbares gitter im
 * hintergrund … wo den abstand und das einrasten gewährt … wenn ich will das eine karte unten rechts ist"; his choice after the pictures
 * docs/ideen-4.48/: "Frei anordnen" per page, width and height by the corner ↘, a card dropped on another pushes it down, on a phone one
 * under the other). A grid of COLS columns and rows of ROW px with GAP px between them; a card has a place [x, y, w, h] in cells (x, y
 * from 0). Gaps stay where they are: nothing moves up by itself. Stored in the page's layout (pagelayout.js: free, places). Pure (unit
 * test: tests/freegrid.test.mjs; boards.py checks places the same way); freegridui.js lays the cards out and drags them. */

export const COLS = 12;
export const ROW = 30;
export const GAP = 14;
export const MAX_Y = 400;
export const MAX_H = 60;
export const MAX_PLACES = 120;
/** a grid narrower than this (px, a phone): the cards one under the other */
export const NARROW = 600;
const KEY = /^[a-z0-9_:.-]{1,80}$/;

/** one place made safe: [x, y, w, h] inside the grid, else null */
export function cleanPlace(p) {
  if (!Array.isArray(p) || p.length !== 4 || !p.every(Number.isInteger)) return null;
  const [x, y, w, h] = p;
  return x >= 0 && w >= 1 && x + w <= COLS && y >= 0 && y <= MAX_Y && h >= 1 && h <= MAX_H ? [x, y, w, h] : null;
}
/** the places of a page made safe: { key: [x, y, w, h] }, at most MAX_PLACES */
export function cleanPlaces(v) {
  const out = {};
  Object.entries(v && typeof v === 'object' && !Array.isArray(v) ? v : {}).forEach(([k, p]) => {
    const c = cleanPlace(p);
    if (c && KEY.test(k) && Object.keys(out).length < MAX_PLACES) out[k] = c;
  });
  return out;
}

const hits = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
const byPlace = (places) => (a, b) => places[a][1] - places[b][1] || places[a][0] - places[b][0];
/** the row below every place (0 for none) */
export const bottom = (places) => Object.values(places).reduce((m, p) => Math.max(m, p[1] + p[3]), 0);

/**
 * Cards on the grid without overlapping: list [{ key, at: [x, y, w, h] }] in the order they claim their place. The first keeps it; a later
 * one that hits one before it goes down just below it, as little as needed (gaps stay) -> { key: [x, y, w, h] }
 */
export function settle(list) {
  const done = [], out = {};
  list.forEach(({ key, at }) => {
    const p = [...at];
    for (let n = 0; n < 500; n++) {
      const hit = done.filter((d) => hits(p, d));
      if (!hit.length) break;
      p[1] = Math.max(...hit.map((d) => d[1] + d[3]));
    }
    done.push(p); out[key] = p;
  });
  return out;
}
/** the first free spot for a card w × h, from row `from` on: top to bottom, left to right */
export function freeSpot(places, w, h, from = 0) {
  const taken = Object.values(places), ww = Math.max(1, Math.min(COLS, w));
  for (let y = from; y <= MAX_Y; y++) {
    for (let x = 0; x + ww <= COLS; x++) if (!taken.some((p) => hits([x, y, ww, h], p))) return [x, y, ww, h];
  }
  return [0, bottom(places), ww, h];
}

/**
 * Where every card shown goes: keys (in the page's order), places (stored), size(key) -> [w, h] for a card that has no place yet (from
 * its width and height now). Cards with a place keep it (settled from top to bottom); the others go below them in the page's order, side by
 * side as long as there is room. -> { key: [x, y, w, h] }
 */
export function arrangeFree(keys, places, size) {
  const own = cleanPlaces(places), have = keys.filter((k) => own[k]).sort(byPlace(own));
  const out = settle(have.map((key) => ({ key, at: own[key] })));
  const from = bottom(out);
  keys.filter((k) => !own[k]).forEach((k) => { const [w, h] = size(k); out[k] = freeSpot(out, w, h, from); });
  return out;
}
/** the places when a card goes to column x, row y (its size kept, inside the grid): the others it lands on make room below it */
export function moveTo(places, key, x, y) {
  const p = places[key];
  if (!p) return places;
  const at = [Math.max(0, Math.min(COLS - p[2], x)), Math.max(0, Math.min(MAX_Y, y)), p[2], p[3]];
  return settle([{ key, at }, ...Object.keys(places).filter((k) => k !== key).sort(byPlace(places)).map((k) => ({ key: k, at: places[k] }))]);
}
/** the places when a card is made w × h (inside the grid, at least one cell): the others below make room */
export function sizeTo(places, key, w, h) {
  const p = places[key];
  if (!p) return places;
  const at = [p[0], p[1], Math.max(1, Math.min(COLS - p[0], w)), Math.max(1, Math.min(MAX_H, h))];
  return settle([{ key, at }, ...Object.keys(places).filter((k) => k !== key).sort(byPlace(places)).map((k) => ({ key: k, at: places[k] }))]);
}
/** the order on a phone: top to bottom, left to right */
export const readingOrder = (places) => Object.keys(places).sort(byPlace(places));

/** the width of a column of a grid `width` px wide */
export const colWidth = (width, gap = GAP) => Math.max(1, (width - (COLS - 1) * gap) / COLS);
/** the cell at px from the grid's edge (the nearest), cell: the size of a cell (a column's width or ROW) */
export const cellAt = (px, cell, gap = GAP) => Math.round(px / (cell + gap));
/** how many cells a length of px covers (the nearest, at least 1) */
export const spanOf = (px, cell, gap = GAP) => Math.max(1, Math.round((px + gap) / (cell + gap)));
/** how many rows a card of height px needs so nothing is cut (rounded up) */
export const rowsFor = (px, row = ROW, gap = GAP) => Math.max(1, Math.min(MAX_H, Math.ceil((px + gap) / (row + gap))));
/** the columns of a card of the flowing grid (its width 1..4 there): a quarter of the page each, 4 = the whole row */
export const colsFor = (w) => Math.max(1, Math.min(COLS, (Number(w) || 1) * (COLS / 4)));

/**
 * "Frei anordnen" switched on: the places from where the cards stand on the screen now. rects [{ key, left, top, width, height }] in px
 * from the grid's corner, width: the grid's width -> { key: [x, y, w, h] } (settled, nothing cut)
 */
export function fromScreen(rects, width, gap = GAP) {
  const cw = colWidth(width, gap);
  const list = rects.map((r) => {
    const w = Math.min(COLS, spanOf(r.width, cw, gap)), x = Math.max(0, Math.min(COLS - w, cellAt(r.left, cw, gap)));
    return { key: r.key, at: [x, Math.max(0, Math.min(MAX_Y, cellAt(r.top, ROW, gap))), w, rowsFor(r.height, ROW, gap)] };
  });
  return settle(list.sort((a, b) => a.at[1] - b.at[1] || a.at[0] - b.at[0]));
}
/** the same on a phone (all one under the other there): side by side in the page's order, list [{ key, w, h }] */
export function packed(list) {
  const out = {};
  list.forEach(({ key, w, h }) => { out[key] = freeSpot(out, w, h); });
  return out;
}
