/* Stair geometry (no THREE dependency, shared by the 3D view, the 2D plan and the tests).
 *
 * Stair data: { id, type: 'straight'|'L'|'U'|'spiral'|'wall', x, z, rot, w, tread, turn: 'left'|'right', dir: 'up'|'down', floors, path, name }
 *  - floors (default 1): how many floors the stair climbs. Straight, L and U stairs are built storey by storey (the same stair again on every
 *    floor, so it arrives on each floor and you can step off there, #229); a spiral makes one turn per floor; a wall stair runs on along its path.
 *  - landing: L and U stairs: the landing at the turn is this much deeper (m); wall stairs: flat for this long after every bend (#210).
 *  - type 'wall': a light stair hanging on a wall: `path` = the line along the wall as local points [[0,0], ...] (the first is the start), `turn` = the
 *    side the steps stick out to (looking along the path). Every bend of the path is a landing (Podest); the steps are thin plates (`thin`) with
 *    nothing below them.
 *  - (x, z) is the start of the stair (bottom, centre of the first step), `rot` turns it around that point (degrees).
 *  - local frame: +x = walking direction of the first flight, +z = to the right of it (screen: down).
 *  - dir 'up'   : the stair belongs to this floor and climbs to the floor above (hole in the floor above).
 *  - dir 'down' : the stair comes up from the floor below to this floor (hole in this floor).
 * All lengths in metres. `H` is the floor-to-floor height.
 */

import polygonClipping from './vendor/polygon-clipping.js';

export const STAIR_TYPES = ['straight', 'L', 'U', 'spiral', 'wall'];
/** shallowest / deepest tread (m): with the usual 16 treads this allows stairs from 1.6 m to 7.2 m long */
export const MIN_TREAD = 0.1, MAX_TREAD = 0.45;
const GAP = 0.1;                     // gap between the two flights of a U stair
export const MAX_LANDING = 3;        // longest flat stretch after a bend of a wall stair (m, #210)
/** the flat stretch a wall stair keeps after every bend (m, 0 = only the corner) */
export const landingLength = (st) => Math.max(0, Math.min(MAX_LANDING, Number(st?.landing) || 0));
export const THIN = 0.06;            // thickness of a step plate of a wall stair (m)
export const POLE_R = 0.06, RAIL_H = 0.9, RAIL_IN = 0.04;   // spiral stair: radius of the middle pole, height of the hand rail over the steps, its distance from the outer edge
export const MAX_FLOORS = 6;
export const SLAB = 0.2;             // thickness under the steps of the upper storeys of a stair over several floors (m, #229)
export const FLOOR_LANDING = 1.2;    // depth of the landing in front of the stair on every floor of a stairwell (m, #229)
/** straight, L and U stairs over several floors are built storey by storey (#229) */
export const perStorey = (st) => st.type === 'straight' || st.type === 'L' || st.type === 'U';
/** how many floors the stair climbs (1..MAX_FLOORS) */
export const stairFloors = (st) => Math.max(1, Math.min(MAX_FLOORS, Math.round(st.floors || 1)));

export function stairDefaults(type) {
  return { type, w: type === 'spiral' ? 0.9 : type === 'wall' ? 0.9 : 1.0, tread: 0.27, turn: 'right', dir: 'up', floors: 1 };
}

/** number of risers for the floor height, and the rise of one step */
export function stairSteps(H) {
  const n = Math.max(3, Math.round(H / 0.18));
  return { n, rise: H / n };
}

const rect = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

/**
 * Local geometry of a stair.
 * Returns { treads: [{ poly, top }], hole: [[x,z],...], arrow: [[x,z],[x,z]] }
 *  - treads: solid step blocks, `top` = height of the walking surface above the stair's start level
 *  - hole  : outline of the stairwell opening in the floor above: the whole stair, so you can look down it
 */
export function stairLocal(st, H) {
  const nf = stairFloors(st);
  if (st.type === 'wall') return wallStairLocal(st, H * nf);
  if (nf > 1 && perStorey(st)) {
    // several floors (#229): the same stair again on every storey, so it arrives on each floor and you step off there; the upper storeys are
    // a slab under their steps (nothing solid down to the floor below); where a U stair ends behind its start a plate closes the gap on the floor
    const one = stairLocal({ ...st, floors: 1 }, H), { rise } = stairSteps(H), treads = [...one.treads];
    for (let k = 1; k < nf; k++) {
      if (one.gap) treads.push({ poly: one.gap, top: k * H, thin: SLAB, storey: k });
      one.treads.forEach((tr) => treads.push({ ...tr, top: tr.top + k * H, thin: rise + SLAB, storey: k }));
    }
    return { ...one, treads };
  }
  const { n, rise } = stairSteps(H * (perStorey(st) ? 1 : nf));
  const T = n - 1;                                     // treads; the last riser arrives at the upper floor
  const w = st.w || 1, d = st.tread || 0.27, sg = st.turn === 'left' ? -1 : 1;
  const treads = [];
  let hole, arrow;
  const flip = (poly) => poly.map(([x, z]) => [x, z * sg]);   // mirror to the chosen turning side (z only, x untouched)

  if (st.type === 'spiral') {
    // a real spiral stair (#209): a pole in the middle, thin step plates fixed to it, nothing below them, a hand rail along the outside
    const R = w, a = (2 * Math.PI * nf) / T, dirn = sg;                  // one turn per floor
    const at = (q, r) => [Math.cos(q) * r, Math.sin(q) * r];
    const rail = [];
    for (let k = 0; k < T; k++) {
      const a0 = k * a * dirn, a1 = (k + 1) * a * dirn, seg = 3;
      const poly = [at(a0, POLE_R)];
      for (let s = 0; s <= seg; s++) poly.push(at(a0 + ((a1 - a0) * s) / seg, R));
      poly.push(at(a1, POLE_R));
      treads.push({ poly, top: (k + 1) * rise, thin: THIN });
      const [rx, rz] = at((a0 + a1) / 2, R - RAIL_IN);
      rail.push([rx, (k + 1) * rise + RAIL_H, rz]);
    }
    const pole = { r: POLE_R, h: T * rise + RAIL_H };
    hole = Array.from({ length: 20 }, (_, i) => [Math.cos((i / 20) * 2 * Math.PI) * (R + 0.05), Math.sin((i / 20) * 2 * Math.PI) * (R + 0.05)]);
    arrow = [[0, 0], [Math.cos(Math.min(T * a, 2 * Math.PI * 0.95) * dirn) * R * 0.85, Math.sin(Math.min(T * a, 2 * Math.PI * 0.95) * dirn) * R * 0.85]];
    return { treads, hole, arrow, pole, rail };
  }

  if (st.type === 'straight') {
    for (let k = 0; k < T; k++) treads.push({ poly: rect(k * d, (k + 1) * d, -w / 2, w / 2), top: (k + 1) * rise });
    hole = rect(0, T * d, -w / 2, w / 2);
    arrow = [[0, 0], [T * d, 0]];
    return { treads, hole, arrow };
  }

  const n1 = Math.floor((T - 1) / 2), n2 = T - 1 - n1;   // flight 1, landing (one step), flight 2
  for (let k = 0; k < n1; k++) treads.push({ poly: rect(k * d, (k + 1) * d, -w / 2, w / 2), top: (k + 1) * rise });
  const xa = n1 * d, xb = xa + w, landTop = (n1 + 1) * rise, ex = landingLength(st);   // ex: the landing at the turn is this much deeper (#229)

  if (st.type === 'L') {
    const z0 = w / 2 + ex;                                            // flight 2 starts after the (deeper) landing
    treads.push({ poly: flip(rect(xa, xb, -w / 2, z0)), top: landTop });
    for (let j = 0; j < n2; j++) treads.push({ poly: flip(rect(xa, xb, z0 + j * d, z0 + (j + 1) * d)), top: (n1 + 2 + j) * rise });
    hole = flip([[0, -w / 2], [xb, -w / 2], [xb, z0 + n2 * d], [xa, z0 + n2 * d], [xa, w / 2], [0, w / 2]]);
    arrow = [[0, 0], [xa + w / 2, 0], [xa + w / 2, (z0 + n2 * d) * sg]];
    return { treads, hole, arrow };
  }

  // U: flight 2 returns next to flight 1
  const z1 = w / 2 + GAP, z2 = z1 + w;
  treads.push({ poly: flip(rect(xa, xb + ex, -w / 2, z2)), top: landTop });
  for (let j = 0; j < n2; j++) treads.push({ poly: flip(rect(xa - (j + 1) * d, xa - j * d, z1, z2)), top: (n1 + 2 + j) * rise });
  const xl = xa - n2 * d, xm = (w + ex) / 2;
  hole = flip(rect(Math.min(0, xl), xb + ex, -w / 2, z2));
  arrow = [[0, 0], [xa + xm, 0], [xa + xm, (z1 + w / 2) * sg], [xl, (z1 + w / 2) * sg]];
  // flight 2 ends this far behind the start of flight 1: on the floors in between a plate closes that bit of the opening (#229)
  const gap = xl < -1e-9 ? flip(rect(xl, 0, -w / 2, w / 2)) : null;
  return { treads, hole, arrow, gap };
}

/** tread counts: T treads in total (per storey for straight, L and U stairs, #229); L/U stairs split into flight 1 (n1), landing and flight 2 (n2) */
export function stairCounts(st, H) {
  const T = stairSteps(H * (perStorey(st) ? 1 : stairFloors(st))).n - 1, n1 = Math.floor((T - 1) / 2);
  return { T, n1, n2: T - 1 - n1 };
}
/** length of the (first) run in metres, null for spiral stairs */
export function stairLength(st, H) {
  if (st.type === 'spiral' || st.type === 'wall') return null;
  const { T, n1 } = stairCounts(st, H);
  return (st.type === 'straight' ? T : n1) * (st.tread || 0.27);
}
/** local positions of the two size handles: `len` at the end of the first run, `wid` at its side */
export function stairHandles(st, H) {
  const w = st.w || 1;
  if (st.type === 'spiral') return { len: null, wid: [w, 0] };
  if (st.type === 'wall') {
    const p = st.path || [], a = p[0], b = p[1];
    if (!a || !b) return { len: null, wid: null };
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, d = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], nr = wallSide(st, d);
    return { len: null, wid: [(a[0] + b[0]) / 2 + nr[0] * w, (a[1] + b[1]) / 2 + nr[1] * w] };
  }
  const L = stairLength(st, H);
  return { len: [L, 0], wid: [L / 2, w / 2] };
}

/* ---- wall stair: a light stair hanging on a wall, with a landing at every bend of its path ---- */

/** the unit vector the steps stick out to, for walking direction d (local frame: +x ahead, +z to the right) */
export function wallSide(st, d) {
  const sg = st.turn === 'left' ? -1 : 1;
  return [-d[1] * sg, d[0] * sg];
}

/**
 * Plan of a wall stair: the flights and landings along `path`.
 * Returns { flights: [{ from, dir, len, k }], landings: [{ at, kind: 'in'|'away'|'straight', a, b, flat: { from, len } | null }], treadsLeft, ok }
 *  (a point in the middle of a straight run is a landing of its own; st.landing keeps the stair flat for that long after a bend, #210)
 *  - at an inner bend ('in': the path turns towards the side the steps are on) the landing sits in the corner: the flight before it stops
 *    one width short, the next one starts one width after the corner
 *  - at an outer bend ('away') the landing lies beyond the corner on the step side and the next flight starts at the corner
 *  - k = number of steps of the flight; the steps are shared out by length
 */
export function wallStairPlan(st, nTreads) {
  const p = (st.path || []).filter((q) => Array.isArray(q) && q.length === 2);
  const w = st.w || 0.9, sg = st.turn === 'left' ? -1 : 1;
  const segs = [];
  for (let i = 0; i + 1 < p.length; i++) {
    const dx = p[i + 1][0] - p[i][0], dz = p[i + 1][1] - p[i][1], len = Math.hypot(dx, dz);
    if (len < 0.01) continue;
    segs.push({ a: p[i], b: p[i + 1], len, dir: [dx / len, dz / len], s0: 0, s1: 0 });
  }
  const landings = [], extra = landingLength(st);
  for (let i = 0; i + 1 < segs.length; i++) {
    const A = segs[i], B = segs[i + 1], cross = A.dir[0] * B.dir[1] - A.dir[1] * B.dir[0], dot = A.dir[0] * B.dir[0] + A.dir[1] * B.dir[1];
    if (Math.abs(cross) < 0.05 && dot > 0) {                 // a point in the middle of a straight run: a landing of its own (#210)
      const len = Math.min(extra || w, Math.max(0, B.len - 0.05));
      landings.push({ at: B.a, kind: 'straight', a: A.dir, b: B.dir, flat: { from: [...B.a], len } });
      B.s0 += len;
      continue;
    }
    const kind = cross * sg > 0 ? 'in' : 'away';
    if (kind === 'in') { A.s1 += w; B.s0 += w; }
    const len = Math.min(extra, Math.max(0, B.len - B.s0 - 0.05));                       // stays flat round the corner for this long (#210)
    landings.push({ at: B.a, kind, a: A.dir, b: B.dir, flat: len > 0 ? { from: [B.a[0] + B.dir[0] * B.s0, B.a[1] + B.dir[1] * B.s0], len } : null });
    B.s0 += len;
  }
  const avail = segs.map((q) => Math.max(0, q.len - q.s0 - q.s1));
  const total = avail.reduce((x, y) => x + y, 0);
  const left = Math.max(0, nTreads - landings.length);
  // share the steps out by length (largest remainder), at least one for every flight that has room for a step
  const ks = avail.map((l) => (total > 0 ? (left * l) / total : 0));
  const k = ks.map((v, i) => (avail[i] >= MIN_TREAD ? Math.max(1, Math.floor(v)) : 0));
  let rest = left - k.reduce((x, y) => x + y, 0);
  const order = ks.map((v, i) => [v - Math.floor(v), i]).sort((x, y) => y[0] - x[0]).map((q) => q[1]).filter((i) => avail[i] >= MIN_TREAD);
  for (let g = 0; rest !== 0 && order.length && g < 1000; g++) {
    const i = order[g % order.length];
    if (rest > 0) { k[i]++; rest--; } else if (k[i] > 1) { k[i]--; rest++; }
  }
  const flights = segs.map((q, i) => ({ from: [q.a[0] + q.dir[0] * q.s0, q.a[1] + q.dir[1] * q.s0], dir: q.dir, len: avail[i], k: k[i] }));
  const ok = flights.length > 0 && flights.every((f) => f.k === 0 || (f.len / f.k >= MIN_TREAD - 1e-9 && f.len / f.k <= MAX_TREAD + 1e-9));
  return { flights, landings, treadsLeft: rest, ok };
}

function wallStairLocal(st, Htot) {
  const { n, rise } = stairSteps(Htot), T = n - 1, w = st.w || 0.9, sg = st.turn === 'left' ? -1 : 1;
  const plan = wallStairPlan(st, T);
  const treads = [];
  const add = (poly, c) => treads.push({ poly, top: c * rise, thin: THIN });
  let c = 0;
  plan.flights.forEach((f, i) => {
    const nrm = [-f.dir[1] * sg, f.dir[0] * sg], d = f.k ? f.len / f.k : 0;
    for (let j = 0; j < f.k; j++) {
      const p0 = [f.from[0] + f.dir[0] * j * d, f.from[1] + f.dir[1] * j * d], p1 = [p0[0] + f.dir[0] * d, p0[1] + f.dir[1] * d];
      c++;
      add([p0, p1, [p1[0] + nrm[0] * w, p1[1] + nrm[1] * w], [p0[0] + nrm[0] * w, p0[1] + nrm[1] * w]], c);
    }
    const L = plan.landings[i];
    if (L) {
      c++;
      const P = L.at, a = L.a, b = L.b, nA = [-a[1] * sg, a[0] * sg];
      if (L.kind !== 'straight') {
        const q = L.kind === 'in'
          ? [[P[0] - a[0] * w, P[1] - a[1] * w], P, [P[0] + b[0] * w, P[1] + b[1] * w], [P[0] + b[0] * w - a[0] * w, P[1] + b[1] * w - a[1] * w]]
          : [P, [P[0] + a[0] * w, P[1] + a[1] * w], [P[0] + a[0] * w + nA[0] * w, P[1] + a[1] * w + nA[1] * w], [P[0] + nA[0] * w, P[1] + nA[1] * w]];
        add(q, c);
      }
      if (L.flat && L.flat.len > 0) {                          // the flat stretch after the corner, or a landing of its own: same height (#210)
        const f0 = L.flat.from, f1 = [f0[0] + b[0] * L.flat.len, f0[1] + b[1] * L.flat.len], nB = [-b[1] * sg, b[0] * sg];
        add([f0, f1, [f1[0] + nB[0] * w, f1[1] + nB[1] * w], [f0[0] + nB[0] * w, f0[1] + nB[1] * w]], c);
      }
    }
  });
  // the opening in the floors above: the outline of everything the stair covers
  let hole = [];
  try {
    const mp = polygonClipping.union(...treads.map((t) => [[...t.poly.map((q) => [q[0], q[1]]), [t.poly[0][0], t.poly[0][1]]]]));
    hole = mp.length ? mp.map((poly) => poly[0].slice(0, -1)).sort((x, y) => y.length - x.length)[0] : [];
  } catch { hole = []; }
  // the arrow runs through the middle of the steps: the path moved by half a width to the step side, with exact (mitred) bends
  const path = (st.path || []).filter((q, k, arr) => k === 0 || Math.hypot(q[0] - arr[k - 1][0], q[1] - arr[k - 1][1]) > 0.01);
  let arrow = [[0, 0], [1, 0]];
  if (path.length >= 2) {
    const lines = [];
    for (let k = 0; k + 1 < path.length; k++) {
      const dx = path[k + 1][0] - path[k][0], dz = path[k + 1][1] - path[k][1], l = Math.hypot(dx, dz), u = [dx / l, dz / l];
      lines.push({ p: [path[k][0] + -u[1] * sg * (w / 2), path[k][1] + u[0] * sg * (w / 2)], u });
    }
    arrow = path.map((q, k) => {
      const prev = lines[k - 1], next = lines[k];
      if (prev && next) { const x = crossLines(prev, next); if (x) return x; }
      return onLine(q, next || prev);
    });
  }
  return { treads, hole, arrow };
}

/** width of a wall stair from a point the user drags (local coordinates): the distance of the point from the first stretch of the path */
export function wallStairWidthAt(st, lx, lz) {
  const a = st.path?.[0], b = st.path?.[1];
  if (!a || !b) return st.w || 0.9;
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, d = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], nr = wallSide(st, d);
  return (lx - a[0]) * nr[0] + (lz - a[1]) * nr[1];
}

/** The face of the wall that runs along the stretch a -> b, on the side the steps stick out to: { p, u } (a point on it and its direction, along a -> b),
 *  or null when no wall runs nearly parallel to the stretch within `maxDist` of its middle. walls: [{ a, b, thickness }], side: 'left'|'right'. */
function wallFace(a, b, walls, side, maxDist) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (L < 0.01) return null;
  const d = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], sg = side === 'left' ? -1 : 1, stepSide = [-d[1] * sg, d[0] * sg];
  let best = null;
  for (const w of walls) {
    const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], len = Math.hypot(dx, dz);
    if (len < 0.01) continue;
    const u = [dx / len, dz / len], cos = u[0] * d[0] + u[1] * d[1];
    if (Math.abs(cos) < 0.9) continue;
    const t = Math.max(0, Math.min(len, (mid[0] - w.a[0]) * u[0] + (mid[1] - w.a[1]) * u[1]));
    const dist = Math.hypot(mid[0] - (w.a[0] + u[0] * t), mid[1] - (w.a[1] + u[1] * t));
    if (dist > maxDist || (best && dist >= best.dist)) continue;
    const nrm = [-u[1], u[0]], sgn = stepSide[0] * nrm[0] + stepSide[1] * nrm[1] >= 0 ? 1 : -1, th = (w.thickness || 0.2) / 2;
    best = { dist, p: [w.a[0] + nrm[0] * th * sgn, w.a[1] + nrm[1] * th * sgn], u: cos >= 0 ? u : [-u[0], -u[1]] };
  }
  return best && { p: best.p, u: best.u };
}
const onLine = (c, f) => { const t = (c[0] - f.p[0]) * f.u[0] + (c[1] - f.p[1]) * f.u[1]; return [f.p[0] + f.u[0] * t, f.p[1] + f.u[1] * t]; };
function crossLines(f, g) {
  const den = f.u[0] * g.u[1] - f.u[1] * g.u[0];
  if (Math.abs(den) < 0.2) return null;
  const t = ((g.p[0] - f.p[0]) * g.u[1] - (g.p[1] - f.p[1]) * g.u[0]) / den;
  return [f.p[0] + f.u[0] * t, f.p[1] + f.u[1] * t];
}

/**
 * The path of a wall stair from the points the user clicked: every stretch that runs along a wall is moved onto the face of that wall (the side the
 * steps stick out to), and a bend between two walls is put exactly into the corner. Stretches far from every wall stay where they were clicked.
 */
export function wallPathFromClicks(clicks, walls, side, maxDist = 0.5) {
  const n = clicks.length;
  if (n < 2) return clicks.map((q) => [...q]);
  const faces = [];
  for (let i = 0; i + 1 < n; i++) faces.push(wallFace(clicks[i], clicks[i + 1], walls, side, maxDist));
  return clicks.map((c, i) => {
    const prev = faces[i - 1], next = faces[i];
    if (prev && next) { const x = crossLines(prev, next); return x && Math.hypot(x[0] - c[0], x[1] - c[1]) <= 1 ? x : onLine(c, next); }
    if (next) return onLine(c, next);
    if (prev) return onLine(c, prev);
    return [...c];
  });
}

/* ---- local <-> world (same convention as devices: rot degrees, three.js rotation.y) ---- */
export function toWorld(st, lx, lz) {
  const th = ((st.rot || 0) * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th);
  return [st.x + lx * c + lz * s, st.z - lx * s + lz * c];
}
export function toLocal(st, x, z) {
  const th = ((st.rot || 0) * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th);
  const dx = x - st.x, dz = z - st.z;
  return [dx * c - dz * s, dx * s + dz * c];
}
export const polyToWorld = (st, poly) => poly.map(([x, z]) => toWorld(st, x, z));

function inPoly(x, z, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/** is the world point on one of the stair's treads? */
export function stairHit(st, x, z, H, pad = 0) {
  const [lx, lz] = toLocal(st, x, z);
  const g = stairLocal(st, H);
  return g.treads.some((t) => inPoly(lx, lz, t.poly)) || (pad > 0 && g.treads.some((t) => t.poly.some(([px, pz]) => Math.hypot(px - lx, pz - lz) < pad)));
}

/** local bounding box of all treads: { x0, x1, z0, z1 } */
export function stairBounds(st, H) {
  const pts = stairLocal(st, H).treads.flatMap((t) => t.poly);
  return {
    x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])),
    z0: Math.min(...pts.map((p) => p[1])), z1: Math.max(...pts.map((p) => p[1])),
  };
}

/** world polygon of the floor opening, or null */
export const stairHoleWorld = (st, H) => polyToWorld(st, stairLocal(st, H).hole);

/**
 * Openings a floor needs: stairs that climb through it (a stair on floor j with `floors` = n reaches floors j+1 .. j+n) plus its own stairs that
 * come up from below (dir 'down' on floor j covers floors j-n+1 .. j).
 * `floors` is layout.floors, `i` the index of the floor whose rooms get the holes.
 */
export function holesForFloor(floors, i, H) {
  const out = [];
  floors.forEach((f, j) => (f.stairs || []).forEach((st) => {
    const n = stairFloors(st), up = (st.dir || 'up') === 'up';
    if (up ? (j < i && i <= j + n) : (j - n + 1 <= i && i <= j)) out.push(stairHoleWorld(st, H));
  }));
  return out;
}

/** the stairs of lower floors that reach floor i (shown there dashed in the plan): [{ st, from }] */
export function arrivingStairs(floors, i) {
  const out = [];
  floors.forEach((f, j) => { if (j < i) (f.stairs || []).forEach((st) => { if ((st.dir || 'up') === 'up' && i <= j + stairFloors(st)) out.push({ st, from: j }); }); });
  return out;
}
