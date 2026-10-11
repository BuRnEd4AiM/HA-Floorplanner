/* Roof dormers (Dachgauben): a box with its own roof that stands out of one slope of the roof: a gable or flat dormer, or a shed dormer
 * (Schleppgaube, #339) whose roof runs up at its own, flatter pitch into the main roof below the ridge; a shed or flat dormer can be as long
 * as the roof, and with "distance from the gable" 0 it goes flush up to the edge of the roof (#345). The slopes of the main roof get a hole
 * where a dormer stands (roofSurface). On a roof with steps (#342, roofsteps.js) a
 * dormer stands on the slope piece under its middle.
 * Pure geometry, no DOM or three.js: the roof floor's footprint and a dormer go in, triangles come out.
 *
 * Coordinates: along the ridge `u`, across the slope `e` = distance from the eave (the lower edge of the slope), height `y`
 * (0 = the base of the roof). On a slope with the pitch angle p the surface is at y = e * tan(p). */

import { sectionsOf, outAt, intervals, sectionFrame } from './roofsteps.js';

export const DORMER_DEFAULT = { side: 0, pos: 0.5, w: 1.6, hw: 1.2, eave: 0.8, type: 'gable', win: true };
export const DORMER_TYPES = ['gable', 'flat', 'shed'];
export const SHED_PITCH = 15;                                      // the roof of a shed dormer (degrees), unless set (d.sp)
const MAX_W = { gable: 5, flat: 30, shed: 30 };                    // a gable dormer's own gable grows with its width
const SHED_WIN = 1.2;                                              // the window of a (long) shed dormer is no wider than this (m)
const GABLE_PITCH = Math.tan((28 * Math.PI) / 180);               // the little roof of a gable dormer
const OVER = 0.1;                                                  // overhang of the dormer roof (m)

/** the frame of the main roof, same maths as roofFrame in solarroof.js (used by roofGeometry in roofs.js) */
export function roofFrame(bb, r) {
  const o = r.overhang ?? 0.4, x0 = bb.x0 - o, x1 = bb.x1 + o, z0 = bb.z0 - o, z1 = bb.z1 + o;
  const alongX = r.ridge ? r.ridge === 'x' : (x1 - x0) >= (z1 - z0);
  const [a0, a1, b0, b1] = alongX ? [x0, x1, z0, z1] : [z0, z1, x0, x1];
  const half = (b1 - b0) / 2;
  const tan = Math.tan(((r.pitch ?? 35) * Math.PI) / 180);
  const ins = r.type === 'hip' ? Math.min(half, (a1 - a0) / 2) : 0;
  return { alongX, a0, a1, b0, b1, half, tan, ins, bc: (b0 + b1) / 2 };
}

/** can a dormer of this type go right up to the edge of the roof at a gable (#345): a shed or flat dormer on a gable roof */
const flushable = (type, F) => (type === 'shed' || type === 'flat') && !F.ins;
/** the house along the ridge: the base box from its start to its end (without the overhang) */
const houseSpan = (F, bb) => (F.alongX ? [bb.x0, bb.x1] : [bb.z0, bb.z1]);
/** where the middle of a dormer of width w can go along the ridge: [lo, hi] (hi < lo: it is longer than the roof). A shed or flat dormer
 *  on a gable roof stays between the gable walls; at a gable wall it reaches out to the edge of the roof (see fitDormer) */
const span = (F, w, bb, type) => {
  if (bb && flushable(type, F)) { const [h0, h1] = houseSpan(F, bb); return [h0 + w / 2, h1 - w / 2]; }
  return [F.a0 + F.ins + w / 2 + OVER, F.a1 - F.ins - w / 2 - OVER];
};

/** the dormer with every value clamped so it really fits on the slope; null when there is no room for it (flat roof, tiny roof) */
export function fitDormer(bb, r, d) {
  if (!bb || !r || r.type === 'flat') return null;
  let F = roofFrame(bb, r);
  const n = { ...DORMER_DEFAULT, ...d };
  n.side = n.side === 1 ? 1 : 0;
  n.type = DORMER_TYPES.includes(n.type) ? n.type : 'gable';
  n.w = Math.max(0.6, Math.min(MAX_W[n.type], +n.w || DORMER_DEFAULT.w));
  const [lo, hi] = span(F, n.w, bb, n.type);
  if (hi < lo) return null;                                        // longer than the roof
  n.pos = Math.max(0, Math.min(1, Number.isFinite(+n.pos) ? +n.pos : 0.5));
  n.at = lo + (hi - lo) * n.pos;                                   // centre along the ridge (m)
  const [h0, h1] = houseSpan(F, bb), fl = flushable(n.type, F);    // at a gable wall it goes on to the edge of the roof, flush with it (#345)
  n.flush0 = fl && n.at - n.w / 2 <= h0 + 1e-6; n.flush1 = fl && n.at + n.w / 2 >= h1 - 1e-6;
  n.u0 = n.flush0 ? F.a0 - n.at : -n.w / 2; n.u1 = n.flush1 ? F.a1 - n.at : n.w / 2;   // its sides, from its middle
  F = sectionFrame(F, n.side, outAt(bb, r, n.side, n.at));         // on a roof with steps (#342): the slope piece the dormer stands on
  n.eave = Math.max(0.2, Math.min(F.half * 0.8, +n.eave || DORMER_DEFAULT.eave));
  const yF = n.eave * F.tan;
  if (n.type === 'shed') {                                         // its roof runs up at the pitch sp until it meets the main roof (at eR)
    const rad = Math.PI / 180, deg = Math.atan(F.tan) / rad;
    const run = F.half - n.eave - 0.05 / F.tan;                    // ... below the ridge of the main roof, so within this run
    const ts2 = Math.tan(2 * rad);
    n.hw = Math.max(0.4, Math.min(+n.hw || DORMER_DEFAULT.hw, 3, run * (F.tan - ts2)));   // the wall height counts most: it gets lower only
    const ts = Math.min(Math.tan(Math.min(deg - 3, Math.max(2, +n.sp > 0 ? +n.sp : SHED_PITCH)) * rad), F.tan - n.hw / run);   // when a 2° roof is not enough, else the roof gets flatter
    if (!(run > 0) || ts < ts2 - 1e-9) return null;                // no room even for a low wall under a nearly flat roof
    n.sp = Math.round((Math.atan(ts) / rad) * 10) / 10;
    n.win = n.win !== false && n.hw >= 0.7;
    const eR = n.eave + n.hw / (F.tan - ts);
    return Object.assign(n, { yF, yT: yF + n.hw, gh: 0, ts, eT: eR, eR, F });
  }
  const gh = n.type === 'gable' ? (n.w / 2) * GABLE_PITCH : 0;
  const room = F.half * F.tan - yF - gh - 0.05;                    // the little roof must stay below the ridge of the main roof
  n.hw = Math.max(0.4, Math.min(+n.hw || DORMER_DEFAULT.hw, room, 3));
  if (room < 0.4) return null;
  n.win = n.win !== false && n.hw >= 0.7;
  Object.assign(n, { yF, yT: yF + n.hw, gh, ts: 0, eT: (yF + n.hw) / F.tan, eR: (yF + n.hw + gh) / F.tan, F });
  return n;
}

/** where a dormer begins along the ridge: metres from the gable end of the house at the low end of the ridge axis (the edge x0 or z0 of the
 *  base box, left or top in the plan) to the dormer's side; null when it does not fit */
export function dormerStart(bb, r, d) {
  const n = fitDormer(bb, r, d);
  return n ? n.at - n.w / 2 - (n.F.alongX ? bb.x0 : bb.z0) : null;
}
/** the pos (0..1) that lets dormer d begin s metres from that gable end (see dormerStart), as near as the roof allows */
export function posForStart(bb, r, d, s) {
  const n = fitDormer(bb, r, d);
  if (!n) return d?.pos ?? 0.5;
  const [lo, hi] = span(n.F, n.w, bb, n.type), at = (n.F.alongX ? bb.x0 : bb.z0) + (+s || 0) + n.w / 2;
  return hi > lo ? Math.max(0, Math.min(1, (at - lo) / (hi - lo))) : 0.5;
}

/** the window in the front wall of a fitted dormer (n from fitDormer): width, height, sill over the dormer's base yF, and the two ends of the
 *  front wall ([x, z] in the roof's frame); null without a window. The same size the glass pane has, so the real window fits the dormer. */
export function dormerWindow(n) {
  if (!n?.win) return null;
  const { F, at, w, eave } = n, hw2 = w / 2, m = 0.18 * w, sill = 0.22, head = 0.18;
  const XZ = (u) => { const a = at + u, b = n.side === 0 ? F.b0 + eave : F.b1 - eave; return F.alongX ? [a, b] : [b, a]; };
  return { width: n.type === 'shed' ? Math.min(w - 2 * m, SHED_WIN) : w - 2 * m, height: n.hw - sill - head, sill, a: XZ(-hw2), b: XZ(hw2) };
}

/** triangles ([x, y, z] points, 3 per triangle) of a dormer: front wall + cheeks, roof, window glass; null if it does not fit. holes: openings
 *  in the front wall ({ u0, u1, y0, y1 }: along the ridge from the dormer's middle, heights as y), where the windows of a wall right behind
 *  the front show through (#341, frontHoles in dormerwin.js) */
export function dormerParts(bb, r, d, holes = []) {
  const n = fitDormer(bb, r, d);
  if (!n) return null;
  const { F, at, w, eave, yF, yT, gh, eT, eR } = n, hw2 = w / 2, yB = n.type === 'shed' ? eR * F.tan : yT;   // yB: where the cheeks end on the slope
  const P = (u, e, y) => {                                         // local -> world (x, y, z) of the roof group
    const a = at + u, b = n.side === 0 ? F.b0 + e : F.b1 - e;
    return F.alongX ? [a, y, b] : [b, y, a];
  };
  const wall = [], roof = [], glass = [];
  const quad = (out, p, q, u, v) => out.push(p, q, u, p, u, v);
  const cuts = (vals, lo, hi) => [...new Set([lo, ...vals.filter((v) => v > lo + 1e-6 && v < hi - 1e-6), hi])].sort((p, q) => p - q);
  const { u0, u1 } = n, o0 = n.flush0 ? 0 : OVER, o1 = n.flush1 ? 0 : OVER;   // its sides; flush with the roof's edge: no overhang there (#345)
  const us = cuts(holes.flatMap((h) => [h.u0, h.u1]), u0, u1), ys = cuts(holes.flatMap((h) => [h.y0, h.y1]), yF - 0.05, yT);
  for (let i = 0; i + 1 < us.length; i++) for (let j = 0; j + 1 < ys.length; j++) {        // front wall, cut into a grid around the holes
    const um = (us[i] + us[i + 1]) / 2, ym = (ys[j] + ys[j + 1]) / 2;
    if (holes.some((h) => um > h.u0 && um < h.u1 && ym > h.y0 && ym < h.y1)) continue;
    quad(wall, P(us[i], eave, ys[j]), P(us[i + 1], eave, ys[j]), P(us[i + 1], eave, ys[j + 1]), P(us[i], eave, ys[j + 1]));
  }
  for (const u of [u0, u1]) wall.push(P(u, eave, yF - 0.05), P(u, eave, yT), P(u, eT, yB));                     // cheeks (triangles up to the slope)
  if (n.type === 'flat') {
    quad(roof, P(u0 - o0, eave - OVER, yT), P(u1 + o1, eave - OVER, yT), P(u1 + o1, eT, yT), P(u0 - o0, eT, yT));
  } else if (n.type === 'shed') {                                  // one plane from the front up into the main roof
    const y0 = yT - OVER * n.ts;
    quad(roof, P(u0 - o0, eave - OVER, y0), P(u1 + o1, eave - OVER, y0), P(u1 + o1, eR, yB), P(u0 - o0, eR, yB));
  } else {
    wall.push(P(-hw2, eave, yT), P(hw2, eave, yT), P(0, eave, yT + gh));                                         // gable above the front wall
    for (const s of [-1, 1]) quad(roof, P(s * (hw2 + OVER), eave - OVER, yT - OVER * GABLE_PITCH), P(s * (hw2 + OVER), eT, yT - OVER * GABLE_PITCH),
      P(0, eR, yT + gh), P(0, eave - OVER, yT + gh));                                                            // the two roof planes meet in the ridge
  }
  const win = dormerWindow(n);
  if (win) {                                                       // window pane in front of the wall
    const u = win.width / 2, e = eave - 0.012;
    quad(glass, P(-u, e, yF + win.sill), P(u, e, yF + win.sill), P(u, e, yF + win.sill + win.height), P(-u, e, yF + win.sill + win.height));
  }
  return { wall, roof, glass, fit: n };
}

/** the main roof (gable or hip, not flat) as triangles ([x, y, z] points, 3 per triangle), as roofGeometry in roofs.js draws it: the two
 *  long slopes with a hole where a dormer stands (from its front back to where it meets the slope; its walls and roof close the hole, so
 *  the slope does not run through the room under a dormer), and the two ends (gable triangles or hip ends). The slopes are cut into a grid
 *  at the dormers' edges, so neighbouring pieces share their corners. On a roof with steps (#342) every piece of a slope has its own eave
 *  and pitch up to the same ridge, and an upright triangle closes each step. */
export function roofSurface(bb, r) {
  const F = roofFrame(bb, r), h = F.half * F.tan, bc = F.bc, k = F.half > 0 ? F.ins / F.half : 0;
  const tris = [];
  const quad = (p, q, u, v) => tris.push(p, q, u, p, u, v);
  const XYZ = (a, b, y) => (F.alongX ? [a, y, b] : [b, y, a]);
  const ns = (r.dormers || []).map((d) => fitDormer(bb, r, d)).filter(Boolean);
  const cuts = (vals, lo, hi) => [...new Set([lo, ...vals.filter((v) => v > lo + 1e-6 && v < hi - 1e-6), hi])].sort((p, q) => p - q);
  for (const side of [0, 1]) {
    const secs = sectionsOf(bb, r, side).map((q, i, all) => ({ ...q, a0: i === 0 ? F.a0 : q.a0, a1: i === all.length - 1 ? F.a1 : q.a1 }));
    secs.forEach((sec, si) => {
      const G = sectionFrame(F, side, sec.out), P = (a, e) => XYZ(a, side === 0 ? G.b0 + e : G.b1 - e, e * G.tan);
      const last = si === secs.length - 1;
      const hs = ns.filter((n) => n.side === side && n.at >= sec.a0 && (n.at < sec.a1 || last))
        .map((n) => ({ a0: n.at + n.u0, a1: n.at + n.u1, e0: n.eave, e1: n.eT }));
      const as = cuts(hs.flatMap((q) => [q.a0, q.a1]), sec.a0, sec.a1), es = cuts(hs.flatMap((q) => [q.e0, q.e1]), 0, G.half);
      for (let i = 0; i + 1 < as.length; i++) {
        const lo = (e) => (i === 0 ? sec.a0 + (si === 0 ? e * k : 0) : as[i]);                          // a hip slope leans in at its ends
        const hi = (e) => (i + 2 === as.length ? sec.a1 - (last ? e * k : 0) : as[i + 1]);
        for (let j = 0; j + 1 < es.length; j++) {
          const am = (as[i] + as[i + 1]) / 2, em = (es[j] + es[j + 1]) / 2, e0 = es[j], e1 = es[j + 1];
          if (hs.some((q) => am > q.a0 && am < q.a1 && em > q.e0 && em < q.e1)) continue;   // under a dormer
          const c = [P(lo(e0), e0), P(hi(e0), e0), P(hi(e1), e1), P(lo(e1), e1)];
          quad(...(side === 0 ? c : c.reverse()));
        }
      }
      if (si > 0 && Math.abs(secs[si - 1].out - sec.out) > 1e-9) {                                   // a step: upright triangle up to the ridge
        const eb = (o) => (side === 0 ? F.b0 - o : F.b1 + o);
        tris.push(XYZ(sec.a0, eb(secs[si - 1].out), 0), XYZ(sec.a0, eb(sec.out), 0), XYZ(sec.a0, bc, h));
      }
    });
  }
  const iv = intervals(bb, r, F.a0, F.a1), f0 = iv[0], fl = iv[iv.length - 1];
  tris.push(XYZ(F.a0, F.b1 + f0.out1, 0), XYZ(F.a0, F.b0 - f0.out0, 0), XYZ(F.a0 + F.ins, bc, h));
  tris.push(XYZ(F.a1, F.b0 - fl.out0, 0), XYZ(F.a1, F.b1 + fl.out1, 0), XYZ(F.a1 - F.ins, bc, h));
  return tris;
}
