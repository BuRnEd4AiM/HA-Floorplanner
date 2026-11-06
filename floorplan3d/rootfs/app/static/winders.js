/* Winder steps (Wendelstufen, #623, asked by Miicki): an L or U stair can turn with wedge-shaped steps instead of a landing, as many cellar
 * and storey stairs in Germany and Switzerland do ("viertelgewendelt", "halbgewendelt"), and its first flight can be longer than the second
 * ("Stufen im 1. Lauf"). An L stair can turn a second time, the same way, after a middle flight (#671, asked by Oely99: "unten und oben
 * viertelgewendelt", the stair of many row houses): you step on from the side, winders turn you, a long flight, winders turn you again onto
 * the floor above. Pure functions (no three.js, no DOM; unit test: tests/winders.test.mjs); stairs.js builds the stair with them.
 *
 * Stair data: corner 'landing' (default) | 'winder'; winders: how many wedge steps turn the corner (L 2 .. 6, U 3 .. 10; without it as many as
 * make them about as deep as the straight steps on the walking line in the middle); split: treads in the first flight (without it about half;
 * 0 with winders: the stair starts right away with them, #671).
 * L only (#671): corner2 'landing' | 'winder' (absent: no second corner), winders2 (2 .. 6) like winders, split2: treads in the middle flight
 * between the two corners; the rest of the storey is the last flight (it may have none).
 */

export const CORNERS = ['landing', 'winder'];
export const WINDER_RANGE = { L: [2, 6], U: [3, 10] };
const TURN = { L: Math.PI / 2, U: Math.PI };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const whole = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : NaN);

/** does stair st turn its corner with winder steps? (only L and U stairs) */
export const hasWinders = (st) => (st?.type === 'L' || st?.type === 'U') && st.corner === 'winder';

/** how many winder steps a stair turns with by itself: about as deep as its straight steps on the walking line (the middle of the stair);
 *  gap: the space between the two flights of a U stair */
export function autoWinders(st, gap = 0) {
  const [lo, hi] = WINDER_RANGE[st.type] || [2, 6];
  const w = st.w || 1, d = st.tread || 0.27, r = w / 2 + (st.type === 'U' ? gap / 2 : 0);
  return clamp(Math.round(((TURN[st.type] || TURN.L) * r) / d), lo, hi);
}

/** does the L stair st turn a second time after its middle flight (#671)? */
export const hasCorner2 = (st) => st?.type === 'L' && CORNERS.includes(st.corner2);
/** ... and does it turn there with winder steps? */
export const hasWinders2 = (st) => hasCorner2(st) && st.corner2 === 'winder';
/** the winder steps of the second corner (#671; 0 for a landing or none): as many as set (2 .. 6), else as many as at a first corner */
export function winderCount2(st) {
  if (!hasWinders2(st)) return 0;
  const [lo, hi] = WINDER_RANGE.L, n = whole(st.winders2);
  return Number.isFinite(n) && n > 0 ? clamp(n, lo, hi) : autoWinders(st);
}

/** the winder steps of stair st (0 for a landing, a straight stair, a spiral or a wall stair) */
export function winderCount(st, gap = 0) {
  if (!hasWinders(st)) return 0;
  const [lo, hi] = WINDER_RANGE[st.type];
  const n = whole(st.winders);
  return Number.isFinite(n) && n > 0 ? clamp(n, lo, hi) : autoWinders(st, gap);
}

/** how the T treads of one storey of an L or U stair are shared out: n1 in flight 1, c at the corner (1 landing or the winders), n2 in
 *  flight 2. split: treads in the first flight (st.split), else about half; flight 1 has at least one step (none when the corner has
 *  winders and split is 0: you step on from the side, #671), flight 2 may have none. With a second corner (L, #671) also c2 (1 landing or
 *  its winders) and n3 in the last flight: n2 = split2 (else two thirds of what flight 1 leaves), n1 about a quarter without split */
export function flightSplit(st, T, gap = 0) {
  const c = Math.max(1, Math.min(Math.max(1, T - 1), winderCount(st, gap) || 1));
  const lo1 = hasWinders(st) ? 0 : 1, s = whole(st.split), set = Number.isFinite(s) && s >= lo1;
  if (!hasCorner2(st)) {
    const free = Math.max(1, T - c);
    const n1 = set ? clamp(s, lo1, free) : Math.max(1, Math.floor(free / 2));
    return { n1, c, n2: Math.max(0, T - c - n1) };
  }
  const c2 = Math.max(1, Math.min(Math.max(1, T - c - 1), winderCount2(st) || 1));
  const free = Math.max(0, T - c - c2);
  const n1 = set ? clamp(s, lo1, Math.max(lo1, free)) : Math.max(lo1, Math.floor(free / 4));
  const rest = Math.max(0, free - n1), s2 = whole(st.split2);
  const n2 = Number.isFinite(s2) && s2 >= 0 ? clamp(s2, 0, rest) : rest - Math.floor(rest / 3);
  return { n1, c, n2, c2, n3: rest - n2 };
}

/** the direction at angle a of the fan: 0 = -z (back along the entry edge), π/2 = +x (ahead), π = +z */
const dirAt = (a) => [Math.sin(a), -Math.cos(a)];
/** the angle of point q seen from p (as dirAt) */
const angleOf = (p, q) => Math.atan2(q[0] - p[0], -(q[1] - p[1]));
/** where the ray from p at angle a leaves box [x0, x1, z0, z1] (p lies on its edge x = x0) */
function hit(p, a, box) {
  const [, x1, z0, z1] = box, [dx, dz] = dirAt(a);
  let t = Infinity;
  if (dx > 1e-12) t = Math.min(t, (x1 - p[0]) / dx);
  if (dz < -1e-12) t = Math.min(t, (p[1] - z0) / -dz);
  if (dz > 1e-12) t = Math.min(t, (z1 - p[1]) / dz);
  return [p[0] + dx * t, p[1] + dz * t];
}

/** k wedges round point p (on the edge x = x0 of box [x0, x1, z0, z1]) from angle a0 to a1, in equal angles; every wedge is p, where its
 *  first ray leaves the box, the box corners between, where its last ray leaves the box. Returns the wedges in walking order. */
export function fanWedges(p, box, a0, a1, k) {
  const [, x1, z0, z1] = box, corners = [[x1, z0], [x1, z1]].map((q) => ({ q, a: angleOf(p, q) }));
  const out = [];
  for (let i = 0; i < k; i++) {
    const b0 = a0 + ((a1 - a0) * i) / k, b1 = a0 + ((a1 - a0) * (i + 1)) / k;
    const poly = [[...p], hit(p, b0, box)];
    corners.filter((c) => c.a > b0 + 1e-9 && c.a < b1 - 1e-9).sort((x, y) => x.a - y.a).forEach((c) => poly.push([...c.q]));
    poly.push(hit(p, b1, box));
    out.push(poly);
  }
  return out;
}

/** the winder steps of the corner of an L stair (before it is mirrored to its turning side): the square [xa, xa + w] × [-w/2, w/2]
 *  turned round its inner corner (xa, w/2) in k steps */
export const lWinders = (xa, w, k) => fanWedges([xa, w / 2], [xa, xa + w, -w / 2, w / 2], 0, Math.PI / 2, k);

/** the winder steps of the second corner of an L stair (#671, before it is mirrored): the square [xa, xa + w] × [zc, zc + w] at the end
 *  of the middle flight, turned round its inner corner (xa, zc) onto the last flight (back along -x), in k steps: the first corner's wedges
 *  turned by 90° */
export const lWinders2 = (xa, w, zc, k) => lWinders(0, w, k).map((poly) => poly.map(([x, z]) => [xa + w / 2 - z, zc + x]));

/** the winder steps of the half turn of a U stair: the corner [xa, xa + w] × [-w/2, z2] turned round the middle of its inner edge
 *  (xa, between the two flights) in k steps; z1 / z2: where flight 2 begins and ends across the stair */
export const uWinders = (xa, w, z1, z2, k) => fanWedges([xa, (w / 2 + z1) / 2], [xa, xa + w, -w / 2, z2], 0, Math.PI, k);

/** how deep a wedge is on the walking line (the middle of the stair, radius r round the pivot): the arc of its angle */
export const walkDepth = (turn, k, r) => (k ? (turn * r) / k : 0);
export const turnOf = (type) => TURN[type] || 0;
