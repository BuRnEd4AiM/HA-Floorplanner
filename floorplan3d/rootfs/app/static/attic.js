/* A lived-in attic (#260): the roof can start inside the storey below the roof floor, on a knee wall (Kniestock) of a set height. Then that
 * storey (the Dachgeschoss) lies under the slopes: its walls are cut off where they meet the roof, and the roof floor above it is the loft
 * (Spitzboden) for the things stored up there. Walls on the roof floor itself are cut at the roof too. Pure maths, no three.js, no DOM
 * (unit test: tests/attic.test.mjs); app.js turns the planes into clipping planes of the wall materials. */
import { roofFrame } from './solarroof.js';

/** the knee wall height of a roof spec in metres, or null when the roof sits on top of the storey below as usual */
export function kneeOf(spec, storeyH) {
  const k = Number(spec?.knee);
  return spec?.knee == null || spec.knee === '' || !Number.isFinite(k) ? null : Math.max(0, Math.min(storeyH, k));
}

/** how far the main roof of a roof floor sits lower than the floor itself: the knee wall height minus the storey height (0 without a knee wall) */
export function kneeDrop(spec, storeyH) {
  const k = kneeOf(spec, storeyH);
  return k == null ? 0 : k - storeyH;
}

/** which roof floor cuts the walls of floor i: the roof floor itself, or the roof floor right above it when its roof starts on a knee wall;
 *  -1 for none */
export function clipRoofFloor(floors, i, storeyH) {
  if (floors[i]?.kind === 'roof') return i;
  const up = floors[i + 1];
  return up?.kind === 'roof' && kneeOf(up.roof, storeyH) != null ? i + 1 : -1;
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

/** is the point (x, y, z) under all planes (see roofPlanes) */
export const underRoof = (planes, x, y, z) => planes.every(([a, b, c, d]) => a * x + b * y + c * z + d >= -1e-9);
