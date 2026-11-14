/* „Oberfläche 2“ (4.73.0; the owner, 2026-11-08: "so unendlich viele Einstellmöglichkeiten … dass man zwischen alt und neu wechseln kann",
 * the example pictures in docs/ideen-5.0/, his choice 2026-11-09): the same fields of the properties panel (props.js), ordered into
 * sections that fold in and out, each with a line that says what is set; a window drawn half open, its panes to tap; the kinds of window as
 * pictures; a room with tabs; the floor height seen from the side. Old and new can be switched (per device). The pure rules (no DOM, no
 * three.js; unit test: tests/uiv2.test.mjs); uiv2ui.js draws them. */
import { windowPanes, paneHinge, stylePanes, fixedGlass, MAX_PANES, WINDOW_HINGES } from './windowpanes.js';
import { tiltDeg } from './windowtilt.js';

export const UI_KEY = 'fp.ui';                      // the choice of this device (localStorage): 'v2' or 'classic' (the default)
export const OPEN_KEY = 'fp.ui.open';               // which sections this device has open ({ "window.panes": true, … })
/** a stored choice: 'v2', anything else is the classic panel */
export const cleanUi = (v) => (v === 'v2' ? 'v2' : 'classic');
/** ?ui=2 (or v2, new, neu) in the address picks the new panel, ?ui=1 (classic, alt) the old one; null: the address says nothing */
export function uiFromQuery(search) {
  let v = null;
  try { v = new URLSearchParams(search || '').get('ui'); } catch { /* not an address */ }
  if (v == null || v === '') return null;
  return ['2', 'v2', 'new', 'neu'].includes(v.toLowerCase()) ? 'v2' : 'classic';
}

/** the kind of panel a selection gets: a window and a door differ, everything else by its kind */
export const panelKind = (kind, it) => (kind === 'opening' ? (it?.type === 'window' ? 'window' : 'door') : kind);

/** the sections per kind, in the order shown: [key, icon, open at the start]. props.js marks where its fields belong (v2mark); fields
 *  before the first mark stay on top, a section without fields is left out. 'kind' is drawn by uiv2ui.js (the kinds of window). */
export const SECTIONS = {
  window: [['kind', '🧩', false], ['size', '📐', true], ['panes', '🪟', true], ['fixed', '▭', false], ['contact', '🔗', false], ['shutter', '🎚', false], ['look', '🎨', false], ['more', '⋯', false], ['inroom', '📟', false]],
  door: [['size', '📐', true], ['style', '🚪', false], ['contact', '🔗', false], ['look', '🎨', false], ['more', '⋯', false], ['inroom', '📟', false]],   // look: its colours (#754)
  device: [['entity', '🔗', true], ['special', '⚙️', true], ['place', '📍', false], ['dsize', '📏', false], ['tilt', '↻', false], ['look', '🎨', false], ['inroom', '📟', false]],
  wall: [['wsize', '📐', true], ['split', '✂️', false], ['finish', '🎨', false]],
  stair: [['form', '📐', true], ['corner', '↪️', true], ['steps', '🪜', true], ['look', '🎨', false], ['place', '📍', false]],   // 5.7.0 (the owner, 2026-11-11); look: covering, rail (#753)
  hole: [['form', '📐', true]],
  block: [['bsize', '📐', true]],
};
/** the kinds of selection the new panel orders (5.7.0: also stairs, holes, blocks, the plot, garden areas and cables, before the old panel) */
export const V2_KINDS = ['window', 'door', 'room', 'device', 'wall', 'stair', 'hole', 'block', 'plot', 'yard', 'cable'];
/** kinds that are no part of a floor: their path is the house and the object (the plot and its areas) */
export const OUTSIDE_KINDS = ['plot', 'yard'];
/** the tabs of a room, and which marks go into which tab */
export const ROOM_TABS = [['general', ['general', 'balcony']], ['floor', ['floor', 'level']], ['walls', ['walls']], ['devices', ['devices']]];
/** marks that are never a section: on top, the delete button and the classic pane fields (drawn as a picture instead; kept hidden) */
export const NOT_SECTIONS = ['top', 'del', 'panesList'];
/** sections every kind may show although its list does not name them (props.js marks them): they come last, open */
export const EXTRA_OPEN = true;

/** split the marked children of the panel into groups: [{ key, els }] in order, 'top' for what comes before the first mark. children:
 *  the elements; markOf(el): the key of a mark (null for a field) */
export function groupMarked(children, markOf) {
  const groups = new Map([['top', []]]);
  let cur = 'top';
  for (const el of children) {
    const k = markOf(el);
    if (k) { cur = k; if (!groups.has(k)) groups.set(k, []); continue; }
    groups.get(cur).push(el);
  }
  return groups;
}
/** the order of the sections for kind pk from the groups that have fields (or are drawn by the panel itself): [[key, icon, open], …];
 *  groups the list does not know come after it, open ('⚙️'); NOT_SECTIONS never are sections */
export function sectionOrder(pk, groups, drawn = []) {
  const list = SECTIONS[pk] || [], known = new Set(list.map(([k]) => k));
  const has = (k) => drawn.includes(k) || (groups.get(k) || []).length > 0;
  const out = list.filter(([k]) => has(k));
  for (const [k, els] of groups) if (!known.has(k) && !NOT_SECTIONS.includes(k) && els.length) out.push([k, '⚙️', EXTRA_OPEN]);
  return out;
}
/** is section key of kind pk open: as this device left it, else as the list says */
export const isOpen = (pk, key, def, saved) => (typeof saved?.[`${pk}.${key}`] === 'boolean' ? saved[`${pk}.${key}`] : !!def);
/** the stored open sections, only yes / no values */
export function cleanOpen(v) {
  const out = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return out;
  for (const [k, b] of Object.entries(v)) if (typeof b === 'boolean' && /^[a-z]+\.[a-z]+$/i.test(k)) out[k] = b;
  return out;
}

/* ---- what a pane does (the window drawn half open) ---- */
/** what pane i of window o does: 'left' / 'right' (turns, hinge on that side), 'bottom' (tilts), 'top' (swings out at the bottom), 'fixed' */
export const paneKind = (o, i) => (o?.style === 'fixed' ? 'fixed' : paneHinge(o, i));
export const PANE_KINDS = ['left', 'right', 'bottom', 'top', 'fixed'];
/** the kinds of every pane of window o */
export const paneKinds = (o) => Array.from({ length: Math.max(1, windowPanes(o)) }, (_, i) => paneKind(o, i));
/** set what pane i of window o does (the same as the fields „Fest“ and „Fenster öffnet“ / „Flügel n“ of props.js): one pane: its fixed
 *  tick (fixed glazing) or the window's hinge; several: every pane its own edge, a fixed pane loses its contact. Returns o. */
export function setPaneKind(o, i, kind) {
  if (!PANE_KINDS.includes(kind) || o?.type !== 'window') return o;
  const n = windowPanes(o);
  if (n <= 1 || o.style === 'fixed') {
    if (kind === 'fixed') {
      o.style = 'fixed';
      ['panes', 'paneHinges', 'paneEntities', 'tiltEntity', 'tiltDeg', 'fixedBelow', 'fixedAbove'].forEach((k) => delete o[k]);
      return o;
    }
    if (o.style === 'fixed') o.style = 'single';
    if (kind === 'bottom') delete o.hinge; else o.hinge = kind;
    delete o.paneHinges;
    return o;
  }
  const base = WINDOW_HINGES.includes(o.hinge) ? o.hinge : 'bottom';
  const arr = Array.from({ length: n }, (_, k) => paneHinge(o, k));
  arr[i] = kind;
  if (kind === 'fixed') {
    const pe = Array.isArray(o.paneEntities) ? o.paneEntities.slice() : [];
    pe[i] = ''; o.paneEntities = pe.some(Boolean) ? pe : undefined;
    if (!o.paneEntities) delete o.paneEntities;
  }
  if (arr.some((h) => h !== base)) o.paneHinges = arr; else delete o.paneHinges;
  return o;
}
/** the number of panes of window o (the field „Anzahl Flügel“ of props.js): the style stays its look, the number overrides its panes */
export function setPaneCount(o, n) {
  if (o?.type !== 'window' || o.style === 'fixed') return o;
  n = Math.max(1, Math.min(MAX_PANES, Math.round(+n || 1)));
  if (n === stylePanes(o.style)) delete o.panes; else o.panes = n;
  const arr = (o.paneEntities || []).slice(0, Math.max(0, n > 1 ? n : 0));
  if (arr.some(Boolean)) o.paneEntities = arr; else delete o.paneEntities;
  if (n <= 1) delete o.paneHinges; else if (Array.isArray(o.paneHinges)) o.paneHinges = o.paneHinges.slice(0, n);
  return o;
}
/** the words under a pane: turns (and tilts, with a tilt contact), tilts, swings out, fixed */
export function paneCaption(o, kind) {
  if (kind === 'fixed') return 'v2.cap.fixed';
  if (kind === 'bottom') return 'v2.cap.tilt';
  if (kind === 'top') return 'v2.cap.top';
  return o?.tiltEntity ? 'v2.cap.turnTilt' : 'v2.cap.turn';
}

/** the window drawn from the front, every pane as it looks open (the owner's choice B, 2026-11-09): turned to the side, tilted at the top,
 *  swung out at the bottom; fixed glass plain. An svg text; every pane is a <g data-pane="i"> to tap, pane sel is marked; captions: the
 *  words under the panes (already in the language). px: the height of the drawing. */
export function windowSvg(o, { sel = -1, px = 150, captions = null, maxW = 300 } = {}) {
  const w = Math.max(0.2, Number(o?.width) || 1), h = Math.max(0.2, Number(o?.height) || 1);
  let H = px, W = Math.round(px * w / h);
  if (W > maxW) { H = Math.round(H * maxW / W); W = maxW; }
  const pad = 8, F = 6, capH = captions ? 26 : 0, VW = W + pad * 2, VH = H + pad * 2 + capH;
  const { below, above } = fixedGlass(o), bandLo = below ? Math.round(H * below / h) : 0, bandHi = above ? Math.round(H * above / h) : 0;
  const kinds = paneKinds(o), n = kinds.length;
  const glass = 'fill="#bfe0fb" stroke="#c4d0dc" stroke-width="3"';
  let s = `<svg class="v2Win" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}" role="img"><rect x="${pad}" y="${pad}" width="${W}" height="${H}" rx="3" fill="#e9eef3" stroke="#aab7c4"/>`;
  const top = pad + F + bandHi, inH = H - F * 2 - bandLo - bandHi, pw = (W - F * 2) / n;
  kinds.forEach((k, i) => {
    const x = +(pad + F + i * pw + 2).toFixed(1), y = top + 2, ww = +(pw - 4).toFixed(1), hh = inH - 4, on = i === sel;
    const frame = `stroke="${on ? '#ffd45c' : '#c4d0dc'}" stroke-width="${on ? 4 : 3}"`;
    s += `<g data-pane="${i}" class="v2Pane${on ? ' on' : ''}" style="cursor:pointer">`;
    if (k === 'fixed') {
      s += `<rect x="${x}" y="${y}" width="${ww}" height="${hh}" fill="#cfe5f8" ${frame}/>`;
    } else {
      s += `<rect x="${x}" y="${y}" width="${ww}" height="${hh}" fill="#2b3946" ${frame}/>`;   // the hole behind the open pane
      if (k === 'bottom') {                 // tilted: the top comes into the room
        const d = ww * 0.12, y0 = y + hh * 0.14;
        s += `<polygon points="${x + d},${y0} ${x + ww - d},${y0} ${x + ww},${y + hh} ${x},${y + hh}" ${glass}/><rect x="${x + ww / 2 - 8}" y="${y0 + 4}" width="16" height="5" rx="2" fill="#4b5d70"/>`;
      } else if (k === 'top') {             // swung out at the bottom: the bottom comes forward
        const d = ww * 0.12, y1 = y + hh * 0.86;
        s += `<polygon points="${x},${y} ${x + ww},${y} ${x + ww - d},${y1} ${x + d},${y1}" ${glass}/><rect x="${x + ww / 2 - 8}" y="${y1 - 10}" width="16" height="5" rx="2" fill="#4b5d70"/>`;
      } else {                              // turned: the free side swings into the room
        const left = k === 'left', fx = left ? x + ww * 0.62 : x + ww * 0.38, hx = left ? x : x + ww;
        s += `<polygon points="${hx},${y} ${fx},${y - hh * 0.06} ${fx},${y + hh * 1.06} ${hx},${y + hh}" ${glass}/><rect x="${left ? fx - 8 : fx + 3}" y="${y + hh / 2 - 9}" width="5" height="18" rx="2" fill="#4b5d70"/>`;
      }
    }
    s += `<rect x="${x}" y="${y}" width="${ww}" height="${hh}" fill="transparent"${on ? ' stroke="#ffd45c" stroke-width="4"' : ''}/></g>`;   // the whole pane can be tapped; the chosen one framed on top
    if (captions) s += `<text x="${x + ww / 2}" y="${pad + H + 20}" text-anchor="middle" font-size="12" font-weight="700" fill="#9fb3c8">${esc(captions[i] || '')}</text>`;
  });
  const band = (y0, hh) => `<rect x="${pad + F + 2}" y="${y0 + 2}" width="${W - F * 2 - 4}" height="${hh - 4}" fill="#cfe5f8" stroke="#c4d0dc" stroke-width="3"/>`;
  if (bandHi) s += band(pad + F, bandHi);
  if (bandLo) s += band(pad + H - F - bandLo, bandLo);
  return `${s}</svg>`;
}
const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---- the kinds of window as pictures ---- */
const near = (a, b) => Math.abs((Number(a) || 0) - (Number(b) || 0)) < 0.011;
/** the kind (a key of the opening palette) window o was made as, by its look and size; '' when its size was changed (own sizes) */
export function windowKind(o, presets) {
  for (const [k, p] of Object.entries(presets || {})) {
    if (p.type !== 'window' || (o.style || 'double') !== p.style || o.panes != null) continue;
    if (near(o.width, p.width) && near(o.height, p.height) && near(o.sill, p.sill) && near(o.fixedBelow, p.fixedBelow) && !o.fixedAbove) return k;
  }
  return '';
}
/** window o as kind p (a preset of the opening palette): look, size, sill and fixed glass; the panes it had go, a pane's own contacts
 *  only so many as it has now; a hinge it had stays (a single pane keeps opening the same way). Returns o. */
export function applyWindowKind(o, p) {
  if (o?.type !== 'window' || p?.type !== 'window') return o;
  o.style = p.style; o.width = p.width; o.height = p.height; o.sill = p.sill;
  delete o.panes; delete o.paneHinges; delete o.fixedAbove;
  if (p.fixedBelow) o.fixedBelow = p.fixedBelow; else delete o.fixedBelow;
  if (p.style === 'fixed') ['paneEntities', 'tiltEntity', 'tiltDeg', 'fixedBelow'].forEach((k) => delete o[k]);
  else if (Array.isArray(o.paneEntities)) {
    const n = windowPanes(o), arr = o.paneEntities.slice(0, n > 1 ? n : 0);
    if (arr.some(Boolean)) o.paneEntities = arr; else delete o.paneEntities;
  }
  return o;
}

/* ---- the lines of the sections: what is set ---- */
/** the line of section key of an object of kind pk: [text key, values], or null (h: { len(m) a length as shown, name(entity) }) */
export function summary(pk, key, it, h = {}) {
  const len = h.len || ((m) => `${(+m || 0).toFixed(2)} m`);
  const ent = (e) => (h.name ? h.name(e) : e);
  if (pk === 'window' || pk === 'door') {
    if (key === 'size') return pk === 'window' ? ['v2.sum.size', { w: len(it.width), h: len(it.height), s: len(it.sill || 0) }] : ['v2.sum.sizeDoor', { w: len(it.width), h: len(it.height) }];
    if (key === 'panes') {
      if (it.style === 'fixed') return ['v2.sum.fixedGlazing', {}];
      const kinds = paneKinds(it), turn = kinds.filter((k) => k === 'left' || k === 'right').length;
      const how = turn ? (it.tiltEntity ? 'v2.cap.turnTilt' : 'v2.cap.turn') : kinds.every((k) => k === 'fixed') ? 'v2.cap.fixed' : kinds.includes('bottom') ? 'v2.cap.tilt' : 'v2.cap.top';
      return ['v2.sum.panes', { n: kinds.length, how: { key: how }, dir: { key: it.openOutward ? 'v2.out' : 'v2.in' } }];
    }
    if (key === 'fixed') {
      const { below, above } = fixedGlass(it);
      if (!below && !above) return ['v2.sum.none', {}];
      return ['v2.sum.fixedGlass', { lo: below ? len(below) : '–', hi: above ? len(above) : '–' }];
    }
    if (key === 'contact') {
      const extra = (it.paneEntities || []).filter(Boolean).length;
      if (!it.entity && !extra) return ['v2.sum.noContact', {}];
      return [it.tiltEntity ? 'v2.sum.contactTilt' : 'v2.sum.contact', { e: it.entity ? ent(it.entity) : `${extra} ×` }];
    }
    if (key === 'shutter') return it.shutter || it.shutterEntity ? (it.shutterEntity ? ['v2.sum.is', { x: ent(it.shutterEntity) }] : ['v2.sum.yes', {}]) : ['v2.sum.noneM', {}];
    if (key === 'style') return [`st.${it.style || 'single'}`, {}];
    if (key === 'more') return pk === 'window' && it.style !== 'fixed' ? ['v2.sum.tiltDeg', { d: tiltDeg(it) }] : null;
    if (key === 'look') return it.look && (it.look.leaf || it.look.frame) ? ['v2.sum.ownColors', {}] : ['v2.sum.houseColors', {}];   // #754
  }
  if (pk === 'device') {
    if (key === 'entity') return it.entity ? ['v2.sum.is', { x: ent(it.entity) }] : ['v2.sum.noEntity', {}];
    if (key === 'place') return ['v2.sum.place', { x: len(it.x), z: len(it.z), r: Math.round(it.rot || 0), y: len(it.y || 0) }];
    if (key === 'dsize') return it.scale && it.scale !== 1 ? ['v2.sum.scale', { k: +(+it.scale).toFixed(2) }] : null;
    if (key === 'tilt') {
      const bits = [];
      if (it.tiltX) bits.push(`${it.tiltX}°`);
      if (it.tiltZ) bits.push(`${it.tiltZ}°`);
      if (it.mirror) return ['v2.sum.mirror', { x: bits.join(' · ') }];
      return bits.length ? ['v2.sum.is', { x: bits.join(' · ') }] : ['v2.sum.nothing', {}];
    }
  }
  if (pk === 'wall' && key === 'wsize') return ['v2.sum.wall', { d: len(it.thickness), h: len(it.height) }];
  if (pk === 'stair') {
    if (key === 'form') return ['v2.sum.stairForm', { dir: { key: it.dir === 'down' ? 'stair.down' : 'stair.up' }, w: len(it.w) }];
    if (key === 'steps') return Number.isFinite(+it.steps) && +it.steps > 0 ? ['v2.sum.steps', { n: Math.round(+it.steps) }] : ['v2.sum.stepsAuto', {}];
    if (key === 'place') return ['v2.sum.where', { x: len(it.x), z: len(it.z), r: Math.round(it.rot || 0) }];
    if (key === 'look') return it.covering ? ['v2.sum.is', { x: { key: `cover.${it.covering}` } }] : it.color || it.rail || it.riser ? ['v2.sum.ownColors', {}] : null;   // #753
  }
  if (pk === 'hole' && key === 'form') {
    const pts = it.points || [];
    return ['v2.sum.holeForm', { n: pts.length, a: h.area ? h.area(polyArea2(pts)) : `${polyArea2(pts).toFixed(1)} m²` }];
  }
  if (pk === 'block' && key === 'bsize') return it.h ? ['v2.sum.height', { h: len(it.h) }] : ['v2.sum.heightFloor', {}];
  return null;                                   // no line: the section says enough
}
/** a line [key, values] in the language: values that are { key } are texts too */
export function sayLine(t, line) {
  if (line == null) return '';
  if (typeof line === 'string') return line;
  const [k, v] = line, vals = {};
  for (const [a, b] of Object.entries(v || {})) vals[a] = b && typeof b === 'object' ? t(b.key) : b;
  return t(k, vals);
}

/* ---- the floor of a room seen from the side ---- */
/** a small picture of a room's floor higher (+) or lower (−) than its storey (m): the storey's floor left and right, the room's floor
 *  between, a person on it, the difference in cm. An svg text; labels in the language. */
export function levelSvg(raise, { storey = 'Etage', room = 'Raum' } = {}) {
  const r = Math.max(-1, Math.min(1, Number(raise) || 0)), cm = Math.round(r * 100);
  const dy = Math.max(-16, Math.min(16, Math.round(r * 60)));       // drawn: 15 cm a quarter of a step, at most 16 px
  const y0 = 40, yr = y0 - dy;
  let s = `<svg class="v2Level" viewBox="0 0 160 84" width="160" height="84" role="img"><rect x="0" y="${y0}" width="44" height="8" fill="#6d7a87"/><rect x="116" y="${y0}" width="44" height="8" fill="#6d7a87"/>`;
  s += `<rect x="44" y="${yr}" width="72" height="8" fill="#b08355"/><path d="M44 ${Math.min(y0, yr)}V${Math.max(y0, yr) + 8}M116 ${Math.min(y0, yr)}V${Math.max(y0, yr) + 8}" stroke="#6d7a87" stroke-width="2"/>`;
  s += `<circle cx="80" cy="${yr - 22}" r="4" fill="#dfe7ef"/><path d="M80 ${yr - 18}v9M74 ${yr - 14}h12M80 ${yr - 9}l-4 9M80 ${yr - 9}l4 9" stroke="#dfe7ef" stroke-width="2" fill="none"/>`;
  if (cm) s += `<path d="M124 ${y0}V${yr}M120 ${y0}h8M120 ${yr}h8" stroke="#ffd45c" stroke-width="2"/><text x="131" y="${(y0 + yr) / 2 + 4}" font-size="11" font-weight="800" fill="#ffd45c">${cm > 0 ? '+' : '−'}${Math.abs(cm)}</text>`;
  s += `<text x="2" y="${y0 - 6}" font-size="10.5" font-weight="700" fill="#9fb3c8">${esc(storey)}</text><text x="80" y="80" text-anchor="middle" font-size="10.5" font-weight="800" fill="#dfe7ef">${esc(room)}</text>`;
  return `${s}</svg>`;
}

/* ---- the head of the panel ---- */
const ICONS = { living: '🛋', kitchen: '🍳', bath: '🛁', bedroom: '🛏', office: '💻', lighting: '💡', smart: '📡', power: '⚡', outdoor: '🌳', decor: '🖼' };
/** the sign in the head: a window, a door, a room, a wall, a stair, a device by its category */
export function headIcon(pk, it, cat = '') {
  if (pk === 'window') return '🪟';
  if (pk === 'door') return it?.style === 'garage' ? '🚗' : '🚪';
  if (pk === 'room') return '▢';
  if (pk === 'wall') return '🧱';
  if (pk === 'stair') return '🪜';
  if (pk === 'hole') return '⬚';
  if (pk === 'block') return '🧊';
  if (pk === 'plot') return '🗺';
  if (pk === 'yard') return '🌱';
  if (pk === 'cable') return '🔌';
  if (/^(tv|tv_wall|tv_arm)$/.test(it?.type || '')) return '📺';
  return ICONS[cat] || '📦';
}
/** the path above the head: house › floor › room (if any) › the object; [{ text, sel }] where sel is what a tap selects (null: nothing) */
export function crumbs({ house, floor, room, name, kind }) {
  const out = [];
  if (house) out.push({ text: `🏠 ${house}`, sel: null });
  if (floor && !OUTSIDE_KINDS.includes(kind)) out.push({ text: floor, sel: null });
  if (room && kind !== 'room') out.push({ text: room.name || '?', sel: { kind: 'room', id: room.id } });
  out.push({ text: name, sel: undefined });
  return out;
}

/** the area of a polygon [[x, z], …] (m²) */
function polyArea2(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const [x1, z1] = pts[i], [x2, z2] = pts[(i + 1) % pts.length]; a += x1 * z2 - x2 * z1; }
  return Math.abs(a) / 2;
}
