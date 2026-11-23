/* 🕳 Light wells (Lichtschächte, #786; the owner: "baue licht schächte ein für den keller das das auch gut aussieht auch drauf achten das der
 * boden ausgeschnitten wird wenn da ein licht schacht ist"): a window of a floor below the ground floor whose sill lies under the ground gets
 * a light well outside: a box open at the top with a grating, from a little above the ground down to just under the sill, so the window gets
 * light and can be seen from outside. The lawn, the areas of the plot and the top of a plateau are cut open over it (earth.js, yard3d.js).
 * On by itself where it is needed; a window can switch it off (`noWell`) or give it its own size (`wellW` across, `wellD` out from the wall).
 * Pure (no three.js, no DOM; tests/lightwell.test.mjs). lightwell3d.js builds it, lightwell2d.js draws it in the plan, lightwellui.js has
 * the fields of the window. */
import { pointInPoly } from './rooms.js';
import { besideOpening, plateausOf, groundAt as plateauAt } from './levels.js';

/** sizes in m: d out from the wall (default), side how much wider than the window on each side, the limits, wall the thickness of the
 *  well's walls, rim how far its top stands over the ground, below how far its floor lies under the sill, free how far the sill must lie
 *  under the ground before a well is needed */
export const WELL = { d: 0.5, side: 0.15, dMin: 0.25, dMax: 1.5, wMin: 0.4, wMax: 4, wall: 0.06, rim: 0.1, below: 0.2, free: 0.05 };

const num = (v, d) => (Number.isFinite(+v) && v !== '' && v !== null ? +v : d);
const r3 = (v) => Math.round(v * 1000) / 1000;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const okPoly = (p) => Array.isArray(p?.points) && p.points.length >= 3;

/** the width (across, along the wall) and the depth (out from the wall) of the light well of opening op: its own (wellW, wellD) within the
 *  limits, else the window's width + 2 × WELL.side and WELL.d */
export function wellSize(op) {
  const w = clamp(num(op?.wellW, num(op?.width, 1) + 2 * WELL.side), WELL.wMin, WELL.wMax);
  const d = clamp(num(op?.wellD, WELL.d), WELL.dMin, WELL.dMax);
  return { w: r3(w), d: r3(d) };
}
/** a typed size for the field `key` ('wellW' or 'wellD') of op: kept within the limits; nothing typed (or the default) is not stored */
export function setWellSize(op, key, v) {
  const n = Number(v);
  if (v === '' || v === null || !Number.isFinite(n) || n <= 0) { delete op[key]; return wellSize(op); }
  const [a, b] = key === 'wellW' ? [WELL.wMin, WELL.wMax] : [WELL.dMin, WELL.dMax];
  op[key] = r3(clamp(n, a, b));
  const def = key === 'wellW' ? num(op.width, 1) + 2 * WELL.side : WELL.d;
  if (Math.abs(op[key] - clamp(def, a, b)) < 1e-6) delete op[key];
  return wellSize(op);
}

/** is the point (x, z) inside the house: in a room or a block of the floors up to the ground floor */
function insideHouse(floors, gi, x, z) {
  return floors.slice(0, gi + 1).some((f) => [...(f?.rooms || []), ...(f?.blocks || [])].some((r) => okPoly(r) && pointInPoly(x, z, r.points)));
}

/** the height of the ground at (x, z) over the floor of the ground floor: on a plateau its top, else the terrain hf (x, z) => h, or 0 on
 *  level ground. areas: the areas of the plot */
export function groundFn(areas, hf = null) {
  const pl = plateausOf(areas), base = (x, z) => (hf ? hf(x, z) : 0);
  const fn = (x, z) => (pl.length && plateauAt(pl, x, z)) || base(x, z);
  fn.base = base;                                    // without the plateaus: lightWells takes a plateau only under the well's middle
  return fn;
}

/** where the window op of wall w of floor fi would have its light well, whether needed or not: { x, z (the middle of the outer wall face
 *  at the window), ux, uz (along the wall), nx, nz (outwards), face (half the wall), w, d, ring: [[x, z] × 4] (its outline, the inner
 *  edge just inside the wall) } or null when the window is no outer window (both sides inside the house or both outside) */
export function wellPlace(floors, fi, gi, w, op) {
  if (op?.type !== 'window' || !w?.a || !w?.b) return null;
  const s = besideOpening(w, op), in1 = insideHouse(floors, gi, ...s.p1), in2 = insideHouse(floors, gi, ...s.p2);
  if (in1 === in2) return null;
  const sg = in1 ? -1 : 1, nx = s.n[0] * sg, nz = s.n[1] * sg, [ux, uz] = s.u;
  const face = (+w.thickness || 0.2) / 2, { w: ww, d } = wellSize(op), x = s.c[0] + nx * face, z = s.c[1] + nz * face;
  const P = (u, n) => [r3(x + ux * u + nx * n), r3(z + uz * u + nz * n)];
  return { x: r3(x), z: r3(z), ux, uz, nx, nz, face, w: ww, d, ring: [P(-ww / 2, -0.01), P(ww / 2, -0.01), P(ww / 2, d), P(-ww / 2, d)] };
}

/** the light wells of floor fi (below the ground floor gi): [{ ...wellPlace, op, wall, rim, bottom, deep }] with the heights over the floor
 *  of fi: rim (the top of the well, WELL.rim over the highest ground around it; a plateau counts under its middle), bottom (its floor, WELL.below under the sill); deep: how
 *  far the sill lies under the ground. elev: the height of floor fi over the ground floor (negative); ground(x, z): groundFn's result.
 *  A window gets one when its sill lies more than WELL.free under the ground outside and it has no `noWell` */
export function lightWells(floors, fi, gi, elev, ground = () => 0) {
  const f = floors?.[fi];
  if (!f || !(fi < gi)) return [];
  const out = [];
  (f.walls || []).forEach((w) => (w.openings || []).forEach((op) => {
    if (op?.noWell) return;
    const p = wellPlace(floors, fi, gi, w, op);
    if (!p) return;
    const sill = num(op.sill, 0.9), base = ground.base || ground;
    const mid = num(ground(p.x + p.nx * (p.d / 2), p.z + p.nz * (p.d / 2)), 0), deep = r3(mid - (elev + sill));
    if (!(deep > WELL.free)) return;                                 // the sill lies over the ground there: the window is free
    const top = Math.max(mid, ...p.ring.map(([x, z]) => num(base(x, z), 0)));   // the highest ground round it (a plateau only under its middle)
    const rim = r3(top + WELL.rim - elev), bottom = r3(Math.max(-0.3, sill - WELL.below));
    if (rim - bottom < 0.15) return;
    out.push({ ...p, op, wall: w, rim, bottom, deep });
  }));
  return out;
}

/** what the window op says about its light well, for the panel: 'off' (switched off), 'on' (it has one), 'free' (its sill lies over the
 *  ground: none needed), 'inner' (no outer window), 'none' (not on a floor below the ground floor, or no window) */
export function wellState(floors, fi, gi, elev, ground, w, op) {
  if (op?.type !== 'window' || !(fi < gi)) return 'none';
  if (!wellPlace(floors, fi, gi, w, op)) return 'inner';
  if (op.noWell) return 'off';
  const only = floors.map((f, i) => (i === fi ? { ...f, walls: [{ ...w, openings: [op] }] } : f));   // this window alone
  return lightWells(only, fi, gi, elev, ground).length ? 'on' : 'free';
}
