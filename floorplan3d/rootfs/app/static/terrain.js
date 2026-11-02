/* ⛰ The terrain of the plot (#629): the ground is no longer flat when spot heights are set (layout.plot.terrain.points: { id, x, z, h },
 * h in m over the floor of the ground floor, the same 0 as the flat lawn). Between the points the ground runs straight:
 * - one point: everywhere its height; two (or all on one line): an even slope between them, level before and behind (a plot on a hillside:
 *   the garden above, the street below);
 * - three and more: triangles between them (Delaunay), straight inside each; outside them the height of the nearest point of their edge.
 * The house never moves with the terrain: only the lawn, the earth, the areas of the plot and the garden things stand on it (terrain3d.js,
 * yard3d.js, levels.js lifter). Here: the height at a place, the triangles of a surface split small enough to follow it, the contour lines
 * of the 2D plan, the two points of "a slope in one step", which devices stand on it.
 * Pure (no three.js, no DOM; unit test: tests/terrain.test.mjs). */
import { pointInPoly } from './rooms.js';

export const TERRAIN = { maxPoints: 40, maxH: 20, step: 0.5, contour: 0.5, contours: [0, 0.25, 0.5, 1], wallGap: 0.6, maxLevels: 80 };

const r2 = (v) => Math.round(v * 100) / 100;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** the terrain as stored: { points (at most maxPoints, h within ±maxH, a place used twice only once: the last), contours (the distance of
 *  the contour lines in the plan, 0 = none) }, or null when it has no point */
export function cleanTerrain(t) {
  const raw = (Array.isArray(t?.points) ? t.points : []).filter((p) => p && [p.x, p.z, p.h].every((v) => v !== null && v !== '' && Number.isFinite(+v)));
  const seen = new Map();
  raw.forEach((p) => seen.set(`${r2(+p.x)},${r2(+p.z)}`, { id: String(p.id || ''), x: r2(+p.x), z: r2(+p.z), h: r2(clamp(+p.h, -TERRAIN.maxH, TERRAIN.maxH)) }));
  const points = [...seen.values()].slice(0, TERRAIN.maxPoints);
  if (!points.length) return null;
  const c = t.contours === undefined ? TERRAIN.contour : +t.contours;
  return { points, contours: TERRAIN.contours.includes(c) ? c : TERRAIN.contour };
}
/** does the plan have a terrain (any spot height) */
export const hasTerrain = (layout) => !!cleanTerrain(layout?.plot?.terrain);

/* ---------- the height at a place ---------- */
const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
/** do all points lie on one line (within 1 cm over the longest distance between two of them) */
function onOneLine(P) {
  let a = P[0], b = P[0], d = 0;
  P.forEach((p) => P.forEach((q) => { const e = Math.hypot(p.x - q.x, p.z - q.z); if (e > d) { d = e; a = p; b = q; } }));
  if (d < 1e-6) return { line: true, a, b, d };
  return { line: P.every((p) => Math.abs(cross([a.x, a.z], [b.x, b.z], [p.x, p.z])) / d < 0.01), a, b, d };
}
/** Delaunay triangles of points [[x, z], ...] (Bowyer-Watson; they must not all lie on one line): [[i, j, k], ...] */
export function delaunay(pts) {
  const n = pts.length, xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs), m = Math.max(x1 - x0, z1 - z0, 1) * 20;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const P = [...pts, [cx - m, cz - m], [cx + m, cz - m], [cx, cz + m]];
  const circ = (t) => {                                        // the circle through the three corners: centre and radius squared
    const [a, b, c] = t.map((i) => P[i]), d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
    if (Math.abs(d) < 1e-12) return { x: 0, z: 0, r: Infinity };
    const A = a[0] ** 2 + a[1] ** 2, B = b[0] ** 2 + b[1] ** 2, C = c[0] ** 2 + c[1] ** 2;
    const x = (A * (b[1] - c[1]) + B * (c[1] - a[1]) + C * (a[1] - b[1])) / d, z = (A * (c[0] - b[0]) + B * (a[0] - c[0]) + C * (b[0] - a[0])) / d;
    return { x, z, r: (a[0] - x) ** 2 + (a[1] - z) ** 2 };
  };
  let tris = [{ v: [n, n + 1, n + 2] }];
  tris[0].c = circ(tris[0].v);
  for (let i = 0; i < n; i++) {
    const [px, pz] = P[i], bad = tris.filter((t) => (px - t.c.x) ** 2 + (pz - t.c.z) ** 2 <= t.c.r * (1 + 1e-9));
    const edges = new Map();
    bad.forEach((t) => [[t.v[0], t.v[1]], [t.v[1], t.v[2]], [t.v[2], t.v[0]]].forEach(([a, b]) => {
      const k = a < b ? `${a},${b}` : `${b},${a}`;
      edges.set(k, edges.has(k) ? null : [a, b]);
    }));
    tris = tris.filter((t) => !bad.includes(t));
    edges.forEach((e) => { if (!e) return; const t = { v: [e[0], e[1], i] }; t.c = circ(t.v); tris.push(t); });
  }
  return tris.filter((t) => t.v.every((k) => k < n)).map((t) => t.v)
    .filter(([a, b, c]) => Math.abs(cross(pts[a], pts[b], pts[c])) > 1e-9);
}
/** the edges of the triangles that belong to one triangle only: the outline round all points */
function hullEdges(tris) {
  const count = new Map();
  tris.forEach(([a, b, c]) => [[a, b], [b, c], [c, a]].forEach(([p, q]) => { const k = p < q ? `${p},${q}` : `${q},${p}`; count.set(k, (count.get(k) || 0) + 1); }));
  return [...count].filter(([, n]) => n === 1).map(([k]) => k.split(',').map(Number));
}
/** the height of the ground at (x, z) as a function (x, z) => h; 0 everywhere without a terrain */
export function heightField(t) {
  const c = cleanTerrain(t);
  if (!c) return () => 0;
  const P = c.points;
  if (P.length === 1) { const h = P[0].h; return () => h; }
  const { line, a, b, d } = onOneLine(P);
  if (line) {                                                   // an even slope along the line, level before and behind it
    if (d < 1e-6) { const h = P[P.length - 1].h; return () => h; }
    const ux = (b.x - a.x) / d, uz = (b.z - a.z) / d;
    const along = P.map((p) => ({ s: (p.x - a.x) * ux + (p.z - a.z) * uz, h: p.h })).sort((p, q) => p.s - q.s);
    return (x, z) => {
      const s = (x - a.x) * ux + (z - a.z) * uz;
      if (s <= along[0].s) return along[0].h;
      for (let i = 1; i < along.length; i++) {
        if (s <= along[i].s) { const p = along[i - 1], q = along[i], k = q.s - p.s < 1e-9 ? 1 : (s - p.s) / (q.s - p.s); return p.h + (q.h - p.h) * k; }
      }
      return along[along.length - 1].h;
    };
  }
  const pts = P.map((p) => [p.x, p.z]), H = P.map((p) => p.h), tris = delaunay(pts), hull = hullEdges(tris);
  const boxes = tris.map(([i, j, k]) => [Math.min(pts[i][0], pts[j][0], pts[k][0]) - 1e-9, Math.max(pts[i][0], pts[j][0], pts[k][0]) + 1e-9,
    Math.min(pts[i][1], pts[j][1], pts[k][1]) - 1e-9, Math.max(pts[i][1], pts[j][1], pts[k][1]) + 1e-9]);
  return (x, z) => {
    for (let n = 0; n < tris.length; n++) {
      const bx = boxes[n];
      if (x < bx[0] || x > bx[1] || z < bx[2] || z > bx[3]) continue;
      const [i, j, k] = tris[n], A = pts[i], B = pts[j], C = pts[k], den = cross(A, B, C);
      const wa = cross([x, z], B, C) / den, wb = cross(A, [x, z], C) / den, wc = 1 - wa - wb;
      if (wa >= -1e-9 && wb >= -1e-9 && wc >= -1e-9) return wa * H[i] + wb * H[j] + wc * H[k];
    }
    let best = Infinity, h = 0;                                // outside: the nearest point of the outline round the points
    hull.forEach(([i, j]) => {
      const A = pts[i], B = pts[j], ex = B[0] - A[0], ez = B[1] - A[1], L2 = ex * ex + ez * ez || 1;
      const k = clamp(((x - A[0]) * ex + (z - A[1]) * ez) / L2, 0, 1), dd = (x - A[0] - ex * k) ** 2 + (z - A[1] - ez * k) ** 2;
      if (dd < best) { best = dd; h = H[i] + (H[j] - H[i]) * k; }
    });
    return h;
  };
}
/** the lowest and the highest ground over a polygon (its corners and points inside every `step` m): [min, max] */
export function rangeOver(hf, poly, step = TERRAIN.step) {
  let lo = Infinity, hi = -Infinity;
  const see = (x, z) => { const h = hf(x, z); if (h < lo) lo = h; if (h > hi) hi = h; };
  poly.forEach(([x, z], i) => {
    const [x2, z2] = poly[(i + 1) % poly.length], n = Math.max(1, Math.ceil(Math.hypot(x2 - x, z2 - z) / step));
    for (let k = 0; k < n; k++) see(x + ((x2 - x) * k) / n, z + ((z2 - z) * k) / n);
  });
  const xs = poly.map((p) => p[0]), zs = poly.map((p) => p[1]);
  for (let x = Math.min(...xs) + step / 2; x < Math.max(...xs); x += step) for (let z = Math.min(...zs) + step / 2; z < Math.max(...zs); z += step) if (pointInPoly(x, z, poly)) see(x, z);
  return lo === Infinity ? [0, 0] : [lo, hi];
}

/* ---------- surfaces that follow the ground ---------- */
/** the triangles of a surface (a flat list x, y, z, x, y, z, ... three corners each) split at their longest side until no side is longer than
 *  `len`, so that the corners can follow the ground. At most `max` triangles (else the rest stays as it is). Returns a new flat list */
export function splitTris(pos, len = TERRAIN.step, max = 120000) {
  const out = [], L2 = len * len;
  const d2 = (p, a, b) => (p[a] - p[b]) ** 2 + (p[a + 1] - p[b + 1]) ** 2 + (p[a + 2] - p[b + 2]) ** 2;
  const stack = [];
  for (let i = 0; i + 8 < pos.length; i += 9) stack.push(pos.slice(i, i + 9));
  while (stack.length) {
    const t = stack.pop(), ab = d2(t, 0, 3), bc = d2(t, 3, 6), ca = d2(t, 6, 0), m = Math.max(ab, bc, ca);
    if (m <= L2 || out.length / 9 + stack.length + 2 > max) { for (let k = 0; k < 9; k++) out.push(t[k]); continue; }
    const mid = (a, b) => [(t[a] + t[b]) / 2, (t[a + 1] + t[b + 1]) / 2, (t[a + 2] + t[b + 2]) / 2];
    const A = t.slice(0, 3), B = t.slice(3, 6), C = t.slice(6, 9);
    if (m === ab) { const q = mid(0, 3); stack.push([...A, ...q, ...C], [...q, ...B, ...C]); }
    else if (m === bc) { const q = mid(3, 6); stack.push([...A, ...B, ...q], [...A, ...q, ...C]); }
    else { const q = mid(6, 0); stack.push([...A, ...B, ...q], [...q, ...B, ...C]); }
  }
  return out;
}
/** the corners of an indexed or plain list of triangles as a flat list x, y, z, ... (three corners each) */
export function flatTris(positions, index = null) {
  if (!index) return Array.from(positions);
  const out = [];
  for (let i = 0; i < index.length; i++) { const k = index[i] * 3; out.push(positions[k], positions[k + 1], positions[k + 2]); }
  return out;
}

/* ---------- the contour lines of the plan ---------- */
/** the contour lines over box [x0, x1, z0, z1] every `step` m (cells of `cell` m): [{ level, segs: [[xa, za, xb, zb], ...] }], the lowest
 *  first; none when step is 0 or the ground is level; at most maxLevels lines */
export function contourLines(hf, box, step = TERRAIN.contour, cell = 0.25) {
  if (!(step > 0)) return [];
  const [x0, x1, z0, z1] = box, nx = Math.max(1, Math.ceil((x1 - x0) / cell)), nz = Math.max(1, Math.ceil((z1 - z0) / cell));
  const dx = (x1 - x0) / nx, dz = (z1 - z0) / nz, V = [];
  let lo = Infinity, hi = -Infinity;
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const h = hf(x0 + i * dx, z0 + j * dz); V.push(h); if (h < lo) lo = h; if (h > hi) hi = h; }
  if (hi - lo < 1e-6) return [];
  const first = Math.ceil((lo + 1e-9) / step) * step, out = [];
  for (let lv = first; lv < hi - 1e-9 && out.length < TERRAIN.maxLevels; lv += step) {
    const level = r2(lv), segs = [];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const c = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, b]) => ({ x: x0 + a * dx, z: z0 + b * dz, h: V[b * (nx + 1) + a] }));
      const cuts = [];
      for (let k = 0; k < 4; k++) {
        const p = c[k], q = c[(k + 1) % 4];
        if ((p.h < level) !== (q.h < level)) { const f = (level - p.h) / (q.h - p.h); cuts.push([r2(p.x + (q.x - p.x) * f), r2(p.z + (q.z - p.z) * f)]); }
      }
      if (cuts.length >= 2) segs.push([...cuts[0], ...cuts[1]]);
      if (cuts.length === 4) segs.push([...cuts[2], ...cuts[3]]);
    }
    if (segs.length) out.push({ level, segs });
  }
  return out;
}

/* ---------- a slope in one step ---------- */
/** the direction of the longest side of the outline of a house (radians), null without one: a slope runs square to the house */
export function mainAxis(rings) {
  let best = 0, ang = null;
  (rings || []).forEach((r) => r.forEach((p, i) => { const q = r[(i + 1) % r.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L > best) { best = L; ang = Math.atan2(q[1] - p[1], q[0] - p[0]); } }));
  return ang;
}
/** the two spot heights of an even slope across the house: the ground falls `drop` m towards `toward` [x, z] (a point on the low side, the
 *  street); the high point (0, the ground floor) lies at the far face of the house, the low one (-drop) at the near face, both on the line
 *  through the middle of the house. corners: the outline of the house [[x, z], ...]; axis (mainAxis): the slope runs along it or square to
 *  it, whichever is nearest to the tap. Returns [high, low] ({ x, z, h }) or null */
export function slopePoints(corners, toward, drop, axis = null) {
  if (!corners?.length || !toward) return null;
  const cx = corners.reduce((s, p) => s + p[0], 0) / corners.length, cz = corners.reduce((s, p) => s + p[1], 0) / corners.length;
  let ux = toward[0] - cx, uz = toward[1] - cz;
  const L = Math.hypot(ux, uz);
  if (L < 0.5) return null;
  ux /= L; uz /= L;
  if (axis !== null && Number.isFinite(axis)) {                // square to the house: the nearest of its four directions
    const a = Math.atan2(uz, ux), k = Math.round((a - axis) / (Math.PI / 2)), s = axis + k * (Math.PI / 2);
    ux = Math.round(Math.cos(s) * 1e9) / 1e9; uz = Math.round(Math.sin(s) * 1e9) / 1e9;
  }
  const along = corners.map(([x, z]) => (x - cx) * ux + (z - cz) * uz), back = Math.min(...along), front = Math.max(...along);
  return [{ x: r2(cx + ux * back), z: r2(cz + uz * back), h: 0 }, { x: r2(cx + ux * front), z: r2(cz + uz * front), h: r2(-Math.abs(+drop || 0)) }];
}

/* ---------- what stands on it ---------- */
const distSeg = (x, z, a, b) => {
  const ex = b[0] - a[0], ez = b[1] - a[1], L2 = ex * ex + ez * ez;
  const k = L2 ? clamp(((x - a[0]) * ex + (z - a[1]) * ez) / L2, 0, 1) : 0;
  return Math.hypot(x - a[0] - ex * k, z - a[1] - ez * k);
};
/** does device d of floor f (the ground floor) stand on the terrain: outside its rooms and blocks, and a garden thing (`garden`: a Set of
 *  types) or more than wallGap m away from every wall (a lamp or a camera on the facade stays where it is) */
export function onTerrain(d, f, garden = new Set()) {
  const x = +d?.x || 0, z = +d?.z || 0;
  if ([...(f?.rooms || []), ...(f?.blocks || [])].some((r) => (r.points || []).length >= 3 && pointInPoly(x, z, r.points))) return false;
  if (garden.has(d.type)) return true;
  return (f?.walls || []).every((w) => distSeg(x, z, w.a, w.b) - (+w.thickness || 0.2) / 2 > TERRAIN.wallGap);
}

/** the height of the ground of a stored terrain, worked out again only when the terrain changes: memo(t) => (x, z) => h, or null on level
 *  ground */
export function memoField() {
  let key = null, hf = null;
  return (t) => { const k = JSON.stringify(t ?? null); if (k !== key) { key = k; hf = cleanTerrain(t) ? heightField(t) : null; } return hf; };
}
/** for levels.js lifter: { at, stands } on the ground floor of a plan on a slope, else null. hf: memoField's result; f: the floor built;
 *  ground: the ground floor; garden: the types of garden things */
export function standsOn(hf, f, ground, garden) {
  return hf && f && ground && f.id === ground.id ? { at: hf, stands: (d) => onTerrain(d, f, garden) } : null;
}
