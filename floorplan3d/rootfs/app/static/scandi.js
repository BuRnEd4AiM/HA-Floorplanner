/* Furniture in the style of the well-known Scandinavian flat-pack classics: cube shelves, the white bookcase, the swing armchair, chests of
 * drawers, wardrobes, beds, desks, the kids' room, the hall, paper lamps ... Own simple models with the real sizes of such pieces, no files
 * of any shop (the names of the shop's pieces only work as search words). Pure geometry, no three.js: every piece is a list of parts in
 * metres, the front towards +z, standing on y = 0 and centred on its footprint. models.js turns the parts into meshes (scandiModel),
 * plan2d.js takes the footprint from them (footOf), the side panel offers the finishes (white, black-brown, oak ...). Unit tests:
 * tests/scandi.test.mjs
 *
 * A part: { s: 'box', w, h, d } | { s: 'cyl', r (top), r2 (bottom), h, seg } | { s: 'ball', r, sx, sy, sz } with x, z (its middle), y (its
 * bottom before it is turned), m (the material: 'f' the finish, 'f2' the finish a little darker, else a key of MATS) and rx, ry, rz (turned
 * round its middle, in the order of three.js). */

/** the finishes a piece can have (side panel: "Ausführung"); rough / metal: how the surface looks */
export const FINISHES = {
  white: { c: '#f1efea' }, blackbrown: { c: '#3b3330' }, oak: { c: '#c49b6a' }, birch: { c: '#dcc59e' }, pine: { c: '#ddb883' },
  walnut: { c: '#6e4f3a' }, grey: { c: '#9b9d9e' }, bamboo: { c: '#cfae74' }, black: { c: '#2b2b2d' }, terracotta: { c: '#b4633c' },
  turquoise: { c: '#3e9c97', metal: 0.3, rough: 0.5 }, alu: { c: '#c4c8cc', metal: 0.6, rough: 0.35 },
  lightgrey: { c: '#b9bbbd', rough: 0.95 }, darkgrey: { c: '#5c6066', rough: 0.95 }, beige: { c: '#d5c7ae', rough: 0.95 },
  blue: { c: '#4d6a8f', rough: 0.9 }, green: { c: '#62795d', rough: 0.9 }, rust: { c: '#a65a3c', rough: 0.95 }, yellow: { c: '#d9a93b', rough: 0.9 },
};
/** the fixed materials (glow: the shade of a lamp, lights up with its entity) */
export const MATS = {
  line: { c: '#55504b' }, metal: { c: '#bfc3c7', metal: 0.6, rough: 0.35 }, black: { c: '#2a2a2c' }, white: { c: '#f4f3ef' },
  glass: { c: '#cfe6f0', opacity: 0.3, rough: 0.1 }, mirror: { c: '#d3e4ee', metal: 0.3, rough: 0.08 }, birch: { c: '#dcc59e' }, wood: { c: '#6a4e39' },
  mattress: { c: '#f2f0ea', rough: 0.95 }, duvet: { c: '#c8d2dc', rough: 0.95 }, pillow: { c: '#fbfaf7', rough: 0.95 },
  ceramic: { c: '#f6f7f7', rough: 0.25 }, basin: { c: '#e2e7ea', rough: 0.25 }, basket: { c: '#b08d5f', rough: 0.95 }, fabricbox: { c: '#8f8b84', rough: 0.95 },
  pot: { c: '#b4633c' }, leaf: { c: '#3f8a4a' }, stem: { c: '#5f7d3c' }, soil: { c: '#4a3727', rough: 1 },
  shark: { c: '#7393ad', rough: 0.95 }, belly: { c: '#f3f4f2', rough: 0.95 }, eye: { c: '#1d1d1f', rough: 0.3 }, kidblue: { c: '#3f7cc4' }, kidpink: { c: '#e98ab0' },
  book1: { c: '#a83b32' }, book2: { c: '#2f5f8a' }, book3: { c: '#3c7d4a' }, book4: { c: '#d0a23c' }, book5: { c: '#e8e2d4' },
  cloth1: { c: '#c94f3d', rough: 0.95 }, cloth2: { c: '#3d5a80', rough: 0.95 }, cloth3: { c: '#e0d6c3', rough: 0.95 }, cloth4: { c: '#6b8f71', rough: 0.95 },
  bin1: { c: '#7cb66b' }, bin2: { c: '#4a90c8' }, bin3: { c: '#f2f2ee' }, bin4: { c: '#e9c548' },
  glow: { c: '#fff2cc', glow: true },
};

/** '#rrggbb' times k (darker below 1) */
export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), ch = (v) => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0');
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}
/** the material of a part (m) in finish `fin`: { c, rough?, metal?, opacity?, glow? } */
export function matOf(m, fin) {
  const f = FINISHES[fin] || FINISHES.white;
  if (m === 'f') return f;
  if (m === 'f2') return { ...f, c: shade(f.c, fin === 'white' ? 0.92 : 0.8) };
  return MATS[m];
}

/* ---------- building blocks ---------- */
const B = (w, h, d, x = 0, y = 0, z = 0, m = 'f', rot = {}) => ({ s: 'box', w, h, d, x, y, z, m, ...rot });
const C = (r, h, x = 0, y = 0, z = 0, m = 'f', r2 = r, seg = 16) => ({ s: 'cyl', r, r2, h, x, y, z, m, seg });
const S = (r, x = 0, y = 0, z = 0, m = 'f', sx = 1, sy = 1, sz = 1) => ({ s: 'ball', r, x, y, z, m, sx, sy, sz });
const prism = (r, h, x, cy, z, m, rot) => ({ s: 'cyl', r, r2: r, h, x, y: cy - h / 2, z, m, seg: 3, ...rot });   // a triangle (fins, leaves), cy: its middle
const sub = (q, p) => [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
/** a round rod from point p to point q (its own y axis turned onto p -> q) */
function rod(p, q, r, m = 'metal', seg = 10) {
  const [dx, dy, dz] = sub(q, p), L = Math.hypot(dx, dy, dz) || 1e-6;
  return { s: 'cyl', r, r2: r, h: L, seg, x: (p[0] + q[0]) / 2, y: (p[1] + q[1]) / 2 - L / 2, z: (p[2] + q[2]) / 2, m, rx: Math.atan2(dz, dy), rz: Math.asin(Math.max(-1, Math.min(1, -dx / L))) };
}
/** a square bar (w wide, t thick) from p to q; a flat one (mostly level) keeps its width level */
function bar(p, q, w, t, m = 'f') {
  const [dx, dy, dz] = sub(q, p), L = Math.hypot(dx, dy, dz) || 1e-6, x = (p[0] + q[0]) / 2, cy = (p[1] + q[1]) / 2, z = (p[2] + q[2]) / 2;
  if (Math.abs(dy) >= Math.hypot(dx, dz)) return { s: 'box', w, h: L, d: t, x, y: cy - L / 2, z, m, rx: Math.atan2(dz, dy), rz: Math.asin(Math.max(-1, Math.min(1, -dx / L))) };
  return { s: 'box', w, h: t, d: L, x, y: cy - t / 2, z, m, ord: 'YXZ', rx: Math.atan2(-dy, Math.hypot(dx, dz)), ry: Math.atan2(dx, dz) };   // turned, then tilted: the width stays level
}
/** a knob on a front at (x, y), standing out from z */
const knob = (x, y, z, m = 'metal') => rod([x, y, z], [x, y, z + 0.022], 0.012, m);
/** a thin dark gap on a front (between drawers, doors) */
const hline = (w, x, y, z) => B(w, 0.004, 0.004, x, y - 0.002, z, 'line');
const vline = (h, x, y, z) => B(0.004, h, 0.004, x, y, z, 'line');
/** four legs (t thick, round or square) under a w x d top, `inset` from its edges */
const legs = (w, d, h, t, inset = 0, m = 'f', round = false, y = 0) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([i, k]) => {
  const x = i * (w / 2 - inset - t / 2), z = k * (d / 2 - inset - t / 2);
  return round ? C(t / 2, h, x, y, z, m, t / 2, 10) : B(t, h, t, x, y, z, m);
});
/** a row of books standing from x0 along `len` metres, at most hmax high; `seed` picks their sizes and colours (always the same) */
function books(x0, len, y, z, depth, hmax, seed) {
  const out = [];
  let x = x0, s = seed;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  while (x < x0 + len - 0.035) {
    const t = 0.022 + rnd() * 0.028, h = hmax * (0.72 + rnd() * 0.28);
    out.push(B(t, h, depth * (0.82 + rnd() * 0.16), x + t / 2, y, z, `book${1 + Math.floor(rnd() * 5)}`));
    x += t + 0.002;
  }
  return out;
}
/** turn parts round the x axis by a (they lean back with a < 0) round the point (py, pz); only for parts in the order XYZ */
function tiltX(parts, a, py = 0, pz = 0) {
  const c = Math.cos(a), s = Math.sin(a);
  parts.forEach((p) => {
    const half = p.s === 'ball' ? p.r * (p.sy || 1) : p.h / 2, y = p.y + half - py, z = p.z - pz;
    p.y = y * c - z * s + py - half; p.z = y * s + z * c + pz; p.rx = (p.rx || 0) + a;
  });
  return parts;
}
/** a framed glass door (w x h) from y0, its face at z */
const glassDoor = (x, w, y0, h, z, st = 0.05) => [
  B(st, h, 0.018, x - w / 2 + st / 2, y0, z), B(st, h, 0.018, x + w / 2 - st / 2, y0, z),
  B(w - 2 * st, st, 0.018, x, y0, z), B(w - 2 * st, st * 1.2, 0.018, x, y0 + h - st * 1.2, z), B(w - 2 * st, h - st * 2.2, 0.006, x, y0 + st, z, 'glass'),
];

/* ---------- the pieces ---------- */
/** cube shelf: cols x rows cubes of 33.5 cm; inserts [col, row, 'box' | 'door' | 'books'] */
function cubeShelf(cols, rows, inserts) {
  const c = 0.335, ti = 0.015, to = 0.0425, D = 0.39;
  const W = cols * c + (cols - 1) * ti + 2 * to, H = rows * c + (rows - 1) * ti + 2 * to;
  const p = [B(to, H, D, -W / 2 + to / 2), B(to, H, D, W / 2 - to / 2), B(W - 2 * to, to, D), B(W - 2 * to, to, D, 0, H - to)];
  for (let i = 1; i < cols; i++) p.push(B(ti, H - 2 * to, D, -W / 2 + to + i * (c + ti) - ti / 2, to));
  for (let j = 1; j < rows; j++) p.push(B(W - 2 * to, ti, D, 0, to + j * (c + ti) - ti));
  inserts.forEach(([i, j, k]) => {
    const x = -W / 2 + to + i * (c + ti) + c / 2, y = to + j * (c + ti);
    if (k === 'box') p.push(B(c - 0.02, c - 0.03, D - 0.04, x, y, 0, 'fabricbox'), B(0.09, 0.022, 0.006, x, y + c - 0.1, D / 2 - 0.017, 'line'));
    if (k === 'door') p.push(B(c - 0.004, c - 0.004, 0.018, x, y + 0.002, D / 2 - 0.009, 'f2'), knob(x + c / 2 - 0.05, y + c / 2, D / 2));
    if (k === 'books') p.push(...books(x - c / 2 + 0.012, c * 0.75, y, -0.03, 0.24, c - 0.06, i * 7 + j * 13 + 3));
  });
  return p;
}
/** the tall white bookcase (80 x 202 cm), with two glass doors or open with books */
function bookcase(glass) {
  const W = 0.8, H = 2.02, D = 0.28, t = 0.018, iw = W - 2 * t, shelves = [0.065, 0.41, 0.75, 1.07, 1.4, 1.72];
  const p = [B(t, H, D, -W / 2 + t / 2), B(t, H, D, W / 2 - t / 2), B(iw, t, D, 0, H - t), B(iw, 0.065, t, 0, 0, D / 2 - 0.03), B(iw, H - 0.02, 0.004, 0, 0.01, -D / 2 + 0.002, 'f2')];
  shelves.forEach((y, i) => {
    p.push(B(iw, t, D - 0.02, 0, y, 0.006));
    if (i === 1 || i === 2 || i === 4) p.push(...books(-iw / 2 + 0.015, iw * (i === 2 ? 0.55 : 0.7), y + t, -0.025, 0.2, 0.27, 17 + i * 31));
  });
  if (glass) {
    const dw = W / 2 - 0.002;
    p.push(...glassDoor(-W / 4, dw, 0.07, H - 0.08, D / 2 + 0.009), ...glassDoor(W / 4, dw, 0.07, H - 0.08, D / 2 + 0.009), knob(-0.04, 1.0, D / 2 + 0.018), knob(0.04, 1.0, D / 2 + 0.018));
  }
  return p;
}
/** chest of drawers with flush fronts (cols x rows drawers, grips are the gaps) */
function chest(W, H, D, cols, rows) {
  const zf = D / 2 + 0.0005, top = H - 0.02, h = (top - 0.03) / rows;
  const p = [B(W - 0.04, 0.03, D - 0.05, 0, 0, -0.01, 'line'), B(W, H - 0.03, D, 0, 0.03)];
  for (let j = 1; j <= rows; j++) p.push(hline(W - 0.036, 0, 0.03 + j * h, zf));
  [-1, 1].forEach((s) => p.push(vline(top - 0.03, s * (W / 2 - 0.018), 0.03, zf)));
  for (let i = 1; i < cols; i++) p.push(vline(top - 0.03, -W / 2 + (i * W) / cols, 0.03, zf));
  return p;
}
/** the swing armchair: a bent birch frame and a thick cushion */
function swingChair() {
  const p = [];
  [-1, 1].forEach((s) => {
    const x = s * 0.3, x2 = s * 0.22;
    p.push(bar([x, 0.015, 0.4], [x, 0.015, -0.4], 0.04, 0.03, 'birch'), bar([x, 0.02, 0.4], [x, 0.5, 0.33], 0.04, 0.03, 'birch'),
      bar([x, 0.5, 0.34], [x, 0.47, -0.24], 0.05, 0.03, 'birch'), bar([x, 0.47, -0.24], [x, 0.03, -0.4], 0.04, 0.03, 'birch'),
      bar([x2, 0.45, 0.3], [x2, 0.33, -0.2], 0.045, 0.02, 'birch'), bar([x2, 0.33, -0.2], [x2, 0.96, -0.36], 0.045, 0.02, 'birch'),
      bar([x, 0.48, 0.33], [x2, 0.45, 0.3], 0.03, 0.02, 'birch'));
  });
  p.push(bar([0, 0.5, 0.31], [0, 0.39, -0.2], 0.54, 0.09), bar([0, 0.4, -0.15], [0, 0.98, -0.3], 0.54, 0.09));
  return p;
}
/** the wing chair: rolled arms, wings on the high back, short wooden legs */
function wingChair() {
  const p = [...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([i, k]) => C(0.022, 0.13, i * 0.33, 0, k * 0.36, 'wood', 0.016, 10)),
    B(0.82, 0.3, 0.84, 0, 0.13, 0.02), B(0.56, 0.12, 0.62, 0, 0.43, 0.1), B(0.62, 0.62, 0.16, 0, 0.4, -0.33, 'f', { rx: -0.12 })];
  [-1, 1].forEach((s) => p.push(B(0.13, 0.17, 0.74, s * 0.345, 0.43, 0.06), rod([s * 0.345, 0.6, 0.43], [s * 0.345, 0.6, -0.31], 0.075, 'f', 16),
    B(0.12, 0.42, 0.3, s * 0.35, 0.58, -0.3, 'f', { rx: -0.12 })));
  return p;
}
/** the classic three-seat sofa: rolled arms, loose seat and back cushions */
function sofa3() {
  const p = [...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([i, k]) => C(0.02, 0.04, i * 1.0, 0, k * 0.36, 'wood', 0.02, 8)), B(2.18, 0.3, 0.88, 0, 0.04), B(1.74, 0.36, 0.2, 0, 0.34, -0.34)];
  [-1, 1].forEach((s) => p.push(B(0.22, 0.24, 0.88, s * 0.98, 0.34, 0), rod([s * 0.98, 0.6, 0.44], [s * 0.98, 0.6, -0.44], 0.11, 'f', 18)));
  [-0.58, 0, 0.58].forEach((x) => p.push(B(0.575, 0.15, 0.62, x, 0.34, 0.13), B(0.56, 0.48, 0.17, x, 0.4, -0.19, 'f', { rx: -0.14 })));
  return p;
}
function sofaCompact() {
  const p = [...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([i, k]) => C(0.02, 0.05, i * 0.82, 0, k * 0.36, 'black', 0.02, 8)),
    B(1.8, 0.28, 0.88, 0, 0.05), B(1.8, 0.33, 0.22, 0, 0.33, -0.33), B(1.44, 0.1, 0.64, 0, 0.33, 0.11)];
  [-1, 1].forEach((s) => p.push(B(0.18, 0.27, 0.66, s * 0.81, 0.33, 0.11)));
  return p;
}
function sofaChaise() {
  const p = [...[[-1.2, -0.75], [1.2, -0.75], [-1.2, 0.08], [1.2, 0.75], [0.46, 0.75]].map(([x, z]) => C(0.022, 0.06, x, 0, z, 'black', 0.022, 8)),
    B(2.52, 0.3, 0.95, 0, 0.06, -0.335), B(0.86, 0.3, 0.68, 0.83, 0.06, 0.47), B(2.52, 0.4, 0.22, 0, 0.36, -0.7),
    B(0.16, 0.24, 0.95, -1.18, 0.36, -0.335), B(0.16, 0.24, 1.62, 1.18, 0.36, 0),
    B(0.745, 0.12, 0.7, -0.725, 0.36, -0.24), B(0.745, 0.12, 0.7, 0.025, 0.36, -0.24), B(0.69, 0.12, 1.36, 0.755, 0.36, 0.09)];
  [-0.75, 0, 0.75].forEach((x) => p.push(B(0.72, 0.42, 0.17, x, 0.42, -0.53, 'f', { rx: -0.14 })));
  return p;
}
function tvBench() {
  const W = 1.8, D = 0.42, zf = D / 2 + 0.0005;
  return [...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([i, k]) => C(0.015, 0.1, i * 0.82, 0, k * 0.15, 'metal', 0.015, 10)), B(W, 0.38, D, 0, 0.1),
    vline(0.38, -0.3, 0.1, zf), vline(0.38, 0.3, 0.1, zf), B(0.56, 0.3, 0.01, 0, 0.14, D / 2 - 0.004, 'black'),
    hline(0.56, -0.6, 0.29, zf), hline(0.56, 0.6, 0.29, zf), B(0.14, 0.014, 0.006, -0.6, 0.445, zf, 'line'), B(0.14, 0.014, 0.006, 0.6, 0.445, zf, 'line')];
}
function vitrine() {
  const W = 0.9, H = 1.97, D = 0.37, t = 0.025, iw = W - 2 * t, fw = iw / 3 - 0.004;
  const p = [B(W - 0.04, 0.08, D - 0.04, 0, 0, -0.01, 'f2'), B(t, H - 0.115, D, -W / 2 + t / 2, 0.08), B(t, H - 0.115, D, W / 2 - t / 2, 0.08), B(W + 0.03, 0.035, D + 0.02, 0, H - 0.035),
    B(iw, t, D, 0, 0.08), B(iw, t, D, 0, 0.32), B(iw, H - 0.115, 0.006, 0, 0.08, -D / 2 + 0.003, 'f2')];
  [-1, 0, 1].forEach((i) => p.push(B(fw, 0.2, 0.02, i * (fw + 0.004), 0.11, D / 2 + 0.01), knob(i * (fw + 0.004), 0.21, D / 2 + 0.02)));
  [0.8, 1.27].forEach((y) => p.push(B(iw - 0.01, 0.008, D - 0.06, 0, y, -0.01, 'glass')));
  [[0.345, 'ceramic'], [0.808, 'ceramic'], [1.278, 'ceramic']].forEach(([y, m], k) => [-0.25, -0.1, 0.12, 0.26].forEach((x, i) => {
    if ((i + k) % 3 !== 2) p.push(C(0.035 + 0.01 * ((i + k) % 2), 0.08 + 0.05 * ((i * k) % 2), x, y, -0.04, m, 0.03, 14));
  }));
  const dw = iw / 2 - 0.003;
  p.push(...glassDoor(-iw / 4, dw, 0.345, H - 0.035 - 0.35, D / 2 - 0.01, 0.06), ...glassDoor(iw / 4, dw, 0.345, H - 0.035 - 0.35, D / 2 - 0.01, 0.06),
    knob(-0.04, 1.1, D / 2 - 0.001), knob(0.04, 1.1, D / 2 - 0.001));
  return p;
}
function pineShelf() {
  const W = 0.89, H = 1.79, D = 0.3, post = 0.045, pd = 0.03, p = [];
  [-1, 1].forEach((s) => {
    const x = s * (W / 2 - post / 2);
    [-1, 1].forEach((k) => p.push(B(post, H, pd, x, 0, k * (D / 2 - pd / 2))));
    [0.05, 0.6, 1.2, 1.73].forEach((y) => p.push(B(0.022, 0.03, D - 2 * pd, x, y, 0)));
  });
  [0.12, 0.52, 0.92, 1.32, 1.76].forEach((y) => p.push(B(W - 2 * post, 0.018, D - 0.01, 0, y, 0)));
  p.push(B(0.3, 0.22, 0.24, -0.18, 0.138, 0, 'basket'), ...books(-0.38, 0.42, 0.938, -0.01, 0.2, 0.25, 11), C(0.065, 0.11, 0.25, 1.338, 0, 'pot', 0.05, 14), S(0.1, 0.25, 1.43, 0, 'leaf', 1, 0.9, 1));
  return p;
}
function wardrobe2() {
  const W = 1.0, H = 2.36, D = 0.58;
  return [B(W - 0.04, 0.06, D - 0.04, 0, 0, -0.01, 'f2'), B(W, H - 0.06, D, 0, 0.06), vline(H - 0.07, 0, 0.065, D / 2 + 0.002),
    B(W / 2 - 0.002, H - 0.07, 0.02, -W / 4 - 0.0005, 0.065, D / 2 + 0.01), B(W / 2 - 0.002, H - 0.07, 0.02, W / 4 + 0.0005, 0.065, D / 2 + 0.01),
    B(0.012, 0.3, 0.025, -0.04, 0.95, D / 2 + 0.0325, 'metal'), B(0.012, 0.3, 0.025, 0.04, 0.95, D / 2 + 0.0325, 'metal')];
}
function wardrobeSlide() {
  const W = 2.0, H = 2.36, D = 0.66;
  return [B(W - 0.04, 0.06, D - 0.12, 0, 0, -0.05, 'f2'), B(W, H - 0.06, D - 0.08, 0, 0.06, -0.04), B(W, 0.05, 0.08, 0, H - 0.05, D / 2 - 0.04, 'metal'), B(W, 0.012, 0.08, 0, 0.055, D / 2 - 0.04, 'metal'),
    B(1.0, H - 0.12, 0.02, -0.5, 0.068, D / 2 - 0.06), B(1.0, H - 0.12, 0.02, 0.5, 0.068, D / 2 - 0.025), B(0.86, H - 0.32, 0.006, 0.5, 0.17, D / 2 - 0.012, 'mirror'),
    B(0.015, 0.6, 0.02, -0.975, 0.9, D / 2 - 0.04, 'metal'), B(0.015, 0.6, 0.02, 0.975, 0.9, D / 2 - 0.005, 'metal')];
}
/** bedding on a mattress of w x l whose top is at y, the head at -z: a duvet and one pillow (two on a wide bed) */
const bedding = (w, l, y, z0) => [B(w - 0.02, 0.06, l * 0.66, 0, y - 0.02, z0 + l * 0.17, 'duvet'),
  ...(w < 1.2 ? [B(0.55, 0.12, 0.38, 0, y, z0 - l / 2 + 0.3, 'pillow')] : [-1, 1].map((s) => B(w / 2 - 0.12, 0.12, 0.4, (s * w) / 4, y, z0 - l / 2 + 0.3, 'pillow')))];
function bedHigh() {
  return [B(0.05, 0.38, 2.0, -0.855, 0, 0.045), B(0.05, 0.38, 2.0, 0.855, 0, 0.045), B(1.66, 0.38, 0.05, 0, 0, 1.02), B(1.76, 1.0, 0.09, 0, 0, -1.0),
    B(1.6, 0.2, 1.94, 0, 0.26, 0.025, 'mattress'), ...bedding(1.6, 1.94, 0.46, 0.025)];
}
function bedPine() {
  const p = [];
  [-1, 1].forEach((s) => p.push(B(0.07, 0.92, 0.07, s * 0.8, 0, -1.01), B(0.07, 0.55, 0.07, s * 0.8, 0, 1.01), B(0.035, 0.16, 1.95, s * 0.8, 0.17, 0)));
  p.push(B(1.53, 0.4, 0.025, 0, 0.42, -1.01), B(1.53, 0.09, 0.05, 0, 0.8, -1.01), B(1.53, 0.22, 0.025, 0, 0.25, 1.01), B(1.53, 0.07, 0.05, 0, 0.45, 1.01),
    B(1.56, 0.2, 1.94, 0, 0.27, 0, 'mattress'), ...bedding(1.56, 1.94, 0.47, 0));
  return p;
}
function clothesRack() {
  const p = [];
  [-1, 1].forEach((s) => p.push(B(0.035, 0.025, 0.46, s * 0.48, 0, 0), rod([s * 0.48, 0.02, 0], [s * 0.48, 1.51, 0], 0.013, 'f'), rod([s * 0.48, 0.18, -0.13], [s * 0.48, 0.18, 0.13], 0.008, 'f'),
    rod([-0.48, 0.18, s * 0.12], [0.48, 0.18, s * 0.12], 0.008, 'f')));
  p.push(rod([-0.495, 1.5, 0], [0.495, 1.5, 0], 0.013, 'f'));
  [-0.34, -0.2, -0.06, 0.08, 0.22, 0.34].forEach((x, i) => { const h = 0.78 - (i % 3) * 0.12; p.push(B(0.035, h, 0.4, x, 1.47 - h, 0, `cloth${1 + (i % 4)}`)); });
  p.push(B(0.1, 0.07, 0.24, -0.2, 0.19, 0, 'black'), B(0.1, 0.07, 0.24, -0.08, 0.19, 0, 'black'));
  return p;
}
function floorMirror() {
  const p = tiltX([B(0.52, 1.67, 0.03, 0, 0, 0), B(0.46, 1.61, 0.006, 0, 0.03, 0.016, 'mirror')], -0.1, 0, -0.015);
  p.push(bar([0, 1.05, -0.12], [0, 0.02, -0.42], 0.05, 0.03));
  return p;
}
function deskDrawers() {
  const p = [B(1.5, 0.025, 0.75, 0, 0.7), B(0.36, 0.7, 0.58, 0.535, 0, 0.065), C(0.025, 0.7, -0.69, 0, -0.3, 'f', 0.025, 12), C(0.025, 0.7, -0.69, 0, 0.3, 'f', 0.025, 12)];
  for (let j = 1; j <= 4; j++) p.push(hline(0.34, 0.535, (0.7 * j) / 5, 0.3555));
  for (let j = 1; j <= 5; j++) p.push(B(0.1, 0.012, 0.004, 0.535, (0.7 * j) / 5 - 0.035, 0.3555, 'line'));
  return p;
}
function deskSmall() {
  const zf = 0.2505;
  return [B(1.05, 0.025, 0.5, 0, 0.725), B(0.02, 0.725, 0.5, -0.515, 0), B(0.35, 0.725, 0.5, 0.35, 0), B(0.66, 0.3, 0.018, -0.165, 0.4, -0.22),
    hline(0.33, 0.35, 0.55, zf), B(0.1, 0.012, 0.004, 0.35, 0.66, zf, 'line'), B(0.012, 0.1, 0.004, 0.2, 0.4, zf, 'line')];
}
function deskStand() {
  const p = [B(1.6, 0.025, 0.8, 0, 0.72), B(1.26, 0.04, 0.06, 0, 0.66, -0.05, 'metal'), B(0.06, 0.02, 0.04, 0.6, 0.7, 0.36, 'black')];
  [-1, 1].forEach((s) => p.push(B(0.07, 0.62, 0.05, s * 0.66, 0.06, -0.05, 'metal'), B(0.07, 0.06, 0.7, s * 0.66, 0, -0.02, 'metal'), B(0.06, 0.02, 0.66, s * 0.66, 0.7, -0.02, 'metal')));
  return p;
}
function rollContainer() {
  const h = 0.64 / 6, zf = 0.2155, p = [B(0.28, 0.64, 0.43, 0, 0.05)];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, k]) => p.push(S(0.024, i * 0.11, 0, k * 0.17, 'black')));
  for (let j = 1; j <= 5; j++) p.push(hline(0.27, 0, 0.05 + j * h, zf));
  for (let j = 1; j <= 6; j++) p.push(B(0.08, 0.012, 0.004, 0, 0.05 + j * h - 0.03, zf, 'line'));
  return p;
}
function officeChairHigh() {
  const p = [C(0.035, 0.06, 0, 0.05, 0, 'black'), C(0.025, 0.32, 0, 0.1, 0, 'metal', 0.025, 12), B(0.48, 0.03, 0.46, 0, 0.4, 0.02, 'black'), B(0.52, 0.09, 0.5, 0, 0.42, 0.02),
    B(0.48, 0.78, 0.05, 0, 0.54, -0.25, 'f', { rx: -0.12 }), bar([0, 0.43, -0.18], [0, 0.62, -0.27], 0.06, 0.03, 'black')];
  for (let k = 0; k < 5; k++) {
    const a = (k * 2 * Math.PI) / 5, x = 0.3 * Math.sin(a), z = 0.3 * Math.cos(a);
    p.push(bar([0, 0.075, 0], [x, 0.05, z], 0.04, 0.03, 'black'), S(0.025, x, 0, z, 'black'));
  }
  [-1, 1].forEach((s) => p.push(B(0.03, 0.18, 0.04, s * 0.27, 0.48, -0.02, 'black'), B(0.07, 0.025, 0.25, s * 0.27, 0.66, 0, 'black')));
  return p;
}
function loftBed() {
  const X = 0.465, Z = 1.02, pt = 0.04, p = [];
  [-1, 1].forEach((s) => {
    p.push(B(pt, 1.95, pt, -X, 0, s * Z), B(pt, 1.95, pt, X, 0, s * Z), B(pt, 0.08, 2.04, s * X, 1.4, 0), B(0.89, 0.08, pt, 0, 1.4, s * Z), B(0.89, 0.03, 0.03, 0, 1.9, s * Z));
  });
  p.push(B(0.03, 0.03, 2.04, -X, 1.9, 0), B(0.03, 0.03, 2.04, -X, 1.68, 0), B(0.03, 0.03, 1.47, X, 1.9, -0.285), B(0.03, 0.03, 0.07, X, 1.9, 0.985),
    B(0.9, 0.12, 2.0, 0, 1.48, 0, 'mattress'), ...bedding(0.9, 2.0, 1.6, 0));
  [0.5, 0.9].forEach((z) => p.push(B(0.03, 1.95, 0.04, X + 0.035, 0, z)));
  [0.3, 0.6, 0.9, 1.2].forEach((y) => p.push(B(0.025, 0.025, 0.4, X + 0.035, y, 0.7)));
  return p;
}
function toyShelf() {
  const W = 0.99, H = 0.94, D = 0.44, t = 0.018, p = [B(t, H, D, -W / 2 + t / 2), B(t, H, D, W / 2 - t / 2), B(t, H - t, D, 0, 0), B(W - 2 * t, t, D, 0, H - t), B(W - 2 * t, 0.05, t, 0, 0, D / 2 - t / 2)];
  [-1, 1].forEach((s, c) => [0.05, 0.33, 0.61].forEach((y, r) => {
    const m = `bin${1 + ((r + c * 2) % 4)}`, x = s * (W / 4 - t / 4);
    p.push(B(0.42, 0.23, 0.42, x, y, 0, m), B(0.42, 0.03, 0.012, x, y + 0.2, D / 2 - 0.006, m));
  }));
  return p;
}
function kidsTable() {
  const p = [B(0.77, 0.035, 0.55, 0, 0.445), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([i, k]) => C(0.045, 0.445, i * 0.31, 0, k * 0.2, 'f', 0.035, 14))];
  [[-1, 'kidblue'], [1, 'kidpink']].forEach(([s, m]) => {
    const zc = s * 0.48;
    p.push(B(0.32, 0.03, 0.3, 0, 0.29, zc, m), B(0.32, 0.26, 0.03, 0, 0.32, zc + s * 0.14, m), ...legs(0.32, 0.3, 0.29, 0.045, 0.01, m, true).map((l) => ({ ...l, z: l.z + zc })));
  });
  return p;
}
function highChair() {
  const p = [];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, k]) => p.push(rod([i * 0.14, 0.55, k * 0.13], [i * 0.27, 0.012, k * 0.29], 0.012)));
  p.push(B(0.38, 0.05, 0.36, 0, 0.53, 0), B(0.38, 0.32, 0.04, 0, 0.55, -0.17, 'f', { rx: -0.1 }), B(0.04, 0.16, 0.3, -0.17, 0.55, 0.02), B(0.04, 0.16, 0.3, 0.17, 0.55, 0.02),
    B(0.5, 0.025, 0.24, 0, 0.72, 0.26), B(0.03, 0.03, 0.12, -0.17, 0.7, 0.18), B(0.03, 0.03, 0.12, 0.17, 0.7, 0.18));
  return p;
}
function shark() {
  const H = Math.PI / 2;
  return [S(0.14, 0, 0.01, 0, 'shark', 3.2, 1, 0.95), S(0.135, 0.03, 0.005, 0, 'belly', 2.9, 0.72, 0.92),
    prism(0.1, 0.025, -0.04, 0.31, 0, 'shark', { rx: -H, ry: -0.5 }), prism(0.11, 0.025, -0.5, 0.22, 0, 'shark', { rx: -H, ry: -0.9 }), prism(0.07, 0.025, -0.48, 0.1, 0, 'shark', { rx: -H, ry: -2.5 }),
    prism(0.09, 0.02, 0.12, 0.07, 0.14, 'shark', { ry: -0.52 }), prism(0.09, 0.02, 0.12, 0.07, -0.14, 'shark', { ry: -2.62 }),
    S(0.014, 0.31, 0.156, 0.094, 'eye'), S(0.014, 0.31, 0.156, -0.094, 'eye')];
}
function shoeCabinet() {
  const p = [B(0.85, 0.07, 0.26, 0, 0, -0.01, 'f2'), B(0.89, 1.17, 0.3, 0, 0.07), B(0.92, 0.03, 0.32, 0, 1.24)];
  [0.09, 0.66].forEach((y) => p.push(B(0.85, 0.55, 0.02, 0, y, 0.16), B(0.73, 0.43, 0.004, 0, y + 0.06, 0.171, 'f2'), knob(0, y + 0.49, 0.17)));
  return p;
}
function coatStand() {
  const p = [C(0.022, 1.78, 0, 0, 0, 'f', 0.022, 14), S(0.03, 0, 1.76, 0)];
  for (let k = 0; k < 3; k++) { const a = Math.PI / 3 + (k * 2 * Math.PI) / 3; p.push(bar([0, 0.3, 0], [0.26 * Math.sin(a), 0.018, 0.26 * Math.cos(a)], 0.035, 0.035)); }
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3, x = Math.sin(a), z = Math.cos(a);
    p.push(rod([0.02 * x, 1.6, 0.02 * z], [0.15 * x, 1.7, 0.15 * z], 0.012, 'f'), S(0.018, 0.15 * x, 1.682, 0.15 * z));
  }
  p.push(B(0.42, 0.8, 0.13, 0, 0.78, 0.09, 'cloth2'));
  return p;
}
function hallBench() {
  const p = [B(0.81, 0.03, 0.32, 0, 0.47), B(0.03, 0.47, 0.32, -0.39, 0), B(0.03, 0.47, 0.32, 0.39, 0)];
  [0.06, 0.25].forEach((y) => [-0.105, 0, 0.105].forEach((z) => p.push(B(0.75, 0.018, 0.08, 0, y, z))));
  p.push(B(0.1, 0.08, 0.25, -0.2, 0.078, 0, 'black'), B(0.1, 0.08, 0.25, -0.08, 0.078, 0, 'black'), B(0.1, 0.09, 0.26, 0.12, 0.268, 0, 'cloth3'), B(0.1, 0.09, 0.26, 0.24, 0.268, 0, 'cloth3'));
  return p;
}
function vanity() {
  const zf = 0.2155;
  return [B(0.8, 0.56, 0.45, 0, 0.3, -0.01), hline(0.78, 0, 0.58, zf), B(0.3, 0.012, 0.004, 0, 0.835, zf, 'line'), B(0.3, 0.012, 0.004, 0, 0.555, zf, 'line'),
    B(0.81, 0.05, 0.47, 0, 0.86, -0.005, 'ceramic'), B(0.58, 0.004, 0.3, 0, 0.91, 0.03, 'basin'), C(0.016, 0.16, 0, 0.91, -0.17, 'metal', 0.02, 12), B(0.025, 0.02, 0.12, 0, 1.05, -0.11, 'metal')];
}
function bathTall() {
  const zf = 0.1605, p = [B(0.4, 1.8, 0.32, 0, 0.12), hline(0.38, 0, 1.02, zf), B(0.012, 0.22, 0.02, 0.15, 0.74, 0.17, 'metal'), B(0.012, 0.22, 0.02, 0.15, 1.08, 0.17, 'metal')];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, k]) => p.push(C(0.012, 0.12, i * 0.17, 0, k * 0.12, 'metal', 0.012, 10)));
  return p;
}
function bathShelf() {
  const p = [];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([i, k]) => p.push(B(0.03, 1.63, 0.03, i * 0.15, 0, k * 0.125)));
  [0.06, 0.5, 0.94, 1.38].forEach((y) => p.push(B(0.27, 0.02, 0.22, 0, y)));
  p.push(rod([-0.06, 0.57, -0.09], [-0.06, 0.57, 0.09], 0.05, 'cloth3', 14), rod([0.06, 0.57, -0.09], [0.06, 0.57, 0.09], 0.05, 'cloth1', 14),
    C(0.03, 0.15, 0.05, 1.4, 0, 'white', 0.03, 12), C(0.025, 0.12, -0.05, 1.4, 0.02, 'kidblue', 0.025, 12));
  return p;
}
function arcLamp() {
  const P0 = [0, 0.05], P1 = [0, 2.6], P2 = [1.5, 1.8], pt = (t) => [0, 1].map((i) => (1 - t) ** 2 * P0[i] + 2 * (1 - t) * t * P1[i] + t * t * P2[i]);
  const p = [C(0.17, 0.05, 0, 0, 0, 'black', 0.17, 28)];
  for (let i = 0; i < 12; i++) { const a = pt(i / 12), b = pt((i + 1) / 12); p.push(rod([a[0], a[1], 0], [b[0], b[1], 0], 0.013)); }
  p.push(C(0.07, 0.2, 1.5, 1.62, 0, 'f', 0.24, 28), C(0.2, 0.01, 1.5, 1.615, 0, 'glow', 0.22, 24), S(0.05, 1.5, 1.6, 0, 'glow'));
  return p;
}
function palm() {
  const p = [C(0.2, 0.34, 0, 0, 0, 'f', 0.16, 24), C(0.185, 0.012, 0, 0.32, 0, 'soil', 0.185, 24)];
  for (let k = 0; k < 5; k++) { const a = (k * 2 * Math.PI) / 5 + 0.2; p.push(rod([0, 0.33, 0], [0.12 * Math.sin(a), 1.05 + 0.08 * (k % 2), 0.12 * Math.cos(a)], 0.015, 'stem', 8)); }
  for (let k = 0; k < 9; k++) {
    const a = (k * 2 * Math.PI) / 9, top = 1.08 + 0.06 * (k % 3);
    p.push(bar([0.1 * Math.sin(a), top, 0.1 * Math.cos(a)], [0.58 * Math.sin(a), top - 0.22 - 0.05 * (k % 2), 0.58 * Math.cos(a)], 0.16, 0.012, 'leaf'));
  }
  [0.5, 2.6, 4.7].forEach((a) => p.push(bar([0.05 * Math.sin(a), 1.1, 0.05 * Math.cos(a)], [0.36 * Math.sin(a), 1.5, 0.36 * Math.cos(a)], 0.1, 0.012, 'leaf')));
  return p;
}

const WOOD = ['white', 'blackbrown', 'oak'], FABRIC = ['lightgrey', 'darkgrey', 'beige', 'blue', 'green', 'rust', 'yellow'];
/** the pieces: cat (library group), label (German, the translations are in i18n.js / lang/*.js), fin (the finishes, the first is the default),
 *  search (more words the library search finds it by), y (height over the floor when placed), round (round footprint), parts() */
export const SCANDI = {
  shelf_cube2x2: { cat: 'living', label: 'Würfelregal 2×2', fin: [...WOOD, 'birch', 'grey'], search: 'kallax expedit würfel wuerfel cube regal', parts: () => cubeShelf(2, 2, [[0, 0, 'box'], [1, 1, 'books']]) },
  shelf_cube2x4: { cat: 'living', label: 'Würfelregal 2×4', fin: [...WOOD, 'birch', 'grey'], search: 'kallax expedit würfel wuerfel cube regal', parts: () => cubeShelf(2, 4, [[0, 0, 'box'], [1, 0, 'door'], [0, 2, 'books'], [1, 3, 'box']]) },
  shelf_cube4x4: { cat: 'living', label: 'Würfelregal 4×4', fin: [...WOOD, 'birch', 'grey'], search: 'kallax expedit würfel wuerfel cube regal raumteiler', parts: () => cubeShelf(4, 4, [[0, 0, 'box'], [1, 0, 'box'], [2, 0, 'door'], [3, 0, 'door'], [0, 2, 'books'], [3, 1, 'books'], [1, 3, 'box'], [2, 2, 'door']]) },
  shelf_cube4x1: { cat: 'living', label: 'Würfelregal 4×1', fin: [...WOOD, 'birch', 'grey'], search: 'kallax expedit würfel wuerfel cube regal lowboard', parts: () => cubeShelf(4, 1, [[0, 0, 'box'], [1, 0, 'door'], [3, 0, 'box']]) },
  shelf_book: { cat: 'living', label: 'Bücherregal hoch', fin: [...WOOD, 'birch'], search: 'billy bücherregal buecherregal bookcase', parts: () => bookcase(false) },
  shelf_glass: { cat: 'living', label: 'Bücherregal mit Glastüren', fin: [...WOOD, 'birch'], search: 'billy oxberg bücherregal buecherregal vitrine glastür', parts: () => bookcase(true) },
  shelf_pine: { cat: 'living', label: 'Holzregal', fin: ['pine', 'white', 'grey'], search: 'ivar kiefer regal massivholz', parts: pineShelf },
  vitrine: { cat: 'living', label: 'Vitrine', fin: ['white', 'blackbrown', 'grey'], search: 'hemnes vitrine glasvitrine geschirrschrank', parts: vitrine },
  tvbench: { cat: 'living', label: 'TV-Bank', fin: [...WOOD, 'grey'], search: 'bestå besta lowboard fernseher fernsehtisch tv-board', parts: tvBench },
  coffeetable_lo: { cat: 'living', label: 'Couchtisch schlicht', fin: [...WOOD, 'birch'], search: 'lack couchtisch wohnzimmertisch', parts: () => [B(0.9, 0.05, 0.55, 0, 0.4), ...legs(0.9, 0.55, 0.4, 0.05), B(0.8, 0.02, 0.45, 0, 0.1)] },
  sidetable_sq: { cat: 'living', label: 'Beistelltisch eckig', fin: [...WOOD, 'birch'], search: 'lack beistelltisch', parts: () => [B(0.55, 0.05, 0.55, 0, 0.4), ...legs(0.55, 0.55, 0.4, 0.05)] },
  chair_swing: { cat: 'living', label: 'Schwingsessel', fin: ['beige', 'darkgrey', 'lightgrey', 'blue', 'green', 'rust'], search: 'poäng poaeng poang schaukelstuhl sessel freischwinger', parts: swingChair },
  chair_wing: { cat: 'living', label: 'Ohrensessel', fin: ['darkgrey', 'beige', 'blue', 'green', 'yellow', 'rust'], search: 'strandmon ohrensessel sessel lesesessel', parts: wingChair },
  sofa_compact: { cat: 'living', label: 'Sofa kompakt', fin: FABRIC, search: 'klippan couch 2-sitzer zweisitzer', parts: sofaCompact },
  sofa_3: { cat: 'living', label: '3er-Sofa mit Kissen', fin: FABRIC, search: 'ektorp couch 3-sitzer dreisitzer', parts: sofa3 },
  sofa_chaise: { cat: 'living', label: 'Sofa mit Récamiere', fin: FABRIC, search: 'friheten vimle kivik couch recamiere récamiere longchair', parts: sofaChaise },
  rug_round: { cat: 'living', label: 'Teppich rund', fin: ['beige', 'lightgrey', 'darkgrey', 'blue', 'green', 'rust'], search: 'teppich rund rug', round: true, parts: () => [C(0.65, 0.012, 0, 0, 0, 'f', 0.65, 40)] },
  table_round: { cat: 'living', label: 'Esstisch rund', fin: ['white', 'black'], search: 'docksta tulpentisch esstisch rund', round: true, parts: () => [C(0.515, 0.03, 0, 0.72, 0, 'f', 0.515, 40), C(0.05, 0.6, 0, 0.12, 0, 'f', 0.09, 24), C(0.2, 0.12, 0, 0, 0, 'f', 0.3, 32)] },
  table_wood: { cat: 'living', label: 'Esstisch Holz', fin: ['oak', 'white', 'blackbrown', 'birch'], search: 'ekedalen mörbylånga esstisch holztisch',
    parts: () => [B(1.8, 0.035, 0.9, 0, 0.715), ...legs(1.8, 0.9, 0.715, 0.065, 0.05), B(1.57, 0.08, 0.025, 0, 0.635, -0.3675), B(1.57, 0.08, 0.025, 0, 0.635, 0.3675), B(0.025, 0.08, 0.67, -0.8175, 0.635, 0), B(0.025, 0.08, 0.67, 0.8175, 0.635, 0)] },
  chair_spindle: { cat: 'living', label: 'Sprossenstuhl', fin: ['white', 'blackbrown', 'birch', 'oak'], search: 'ingolf stuhl holzstuhl esszimmerstuhl',
    parts: () => [B(0.43, 0.035, 0.44, 0, 0.43, 0.02), B(0.035, 0.43, 0.035, -0.19, 0, 0.21), B(0.035, 0.43, 0.035, 0.19, 0, 0.21),
      B(0.035, 0.91, 0.035, -0.19, 0, -0.18, 'f', { rx: -0.06 }), B(0.035, 0.91, 0.035, 0.19, 0, -0.18, 'f', { rx: -0.06 }), B(0.38, 0.07, 0.025, 0, 0.82, -0.205),
      ...[-0.105, -0.035, 0.035, 0.105].map((x) => B(0.016, 0.33, 0.016, x, 0.48, -0.195)), B(0.36, 0.02, 0.02, 0, 0.14, 0.21), B(0.36, 0.02, 0.02, 0, 0.14, -0.17), B(0.02, 0.02, 0.36, -0.19, 0.2, 0.02), B(0.02, 0.02, 0.36, 0.19, 0.2, 0.02)] },
  chair_shell: { cat: 'living', label: 'Schalenstuhl', fin: ['white', 'black', 'grey', 'blue', 'green', 'yellow'], search: 'teodores adde stuhl kunststoffstuhl',
    parts: () => [...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([i, k]) => rod([i * 0.17, 0.42, k * 0.15], [i * 0.21, 0.012, k * 0.19], 0.012, 'black')), B(0.45, 0.03, 0.43, 0, 0.42, 0.01), B(0.45, 0.36, 0.03, 0, 0.47, -0.21, 'f', { rx: -0.16 })] },
  cart: { cat: 'kitchen', label: 'Rollwagen', fin: ['turquoise', 'white', 'black', 'grey'], search: 'råskog raskog servierwagen küchenwagen trolley',
    parts: () => [...[[-1, -1], [1, -1], [-1, 1], [1, 1]].flatMap(([i, k]) => [rod([i * 0.155, 0.04, k * 0.205], [i * 0.155, 0.78, k * 0.205], 0.011, 'f'), S(0.022, i * 0.155, 0, k * 0.205, 'black')]),
      ...[0.07, 0.38, 0.69].flatMap((y) => [B(0.32, 0.008, 0.42, 0, y), B(0.32, 0.06, 0.006, 0, y, 0.207), B(0.32, 0.06, 0.006, 0, y, -0.207), B(0.006, 0.06, 0.42, 0.157, y), B(0.006, 0.06, 0.42, -0.157, y)]),
      rod([-0.155, 0.78, 0.205], [0.155, 0.78, 0.205], 0.009, 'f'), rod([-0.155, 0.78, -0.205], [0.155, 0.78, -0.205], 0.009, 'f')] },
  stepstool: { cat: 'kitchen', label: 'Tritthocker', fin: ['birch', 'white', 'blackbrown'], search: 'bekväm bekvaem bekvam trittleiter hocker',
    parts: () => [B(0.43, 0.025, 0.24, 0, 0.475, -0.08), B(0.4, 0.025, 0.14, 0, 0.23, 0.1), B(0.36, 0.05, 0.02, 0, 0.1, -0.17),
      ...[-1, 1].flatMap((s) => [bar([s * 0.19, 0.01, 0.19], [s * 0.19, 0.49, -0.01], 0.025, 0.05), bar([s * 0.19, 0.01, -0.19], [s * 0.19, 0.49, -0.15], 0.025, 0.05)])] },
  bed_high: { cat: 'bedroom', label: 'Bett mit hohem Kopfteil', fin: [...WOOD, 'walnut'], search: 'malm doppelbett bettgestell', parts: bedHigh },
  bed_pine: { cat: 'bedroom', label: 'Holzbett', fin: ['pine', 'white', 'oak'], search: 'tarva doppelbett massivholz kiefer', parts: bedPine },
  dresser6: { cat: 'bedroom', label: 'Kommode 6 Schubladen', fin: [...WOOD, 'walnut'], search: 'malm kommode schubladen', parts: () => chest(1.6, 0.78, 0.48, 2, 3) },
  dresser3: { cat: 'bedroom', label: 'Kommode 3 Schubladen', fin: [...WOOD, 'walnut'], search: 'malm kommode schubladen', parts: () => chest(0.8, 0.78, 0.48, 1, 3) },
  nightstand2: { cat: 'bedroom', label: 'Nachttisch mit Schubladen', fin: [...WOOD, 'walnut'], search: 'malm nachtkommode nachtschrank', parts: () => chest(0.4, 0.55, 0.48, 1, 2) },
  wardrobe2: { cat: 'bedroom', label: 'Kleiderschrank 2-türig', fin: [...WOOD, 'grey'], search: 'pax kleiderschrank schrank', parts: wardrobe2 },
  wardrobe_slide: { cat: 'bedroom', label: 'Kleiderschrank Schiebetüren', fin: [...WOOD, 'grey'], search: 'pax hasvik kleiderschrank schrank schwebetüren spiegel', parts: wardrobeSlide },
  clothesrack: { cat: 'bedroom', label: 'Kleiderständer', fin: ['white', 'black'], search: 'mulig kleiderstange garderobe', parts: clothesRack },
  desk_drawers: { cat: 'office', label: 'Schreibtisch mit Schubladen', fin: [...WOOD, 'grey'], search: 'alex linnmon lagkapten schreibtisch', parts: deskDrawers },
  desk_small: { cat: 'office', label: 'Schreibtisch kompakt', fin: WOOD, search: 'micke schreibtisch klein', parts: deskSmall },
  desk_stand: { cat: 'office', label: 'Steh-Sitz-Schreibtisch', fin: [...WOOD, 'birch'], search: 'trotten bekant höhenverstellbar hoehenverstellbar stehpult schreibtisch', parts: deskStand },
  drawers_roll: { cat: 'office', label: 'Rollcontainer', fin: ['white', 'black', 'grey'], search: 'helmer alex schubladen container', parts: rollContainer },
  officechair_high: { cat: 'office', label: 'Bürostuhl hohe Lehne', fin: ['darkgrey', 'black', 'lightgrey'], search: 'markus chefsessel drehstuhl', parts: officeChairHigh },
  bed_loft: { cat: 'kids', label: 'Hochbett', fin: ['white', 'black', 'grey'], search: 'svärta svaerta tuffing hochbett kinderbett', parts: loftBed },
  toyshelf: { cat: 'kids', label: 'Spielzeugregal mit Boxen', fin: ['pine', 'white'], search: 'trofast spielzeug kisten aufbewahrung', parts: toyShelf },
  kidstable: { cat: 'kids', label: 'Kindertisch mit Stühlen', fin: ['white', 'blue', 'green', 'yellow'], search: 'mammut kinder kindermöbel', parts: kidsTable },
  highchair: { cat: 'kids', label: 'Kinderhochstuhl', fin: ['white'], search: 'antilop hochstuhl baby', parts: highChair },
  shark: { cat: 'kids', label: 'Plüschhai', fin: [], search: 'blåhaj blahaj hai kuscheltier plüschtier', parts: shark },
  shoecab: { cat: 'entry', label: 'Schuhschrank', fin: ['white', 'blackbrown', 'grey'], search: 'hemnes trones schuhe schuhregal', parts: shoeCabinet },
  coatstand: { cat: 'entry', label: 'Garderobenständer', fin: ['birch', 'white', 'blackbrown'], search: 'garderobe kleiderständer jacken', parts: coatStand },
  hallbench: { cat: 'entry', label: 'Schuhbank', fin: ['white', 'birch', 'blackbrown', 'bamboo'], search: 'bank sitzbank schuhregal', parts: hallBench },
  mirror_floor: { cat: 'entry', label: 'Standspiegel', fin: ['white', 'blackbrown', 'oak'], search: 'spiegel ganzkörperspiegel ganzkoerperspiegel', parts: floorMirror },
  vanity: { cat: 'bath', label: 'Waschtisch mit Unterschrank', fin: ['white', 'oak', 'grey', 'blackbrown'], search: 'godmorgon waschbecken waschbeckenunterschrank', parts: vanity },
  bathtall: { cat: 'bath', label: 'Hochschrank Bad', fin: ['white', 'oak', 'grey', 'blackbrown'], search: 'godmorgon hochschrank badschrank', parts: bathTall },
  bathshelf: { cat: 'bath', label: 'Badregal', fin: ['bamboo', 'white'], search: 'rågrund ragrund bambus regal', parts: bathShelf },
  lamp_paper: { cat: 'lighting', label: 'Papier-Stehlampe', fin: [], search: 'regolit papierlampe papierkugel leuchte', parts: () => [C(0.14, 0.025, 0, 0, 0, 'black', 0.15, 24), C(0.01, 1.26, 0, 0.025, 0, 'black', 0.01, 8), S(0.22, 0, 1.26, 0, 'glow')] },
  lamp_arc: { cat: 'lighting', label: 'Bogenleuchte', fin: ['alu', 'black', 'white'], search: 'bogenlampe leuchte stehlampe', parts: arcLamp },
  lamp_table: { cat: 'lighting', label: 'Tischleuchte', fin: ['white', 'black', 'grey'], search: 'lampan tischlampe leuchte', y: 0.75, parts: () => [C(0.035, 0.14, 0, 0, 0, 'f', 0.075, 24), C(0.06, 0.15, 0, 0.13, 0, 'glow', 0.115, 24)] },
  pendant_paper: { cat: 'lighting', label: 'Papier-Hängelampe', fin: [], search: 'regolit papierlampe papierkugel pendelleuchte leuchte', y: 1.9, parts: () => [S(0.225, 0, 0, 0, 'glow'), C(0.004, 0.3, 0, 0.45, 0, 'black', 0.004, 6), C(0.05, 0.03, 0, 0.72, 0, 'white', 0.05, 16)] },
  pendant_dome: { cat: 'lighting', label: 'Metall-Hängelampe', fin: ['alu', 'white', 'black'], search: 'foto pendelleuchte leuchte', y: 1.9,
    parts: () => [C(0.06, 0.2, 0, 0, 0, 'f', 0.19, 28), C(0.175, 0.006, 0, 0.002, 0, 'glow', 0.175, 24), S(0.045, 0, 0.03, 0, 'glow'), C(0.025, 0.04, 0, 0.2, 0, 'f', 0.025, 12), C(0.004, 0.48, 0, 0.24, 0, 'black', 0.004, 6), C(0.05, 0.03, 0, 0.72, 0, 'white', 0.05, 16)] },
  plant_palm: { cat: 'decor', label: 'Zimmerpalme', fin: ['white', 'terracotta', 'black'], search: 'pflanze palme fejka zimmerpflanze', parts: palm },
};
export const SCANDI_TYPES = Object.keys(SCANDI);

/** the finish a piece is shown in: the one chosen on the device, else its default (null: it has none) */
export function finishOf(type, dev) {
  const l = SCANDI[type]?.fin || [];
  return l.includes(dev?.finish) ? dev.finish : l[0] || null;
}
/** the finishes the side panel offers (null: nothing to choose) */
export const finishChoices = (type) => (SCANDI[type]?.fin?.length > 1 ? SCANDI[type].fin : null);

const turnX = ([x, y, z], a) => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
const turnY = ([x, y, z], a) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
const turnZ = ([x, y, z], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z];
/** the point of part p at its own (lx, ly, lz) from its middle, turned as three.js does (order XYZ: z first, then y, then x; YXZ: z, x, y) */
export function pointOf(p, v) {
  let q = turnZ(v, p.rz || 0);
  q = p.ord === 'YXZ' ? turnY(turnX(q, p.rx || 0), p.ry || 0) : turnX(turnY(q, p.ry || 0), p.rx || 0);
  const cy = p.y + (p.s === 'ball' ? p.r * (p.sy || 1) : p.h / 2);
  return [p.x + q[0], cy + q[1], p.z + q[2]];
}
/** half the size of a part along its own axes */
function halfOf(p) {
  if (p.s === 'box') return [p.w / 2, p.h / 2, p.d / 2];
  if (p.s === 'cyl') { const r = Math.max(p.r, p.r2); return [r, p.h / 2, r]; }
  return [p.r * (p.sx || 1), p.r * (p.sy || 1), p.r * (p.sz || 1)];
}
/** the box around parts: { x0, x1, y0, y1, z0, z1 } */
export function bounds(parts) {
  const bb = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity, z0: Infinity, z1: -Infinity };
  parts.forEach((p) => {
    const [hx, hy, hz] = halfOf(p);
    for (const i of [-1, 1]) for (const j of [-1, 1]) for (const k of [-1, 1]) {
      const [x, y, z] = pointOf(p, [i * hx, j * hy, k * hz]);
      bb.x0 = Math.min(bb.x0, x); bb.x1 = Math.max(bb.x1, x); bb.y0 = Math.min(bb.y0, y); bb.y1 = Math.max(bb.y1, y); bb.z0 = Math.min(bb.z0, z); bb.z1 = Math.max(bb.z1, z);
    }
  });
  return bb;
}
const partsCache = new Map();
/** the parts of a piece, centred on its footprint (the same list every time: do not change it) */
export function partsOf(type) {
  if (!SCANDI[type]) return [];
  if (!partsCache.has(type)) {
    const parts = SCANDI[type].parts(), bb = bounds(parts), cx = (bb.x0 + bb.x1) / 2, cz = (bb.z0 + bb.z1) / 2;
    partsCache.set(type, parts.map((p) => ({ ...p, x: p.x - cx, z: p.z - cz })));
  }
  return partsCache.get(type);
}
/** the footprint in the 2D plan: { w, d } (m), { r } for a round piece */
export function footOf(type) {
  const bb = bounds(partsOf(type)), w = +(bb.x1 - bb.x0).toFixed(2), d = +(bb.z1 - bb.z0).toFixed(2);
  return SCANDI[type]?.round ? { r: +(Math.max(w, d) / 2).toFixed(3) } : { w, d };
}
