/* Roof dormers (Dachgauben): a box with its own roof that stands out of one slope of the roof: a gable or flat dormer, or a shed dormer
 * (Schleppgaube, #339) whose roof runs up at its own, flatter pitch into the main roof below the ridge; a shed or flat dormer can be as long
 * as the roof. The slopes of the main roof get a hole where a dormer stands (roofSurface).
 * Pure geometry, no DOM or three.js: the roof floor's footprint and a dormer go in, triangles come out.
 *
 * Coordinates: along the ridge `u`, across the slope `e` = distance from the eave (the lower edge of the slope), height `y`
 * (0 = the base of the roof). On a slope with the pitch angle p the surface is at y = e * tan(p). */

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
  return { alongX, a0, a1, b0, b1, half, tan, ins };
}

/** where the middle of a dormer of width w can go along the ridge: [lo, hi] (hi < lo: it is longer than the roof) */
const span = (F, w) => [F.a0 + F.ins + w / 2 + OVER, F.a1 - F.ins - w / 2 - OVER];

/** the dormer with every value clamped so it really fits on the slope; null when there is no room for it (flat roof, tiny roof) */
export function fitDormer(bb, r, d) {
  if (!bb || !r || r.type === 'flat') return null;
  const F = roofFrame(bb, r);
  const n = { ...DORMER_DEFAULT, ...d };
  n.side = n.side === 1 ? 1 : 0;
  n.type = DORMER_TYPES.includes(n.type) ? n.type : 'gable';
  n.w = Math.max(0.6, Math.min(MAX_W[n.type], +n.w || DORMER_DEFAULT.w));
  const [lo, hi] = span(F, n.w);
  if (hi < lo) return null;                                        // longer than the roof
  n.pos = Math.max(0, Math.min(1, Number.isFinite(+n.pos) ? +n.pos : 0.5));
  n.at = lo + (hi - lo) * n.pos;                                   // centre along the ridge (m)
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
  const [lo, hi] = span(n.F, n.w), at = (n.F.alongX ? bb.x0 : bb.z0) + (+s || 0) + n.w / 2;
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

/** triangles ([x, y, z] points, 3 per triangle) of a dormer: front wall + cheeks, roof, window glass; null if it does not fit */
export function dormerParts(bb, r, d) {
  const n = fitDormer(bb, r, d);
  if (!n) return null;
  const { F, at, w, eave, yF, yT, gh, eT, eR } = n, hw2 = w / 2, yB = n.type === 'shed' ? eR * F.tan : yT;   // yB: where the cheeks end on the slope
  const P = (u, e, y) => {                                         // local -> world (x, y, z) of the roof group
    const a = at + u, b = n.side === 0 ? F.b0 + e : F.b1 - e;
    return F.alongX ? [a, y, b] : [b, y, a];
  };
  const wall = [], roof = [], glass = [];
  const quad = (out, p, q, u, v) => out.push(p, q, u, p, u, v);
  quad(wall, P(-hw2, eave, yF - 0.05), P(hw2, eave, yF - 0.05), P(hw2, eave, yT), P(-hw2, eave, yT));           // front wall
  for (const s of [-1, 1]) wall.push(P(s * hw2, eave, yF - 0.05), P(s * hw2, eave, yT), P(s * hw2, eT, yB));      // cheeks (triangles up to the slope)
  if (n.type === 'flat') {
    quad(roof, P(-hw2 - OVER, eave - OVER, yT), P(hw2 + OVER, eave - OVER, yT), P(hw2 + OVER, eT, yT), P(-hw2 - OVER, eT, yT));
  } else if (n.type === 'shed') {                                  // one plane from the front up into the main roof
    const y0 = yT - OVER * n.ts;
    quad(roof, P(-hw2 - OVER, eave - OVER, y0), P(hw2 + OVER, eave - OVER, y0), P(hw2 + OVER, eR, yB), P(-hw2 - OVER, eR, yB));
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
 *  at the dormers' edges, so neighbouring pieces share their corners. */
export function roofSurface(bb, r) {
  const F = roofFrame(bb, r), h = F.half * F.tan, bc = (F.b0 + F.b1) / 2, k = F.half > 0 ? F.ins / F.half : 0;
  const tris = [];
  const quad = (p, q, u, v) => tris.push(p, q, u, p, u, v);
  const XYZ = (a, b, y) => (F.alongX ? [a, y, b] : [b, y, a]);
  const holes = [[], []];
  for (const d of r.dormers || []) {
    const n = fitDormer(bb, r, d);
    if (n) holes[n.side].push({ a0: n.at - n.w / 2, a1: n.at + n.w / 2, e0: n.eave, e1: n.eT });
  }
  const cuts = (vals, lo, hi) => [...new Set([lo, ...vals.filter((v) => v > lo + 1e-6 && v < hi - 1e-6), hi])].sort((p, q) => p - q);
  for (const side of [0, 1]) {
    const hs = holes[side], P = (a, e) => XYZ(a, side === 0 ? F.b0 + e : F.b1 - e, e * F.tan);
    const as = cuts(hs.flatMap((q) => [q.a0, q.a1]), F.a0, F.a1), es = cuts(hs.flatMap((q) => [q.e0, q.e1]), 0, F.half);
    for (let i = 0; i + 1 < as.length; i++) {
      const lo = (e) => (i === 0 ? F.a0 + e * k : as[i]), hi = (e) => (i + 2 === as.length ? F.a1 - e * k : as[i + 1]);   // a hip slope leans in at its ends
      for (let j = 0; j + 1 < es.length; j++) {
        const am = (as[i] + as[i + 1]) / 2, em = (es[j] + es[j + 1]) / 2, e0 = es[j], e1 = es[j + 1];
        if (hs.some((q) => am > q.a0 && am < q.a1 && em > q.e0 && em < q.e1)) continue;   // under a dormer
        const c = [P(lo(e0), e0), P(hi(e0), e0), P(hi(e1), e1), P(lo(e1), e1)];
        quad(...(side === 0 ? c : c.reverse()));
      }
    }
  }
  tris.push(XYZ(F.a0, F.b1, 0), XYZ(F.a0, F.b0, 0), XYZ(F.a0 + F.ins, bc, h));
  tris.push(XYZ(F.a1, F.b0, 0), XYZ(F.a1, F.b1, 0), XYZ(F.a1 - F.ins, bc, h));
  return tris;
}
