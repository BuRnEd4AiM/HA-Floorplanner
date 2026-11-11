/* Mitre joints at slanted corners (#724, Miicki: "an der Ecke entsteht eine sichtbare Kerbe … die rechteckigen Wandenden stehen über die
 * Aussenfläche der anderen Wand hinaus"). Every wall reaches half its thickness past its corner with a square end (walls.js, openingstack.js
 * solidParts): at 90° that fills the corner exactly, at any other angle a notch stays outside and the corners of the boxes stick out. Where
 * exactly two walls of the same height meet at a point at another angle, each face of both walls now runs on to where it meets the matching
 * face of the other one (the outer faces to each other, the inner ones to each other): a mitre along the line through those two points, also
 * with different thicknesses. Pure (no three.js, no DOM): unit test tests/wallmiter.test.mjs; walls.js builds the ends, plan2d.js draws them,
 * finishes.js lays the wall finish to them.
 *
 * The ends of a wall w (from a to b): { a: [left, right] | null, b: [left, right] | null }, how far each face reaches past that end along the
 * wall (m; negative: it stops short of it). "left" is the face on the left going from a to b (local +z in walls.js, the +normal in plan2d.js
 * wallPoly), "right" the other one. null: the square end as before (t / 2 for both faces). */

export const TOL = 0.01;            // m: ends closer than this are one corner
export const SQUARE = 1;            // degrees: this close to 90° (or to 0° / 180°) the square ends stay (they fit, or the walls run straight on)
export const MAX_REACH = 3;         // a face reaching more than this many thicknesses past the corner (a very sharp angle): square ends
export const EDGE = 0.05;           // m: an opening keeps this much solid wall to where a face stops short (walls.js EDGE)

const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const cross = (p, q) => p[0] * q[1] - p[1] * q[0];
const dot = (p, q) => p[0] * q[0] + p[1] * q[1];
const near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < TOL;
const unit = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); return L > 1e-9 ? [dx / L, dz / L, L] : null; };

/** how far the faces of wall w reach past its end `end` ('a' or 'b') when it meets wall o there, with o's end `oEnd` at that point:
 *  [left, right], or null for the square end */
export function miterEnd(w, end, o, oEnd) {
  const u = unit(w.a, w.b), v0 = unit(o.a, o.b);
  if (!u || !v0) return null;
  const E = end === 'a' ? w.a : w.b, d = end === 'a' ? [u[0], u[1]] : [-u[0], -u[1]];        // d: from the corner into w
  const v = oEnd === 'a' ? [v0[0], v0[1]] : [-v0[0], -v0[1]];                                 // v: from the corner into o
  const deg = (Math.acos(Math.max(-1, Math.min(1, dot(d, v)))) * 180) / Math.PI;
  if (Math.abs(deg - 90) < SQUARE || deg < SQUARE || deg > 180 - SQUARE) return null;
  const t = num(w.thickness, 0.2), t2 = num(o.thickness, 0.2);
  const n = [-u[1], u[0]], m = [-v0[1], v0[0]];                                               // the left normals (a → b) of both walls
  const out = [];
  for (const s of [1, -1]) {                                                                  // the left face, then the right one
    const s2 = s * Math.sign(dot(n, v)) * Math.sign(dot(m, d));                               // o's face on the same side of the corner
    const P = [E[0] + (s * n[0] * t) / 2, E[1] + (s * n[1] * t) / 2], Q = [E[0] + (s2 * m[0] * t2) / 2, E[1] + (s2 * m[1] * t2) / 2];
    const along = cross([Q[0] - P[0], Q[1] - P[1]], v) / cross(d, v);                         // where w's face meets o's, measured into w
    out.push(-along);
  }
  if (out.some((e) => !Number.isFinite(e) || Math.abs(e) > MAX_REACH * Math.max(t, t2))) return null;
  return out;
}

/** the ends of every wall of a floor (in the order given): [{ a, b }], each [left, right] or null (see above). Only where exactly two walls
 *  of the same height end at one point (within TOL), not where an opening would reach into the slanted part, and not where a face would
 *  stop short of the middle of the wall. */
export function miterEnds(walls) {
  const list = walls || [];
  const ends = [];
  list.forEach((w, i) => { if (Array.isArray(w?.a) && Array.isArray(w?.b)) for (const e of ['a', 'b']) ends.push({ i, e, p: w[e] }); });
  const out = list.map(() => ({ a: null, b: null }));
  for (const x of ends) {
    const at = ends.filter((y) => near(y.p, x.p));
    if (at.length !== 2) continue;                                                            // a free end, or three and more walls
    const y = at.find((q) => q !== x);
    if (y.i === x.i) continue;                                                                // a wall of no length
    const w = list[x.i], o = list[y.i];
    if (Math.abs(num(w.height, 2.6) - num(o.height, 2.6)) > TOL) continue;                    // a low wall at a high one: square as before
    const r = miterEnd(w, x.e, o, y.e);
    if (!r || !fits(w, x.e, r)) continue;
    out[x.i][x.e] = r;
  }
  // both walls of a corner or neither: a mitre on one side only would leave a gap
  ends.forEach((x) => {
    const at = ends.filter((y) => near(y.p, x.p));
    if (at.length !== 2) return;
    const y = at.find((q) => q !== x);
    if (!out[x.i][x.e] || !out[y.i][y.e]) { out[x.i][x.e] = null; out[y.i][y.e] = null; }
  });
  return out;
}

/** does a mitred end leave the wall's openings and its other end alone */
function fits(w, end, r) {
  const L = unit(w.a, w.b)?.[2] || 0, short = Math.max(0, -Math.min(...r));                    // how far the shorter face stops before the end
  if (short > L / 2 - EDGE) return false;
  for (const op of w.openings || []) {
    const lo = num(op.pos) - num(op.width) / 2, hi = num(op.pos) + num(op.width) / 2;
    const gap = end === 'a' ? lo : L - hi;                                                     // solid wall between the end and the opening
    if (gap < short + EDGE) return false;
  }
  return true;
}

/** a wall's outline in the plan (x, z): [a-left, b-left, b-right, a-right] with the ends of miterEnds (null: t / 2 square) */
export function wallOutline(w, end = {}) {
  const u = unit(w.a, w.b);
  if (!u) return [];
  const t = num(w.thickness, 0.2), [ux, uz] = u, nx = (-uz * t) / 2, nz = (ux * t) / 2;
  const [aL, aR] = end.a || [t / 2, t / 2], [bL, bR] = end.b || [t / 2, t / 2];
  const at = (p, k) => [p[0] + ux * k, p[1] + uz * k];
  const A1 = at(w.a, -aL), A2 = at(w.a, -aR), B1 = at(w.b, bL), B2 = at(w.b, bR);
  return [[A1[0] + nx, A1[1] + nz], [B1[0] + nx, B1[1] + nz], [B2[0] - nx, B2[1] - nz], [A2[0] - nx, A2[1] - nz]];
}

/** the faces of a piece of wall with slanted ends (local x along the wall, y up, z across; walls.js): its left face (z = +depth / 2) from
 *  l0 to l1, its right face (z = −depth / 2) from r0 to r1, from y0 to y1. Six flat faces with their outward normals, 24 corners and 36
 *  indices like a BoxGeometry (so it merges with the other pieces): { pos, nor, uv, idx } as plain arrays. */
export function prismFaces(l0, l1, r0, r1, y0, y1, depth) {
  const h = depth / 2;
  const P = { LB0: [l0, y0, h], LB1: [l1, y0, h], LT0: [l0, y1, h], LT1: [l1, y1, h], RB0: [r0, y0, -h], RB1: [r1, y0, -h], RT0: [r0, y1, -h], RT1: [r1, y1, -h] };
  const faces = [
    [['LB0', 'LB1', 'LT1', 'LT0'], [0, 0, 1]], [['RB1', 'RB0', 'RT0', 'RT1'], [0, 0, -1]],
    [['LT0', 'LT1', 'RT1', 'RT0'], [0, 1, 0]], [['RB0', 'RB1', 'LB1', 'LB0'], [0, -1, 0]],
    [['RB0', 'LB0', 'LT0', 'RT0'], [-1, 0, 0]], [['LB1', 'RB1', 'RT1', 'LT1'], [1, 0, 0]],
  ];
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
  const crs = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
  const pos = [], nor = [], uv = [], idx = [];
  for (const [names, want] of faces) {
    let q = names.map((k) => P[k]);
    let n = crs(sub(q[1], q[0]), sub(q[2], q[0]));
    if (Math.hypot(...n) < 1e-12) n = crs(sub(q[2], q[0]), sub(q[3], q[0]));                     // a corner where two faces end in one point
    if (n[0] * want[0] + n[1] * want[1] + n[2] * want[2] < 0) { q = [q[0], q[3], q[2], q[1]]; n = n.map((x) => -x); }   // turned outward
    const k = Math.hypot(...n) || 1, base = pos.length / 3;
    q.forEach((p, i) => { pos.push(...p); nor.push(n[0] / k, n[1] / k, n[2] / k); uv.push(i === 1 || i === 2 ? 1 : 0, i >= 2 ? 1 : 0); });
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return { pos, nor, uv, idx };
}
