/* A lived-in attic (#260, #265): the roof can start lower than on top of the storey below the roof floor: on a knee wall (Kniestock) of a
 * set height, in that storey or one further down. The storeys from there up lie under the slopes: their walls are cut off where they
 * meet the roof, except where a dormer stands out of it (there they reach up under the dormer). The roof floor is the loft (Spitzboden).
 * Walls on the roof floor itself are cut at the roof too. The ridge height can be typed in instead of the pitch. Pure maths, no
 * three.js, no DOM (unit test: tests/attic.test.mjs); atticclip.js cuts the wall materials with it. */
import { roofFrame } from './solarroof.js';
import { fitDormer } from './dormer.js';

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

const GAP = 0.03;   // walls end this far under the roof surface, so the roof is never hidden by a wall top
/** the planes of a roof's slopes (base box bb, spec with type / pitch / overhang / ridge, lifted by y0) as [nx, ny, nz, d] with a unit normal:
 *  a point p lies under the roof when nx*px + ny*py + nz*pz + d >= 0 for every plane (the roof is the lowest of its planes). A flat roof
 *  gives no planes (nothing is cut). */
export function roofPlanes(bb, spec, y0 = 0) {
  if (!bb || spec?.type === 'flat') return [];
  const F = roofFrame(bb, spec);
  if (!(F.h > 0)) return [];
  const out = [];
  // a plane y = c + s * u (u = a or b, the coordinate along which it rises); under it: c + s*u - y >= 0
  const plane = (axis, s, c) => {
    const len = Math.hypot(s, 1), n = [0, -1 / len, 0];
    const k = (axis === 'a') === F.alongX ? 0 : 2;                         // a is x when the ridge runs along x
    n[k] = s / len;
    out.push([n[0], n[1], n[2], (c + y0 - GAP) / len]);
  };
  const m = F.h / F.half;
  plane('b', -m, F.h + m * F.bc);                                           // the long side towards b1
  plane('b', m, F.h - m * F.bc);                                            // the long side towards b0
  if (F.ins > 0) {                                                          // a hip roof: its two ends
    const e = F.h / F.ins;
    plane('a', e, -e * F.a0);
    plane('a', -e, e * F.a1);
  }
  return out;
}

const FRONT = 0.25;  // a wall this far in front of a dormer's front wall still reaches up into it (the wall thickness)
/** the room inside each dormer of the roof (#265), where walls are not cut: { x0, x1, z0, z1 } (from the dormer's front wall back to the
 *  ridge line), top (its ceiling, lifted by y0), gh (the extra height of a gable dormer in its middle), at (its middle along the ridge),
 *  alongX (the ridge runs along x) */
export function dormerRooms(bb, spec, y0 = 0) {
  if (!bb || !spec || spec.type === 'flat') return [];
  const out = [];
  for (const d of spec.dormers || []) {
    const n = fitDormer(bb, spec, d);
    if (!n) continue;
    const F = n.F, bc = (F.b0 + F.b1) / 2, hw2 = n.w / 2;
    const front = Math.max(0, n.eave - FRONT);                              // a wall right under the dormer's front wall still counts
    const [b0, b1] = n.side === 0 ? [F.b0 + front, bc] : [bc, F.b1 - front];
    const [a0, a1] = [n.at - hw2, n.at + hw2];
    const box = F.alongX ? { x0: a0, x1: a1, z0: b0, z1: b1 } : { x0: b0, x1: b1, z0: a0, z1: a1 };
    out.push({ ...box, top: y0 + n.yT - GAP, gh: n.gh, at: n.at, alongX: F.alongX });
  }
  return out;
}

/** is the point (x, y, z) kept: under the roof (all planes, see roofPlanes) or inside a dormer room (see dormerRooms). The wall shader in
 *  atticclip.js does the same per pixel */
export function keptAt(planes, rooms, x, y, z) {
  if (planes.every(([a, b, c, d]) => a * x + b * y + c * z + d >= -1e-9)) return true;
  return rooms.some((q) => {
    if (x < q.x0 || x > q.x1 || z < q.z0 || z > q.z1) return false;
    const u = q.alongX ? x : z, hw = q.alongX ? (q.x1 - q.x0) / 2 : (q.z1 - q.z0) / 2;
    return y <= q.top + q.gh * Math.max(0, 1 - Math.abs(u - q.at) / hw);
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
