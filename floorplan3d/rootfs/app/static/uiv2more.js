/* „Oberfläche 2“, second part (5.0.0; the owner's choice of 2026-11-09 from docs/ideen-5.0/: 5 tabs on the panel, 9 the house as a tree,
 * 10 a floor of its own, 12 a search for settings, 13 „⇉ Übernehmen“): the pure rules (no DOM, no three.js; unit test:
 * tests/uiv2more.test.mjs). uiv2homeui.js draws the tree and the floor, uiv2tools.js the search, the tabs and „Übernehmen“. */
import { polyArea } from './rooms.js';
import { windowPanes } from './windowpanes.js';

/* ---- the house as a tree (nothing selected) ---- */
export const FLOOR_ICON = { basement: '⬇', floor: '▤', roof: '⌂' };
/** the rows of the tree: the floors from the top down, as they stand in a house (index i in layout.floors), each with how many rooms
 *  it has; the rooms of the open floors under them (name, area in m²), by name */
export function treeRows(layout, open = []) {
  const out = [], floors = layout?.floors || [];
  for (let i = floors.length - 1; i >= 0; i--) {
    const f = floors[i], rooms = f.rooms || [];
    out.push({ type: 'floor', i, id: f.id, name: f.name || '', kind: f.kind || 'floor', rooms: rooms.length, open: open.includes(f.id) });
    if (!open.includes(f.id)) continue;
    [...rooms].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))).forEach((r) => out.push({ type: 'room', i, id: r.id, name: r.name || '', area: polyArea(r.points || []) }));
  }
  return out;
}
/** move floor `from` to place `to` in floors (one step at a time, the others keep their order); returns where it is now */
export function moveFloorTo(floors, from, to) {
  if (!Array.isArray(floors) || from < 0 || from >= floors.length) return from;
  to = Math.max(0, Math.min(floors.length - 1, to));
  const [f] = floors.splice(from, 1);
  floors.splice(to, 0, f);
  return to;
}

/** the floors of the house from the side, the one at index cur marked, every storey with its height (the same for all: the storey height
 *  of the house, h in m, shown as text hTxt); a roof floor is the roof on top. An svg text. names in the language are the floors' own. */
export function storeySvg(floors, cur, hTxt) {
  const list = (floors || []).map((f, i) => ({ f, i })).reverse(), W = 176, rowH = 26, roof = list.filter(({ f }) => f.kind === 'roof');
  const body = list.filter(({ f }) => f.kind !== 'roof');
  const top = roof.length ? 30 : 6, H = top + body.length * rowH + 10;
  let s = `<svg class="v2Storeys" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">`;
  if (roof.length) {
    const on = roof.some(({ i }) => i === cur);
    s += `<path d="M8 ${top} L${W / 2} 4 L${W - 8} ${top} Z" fill="${on ? '#e07a5f' : '#b2533e'}" stroke="${on ? '#ffd45c' : 'none'}" stroke-width="2.5"/>`;
    s += `<text x="${W / 2}" y="${top - 6}" text-anchor="middle" font-size="10" font-weight="800" fill="#fff">${esc(roof[0].f.name || '')}</text>`;
  }
  let ground = -1;
  body.forEach(({ f, i }, k) => {
    const y = top + k * rowH, on = i === cur;
    if (f.kind !== 'basement' && body[k + 1]?.f.kind === 'basement') ground = y + rowH;
    s += `<rect x="12" y="${y}" width="${W - 24}" height="${rowH}" fill="${on ? 'rgba(63,169,245,.45)' : f.kind === 'basement' ? '#3a3f45' : '#2a3541'}" stroke="${on ? '#3fa9f5' : '#4b5866'}" stroke-width="${on ? 2.5 : 1}"/>`;
    s += `<text x="18" y="${y + rowH / 2 + 4}" font-size="10.5" font-weight="700" fill="#dfe7ef">${esc(f.name || '')}</text>`;
    s += `<text x="${W - 18}" y="${y + rowH / 2 + 4}" font-size="10.5" font-weight="800" fill="${on ? '#ffd45c' : '#9fb3c8'}" text-anchor="end">${esc(hTxt)}</text>`;
  });
  if (ground < 0) ground = top + body.length * rowH;
  s += `<rect x="0" y="${ground}" width="${W}" height="3" fill="#5c8a3a"/>`;
  return `${s}</svg>`;
}
const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---- the search for a setting ---- */
/** a text for comparing: small letters, umlauts and accents plain (ä → a), ß → ss */
export const fold = (s) => String(s ?? '').toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '');
/** does text have every word of the query (any order, also inside a word: „kipp“ finds „Kippwinkel“)? An empty query has nothing */
export function matches(q, text) {
  const words = fold(q).split(/\s+/).filter(Boolean);
  if (!words.length) return false;
  const t = fold(text);
  return words.every((w) => t.includes(w));
}

/* ---- „⇉ Übernehmen“: the same settings for others ---- */
/** what can be passed on, per kind, in groups of keys of the object; the contacts and names are never passed on (each has its own) */
export const COPY_GROUPS = {
  window: { size: ['width', 'height', 'sill'], panes: ['style', 'panes', 'hinge', 'paneHinges', 'openOutward', 'tiltDeg'], fixed: ['fixedBelow', 'fixedAbove'], shutter: ['shutter', 'shutterStyle', 'curtainSide'] },
  door: { size: ['width', 'height'], style: ['style', 'flip', 'inv'] },
  room: { floor: ['covering', 'floorLook', 'color'], level: ['raise', 'steps'], walls: ['wallLook', 'wallBelow'] },
  device: { dsize: ['scale', 'sx', 'sy', 'sz'], look: ['variant', 'finish', 'hideModel', 'lightColor'], tilt: ['tiltX', 'tiltZ', 'mirror'] },
};
/** the groups ticked at first: everything but the size (a window passes on how it opens, not its size, unless asked) */
export const copyDefaults = (pk) => Object.keys(COPY_GROUPS[pk] || {}).filter((g) => !(g === 'size' || g === 'dsize'));
const clone = (v) => (v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v);
/** pass the groups of src (an object of kind pk) on to dst: a key src has is copied, a key it has not is removed from dst; afterwards dst
 *  is made whole again (a fixed window has no own contacts, tilt contact or fixed glass; contacts per pane only for the panes it has; a
 *  window without a shutter loses its shutter's entity). Returns dst. */
export function copyGroups(pk, src, dst, groups) {
  const all = COPY_GROUPS[pk];
  if (!all || !src || !dst || src === dst) return dst;
  for (const g of groups || []) for (const k of all[g] || []) {
    if (src[k] === undefined) delete dst[k]; else dst[k] = clone(src[k]);
  }
  if (pk === 'window') {
    if (dst.style === 'fixed') ['panes', 'paneHinges', 'paneEntities', 'tiltEntity', 'tiltDeg', 'fixedBelow', 'fixedAbove'].forEach((k) => delete dst[k]);
    else if (Array.isArray(dst.paneEntities)) {
      const n = windowPanes(dst), arr = dst.paneEntities.slice(0, n > 1 ? n : 0);
      if (arr.some(Boolean)) dst.paneEntities = arr; else delete dst.paneEntities;
    }
    if (!dst.shutter) delete dst.shutterEntity;
  }
  return dst;
}
/** can a pass on from a reach b: the same kind of thing (a window to windows, a door to doors, a device to devices of its type, a room to rooms) */
export function sameKind(pk, a, b) {
  if (!a || !b || a === b) return false;
  if (pk === 'window' || pk === 'door') return b.type === a.type;
  if (pk === 'device') return b.type === a.type;
  return pk === 'room';
}
