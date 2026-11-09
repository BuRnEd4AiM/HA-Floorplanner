/* Splitting a wall in two (or in several equal parts): used by the double click in the 2D plan (plan2d.js) and by the
 * "Split wall" fields in the wall's properties (props.js), so a corner can be put at an exact distance, also very close to
 * another corner. Doors / windows go with the piece they sit on; the corner is also added to the rooms and blocks that run
 * along this wall, so moving it later keeps them together. Pure logic (no three.js, no DOM), tested in tests/wallsplit.test.mjs. */

export const SPLIT_MIN = 0.05;   // a corner keeps at least 5 cm to the ends of the wall

const distSeg = (px, pz, a, b) => {
  const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz;
  const t = l2 ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / l2)) : 0;
  return Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t));
};

export const wallLength = (w) => Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);

/** distance along the wall (from its start a) of the point of it closest to (x, z) */
export function distAlong(w, x, z) {
  const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], L = Math.hypot(dx, dz);
  return L ? ((x - w.a[0]) * dx + (z - w.a[1]) * dz) / L : 0;
}

/** can a corner go at distance d from the start? (not too close to an end, not inside a door / window) */
export function canSplitAt(w, d) {
  const L = wallLength(w);
  if (L < 2 * SPLIT_MIN || d < SPLIT_MIN || d > L - SPLIT_MIN) return false;
  return !(w.openings || []).some((o) => Math.abs(o.pos - d) < o.width / 2 + 0.02);
}

/** split wall w of floor f at distance d from its start; w keeps the first piece, the new second piece follows it in the list.
 *  uid() makes the new id. Returns the new wall, or null when no corner fits there. */
export function splitWall(f, w, d, uid) {
  if (!canSplitAt(w, d)) return null;
  const L = wallLength(w), t = d / L;
  const pt = [+(w.a[0] + (w.b[0] - w.a[0]) * t).toFixed(3), +(w.a[1] + (w.b[1] - w.a[1]) * t).toFixed(3)];
  const second = { ...w, id: uid(), a: [...pt], b: [...w.b], openings: (w.openings || []).filter((o) => o.pos > d).map((o) => ({ ...o, pos: +(o.pos - d).toFixed(3) })) };
  w.openings = (w.openings || []).filter((o) => o.pos <= d);
  w.b = [...pt];
  f.walls.splice(f.walls.indexOf(w) + 1, 0, second);
  [...(f.rooms || []), ...(f.blocks || [])].forEach((poly) => {
    const ps = poly.points;
    for (let i = 0; i < ps.length; i++) {
      const a = ps[i], b = ps[(i + 1) % ps.length];
      if (distSeg(pt[0], pt[1], a, b) < 0.03 && Math.hypot(pt[0] - a[0], pt[1] - a[1]) > 0.02 && Math.hypot(pt[0] - b[0], pt[1] - b[1]) > 0.02) { ps.splice(i + 1, 0, [...pt]); break; }
    }
  });
  return second;
}

/** split wall w into n equal parts (2 … 20); returns the pieces in order (w first), or null when a corner would hit a door / window */
export function splitEqual(f, w, n, uid) {
  n = Math.round(n);
  if (!(n >= 2 && n <= 20)) return null;
  const L = wallLength(w), step = L / n;
  for (let k = 1; k < n; k++) if (!canSplitAt(w, k * step)) return null;
  const pieces = [w];
  let cur = w;
  for (let k = 1; k < n; k++) { cur = splitWall(f, cur, step, uid); pieces.push(cur); }
  return pieces;
}
