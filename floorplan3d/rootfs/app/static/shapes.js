/* Building blocks of the pieces made of simple parts (scandi.js: furniture in Scandinavian style, leisure.js: sauna, fitness, bar, cinema,
 * PC, LED mirrors): boxes, cylinders, balls, rods and bars between two points, legs, rows of books ... Pure geometry, no three.js; the
 * format of a part is described in scandi.js. Unit tests: tests/scandi.test.mjs, tests/leisure.test.mjs */

export const B = (w, h, d, x = 0, y = 0, z = 0, m = 'f', rot = {}) => ({ s: 'box', w, h, d, x, y, z, m, ...rot });
export const C = (r, h, x = 0, y = 0, z = 0, m = 'f', r2 = r, seg = 16) => ({ s: 'cyl', r, r2, h, x, y, z, m, seg });
export const S = (r, x = 0, y = 0, z = 0, m = 'f', sx = 1, sy = 1, sz = 1) => ({ s: 'ball', r, x, y, z, m, sx, sy, sz });
export const prism = (r, h, x, cy, z, m, rot) => ({ s: 'cyl', r, r2: r, h, x, y: cy - h / 2, z, m, seg: 3, ...rot });   // a triangle (fins, leaves), cy: its middle
const sub = (q, p) => [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
/** a round rod from point p to point q (its own y axis turned onto p -> q) */
export function rod(p, q, r, m = 'metal', seg = 10) {
  const [dx, dy, dz] = sub(q, p), L = Math.hypot(dx, dy, dz) || 1e-6;
  return { s: 'cyl', r, r2: r, h: L, seg, x: (p[0] + q[0]) / 2, y: (p[1] + q[1]) / 2 - L / 2, z: (p[2] + q[2]) / 2, m, rx: Math.atan2(dz, dy), rz: Math.asin(Math.max(-1, Math.min(1, -dx / L))) };
}
/** a square bar (w wide, t thick) from p to q; a flat one (mostly level) keeps its width level */
export function bar(p, q, w, t, m = 'f') {
  const [dx, dy, dz] = sub(q, p), L = Math.hypot(dx, dy, dz) || 1e-6, x = (p[0] + q[0]) / 2, cy = (p[1] + q[1]) / 2, z = (p[2] + q[2]) / 2;
  if (Math.abs(dy) >= Math.hypot(dx, dz)) return { s: 'box', w, h: L, d: t, x, y: cy - L / 2, z, m, rx: Math.atan2(dz, dy), rz: Math.asin(Math.max(-1, Math.min(1, -dx / L))) };
  return { s: 'box', w, h: t, d: L, x, y: cy - t / 2, z, m, ord: 'YXZ', rx: Math.atan2(-dy, Math.hypot(dx, dz)), ry: Math.atan2(dx, dz) };   // turned, then tilted: the width stays level
}
/** a knob on a front at (x, y), standing out from z */
export const knob = (x, y, z, m = 'metal') => rod([x, y, z], [x, y, z + 0.022], 0.012, m);
/** a thin dark gap on a front (between drawers, doors) */
export const hline = (w, x, y, z) => B(w, 0.004, 0.004, x, y - 0.002, z, 'line');
export const vline = (h, x, y, z) => B(0.004, h, 0.004, x, y, z, 'line');
/** four legs (t thick, round or square) under a w x d top, `inset` from its edges */
export const legs = (w, d, h, t, inset = 0, m = 'f', round = false, y = 0) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([i, k]) => {
  const x = i * (w / 2 - inset - t / 2), z = k * (d / 2 - inset - t / 2);
  return round ? C(t / 2, h, x, y, z, m, t / 2, 10) : B(t, h, t, x, y, z, m);
});
/** a row of books standing from x0 along `len` metres, at most hmax high; `seed` picks their sizes and colours (always the same) */
export function books(x0, len, y, z, depth, hmax, seed) {
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
export function tiltX(parts, a, py = 0, pz = 0) {
  const c = Math.cos(a), s = Math.sin(a);
  parts.forEach((p) => {
    const half = p.s === 'ball' ? p.r * (p.sy || 1) : p.h / 2, y = p.y + half - py, z = p.z - pz;
    p.y = y * c - z * s + py - half; p.z = y * s + z * c + pz; p.rx = (p.rx || 0) + a;
  });
  return parts;
}
/** a framed glass door (w x h) from y0, its face at z */
export const glassDoor = (x, w, y0, h, z, st = 0.05) => [
  B(st, h, 0.018, x - w / 2 + st / 2, y0, z), B(st, h, 0.018, x + w / 2 - st / 2, y0, z),
  B(w - 2 * st, st, 0.018, x, y0, z), B(w - 2 * st, st * 1.2, 0.018, x, y0 + h - st * 1.2, z), B(w - 2 * st, h - st * 2.2, 0.006, x, y0 + st, z, 'glass'),
];
/** the parts moved by (dx, dy, dz) (a copy) */
export const at = (parts, dx = 0, dy = 0, dz = 0) => parts.map((q) => ({ ...q, x: q.x + dx, y: q.y + dy, z: q.z + dz }));
/** the parts turned by a round the y axis through x = z = 0 (a copy): each part keeps its own turn and is turned as a whole on top of it
 *  (order YXZ: three.js turns round y last). A part already turned round y in the order XYZ cannot be turned like this. */
export function turnAll(parts, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return parts.map((q) => {
    if (q.ry && q.ord !== 'YXZ' && (q.rx || q.rz)) throw new Error('turnAll: a part turned round x or z after y');
    return { ...q, x: q.x * c + q.z * s, z: -q.x * s + q.z * c, ord: 'YXZ', ry: (q.ry || 0) + a };
  });
}
/** a box tilted round x by a (its top towards -z with a < 0), its middle at (x, cy, z), moved `off` along its front face */
export const tilted = (w, h, d, x, cy, z, a, m, off = 0) => B(w, h, d, x, cy - h / 2 - off * Math.sin(a), z + off * Math.cos(a), m, { rx: a });
/** a cylinder lying along x (a wheel seen from the side), its middle at (x, cy, z), t thick */
export const wheelX = (r, t, x, cy, z, m, seg = 24) => ({ ...C(r, t, x, cy - t / 2, z, m, r, seg), rz: Math.PI / 2 });
/** a cylinder lying along z (a disc facing the front), its middle at (x, cy, z), t thick */
export const discZ = (r, t, x, cy, z, m, seg = 24) => ({ ...C(r, t, x, cy - t / 2, z, m, r, seg), rx: Math.PI / 2 });
