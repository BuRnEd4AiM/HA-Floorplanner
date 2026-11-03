/* Winder steps (Wendelstufen, #623, asked by Miicki): an L or U stair can turn with wedge-shaped steps instead of a landing, as many cellar
 * and storey stairs in Germany and Switzerland do ("viertelgewendelt", "halbgewendelt"), and its first flight can be longer than the second
 * ("Stufen im 1. Lauf"). Pure functions (no three.js, no DOM; unit test: tests/winders.test.mjs); stairs.js builds the stair with them.
 *
 * Stair data: corner 'landing' (default) | 'winder'; winders: how many wedge steps turn the corner (L 2 .. 6, U 3 .. 10; without it as many as
 * make them about as deep as the straight steps on the walking line in the middle); split: treads in the first flight (without it about half).
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

/** the winder steps of stair st (0 for a landing, a straight stair, a spiral or a wall stair) */
export function winderCount(st, gap = 0) {
  if (!hasWinders(st)) return 0;
  const [lo, hi] = WINDER_RANGE[st.type];
  const n = whole(st.winders);
  return Number.isFinite(n) && n > 0 ? clamp(n, lo, hi) : autoWinders(st, gap);
}

/** how the T treads of one storey of an L or U stair are shared out: n1 in flight 1, c at the corner (1 landing or the winders), n2 in
 *  flight 2. split: treads in the first flight (st.split), else about half; flight 1 has at least one step, flight 2 may have none */
export function flightSplit(st, T, gap = 0) {
  const c = Math.max(1, Math.min(Math.max(1, T - 1), winderCount(st, gap) || 1));
  const free = Math.max(1, T - c), s = whole(st.split);
  const n1 = Number.isFinite(s) && s > 0 ? clamp(s, 1, free) : Math.max(1, Math.floor(free / 2));
  return { n1, c, n2: Math.max(0, T - c - n1) };
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

/** the winder steps of the half turn of a U stair: the corner [xa, xa + w] × [-w/2, z2] turned round the middle of its inner edge
 *  (xa, between the two flights) in k steps; z1 / z2: where flight 2 begins and ends across the stair */
export const uWinders = (xa, w, z1, z2, k) => fanWedges([xa, (w / 2 + z1) / 2], [xa, xa + w, -w / 2, z2], 0, Math.PI, k);

/** how deep a wedge is on the walking line (the middle of the stair, radius r round the pivot): the arc of its angle */
export const walkDepth = (turn, k, r) => (k ? (turn * r) / k : 0);
export const turnOf = (type) => TURN[type] || 0;
