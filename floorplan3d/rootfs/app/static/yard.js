/* 🏡 The plot (Grundstück) and the areas on it (#538): a yard of paving, a terrace of wood, the gravel of the drive, a bed, a pond ...
 * drawn in the 2D plan like a room and lying flat on the ground in 3D, each with its surface (Belag). The plot shows its size, its sides
 * and how long each one is; a side can be set to a length typed in (a rectangle stays a rectangle), a plot can be a rectangle round the
 * house in one tap. Pure (unit test: tests/yard.test.mjs): the surfaces, measuring, changing a side, cleaning what is stored.
 * plotui.js is the palette and the side panel, yard3d.js lays the areas on the ground, plan2d.js draws and edits them. */
import { resolve, isPattern } from './finishes.js';
import { cleanPlateau } from './levels.js';

/** the surfaces an area can have: icon, the finish it is drawn with (finishes.js: a pattern with its colours and size), water: a pond
 *  (no pattern, it shines); the order is the order of the palette */
export const SURFACES = {
  lawn: { icon: '🌱', spec: { pattern: 'carpet', color: '#5f9446', size: 0.6 } },
  paving: { icon: '🧱', spec: { pattern: 'paving' } },
  cobble: { icon: '🪨', spec: { pattern: 'cobble' } },
  slabs: { icon: '⬜', spec: { pattern: 'stoneSlabs' } },
  flagstone: { icon: '🗿', spec: { pattern: 'flagstone' } },
  deck: { icon: '🪵', spec: { pattern: 'deck' } },
  gravel: { icon: '⚪', spec: { pattern: 'terrazzo', color: '#bcb3a5', color2: '#6f665c', size: 0.25 } },
  bed: { icon: '🌷', spec: { pattern: 'cork', color: '#5a4030', size: 0.3 } },
  concrete: { icon: '▫', spec: { pattern: 'concrete' } },
  asphalt: { icon: '⬛', spec: { pattern: 'concrete', color: '#46484c', size: 1.5 } },
  sand: { icon: '🏖', spec: { pattern: 'cork', color: '#dcc794', size: 0.2 } },
  water: { icon: '💧', water: true, color: '#3f7fa8' },
};
export const SURFACE_KEYS = Object.keys(SURFACES);
export const DEFAULT_SURFACE = 'paving';
export const MAX_AREAS = 60;
const MAX_POINTS = 200, LIMIT = 10000;

/** the finish a surface is drawn with in 3D (finishes.js resolve), null for water */
export const surfaceFinish = (key) => (SURFACES[key]?.spec && isPattern(SURFACES[key].spec.pattern) ? resolve(SURFACES[key].spec) : null);
/** the colour of a surface from afar ('#rrggbb'): the 2D plan, the hologram, the "fast" mode */
export const surfaceColor = (key) => SURFACES[key]?.color || surfaceFinish(key)?.mean || '#8f8a84';

/* ---------- measuring ---------- */
const r3 = (v) => Math.round(v * 1000) / 1000;
/** the area enclosed by the corners (m²), its sign tells the direction they run in */
export function signedArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const [x1, z1] = pts[i], [x2, z2] = pts[(i + 1) % pts.length]; a += x1 * z2 - x2 * z1; }
  return a / 2;
}
export const polyArea = (pts) => Math.abs(signedArea(pts || []));
/** the length all round (m) */
export const perimeter = (pts) => (pts || []).reduce((s, p, i, a) => s + Math.hypot(a[(i + 1) % a.length][0] - p[0], a[(i + 1) % a.length][1] - p[1]), 0);
/** the sides: [{ i, a, b, len, mid, out }] (out: the direction away from the inside, for the label of its length) */
export function edgeList(pts) {
  const n = (pts || []).length, sgn = signedArea(pts || []) >= 0 ? 1 : -1;
  return Array.from({ length: n }, (_, i) => {
    const a = pts[i], b = pts[(i + 1) % n], len = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / (len || 1), uz = (b[1] - a[1]) / (len || 1);
    return { i, a, b, len, mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], out: [uz * sgn || 0, -ux * sgn || 0] };
  });
}
/** is it a rectangle (4 corners, every angle right within half a degree) */
export function isRect(pts) {
  if (!Array.isArray(pts) || pts.length !== 4) return false;
  return edgeList(pts).every((e, i, all) => {
    const f = all[(i + 1) % 4];
    if (e.len < 1e-6 || f.len < 1e-6) return false;
    const dot = ((e.b[0] - e.a[0]) * (f.b[0] - f.a[0]) + (e.b[1] - e.a[1]) * (f.b[1] - f.a[1])) / (e.len * f.len);
    return Math.abs(dot) < 0.009;
  });
}
/** a rectangle's width and depth (its first and second side), null when it is none */
export const rectSize = (pts) => (isRect(pts) ? [edgeList(pts)[0].len, edgeList(pts)[1].len] : null);

/** side i set to len metres: the corner at its end moves along it; when the next side stands at a right angle to it, that side moves
 *  along too (so a rectangle stays a rectangle and an L keeps its right angles). A new list, the old one stays */
export function setEdgeLength(pts, i, len) {
  const n = pts?.length || 0;
  if (n < 3 || !(len > 0.05) || !(i >= 0 && i < n)) return pts;
  const a = pts[i], j = (i + 1) % n, k = (i + 2) % n, b = pts[j], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (L < 1e-6) return pts;
  const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, d = len - L, out = pts.map((p) => [p[0], p[1]]);
  out[j] = [r3(b[0] + ux * d), r3(b[1] + uz * d)];
  const c = pts[k], vx = c[0] - b[0], vz = c[1] - b[1], V = Math.hypot(vx, vz);
  if (n >= 4 && k !== i && V > 1e-6 && Math.abs((ux * vx + uz * vz) / V) < 0.009) out[k] = [r3(c[0] + ux * d), r3(c[1] + uz * d)];
  return out;
}
/** a rectangle w x d (its first side w, its second d), the first corner stays */
export function setRectSize(pts, w, d) {
  if (!isRect(pts)) return pts;
  return setEdgeLength(setEdgeLength(pts, 0, w), 1, d);
}
/** the rectangle between two corners a and b, its corners clockwise in the plan (x right, z down) */
export function rectFrom(a, b) {
  const x0 = r3(Math.min(a[0], b[0])), x1 = r3(Math.max(a[0], b[0])), z0 = r3(Math.min(a[1], b[1])), z1 = r3(Math.max(a[1], b[1]));
  return x1 - x0 < 0.05 || z1 - z0 < 0.05 ? null : [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
}
/** the rectangle `margin` metres round a box { x0, x1, z0, z1 } (the house), on whole decimetres */
export function rectAround(box, margin) {
  if (!box || ![box.x0, box.x1, box.z0, box.z1].every(Number.isFinite)) return null;
  const m = Math.max(0, Math.min(500, Number(margin) || 0)), d = (v) => Math.round(v * 10) / 10;
  return rectFrom([d(box.x0 - m), d(box.z0 - m)], [d(box.x1 + m), d(box.z1 + m)]);
}
/** the box round every corner of the house (walls, rooms, blocks of every floor), null without any */
export function houseBox(floors) {
  const all = (floors || []).flatMap((f) => [...(f.walls || []).flatMap((w) => [w.a, w.b]), ...(f.rooms || []).flatMap((r) => r.points), ...(f.blocks || []).flatMap((b) => b.points)])
    .filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (!all.length) return null;
  const xs = all.map((p) => p[0]), zs = all.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
}
/** is (x, z) within tol metres of a side of the outline (the plot is picked by its edge, its inside stays free for the areas) */
export function nearEdge(pts, x, z, tol) {
  return edgeList(pts).some(({ a, b, len }) => {
    const t = len < 1e-9 ? 0 : Math.max(0, Math.min(1, ((x - a[0]) * (b[0] - a[0]) + (z - a[1]) * (b[1] - a[1])) / (len * len)));
    return Math.hypot(x - (a[0] + (b[0] - a[0]) * t), z - (a[1] + (b[1] - a[1]) * t)) <= tol;
  });
}
/** the area under (x, z): the last drawn lies on top. inside(x, z, points) */
export function areaAt(areas, x, z, inside) {
  for (let i = (areas || []).length - 1; i >= 0; i--) if (inside(x, z, areas[i].points)) return areas[i];
  return null;
}
/** how much of every surface there is: [{ surface, m2, n }], the most first */
export function surfaceTotals(areas) {
  const by = new Map();
  (areas || []).forEach((a) => { const o = by.get(a.surface) || { surface: a.surface, m2: 0, n: 0 }; o.m2 += polyArea(a.points); o.n++; by.set(a.surface, o); });
  return [...by.values()].sort((p, q) => q.m2 - p.m2);
}

/* ---------- what is stored: layout.plot = { boundary, areas: [{ id, name, surface, points, rise?, edge?, wall? }] } ---------- */
const okPt = (p) => Array.isArray(p) && p.length >= 2 && [p[0], p[1]].every((v) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= LIMIT);
/** a list of corners as stored: 3 to 200 points [x, z] with an area, else null */
export function cleanPoints(v) {
  if (!Array.isArray(v) || v.length < 3 || v.length > MAX_POINTS || !v.every(okPt)) return null;
  const pts = v.map((p) => [r3(p[0]), r3(p[1])]);
  return polyArea(pts) >= 0.01 ? pts : null;
}
/** an area as stored: { id, name, surface, points } (a plateau also { rise, edge, wall }), null when its corners are not usable */
export function cleanArea(v, uid = () => `y${Math.random().toString(36).slice(2, 9)}`) {
  const points = cleanPoints(v?.points);
  if (!points) return null;
  const id = typeof v.id === 'string' && /^[\w-]{1,40}$/.test(v.id) ? v.id : uid();
  const name = typeof v.name === 'string' ? v.name.trim().slice(0, 40) : '';
  return { id, name, surface: SURFACE_KEYS.includes(v.surface) ? v.surface : DEFAULT_SURFACE, points, ...cleanPlateau(v) };   // a plateau: rise, edge, wall (levels.js, #566)
}
/** the areas as stored: each one usable once (by its id), at most MAX_AREAS */
export function cleanAreas(list, uid) {
  const out = [], ids = new Set();
  (Array.isArray(list) ? list : []).forEach((v) => {
    const a = out.length < MAX_AREAS ? cleanArea(v, uid) : null;
    if (a && !ids.has(a.id)) { ids.add(a.id); out.push(a); }
  });
  return out;
}
