/* A lived-in attic (#260, #265): the roof can start lower than on top of the storey below the roof floor: on a knee wall (Kniestock) of a
 * set height, in that storey or one further down. The storeys from there up lie under the slopes: their walls are cut off where they
 * meet the roof, except where a dormer stands out of it (there they reach up under the dormer). The roof floor is the loft (Spitzboden).
 * Walls on the roof floor itself are cut at the roof too. The ridge height can be typed in instead of the pitch. Pure maths, no
 * three.js, no DOM (unit test: tests/attic.test.mjs); atticclip.js cuts the wall materials with it. */
import { roofFrame } from './solarroof.js';
import { fitDormer } from './dormer.js';
import { sectionsOf } from './roofsteps.js';

/** the knee wall height of a roof spec in metres, or null when the roof sits on top of the storey below as usual */
export function kneeOf(spec, maxH = Infinity) {
  const k = Number(spec?.knee);
  return spec?.knee == null || spec.knee === '' || !Number.isFinite(k) ? null : Math.max(0, Math.min(maxH, k));
}

/** the storey the roof of roof floor r starts in (its knee wall stands on it): the one chosen (roof.base, a floor id below r that is
 *  not a roof floor), else the one right below */
export function roofBaseIdx(floors, r) {
  const id = floors[r]?.roof?.base;
  const i = id ? floors.findIndex((f) => f.id === id) : -1;
  return i >= 0 && i < r && floors[i].kind !== 'roof' ? i : r - 1;
}

/** how high the main roof of roof floor r sits over the floor of roof floor r (negative: lower); elev(i) is the height of floor i.
 *  0 without a knee wall (on top of the storey below, as before) */
export function roofY0(floors, r, elev) {
  const k = kneeOf(floors[r]?.roof);
  if (k == null || r < 1) return 0;
  const b = roofBaseIdx(floors, r);
  return b < 0 ? 0 : elev(b) + k - elev(r);
}

/** which roof floor cuts the walls of floor i: the roof floor itself, or the next roof floor above it when its roof starts (on a knee
 *  wall) at floor i or below; -1 for none */
export function clipRoofFloor(floors, i) {
  if (floors[i]?.kind === 'roof') return i;
  let r = i + 1;
  while (r < floors.length && floors[r].kind !== 'roof') r++;
  if (r >= floors.length || kneeOf(floors[r].roof) == null) return -1;
  return roofBaseIdx(floors, r) <= i ? r : -1;
}

/** the roof floor whose roof lies over the rooms of floor i (shown see-through over a focused room): the one that cuts its walls, else
 *  the roof floor right above it; -1 for none */
export function coverRoofFloor(floors, i) {
  const c = clipRoofFloor(floors, i);
  return c >= 0 ? c : floors[i + 1]?.kind === 'roof' ? i + 1 : -1;
}

/** does the roof over a room matter for it (room view): only when the roof cuts the walls of the room's floor (knee wall) or a dormer
 *  room (see dormerRooms) lies over the room's outline pts. A roof that simply sits on top of the storey is above the ceiling, it is
 *  not drawn over the room (it floated high above it, #306) */
export function roofOverRoom({ cuts, dormers, pts }) {
  if (cuts) return true;
  if (!pts?.length) return false;
  const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
  return (dormers || []).some((q) => q.x0 < x1 && q.x1 > x0 && q.z0 < z1 && q.z1 > z0);
}

const GAP = 0.03;   // walls end this far under the roof surface, so the roof is never hidden by a wall top
/** the planes of a roof's slopes (base box bb, spec with type / pitch / overhang / ridge, lifted by y0) as [nx, ny, nz, d] with a unit normal:
 *  a point p lies under the roof when nx*px + ny*py + nz*pz + d >= 0 for every plane (the roof is the lowest of its planes). A flat roof
 *  gives no planes (nothing is cut). On a roof with steps (#342) every piece of a slope has its own plane, which only counts along its own
 *  stretch of the ridge: then the plane carries [..., axisX (1: the stretch is in x, 0: in z), from, to] */
export function roofPlanes(bb, spec, y0 = 0) {
  if (!bb || spec?.type === 'flat') return [];
  const F = roofFrame(bb, spec);
  if (!(F.h > 0)) return [];
  const out = [];
  // a plane y = c + s * u (u = a or b, the coordinate along which it rises); under it: c + s*u - y >= 0
  const plane = (axis, s, c, range) => {
    const len = Math.hypot(s, 1), n = [0, -1 / len, 0];
    const k = (axis === 'a') === F.alongX ? 0 : 2;                         // a is x when the ridge runs along x
    n[k] = s / len;
    out.push([n[0], n[1], n[2], (c + y0 - GAP) / len, ...(range || [])]);
  };
  const m = F.h / F.half;
  for (const side of [1, 0]) {                                              // the long sides towards b1 and towards b0
    const secs = sectionsOf(bb, spec, side);
    secs.forEach((q, i) => {
      const range = secs.length > 1 ? [F.alongX ? 1 : 0, i === 0 ? -1e6 : q.a0, i === secs.length - 1 ? 1e6 : q.a1] : null;
      const s = F.h / (F.half + q.out);
      if (side === 1) plane('b', q.out ? -s : -m, q.out ? s * (F.b1 + q.out) : F.h + m * F.bc, range);
      else plane('b', q.out ? s : m, q.out ? -s * (F.b0 - q.out) : F.h - m * F.bc, range);
    });
  }
  if (F.ins > 0) {                                                          // a hip roof: its two ends
    const e = F.h / F.ins;
    plane('a', e, -e * F.a0);
    plane('a', -e, e * F.a1);
  }
  return out;
}

const FRONT = 0.25;  // a wall this far in front of a dormer's front wall still reaches up into it (the wall thickness)
/** the room inside each dormer of the roof (#265), where walls are not cut: { x0, x1, z0, z1 } (from the dormer's front wall back to the
 *  ridge line), top (its ceiling at the front, lifted by y0), gh (the extra height of a gable dormer in its middle), at (its middle along
 *  the ridge), alongX (the ridge runs along x), rise (how much the ceiling of a shed dormer climbs per metre back from the front, #339;
 *  0 for the others), fb (the front's x or z across the ridge), dir (+1 / -1: the way from the front back into the dormer) */
export function dormerRooms(bb, spec, y0 = 0) {
  if (!bb || !spec || spec.type === 'flat') return [];
  const out = [];
  for (const d of spec.dormers || []) {
    const n = fitDormer(bb, spec, d);
    if (!n) continue;
    const F = n.F, bc = F.bc ?? (F.b0 + F.b1) / 2, hw2 = n.w / 2;
    const front = Math.max(0, n.eave - FRONT);                              // a wall right under the dormer's front wall still counts
    const [b0, b1] = n.side === 0 ? [F.b0 + front, bc] : [bc, F.b1 - front];
    const [a0, a1] = [n.at + (n.u0 ?? -hw2), n.at + (n.u1 ?? hw2)];
    const box = F.alongX ? { x0: a0, x1: a1, z0: b0, z1: b1 } : { x0: b0, x1: b1, z0: a0, z1: a1 };
    out.push({ ...box, top: y0 + n.yT - GAP, gh: n.gh, at: n.at, alongX: F.alongX, rise: n.ts, fb: n.side === 0 ? F.b0 + n.eave : F.b1 - n.eave, dir: n.side === 0 ? 1 : -1 });
  }
  return out;
}

/** is the point (x, y, z) kept: under the roof (all planes, see roofPlanes) or inside a dormer room (see dormerRooms). The wall shader in
 *  atticclip.js does the same per pixel */
export function keptAt(planes, rooms, x, y, z) {
  const counts = (p) => p.length < 7 || ((u) => u >= p[5] && u <= p[6])(p[4] ? x : z);   // a plane of a slope piece: only along its stretch
  if (planes.every((p) => !counts(p) || p[0] * x + p[1] * y + p[2] * z + p[3] >= -1e-9)) return true;
  return rooms.some((q) => {
    if (x < q.x0 || x > q.x1 || z < q.z0 || z > q.z1) return false;
    const u = q.alongX ? x : z, hw = q.alongX ? (q.x1 - q.x0) / 2 : (q.z1 - q.z0) / 2, b = q.alongX ? z : x;
    return y <= q.top + q.gh * Math.max(0, 1 - Math.abs(u - q.at) / hw) + (q.rise || 0) * Math.max(0, (b - q.fb) * q.dir);
  });
}
/** is the point under the roof planes only (no dormers) */
export const underRoof = (planes, x, y, z) => keptAt(planes, [], x, y, z);

/** the height of the ridge over the top of the walls it stands on (the base box edge; with a knee wall: over the knee wall), set by the
 *  pitch; 0 for a flat roof */
export function ridgeHeight(bb, spec) {
  if (!bb || spec?.type === 'flat') return 0;
  const F = roofFrame(bb, spec), o = spec?.overhang ?? 0.4;
  return F.h * (1 - o / F.half);
}
/** the pitch (degrees, 5 to 70) that gives the ridge height h over the top of the walls */
export function pitchFor(bb, spec, h) {
  const F = roofFrame(bb, { ...spec, type: 'gable' }), o = spec?.overhang ?? 0.4;
  const deg = (Math.atan(Math.max(0, h) / (F.half - o)) * 180) / Math.PI;
  return Math.max(5, Math.min(70, +deg.toFixed(1)));
}
