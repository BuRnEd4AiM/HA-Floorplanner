/* The shape of a roof (#628): its frame (the outline with the overhang, the ridge axis, the ridge height; solarroof.js, dormer.js,
 * attic.js and roofs.js use it), the gable ends with their own overhang (Ortgang, `gableOver`, the overhang of the eaves unless set)
 * and a gable wall (Giebelwand, `gableWall`, on unless false): the wall under each gable goes on up to the roof in the colour of the
 * walls, instead of a triangle in the colour of the roof out at the edge of the overhang. And the shed roof (Pultdach, type 'shed'): one
 * slope from its low eave up to its high side (`high`: the edge of the base box that is high, 'z0' top, 'z1' bottom, 'x0' left, 'x1'
 * right in the plan), no overhang on the high side (it often leans against the house); its two sides and its high side get the wall.
 * Pure, no three.js, no DOM (unit test: tests/roofshape.test.mjs). */
import { outAt } from './roofsteps.js';

export const ROOF_TYPES = ['gable', 'hip', 'flat', 'shed'];
export const SHED_HIGH = ['z0', 'z1', 'x0', 'x1'];
export const SHED_PITCH = 10;                       // a new shed roof (degrees)
export const WALL_T = 0.3;                          // a gable wall without walls under it to take the thickness from (m)
const GAP = 0.03;                                   // a gable wall ends this far under the roof, like the walls cut at the roof (attic.js)
const INSET = 0.005;                                // ... and 5 mm thinner on each face than the wall: a wall drawn there covers it without flicker

/** does roof r have gable ends with their own overhang and a gable wall: a gable roof (its two gables) or a shed roof (its sides, its high side) */
export const hasGables = (r) => r?.type === 'gable' || r?.type === 'shed';
/** the overhang at the gable ends (Ortgang, 0 to 3 m): its own value, else the overhang of the eaves (as before #628) */
export function gableOverOf(r) {
  const g = Number(r?.gableOver);
  return r?.gableOver != null && r.gableOver !== '' && Number.isFinite(g) ? Math.max(0, Math.min(3, g)) : (r?.overhang ?? 0.4);
}
/** is the gable wall drawn (a gable or shed roof, on unless switched off) */
export const gableWallOn = (r) => hasGables(r) && r.gableWall !== false;
/** the high side of a shed roof ('z0' unless set) */
export const shedHigh = (r) => (SHED_HIGH.includes(r?.high) ? r.high : 'z0');
/** how far a further roof is moved up (down: negative), -10 to 10 m */
export const dyOf = (p) => (Number.isFinite(+p?.dy) ? Math.max(-10, Math.min(10, +p.dy)) : 0);

/** The frame of a roof as roofGeometry draws it: the outline with the overhangs (x0..x1, z0..z1), the ridge axis a (alongX), the axis b
 *  across it (a0..a1, b0..b1), the ridge bc and its height h over the eave, half (from the eave to the ridge), tan (the pitch), the hip
 *  inset ins. A shed roof (shed: true) rises across all of b to its high side hi (0: at b0, 1: at b1), which is bc; half is then the whole
 *  run. `bb` is the base box, `r` the roof spec (type / pitch / overhang / gableOver / ridge / high). */
export function roofFrame(bb, r) {
  const o = r.overhang ?? 0.4, shed = r.type === 'shed', g = hasGables(r) ? gableOverOf(r) : o;
  const hs = shedHigh(r), hi = shed && hs[1] === '1' ? 1 : 0;
  const alongX = shed ? hs[0] === 'z' : r.ridge ? r.ridge === 'x' : bb.x1 - bb.x0 >= bb.z1 - bb.z0;
  const [A0, A1, B0, B1] = alongX ? [bb.x0, bb.x1, bb.z0, bb.z1] : [bb.z0, bb.z1, bb.x0, bb.x1];
  const a0 = A0 - g, a1 = A1 + g, b0 = B0 - (shed && hi === 0 ? 0 : o), b1 = B1 + (shed && hi === 1 ? 0 : o);
  const [x0, x1, z0, z1] = alongX ? [a0, a1, b0, b1] : [b0, b1, a0, a1];
  const flat = r.type === 'flat', tan = Math.tan(((r.pitch ?? 35) * Math.PI) / 180);
  const half = shed ? b1 - b0 : (b1 - b0) / 2, bc = shed ? (hi ? b1 : b0) : (b0 + b1) / 2;
  const h = flat ? 0.15 : half * tan;
  const ins = r.type === 'hip' ? Math.min(half, (a1 - a0) / 2) : 0;
  return { x0, x1, z0, z1, alongX, a0, a1, b0, b1, half, bc, h, ins, flat, tan, shed, hi };
}

/** the slope of a shed roof as triangles ([x, y, z] points, 3 per triangle), facing up: from the low eave (y 0) to the high side (y h);
 *  holes: where roof windows lie (#643, skylight.js: [{ a0, a1, e0, e1 }], e from the low eave), the slope is cut into a grid round them */
export function shedSurface(bb, r, holes = []) {
  const F = roofFrame(bb, r), P = (a, b, y) => (F.alongX ? [a, y, b] : [b, y, a]);
  const lo = F.hi ? F.b0 : F.b1, sg = F.hi ? 1 : -1, Q = (a, e) => P(a, lo + sg * e, e * F.tan);
  const cuts = (vals, a, b) => [...new Set([a, ...vals.filter((v) => v > a + 1e-6 && v < b - 1e-6), b])].sort((p, q) => p - q);
  const as = cuts(holes.flatMap((h) => [h.a0, h.a1]), F.a0, F.a1), es = cuts(holes.flatMap((h) => [h.e0, h.e1]), 0, F.half), tris = [];
  for (let i = 0; i + 1 < as.length; i++) for (let j = 0; j + 1 < es.length; j++) {
    const am = (as[i] + as[i + 1]) / 2, em = (es[j] + es[j + 1]) / 2;
    if (holes.some((h) => am > h.a0 && am < h.a1 && em > h.e0 && em < h.e1)) continue;
    const q = [Q(as[i], es[j]), Q(as[i + 1], es[j]), Q(as[i + 1], es[j + 1]), Q(as[i], es[j + 1])];
    if (cross(q[0], q[1], q[2])[1] < 0) q.reverse();
    tris.push(q[0], q[1], q[2], q[0], q[2], q[3]);
  }
  return tris;
}

/** the outline of a wall from `from` up to the profile top ([[s, y], ...] along s, its top under the roof: rising, then falling): the part of
 *  it that reaches over `from`, closed along the bottom; [] when none does */
function upTo(top, from) {
  const pts = [];
  top.forEach((p, i) => {
    const q = top[i + 1];
    if (p[1] >= from - 1e-9) pts.push(p);
    if (q && (p[1] >= from) !== (q[1] >= from)) { const u = (from - p[1]) / (q[1] - p[1]); pts.push([p[0] + u * (q[0] - p[0]), from]); }
  });
  if (pts.length < 2) return [];
  const out = [[pts[0][0], from], ...pts, [pts[pts.length - 1][0], from]];
  return out.filter((p, i) => { const q = out[(i + 1) % out.length]; return Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-6; });
}
const area = (pts) => Math.abs(pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;

/** The gable walls of roof r (base box bb) when it has them (gableWallOn): [{ alongX (the wall runs along x), c (where it stands
 *  across: its middle), t (its thickness), poly: [[s, y], ...] }], poly being its outline seen from the front: s along the wall, y the
 *  height over the base of the roof, from `from` (the top of the walls under it, over the base of the roof: higher on a knee wall) up
 *  to just under the roof. A gable roof has one at each gable, on the base box's edge (the middle of the wall under it), as wide as
 *  the house there (with steps in the eaves too, #342) plus the wall's thickness; a shed roof one at each side and one along its high
 *  side. t: the thickness of the walls under it; skip(x, z): leave out the wall whose middle is there (it stands inside another roof:
 *  the inner end of the second wing of an L-shaped house) */
export function gableWalls(bb, r, { from = 0, t = WALL_T, skip = () => false } = {}) {
  if (!bb || !gableWallOn(r)) return [];
  const F = roofFrame(bb, r), alongX = F.alongX, half = t / 2, top = (y) => y - GAP;
  const [A0, A1, B0, B1] = alongX ? [bb.x0, bb.x1, bb.z0, bb.z1] : [bb.z0, bb.z1, bb.x0, bb.x1];
  const XZ = (a, b) => (alongX ? [a, b] : [b, a]);
  const out = [];
  const add = (runsAlongX, c, top, mid) => {
    if (skip(...mid)) return;
    const p = upTo(top, from);
    if (p.length >= 3 && area(p) > 1e-4) out.push({ alongX: runsAlongX, c, t: Math.max(0.02, t - 2 * INSET), poly: p });
  };
  if (F.shed) {
    const hb = F.hi ? B1 : B0, lb = F.hi ? B0 : B1;                                  // the high and the low wall line of the house
    const y = (b) => Math.min(F.h, F.h * (1 - Math.abs(b - F.bc) / F.half));       // beyond the high side: no higher than the roof
    const s0 = Math.min(hb, lb) - half, s1 = Math.max(hb, lb) + half;
    for (const a of [A0, A1]) {                                                     // the two sides: from the high side down to the low eave
      const pts = [[s0, top(y(s0))]];
      if (F.bc > s0 && F.bc < s1) pts.push([F.bc, top(F.h)]);
      pts.push([s1, top(y(s1))]);
      add(!alongX, a, pts, XZ(a, (B0 + B1) / 2));
    }
    add(alongX, hb, [[A0 - half, top(F.h)], [A1 + half, top(F.h)]], XZ((A0 + A1) / 2, hb));   // the high side
    return out;
  }
  [[A0, A0 + 1e-6], [A1, A1 - 1e-6]].forEach(([a, inside]) => {                    // a gable roof: its two gables
    const o0 = outAt(bb, r, 0, inside), o1 = outAt(bb, r, 1, inside);               // the eaves at this end (steps, #342)
    const lo = B0 - o0 - half, hi = B1 + o1 + half;
    const y = (b) => (b <= F.bc ? (F.h * (b - (F.b0 - o0))) / (F.bc - (F.b0 - o0)) : (F.h * (F.b1 + o1 - b)) / (F.b1 + o1 - F.bc));
    add(!alongX, a, [[lo, top(y(lo))], [F.bc, top(F.h)], [hi, top(y(hi))]], XZ(a, F.bc));
  });
  return out;
}

/** the triangles of a gable wall from gableWalls ([x, y, z] points, 3 per triangle, facing out) and the texture coordinates of their
 *  points ([s, y]: along the wall and up, for the facade's finish) */
export function wallTris(w) {
  const { poly, c, t } = w, P = (s, y, k) => (w.alongX ? [s, y, c + k * t / 2] : [c + k * t / 2, y, s]);
  const pos = [], uv = [];
  const tri = (a, b, d) => { pos.push(a.p, b.p, d.p); uv.push(a.uv, b.uv, d.uv); };
  const V = (q, k) => ({ p: P(q[0], q[1], k), uv: [q[0], q[1]] });
  for (const k of [-1, 1]) for (let i = 1; i + 1 < poly.length; i++) tri(V(poly[0], k), V(poly[i], k), V(poly[i + 1], k));   // front and back
  poly.forEach((q, i) => {                                                          // the edges: bottom, sides, top
    const n = poly[(i + 1) % poly.length];
    tri(V(q, -1), V(n, -1), V(n, 1)); tri(V(q, -1), V(n, 1), V(q, 1));
  });
  const cx = poly.reduce((s, q) => s + q[0], 0) / poly.length, cy = poly.reduce((s, q) => s + q[1], 0) / poly.length, mid = P(cx, cy, 0);
  for (let i = 0; i < pos.length; i += 3) {                                         // every triangle faces out (the wall is convex)
    const n = cross(pos[i], pos[i + 1], pos[i + 2]), m = [0, 1, 2].map((k) => (pos[i][k] + pos[i + 1][k] + pos[i + 2][k]) / 3 - mid[k]);
    if (n[0] * m[0] + n[1] * m[1] + n[2] * m[2] < 0) { [pos[i + 1], pos[i + 2]] = [pos[i + 2], pos[i + 1]]; [uv[i + 1], uv[i + 2]] = [uv[i + 2], uv[i + 1]]; }
  }
  return { pos, uv };
}
function cross(p, q, u) {
  const a = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], b = [u[0] - p[0], u[1] - p[1], u[2] - p[2]];
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** how high the walls of a floor are: the highest of them (a wall without its own height: `def`, the setting) */
export function wallHeightOf(floor, def = 2.6) {
  const hs = (floor?.walls || []).map((w) => +w.height || +def || 2.6);
  return hs.length ? Math.max(...hs) : +def || 2.6;
}
/** the thickness of the gable walls: the thickest wall of the floor under the roof (the outer walls), WALL_T without walls */
export function wallThickness(floor) {
  const ts = (floor?.walls || []).map((w) => +w.thickness).filter((v) => Number.isFinite(v) && v > 0);
  return ts.length ? Math.max(0.1, Math.min(0.6, Math.max(...ts))) : WALL_T;
}

/** the side of a further roof's base box pb that faces the main roof's base box mb (a shed roof leaning against the house is high
 *  there): 'z1' when it lies above mb in the plan, 'z0' below, 'x1' left of it, 'x0' right of it; 'z0' when it lies over it */
export function shedHighToward(pb, mb) {
  if (!pb || !mb) return 'z0';
  const gaps = [['z1', mb.z0 - pb.z1], ['z0', pb.z0 - mb.z1], ['x1', mb.x0 - pb.x1], ['x0', pb.x0 - mb.x1]].filter(([, g]) => g > -0.3);
  return gaps.length ? gaps.sort((p, q) => q[1] - p[1])[0][0] : 'z0';
}

/** a canopy (Vordach, #628) in front of the house: a shed roof `depth` m deep along the eave of the main roof (base box mb, its ridge
 *  along x or not) at the bottom of the plan (right, when the ridge runs along z), as long as the house, high against the wall just
 *  under the main roof's eave (as high as the main roof, moved down by its own height), without gable walls */
export function newCanopy(mb, alongX, id, depth = 2.5) {
  const box = alongX ? { x0: mb.x0, x1: mb.x1, z0: mb.z1, z1: mb.z1 + depth } : { x0: mb.x1, x1: mb.x1 + depth, z0: mb.z0, z1: mb.z1 };
  const p = { id, type: 'shed', pitch: SHED_PITCH, overhang: 0.2, gableOver: 0.1, gableWall: false, high: alongX ? 'z0' : 'x0', box, level: 'main' };
  p.dy = -Math.round((roofFrame(box, p).h + 0.05) * 100) / 100;
  return p;
}
