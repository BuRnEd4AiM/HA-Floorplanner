/* Cabinet builder ("Schrank (selbst bauen)"): a cabinet made of columns (each with its width, what is inside and its front), cut by up to two
 * roof slopes so it fits under a Dachschräge, in the colours chosen. Pure maths, no three.js, no DOM (unit test: tests/closet.test.mjs):
 * closet3d.js turns the solids into meshes, closetview.js draws the front and side views of the editor (closetui.js).
 *
 * The settings live on the device as `cab`: { cols: [{ w, fill, n, low, front, hinge }], h, d, plinth, slopes: [{ side, low, deg }], body, front,
 * handle, metal, doors, led }. The width of the cabinet is the sum of its columns.
 * Local frame: x across the width (-W/2 .. W/2, left to right seen from the front), y up from the bottom, z from the back (-D/2) to the front
 * (+D/2). A slope lowers the top towards one side: at that edge the cabinet is `low` high, from there it rises at `deg` degrees (the roof
 * pitch) up to the full height. */

export const T = 0.019;                     // board thickness
export const GAP = 0.003;                   // gap around doors and drawer fronts
const BACK = 0.008, FRONT = 0.019, DRAWER = 0.2, RECESS = 0.04, EPS = 1e-7;
export const FILLS = ['rail', 'rail2', 'shelves', 'drawers', 'empty'];
export const FRONTS = ['door', 'glass', 'mirror', 'open'];
export const SIDES = ['left', 'right', 'back', 'front'];
export const HANDLES = ['bar', 'knob', 'long', 'none'];
export const METALS = ['steel', 'black', 'brass'];
export const DOORS = ['hinged', 'sliding'];
export const MAX_COLS = 12, MAX_SLOPES = 2;
export const LIM = { w: [0.15, 2], h: [0.3, 3.5], d: [0.2, 1.2], plinth: [0, 0.25], low: [0.1, 3.5], deg: [5, 75], n: [0, 12], drawers: [1, 10], lowDrawers: [0, 6] };
/** the colours offered in the editor (any other colour can be picked too) */
export const COLORS = {
  white: '#f1efe9', cashmere: '#d9cfc1', grey: '#c8c9c7', sage: '#9fae95', blue: '#6f8597', anthracite: '#3d4045', black: '#1f2023',
  oaklight: '#cfae82', oak: '#b48a5c', walnut: '#6e4c35',
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const r3 = (v) => Math.round(v * 1000) / 1000;
const num = (v, [lo, hi], def) => (typeof v === 'number' && Number.isFinite(v) ? r3(clamp(v, lo, hi)) : def);
const oneOf = (v, list, def) => (list.includes(v) ? v : def);
const hex = (v, def) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : def);
const whole = (v, [lo, hi], def) => (typeof v === 'number' && Number.isFinite(v) ? clamp(Math.round(v), lo, hi) : def);

const col = (w, fill, extra = {}) => ({ w, fill, ...extra });
/** ready-made cabinets to start from (the editor's "Vorlage") */
export const PRESETS = {
  wardrobe2: () => ({ h: 2.2, d: 0.6, cols: [col(0.5, 'rail'), col(0.5, 'shelves', { n: 5 })] }),
  wardrobe3: () => ({ h: 2.2, d: 0.6, cols: [col(0.5, 'rail'), col(0.5, 'shelves', { n: 3, low: 2 }), col(0.5, 'rail')] }),
  wardrobe4: () => ({ h: 2.3, d: 0.62, doors: 'sliding', cols: [col(0.5, 'rail'), col(0.5, 'rail2'), col(0.5, 'shelves', { n: 4, low: 2 }), col(0.5, 'rail')] }),
  attic: () => ({ h: 2.2, d: 0.6, slopes: [{ side: 'left', low: 1.0, deg: 40 }], cols: [col(0.6, 'shelves', { n: 3 }), col(0.6, 'shelves', { n: 4 }), col(0.6, 'rail')] }),
  knee: () => ({ h: 1.5, d: 0.6, slopes: [{ side: 'back', low: 1.0, deg: 40 }], cols: [col(0.6, 'drawers', { n: 3 }), col(0.6, 'shelves', { n: 2 }), col(0.6, 'shelves', { n: 2 }), col(0.6, 'drawers', { n: 3 })] }),
  shelf: () => ({ h: 2.0, d: 0.35, cols: [col(0.6, 'shelves', { n: 4, front: 'open' }), col(0.6, 'shelves', { n: 4, front: 'open' })] }),
  chest: () => ({ h: 0.86, d: 0.45, plinth: 0.06, cols: [col(0.6, 'drawers', { n: 4 }), col(0.6, 'drawers', { n: 4 })] }),
  hall: () => ({ h: 2.0, d: 0.4, cols: [col(0.8, 'rail', { front: 'open', low: 1 }), col(0.5, 'shelves', { n: 4, front: 'mirror' })] }),
};
export const PRESET_KEYS = Object.keys(PRESETS);

/** one column, cleaned: width, what is inside (n: shelves or drawers), drawers at the bottom under the door (low), the front, the hinge */
export function cleanCol(c) {
  const s = c && typeof c === 'object' ? c : {};
  const fill = oneOf(s.fill, FILLS, 'shelves');
  const o = { w: num(s.w, LIM.w, 0.5), fill };
  if (fill === 'shelves') o.n = whole(s.n, LIM.n, 4);
  if (fill === 'drawers') o.n = whole(s.n, LIM.drawers, 4);
  else {
    const low = whole(s.low, LIM.lowDrawers, 0);
    if (low) o.low = low;
    o.front = oneOf(s.front, FRONTS, 'door');
  }
  if (s.hinge === 'l' || s.hinge === 'r') o.hinge = s.hinge;
  return o;
}
/** the whole cabinet, cleaned: everything in its limits, unknown values back to the default (a three-door wardrobe) */
export function cleanCloset(cab) {
  const s = cab && typeof cab === 'object' ? cab : {};
  const cols = (Array.isArray(s.cols) && s.cols.length ? s.cols : PRESETS.wardrobe3().cols).slice(0, MAX_COLS).map(cleanCol);
  const h = num(s.h, LIM.h, 2.2), seen = new Set();
  const slopes = (Array.isArray(s.slopes) ? s.slopes : []).filter((q) => q && SIDES.includes(q.side) && !seen.has(q.side) && seen.add(q.side))
    .slice(0, MAX_SLOPES).map((q) => ({ side: q.side, low: Math.min(num(q.low, LIM.low, 1), h), deg: num(q.deg, LIM.deg, 35) }));
  return {
    cols, h, d: num(s.d, LIM.d, 0.6), plinth: Math.min(num(s.plinth, LIM.plinth, 0.08), r3(h / 3)), slopes,
    body: hex(s.body, COLORS.white), front: hex(s.front, COLORS.white), handle: oneOf(s.handle, HANDLES, 'bar'), metal: oneOf(s.metal, METALS, 'steel'),
    doors: oneOf(s.doors, DOORS, 'hinged'), led: s.led === true,
  };
}
export const closetPreset = (key) => cleanCloset({ ...(PRESETS[key] || PRESETS.wardrobe3)(), body: COLORS.white, front: COLORS.white });
/** the width of a cabinet: its columns side by side */
export const closetW = (c) => r3(c.cols.reduce((s, q) => s + q.w, 0));
/** the size of a cabinet in metres (for the size fields and the plan) */
export function closetSize(cab) { const c = cleanCloset(cab); return { x: closetW(c), y: c.h, z: c.d }; }

/** a new total width: every column grows or shrinks by the same factor (whole centimetres, the last one takes the rest) */
export function setWidth(cab, W) {
  const c = cleanCloset(cab), n = c.cols.length, old = closetW(c);
  const want = clamp(W, LIM.w[0] * n, LIM.w[1] * n), k = want / old;
  let rest = want;
  c.cols.forEach((q, i) => {
    const w = i === n - 1 ? rest : Math.round(clamp(q.w * k, LIM.w[0], LIM.w[1]) * 100) / 100;
    q.w = r3(clamp(w, LIM.w[0], LIM.w[1]));
    rest -= q.w;
  });
  return c;
}
/** all columns equally wide (same total width) */
export function evenCols(cab) {
  const c = cleanCloset(cab), W = closetW(c), n = c.cols.length, w = Math.floor((W / n) * 1000) / 1000;
  c.cols.forEach((q, i) => { q.w = i === n - 1 ? r3(W - w * (n - 1)) : w; });
  return c;
}
/** a size handle in the plan was dragged: the width (all columns) or the depth */
export function resizeTo(cab, which, ext) {
  if (which === 'x') return setWidth(cab, ext);
  const c = cleanCloset(cab);
  c.d = num(ext, LIM.d, c.d);
  return c;
}
/** which side a door opens to: chosen, else in pairs (the first of a pair has its hinge on the left, the handle on the right) */
export const hingeOf = (c, i) => c.cols[i]?.hinge || (i % 2 === 0 ? 'l' : 'r');

/* ---------- slopes ---------- */
const tanOf = (s) => Math.tan((s.deg * Math.PI) / 180);
/** a slope as the plane a*x + b*y + c*z + e >= 0 (kept: under it), for a cabinet W wide and D deep */
export function slopePlane(s, W, D) {
  const k = tanOf(s);
  if (s.side === 'left') return [k, -1, 0, s.low + (k * W) / 2];
  if (s.side === 'right') return [-k, -1, 0, s.low + (k * W) / 2];
  if (s.side === 'back') return [0, -1, k, s.low + (k * D) / 2];
  return [0, -1, -k, s.low + (k * D) / 2];
}
/** how much higher the inside of a sloped board ends than its top (a board T thick across the slope is this high) */
const vertT = (s) => T * Math.hypot(1, tanOf(s));
/** the height of the top of the cabinet at (x, z): the full height or lower under a slope */
export function topAt(c, x, z) {
  const W = closetW(c);
  return c.slopes.reduce((h, s) => { const [a, , cc, e] = slopePlane(s, W, c.d); return Math.min(h, a * x + cc * z + e); }, c.h);
}
/** the height of the inside at (x, z): under the top board or under a sloped board */
export function innerTop(c, x, z) {
  const W = closetW(c);
  return c.slopes.reduce((h, s) => { const [a, , cc, e] = slopePlane(s, W, c.d); return Math.min(h, a * x + cc * z + e - vertT(s)); }, c.h - T);
}
/** the top line of the cabinet along x (at depth z) or along z (at x): [[u, y], ...] from `from` to `to`, with every kink (where a slope meets
 *  the full height or another slope) */
export function topLine(c, axis, at, from, to) {
  const W = closetW(c);
  const lines = [[c.h, 0], ...c.slopes.map((s) => { const [a, , cc, e] = slopePlane(s, W, c.d); return axis === 'x' ? [cc * at + e, a] : [a * at + e, cc]; })];
  const us = [from, to];
  for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) {
    const [a1, b1] = lines[i], [a2, b2] = lines[j];
    if (Math.abs(b1 - b2) > 1e-12) { const u = (a2 - a1) / (b1 - b2); if (u > from && u < to) us.push(u); }
  }
  return [...new Set(us.map(r3))].sort((p, q) => p - q).map((u) => [u, Math.max(0, Math.min(...lines.map(([a, b]) => a + b * u)))]);
}

/* ---------- the layout: where everything goes (shared by the 3D model and the views) ---------- */
/** the columns with their place and what is in them: xa..xb (outside), ia..ib (inside), drawers at the bottom (yD: their top), the inside
 *  from yA up to top, the shelves, the rails (with the stretch they fit in), the drawers, the door and a filler panel above the drawers under a slope */
export function closetLayout(cab) {
  const c = cleanCloset(cab), W = closetW(c), H = c.h, D = c.d, P = c.plinth, x0 = -W / 2, z0 = -D / 2, z1 = D / 2, n = c.cols.length;
  let xa = x0;
  const cols = c.cols.map((q, i) => {
    const xb = xa + q.w, ia = i === 0 ? xa + T : xa + T / 2, ib = i === n - 1 ? xb - T : xb - T / 2;
    const fronts = [topAt(c, xa, z1), topAt(c, xb, z1)], frontLow = Math.min(...fronts), frontHigh = Math.max(...fronts);
    const tops = [ia, ib].flatMap((x) => [innerTop(c, x, z0 + BACK), innerTop(c, x, z1)]), top = Math.max(...tops), topLow = Math.min(...tops);
    const o = { i, xa, xb, ia, ib, fill: q.fill, front: q.fill === 'drawers' ? 'drawers' : q.front, hinge: hingeOf(c, i), top, topLow, frontLow, frontHigh,
      shelves: [], rails: [], drawers: [], door: null, filler: null, led: null, yD: P, yA: P + T, low: 0 };
    if (q.fill === 'drawers') {
      const yZ = Math.max(P + 0.05, frontLow - GAP), h = (yZ - P) / q.n;
      for (let k = 0; k < q.n; k++) o.drawers.push({ y0: P + k * h + GAP / 2, y1: P + (k + 1) * h - GAP / 2 });
      if (frontHigh - yZ > 0.02) o.filler = { y0: yZ + GAP / 2 };
      o.yA = yZ;
    } else {
      o.low = Math.max(0, Math.min(q.low || 0, Math.floor((frontLow - P - T - 0.25) / DRAWER)));
      if (o.low) {
        o.yD = P + o.low * DRAWER;
        for (let k = 0; k < o.low; k++) o.drawers.push({ y0: P + k * DRAWER + GAP / 2, y1: P + (k + 1) * DRAWER - GAP / 2 });
        o.yA = o.yD + T;
      }
      if (o.front !== 'open') o.door = { y0: (o.low ? o.yD : P) + GAP / 2 };
      const room = top - o.yA;
      if (q.fill === 'shelves') for (let k = 1; k <= q.n; k++) o.shelves.push(o.yA + (room * k) / (q.n + 1) - T / 2);
      else if (q.fill === 'rail') {
        if (room > 1.25) { const ys = top - 0.3; o.shelves.push(ys); o.rails.push(ys - 0.06); }   // a shelf for hats, the rail under it
        else if (room > 0.6) o.rails.push(top - 0.06);
      } else if (q.fill === 'rail2' && room > 0.5) o.rails.push(top - 0.06, o.yA + room / 2 - 0.04);
    }
    o.rails = o.rails.map((y) => ({ y, ...railSpan(c, ia + 0.005, ib - 0.005, y) })).filter((r) => r.x1 - r.x0 >= 0.12);
    if (c.led && q.fill !== 'drawers') {                                                   // the LED strip under the top near the front, under a slope too
      const y = Math.max(...[ia + 0.02, ib - 0.02].map((x) => Math.min(innerTop(c, x, z1 - 0.07), innerTop(c, x, z1 - 0.045)))) - 0.002;
      if (y - o.yA > 0.3) o.led = { y };
    }
    xa = xb;
    return o;
  });
  return { c, W, H, D, P, x0, z0, z1, cols };
}
const ROD = 0.0125;
/** the stretch of a rail (a rod along x at height y in the middle of the depth) that stays under the slopes */
function railSpan(c, x0, x1, y) {
  const W = closetW(c);
  c.slopes.forEach((s) => {
    const [a, b, cc, e] = slopePlane(s, W, c.d), e2 = e - vertT(s);
    for (const z of [-ROD, ROD]) {
      const rest = b * (y + ROD) + cc * z + e2;          // a*x + rest >= 0
      if (Math.abs(a) < 1e-12) { if (rest < 0) x1 = x0 - 1; } else if (a > 0) x0 = Math.max(x0, -rest / a); else x1 = Math.min(x1, -rest / a);
    }
  });
  return { x0, x1 };
}

/* ---------- the parts: boxes cut by the slopes ---------- */
/** the parts of a cabinet as boxes [x0, x1, y0, y1, z0, z1] with their material (body, back, plinth, front, glass, mirror, metal, led) and how
 *  the slopes cut them ('out': at the top of the sloped board, 'in': under it, 'front': a door's gap below it; `under`: the sloped board of that
 *  slope), and the rails as rods { rod: [x0, x1, y, z, r] } */
export function closetParts(cab) {
  const L = closetLayout(cab), { c, W, H, D, P, x0, z0, z1 } = L, x1 = -x0, parts = [];
  const add = (m, b, cut = 'out', extra) => parts.push({ m, b, cut, ...extra });
  if (P > 0.005) add('plinth', [x0 + T, x1 - T, 0, P, z0 + 0.02, z1 - RECESS]);
  add('body', [x0, x0 + T, 0, H, z0, z1]);
  add('body', [x1 - T, x1, 0, H, z0, z1]);
  add('body', [x0 + T, x1 - T, P, P + T, z0, z1]);
  add('body', [x0 + T, x1 - T, H - T, H, z0, z1]);
  add('back', [x0 + T, x1 - T, P + T, H - T, z0, z0 + BACK]);
  c.slopes.forEach((s, i) => add('body', [x0, x1, 0, H, z0, z1], 'out', { under: i }));
  const sliding = c.doors === 'sliding', front = (m, xa, xb, y0, z = z1) => add(m, [xa, xb, y0, H - GAP / 2, z, z + FRONT], 'front');
  L.cols.forEach((q) => {
    if (q.i > 0) add('body', [q.xa - T / 2, q.xa + T / 2, P + T, H - T, z0 + BACK, z1], 'in');
    if (q.low) add('body', [q.ia, q.ib, q.yD, q.yD + T, z0 + BACK, z1], 'in');
    q.shelves.forEach((y) => add('body', [q.ia, q.ib, y, y + T, z0 + BACK, z1 - 0.01], 'in'));
    q.rails.forEach((r) => parts.push({ m: 'metal', rod: [r.x0, r.x1, r.y, 0, ROD] }));
    q.drawers.forEach((d) => {
      add('front', [q.xa + GAP / 2, q.xb - GAP / 2, d.y0, d.y1, z1, z1 + FRONT], 'front');
      handle(add, c, (q.xa + q.xb) / 2, d, z1 + FRONT, 'drawer', q.xb - q.xa);
    });
    if (q.filler) front('front', q.xa + GAP / 2, q.xb - GAP / 2, q.filler.y0);
    if (q.door) {
      const m = q.front === 'door' ? 'front' : q.front;
      const z = sliding ? z1 + (q.i % 2 ? 0.002 : 0.004 + FRONT) : z1;
      const [da, db] = sliding ? [Math.max(x0, q.xa - 0.01), Math.min(x1, q.xb + 0.01)] : [q.xa + GAP / 2, q.xb - GAP / 2];
      front(m, da, db, q.door.y0, z);
      const hx = q.hinge === 'l' ? db - 0.04 : da + 0.04, ft = topAt(c, hx, z1) - GAP;
      handle(add, c, hx, { y0: q.door.y0, y1: ft }, z + FRONT, 'door');
    }
    if (q.led) add('led', [q.ia + 0.02, q.ib - 0.02, q.led.y - 0.01, q.led.y, z1 - 0.07, z1 - 0.045], 'in');
  });
  if (sliding && L.cols.some((q) => q.door)) {                             // the tracks of the sliding doors, at the top and at the bottom
    add('metal', [x0, x1, H - 0.012, H, z1, z1 + 0.05], 'out');
    const b0 = Math.max(0, P - 0.012);
    add('metal', [x0, x1, b0, b0 + 0.012, z1, z1 + 0.05], 'out');
  }
  return { parts, W, H, D };
}
/** a handle on a door (vertical, at x) or a drawer front (horizontal, in its middle), as the cabinet's handle style */
function handle(add, c, x, { y0, y1 }, z, kind, w = 0.5) {
  if (c.handle === 'none' || y1 - y0 < 0.06) return;
  const zz = [z, z + 0.028];
  if (c.handle === 'knob') {
    const lo = y0 + 0.08, hi = y1 - 0.08, y = kind === 'drawer' || hi < lo ? (y0 + y1) / 2 : clamp(1.05, lo, hi);
    add('metal', [x - 0.0125, x + 0.0125, y - 0.0125, y + 0.0125, ...zz], 'front');
  } else if (kind === 'drawer') {
    const half = c.handle === 'long' ? w / 2 - 0.04 : Math.min(0.08, w / 4), y = c.handle === 'long' ? y1 - 0.02 : y1 - Math.min(0.06, (y1 - y0) / 2);
    add('metal', [x - half, x + half, y - 0.006, y + 0.006, ...zz], 'front');
  } else if (c.handle === 'long') add('metal', [x - 0.007, x + 0.007, y0 + 0.05, y1 - 0.05, ...zz], 'front');
  else {
    const len = Math.min(0.24, (y1 - y0) * 0.5), lo = y0 + 0.06 + len / 2, hi = y1 - 0.06 - len / 2, y = hi < lo ? (y0 + y1) / 2 : clamp(1.05, lo, hi);
    add('metal', [x - 0.006, x + 0.006, y - len / 2, y + len / 2, ...zz], 'front');
  }
}

/* ---------- convex solids: faces (polygons of [x, y, z], counter-clockwise seen from outside) cut by planes ---------- */
export function boxFaces([x0, x1, y0, y1, z0, z1]) {
  return [
    [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]],
    [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]],
    [[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]],
  ];
}
const val = (p, pl) => pl[0] * p[0] + pl[1] * p[1] + pl[2] * p[2] + pl[3];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** the normal of a polygon (Newell), not normalised */
export function faceNormal(f) {
  const n = [0, 0, 0];
  f.forEach((p, i) => { const q = f[(i + 1) % f.length]; n[0] += (p[1] - q[1]) * (p[2] + q[2]); n[1] += (p[2] - q[2]) * (p[0] + q[0]); n[2] += (p[0] - q[0]) * (p[1] + q[1]); });
  return n;
}
/** a convex solid cut by the plane pl (kept: a*x + b*y + c*z + e >= 0): its faces, with the new face on the plane; null when nothing is left */
export function clipSolid(faces, pl) {
  let most = -Infinity, cutAny = false;
  const out = [], on = [];
  for (const f of faces) {
    const vs = f.map((p) => val(p, pl));
    most = Math.max(most, ...vs);
    if (vs.every((v) => v >= -EPS)) { out.push(f); f.forEach((p, i) => { if (Math.abs(vs[i]) <= EPS) on.push(p); }); continue; }
    cutAny = true;
    const nf = [];
    f.forEach((p, i) => {
      const j = (i + 1) % f.length, q = f[j], vp = vs[i], vq = vs[j];
      if (vp >= -EPS) nf.push(p);
      if (Math.abs(vp) <= EPS) on.push(p);
      if ((vp > EPS && vq < -EPS) || (vp < -EPS && vq > EPS)) {
        const t = vp / (vp - vq), r = [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
        nf.push(r); on.push(r);
      }
    });
    if (nf.length >= 3) out.push(nf);
  }
  if (most <= EPS) return null;
  if (!cutAny) return faces;
  const cap = capFace(on, [-pl[0], -pl[1], -pl[2]]);
  if (cap) out.push(cap);
  return out.map(tidy).filter(Boolean);
}
/** the points where a cut went through, as one polygon facing n */
function capFace(pts, n) {
  const uniq = [];
  pts.forEach((p) => { if (!uniq.some((q) => Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) + Math.abs(q[2] - p[2]) < 1e-6)) uniq.push(p); });
  if (uniq.length < 3) return null;
  const c = uniq.reduce((s, p) => [s[0] + p[0] / uniq.length, s[1] + p[1] / uniq.length, s[2] + p[2] / uniq.length], [0, 0, 0]);
  const u = Math.abs(n[0]) < 0.9 ? cross(n, [1, 0, 0]) : cross(n, [0, 1, 0]), w = cross(n, u);
  return uniq.map((p) => { const d = sub(p, c); return { p, a: Math.atan2(dot(d, w), dot(d, u)) }; }).sort((a, b) => a.a - b.a).map((q) => q.p);
}
/** a face without repeated corners; null when it has no area left */
function tidy(f) {
  const g = f.filter((p, i) => { const q = f[(i + 1) % f.length]; return Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) + Math.abs(q[2] - p[2]) > 1e-7; });
  if (g.length < 3) return null;
  const n = faceNormal(g);
  return Math.hypot(...n) > 1e-10 ? g : null;
}
/** the volume of a closed solid (for the tests) */
export function volume(faces) {
  let v = 0;
  faces.forEach((f) => { for (let i = 1; i < f.length - 1; i++) v += dot(f[0], cross(f[i], f[i + 1])); });
  return v / 6;
}
/** a rod along x from x0 to x1 (an eight-sided prism) */
function rodFaces([x0, x1, y, z, r]) {
  const ring = Array.from({ length: 8 }, (_, k) => [y + r * Math.cos((k * Math.PI) / 4), z + r * Math.sin((k * Math.PI) / 4)]);
  const faces = ring.map(([py, pz], k) => { const [qy, qz] = ring[(k + 1) % 8]; return [[x0, py, pz], [x0, qy, qz], [x1, qy, qz], [x1, py, pz]]; });
  faces.push(ring.map(([py, pz]) => [x0, py, pz]), ring.map(([py, pz]) => [x1, py, pz]));
  const mid = [(x0 + x1) / 2, y, z];
  return faces.map((f) => { const c = f.reduce((s, p) => [s[0] + p[0], s[1] + p[1], s[2] + p[2]], [0, 0, 0]).map((v) => v / f.length); return dot(faceNormal(f), sub(c, mid)) < 0 ? f.reverse() : f; });
}

/** the whole cabinet as faces by material: { body: [face, ...], front: [...], ... }, ready to be turned into meshes */
export function closetSolids(cab) {
  const { parts, W, H, D } = closetParts(cab), c = cleanCloset(cab), out = {};
  const planes = c.slopes.map((s) => ({ pl: slopePlane(s, W, D), t: vertT(s) }));
  const shift = (pl, dy) => [pl[0], pl[1], pl[2], pl[3] - dy];
  parts.forEach((p) => {
    let faces = p.rod ? rodFaces(p.rod) : boxFaces(p.b);
    if (!p.rod) {
      const cuts = planes.map(({ pl, t }) => shift(pl, p.cut === 'in' ? t : p.cut === 'front' ? GAP / 2 : 0));
      if (p.under !== undefined) { const { pl, t } = planes[p.under]; cuts.push([-pl[0], -pl[1], -pl[2], -pl[3] + t]); }
      for (const pl of cuts) { faces = clipSolid(faces, pl); if (!faces) return; }
    }
    if (faces.length >= 4) (out[p.m] ||= []).push(...faces);
  });
  return { faces: out, W, H, D };
}

/* ---------- fitting a cabinet under the roof ---------- */
/** the settings that make the cabinet fit under the roof over it: the roof's slopes over its place (planes in the world frame as roofPlanes in
 *  attic.js gives them: [nx, ny, nz, d] kept where nx*x + ny*y + nz*z + d >= 0, a piece of a slope with [.., axisX, from, to]), the device
 *  (x, z, rot in degrees, mirror) and the height of its bottom in the same frame. Returns { cab, slopes: how many, lowered: the full height
 *  had to come down } or null when no slope is over the cabinet; { error: 'low' } when the roof is too low for any cabinet there */
export function fitToRoof(cab, dev, planes, baseY) {
  const c = cleanCloset(cab), W = closetW(c), D = c.d, th = ((dev?.rot || 0) * Math.PI) / 180, co = Math.cos(th), si = Math.sin(th), sm = dev?.mirror ? -1 : 1;
  const world = (lx, lz) => [dev.x + sm * lx * co + lz * si, dev.z - sm * lx * si + lz * co];
  const corners = [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]];
  const local = [];
  (planes || []).forEach((p) => {
    const [nx, ny, nz, d] = p;
    if (!(ny < -1e-6)) return;
    if (p.length >= 7) { const us = corners.map(([lx, lz]) => world(lx, lz)[p[4] ? 0 : 1]); if (Math.max(...us) < p[5] || Math.min(...us) > p[6]) return; }
    local.push({ gx: (sm * (nx * co - nz * si)) / -ny, gz: (nx * si + nz * co) / -ny, h0: (nx * dev.x + nz * dev.z + d) / -ny - baseY });
  });
  if (!local.length) return null;
  const MARGIN = 0.01, at = (q, lx, lz) => q.h0 + q.gx * lx + q.gz * lz, roofAt = (lx, lz) => Math.min(...local.map((q) => at(q, lx, lz)));
  let most = -Infinity;                                                           // the highest point of the roof over the cabinet (a ridge can be inside)
  for (let i = 0; i <= 20; i++) for (let j = 0; j <= 6; j++) most = Math.max(most, roofAt(-W / 2 + (W * i) / 20, -D / 2 + (D * j) / 6));
  let h = Math.min(c.h, Math.floor((most - MARGIN) * 100) / 100);
  if (h < LIM.h[0]) return { error: 'low' };
  const cands = [];
  local.forEach((q) => {
    const low = Math.min(...corners.map(([lx, lz]) => at(q, lx, lz)));
    if (low >= h - 0.005) return;                                                  // this slope is above the cabinet
    const g = Math.hypot(q.gx, q.gz);
    if (g < Math.tan((LIM.deg[0] * Math.PI) / 180)) { h = Math.min(h, Math.floor((low - MARGIN) * 100) / 100); return; }   // (nearly) flat over it
    const alongX = Math.abs(q.gx) >= Math.abs(q.gz), k = alongX ? Math.abs(q.gx) : Math.abs(q.gz);
    const side = alongX ? (q.gx > 0 ? 'left' : 'right') : (q.gz > 0 ? 'back' : 'front');
    const edge = alongX ? [[side === 'left' ? -W / 2 : W / 2, -D / 2], [side === 'left' ? -W / 2 : W / 2, D / 2]] : [[-W / 2, side === 'back' ? -D / 2 : D / 2], [W / 2, side === 'back' ? -D / 2 : D / 2]];
    cands.push({ side, low: Math.min(...edge.map(([lx, lz]) => at(q, lx, lz))) - MARGIN, deg: Math.floor(((Math.atan(k) * 180) / Math.PI) * 10) / 10, worst: low });
  });
  if (h < LIM.h[0]) return { error: 'low' };
  const slopes = [];
  cands.sort((a, b) => a.worst - b.worst).forEach((s) => { if (slopes.length < MAX_SLOPES && !slopes.some((q) => q.side === s.side)) slopes.push(s); });
  const out = cleanCloset({ ...c, h, slopes: slopes.map((s) => ({ side: s.side, low: Math.max(LIM.low[0], Math.min(h, Math.floor(s.low * 100) / 100)), deg: clamp(s.deg, ...LIM.deg) })) });
  return { cab: out, slopes: out.slopes.length, lowered: h < c.h - 0.005, tight: slopes.some((s) => s.low < 0.3) };
}
