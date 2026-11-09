/* Roof windows (Dachfenster, #643): a plain window lying in a slope of the roof, without a dormer (the kind most roofs have). On a gable,
 * hip or shed roof, the main roof or a further one (a flat roof has none). Placed like a dormer (dormer.js): the side of the roof (A / B;
 * a shed roof has only its one slope), where along the ridge (pos 0..1, or metres from the gable), its size (w along the ridge, h up the
 * slope, as the sizes of roof windows are given: 78 x 118 cm) and how far its lower edge is from the eave (eave: across, in the plan,
 * from the edge of the overhang, as for a dormer). The slope gets a hole for it (roofSurface in dormer.js, shedSurface in roofshape.js)
 * and a flashing round it (Eindeckrahmen, skylightParts); the window itself is a real window (contact, open / tilted, roller shutter, the
 * lists): it hangs on a wall object that is never saved, like the window of a dormer (syncDormerWindows in dormerwin.js), and the floor
 * tips that wall back into the slope round the window's lower edge (skylightWindow: tilt).
 * Stored as roof.skylights = [{ id, side, pos, w, h, eave, window }]. Pure, no three.js, no DOM (unit test: tests/skylight.test.mjs).
 *
 * Coordinates as in dormer.js: along the ridge `a`, across the slope `e` = distance from the eave (the lower edge of the slope, with its
 * overhang), height `y` over the base of the roof; on a slope with the pitch angle p the surface is at y = e * tan(p). */
import { outAt, sectionFrame, sectionsOf, stepsAllowed } from './roofsteps.js';
import { roofFrame } from './roofshape.js';

export const SKYLIGHT_DEFAULT = { side: 0, pos: 0.5, w: 0.78, h: 1.18 };
/** the usual sizes of roof windows (width x height in m, the height measured in the slope) */
export const SKYLIGHT_SIZES = [[0.55, 0.78], [0.55, 0.98], [0.66, 1.18], [0.78, 0.98], [0.78, 1.18], [0.78, 1.4], [0.94, 1.18], [0.94, 1.4], [1.14, 1.18], [1.14, 1.4], [1.34, 0.98], [1.34, 1.4]];
export const MAX_SKYLIGHTS = 20;
const MIN = 0.3, MAX = 3;                                          // width and height (m)
const EDGE = 0.12;                                                 // a roof window keeps this far from the eave, the ridge, a gable or hip and a step
export const FLASH = 0.07;                                         // the flashing round the window (m)
const LIFT = 0.012;                                                // ... lies this far over the roof
export const THICK = 0.1;                                          // the wall the window hangs on: its frame is THICK + 2 cm deep, half over the roof

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const len = (v, def) => clamp(Number.isFinite(+v) && +v > 0 ? +v : def, MIN, MAX);
const r3 = (v) => Math.round(v * 1000) / 1000;

/** can roof r have roof windows: a gable, hip or shed roof, not a flat roof */
export const skylightsAllowed = (r) => !!r && (r.type || 'gable') !== 'flat';
/** the slope a roof window lies in: 0 (side A, from the eave at b0) or 1 (side B, from b1); a shed roof has one slope, from its low eave */
const sideOf = (F, s) => (F.shed ? (F.hi ? 0 : 1) : s?.side === 1 || s?.side === 'b' ? 1 : 0);
/** the house along the ridge (the base box, without the overhang at the gables) */
const houseSpan = (F, bb) => (F.alongX ? [bb.x0, bb.x1] : [bb.z0, bb.z1]);

/** where the middle of a roof window w wide can go along the ridge: [lo, hi] (hi < lo: there is no room). Between the gables of the house;
 *  on a hip roof also inside the hips up to its upper edge e1 */
function span(F, bb, w, e1) {
  const [h0, h1] = houseSpan(F, bb), k = F.half > 0 ? F.ins / F.half : 0;
  return [Math.max(h0, F.a0 + e1 * k) + EDGE + w / 2, Math.min(h1, F.a1 - e1 * k) - EDGE - w / 2];
}

/** the lower edge of a new roof window: 1 m over the floor under the roof (a knee wall of `knee` m counts), at least 30 cm inside the wall */
export function defaultEave(bb, r, knee = 0) {
  const F = roofFrame(bb, r), o = r.overhang ?? 0.4;
  return r3(Math.max(o + 0.3, (1 - (+knee || 0)) / (F.tan || 1)));
}

/** the roof window with every value clamped so that it really lies in its slope; null when there is no room for it (a flat roof, a window
 *  higher than the slope, a roof shorter than the window). Adds: at (its middle along the ridge), a0 / a1 (its sides), e0 / e1 (its lower
 *  and upper edge), y0 / y1 (their heights over the base of the roof), F (the frame of the slope piece it lies in, roofsteps.js) */
export function fitSkylight(bb, r, s) {
  if (!bb || !skylightsAllowed(r)) return null;
  const F0 = roofFrame(bb, r), n = { ...SKYLIGHT_DEFAULT, ...s };
  n.side = sideOf(F0, s);
  n.w = len(n.w, SKYLIGHT_DEFAULT.w); n.h = len(n.h, SKYLIGHT_DEFAULT.h);
  n.pos = clamp(Number.isFinite(+n.pos) ? +n.pos : 0.5, 0, 1);
  const across = (G) => n.h / Math.sqrt(1 + G.tan * G.tan);        // how far the window reaches across (in the plan)
  const eaveIn = (G) => clamp(Number.isFinite(+s?.eave) ? +s.eave : Math.max((r.overhang ?? 0.4) + 0.3, 1 / (G.tan || 1)), EDGE, G.half - EDGE - across(G));
  const [lo, hi] = span(F0, bb, n.w, eaveIn(F0) + across(F0));
  if (hi < lo) return null;                                        // longer than the roof
  n.at = lo + (hi - lo) * n.pos;
  if (stepsAllowed(r)) {                                           // a roof with steps (#342): the window stays in one piece of the eave
    const sec = sectionsOf(bb, r, n.side).find((q, i, all) => n.at < q.a1 - 1e-9 || i === all.length - 1);
    if (sec) {
      const [h0, h1] = houseSpan(F0, bb), q0 = Math.max(h0, sec.a0) + EDGE + n.w / 2, q1 = Math.min(h1, sec.a1) - EDGE - n.w / 2;
      if (q1 < q0) return null;
      n.at = clamp(n.at, q0, q1);
    }
  }
  const F = sectionFrame(F0, n.side, stepsAllowed(r) ? outAt(bb, r, n.side, n.at) : 0);
  if (F.half - 2 * EDGE < across(F)) return null;                  // higher than the slope
  n.eave = eaveIn(F);
  Object.assign(n, { a0: n.at - n.w / 2, a1: n.at + n.w / 2, e0: n.eave, e1: n.eave + across(F), F });
  n.y0 = n.e0 * F.tan; n.y1 = n.e1 * F.tan;
  return n;
}
/** every roof window of roof r that fits (fitSkylight) */
export const fitSkylights = (bb, r) => (skylightsAllowed(r) ? (r.skylights || []).map((s) => fitSkylight(bb, r, s)).filter(Boolean) : []);

/** the holes in the slope `side` of roof r for its roof windows: [{ a0, a1, e0, e1 }] (roofSurface in dormer.js, shedSurface in roofshape.js) */
export const skylightHoles = (bb, r, side) => fitSkylights(bb, r).filter((n) => n.side === side).map(({ a0, a1, e0, e1, at }) => ({ a0, a1, e0, e1, at }));

/** where a roof window begins along the ridge: metres from the gable end of the house at the low end of the ridge axis (the edge x0 or z0
 *  of the base box, left or top in the plan) to its side; null when it does not fit */
export function skylightStart(bb, r, s) {
  const n = fitSkylight(bb, r, s);
  return n ? r3(n.a0 - houseSpan(n.F, bb)[0]) : null;
}
/** the pos (0..1) that lets roof window s begin `start` metres from that gable end (see skylightStart), as near as the roof allows */
export function posForStart(bb, r, s, start) {
  const n = fitSkylight(bb, r, s);
  if (!n) return s?.pos ?? 0.5;
  const F0 = roofFrame(bb, r), [lo, hi] = span(F0, bb, n.w, n.e1), at = houseSpan(F0, bb)[0] + (+start || 0) + n.w / 2;
  return hi > lo ? clamp((at - lo) / (hi - lo), 0, 1) : 0.5;
}

/** a point of the slope of fitted window n ([x, y, z] in the roof's frame): u along the ridge from its middle, e from the eave, lifted
 *  `up` m off the slope (along its normal, outwards) */
function slopePoint(n, u, e, up = 0) {
  const { F } = n, sg = n.side === 0 ? 1 : -1, c = 1 / Math.sqrt(1 + F.tan * F.tan), sn = F.tan * c;
  const a = n.at + u, b = (n.side === 0 ? F.b0 + e : F.b1 - e) - sg * sn * up, y = e * F.tan + c * up;
  return F.alongX ? [a, y, b] : [b, y, a];
}

/** the flashing round a roof window (Eindeckrahmen): a frame FLASH wide lying on the slope round the hole, as triangles ([x, y, z] points,
 *  3 per triangle, facing up), and a pane of glass in the hole (for a roof window that has no real window yet); null when it does not fit */
export function skylightParts(bb, r, s) {
  const n = fitSkylight(bb, r, s);
  if (!n) return null;
  const c = 1 / Math.sqrt(1 + n.F.tan * n.F.tan), fe = FLASH * c, hw = n.w / 2;
  const flashing = [], glass = [];
  const quad = (out, p, q, u, v) => { if (n.side === 0) out.push(p, q, u, p, u, v); else out.push(p, u, q, p, v, u); };
  const P = (u, e, up = LIFT) => slopePoint(n, u, e, up);
  const [u0, u1, U0, U1, e0, e1, E0, E1] = [-hw, hw, -hw - FLASH, hw + FLASH, n.e0, n.e1, n.e0 - fe, n.e1 + fe];
  quad(flashing, P(U0, E0), P(U0, e0), P(U1, e0), P(U1, E0));        // below the window
  quad(flashing, P(U0, e1), P(U0, E1), P(U1, E1), P(U1, e1));        // above it
  quad(flashing, P(U0, e0), P(U0, e1), P(u0, e1), P(u0, e0));        // its two sides
  quad(flashing, P(u1, e0), P(u1, e1), P(U1, e1), P(U1, e0));
  quad(glass, P(u0, e0, 0), P(u0, e1, 0), P(u1, e1, 0), P(u1, e0, 0));
  return { flashing, glass, fit: n };
}

/** the real window of fitted roof window n (#643): its width and height, the two ends of its lower edge a, b ([x, z] in the roof's frame,
 *  along the ridge), the height of that edge over the base of the roof (y0), the upper edge (top: { a, b, y }), its middle in the plan
 *  (mid), the outside of the wall a→b (outside: +1 the side of its normal (-dz, dx), as outsideOf in dormerwin.js: up out of the roof) and
 *  tilt: the turn (radians, round the wall's local x) that tips the upright window back into the slope round its lower edge */
export function skylightWindow(n) {
  if (!n) return null;
  const XZ = (p) => [p[0], p[2]], hw = n.w / 2;
  const a = XZ(slopePoint(n, -hw, n.e0)), b = XZ(slopePoint(n, hw, n.e0)), ta = XZ(slopePoint(n, -hw, n.e1)), tb = XZ(slopePoint(n, hw, n.e1));
  const sg = n.side === 0 ? 1 : -1, inward = n.F.alongX ? [0, sg] : [sg, 0];                   // from the eave towards the ridge
  const outside = (-(b[1] - a[1])) * inward[0] + (b[0] - a[0]) * inward[1] > 0 ? -1 : 1;
  const p = Math.atan(n.F.tan);
  return { width: n.w, height: n.h, a, b, y0: n.y0, top: { a: ta, b: tb, y: n.y1 }, mid: [(a[0] + tb[0]) / 2, (a[1] + tb[1]) / 2], outside, tilt: -outside * (Math.PI / 2 - p) };
}

/** the roof windows of roof r (base box bb) as they lie in the plan (seen from above): one outline [[x, z] x 4] each (the 2D plan, #643) */
export const skylightOutlines = (bb, r) => (bb ? fitSkylights(bb, r).map((n) => {
  const XZ = (u, e) => { const p = slopePoint(n, u, e); return [r3(p[0]), r3(p[2])]; };
  return [XZ(-n.w / 2, n.e0), XZ(n.w / 2, n.e0), XZ(n.w / 2, n.e1), XZ(-n.w / 2, n.e1)];
}) : []);

/** a new roof window for roof r (base box bb): the n-th goes in the middle of side A, then side B, then a quarter and three quarters
 *  along; its lower edge 1 m over the floor (defaultEave; knee: the knee wall the roof sits on) */
export function newSkylight(bb, r, count, id, knee = 0) {
  const s = { id, side: count % 2, pos: [0.5, 0.25, 0.75][Math.floor(count / 2) % 3], w: SKYLIGHT_DEFAULT.w, h: SKYLIGHT_DEFAULT.h };
  if (bb && skylightsAllowed(r)) s.eave = defaultEave(bb, r, knee);
  return s;
}
/** a new width for roof window s on roof r: its start (distance from the gable) stays where it is */
export function setSkylightWidth(bb, r, s, w) {
  const st = bb ? skylightStart(bb, r, s) : null;
  s.w = len(w, SKYLIGHT_DEFAULT.w);
  if (st != null) s.pos = posForStart(bb, r, s, st);
}
