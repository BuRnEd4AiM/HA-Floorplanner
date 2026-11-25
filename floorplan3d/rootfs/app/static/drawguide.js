/* 📐 Drawing guides (5.14.0, the owner: „ich möchte, dass man sieht, wann es ein rechter Winkel ist und wann etwas parallel ist zur nächsten
 * Wand oder Linie, wenn man zeichnet“): while a wall, a room, a block, an area of the plot or a floor opening is drawn, the next point is
 * looked at against the line drawn before it (or the walls meeting at the last point) and against every wall and edge of the floor: when
 * the new line is within a few degrees of a right angle or of parallel to one of them, the point moves onto it exactly and the plan shows
 * it (∟ 90° at the corner, ∥ at both lines). Alt (free drawing) and a snap to an existing corner leave the point as it is.
 * Pure (no DOM; unit test: tests/drawguide.test.mjs); plan2d.js draws the marks. */

export const GUIDE = { tol: 4, min: 0.05 };                             // degrees off that still count; a line shorter than min (m) is left alone

const unit = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); return L > 1e-9 ? [dx / L, dz / L, L] : null; };
const deg = (r) => (r * 180) / Math.PI;
/** the angle in degrees between the directions u and v as lines (0 … 90: parallel … square, no matter which way they point) */
function lineAngle(u, v) {
  const c = Math.abs(u[0] * v[0] + u[1] * v[1]);
  return deg(Math.acos(Math.min(1, c)));
}
const r4 = (v) => Math.round(v * 1e4) / 1e4;

/** the guide for the next point p after `last` (prev: the point before last, null for the first line; lines: [[a, b]] the walls and edges
 *  of the floor (and the lines drawn before); opts.tol: degrees). { p (moved onto the guide, or as it was), kind: 'right' | 'parallel' |
 *  null, ref: [a, b] (the line it is square or parallel to), at: last, off (degrees it was off) } */
export function guideAt(prev, last, p, lines = [], { tol = GUIDE.tol } = {}) {
  const none = { p, kind: null, ref: null, at: last, off: 0 };
  const d = unit(last, p);
  if (!d || d[2] < GUIDE.min) return none;
  const near = (q) => Math.hypot(q[0] - last[0], q[1] - last[1]) < 0.02;
  // square: to the line before (prev → last), else to a wall or edge that ends at the last point
  const refs = prev ? [[prev, last]] : lines.filter(([a, b]) => near(a) || near(b));
  let best = null;
  refs.forEach((ref) => {
    const u = unit(ref[0], ref[1]);
    if (!u) return;
    const off = 90 - lineAngle(u, d);
    if (off <= tol && (!best || off < best.off - 1e-9)) best = { kind: 'right', ref, off, dir: [-u[1], u[0]] };
  });
  // parallel: to any wall or edge (the nearest one when several are equally close in angle)
  const mid = [(last[0] + p[0]) / 2, (last[1] + p[1]) / 2];
  let par = null;
  lines.forEach((ref) => {
    const u = unit(ref[0], ref[1]);
    if (!u || u[2] < GUIDE.min) return;
    const off = lineAngle(u, d);
    if (off > tol) return;
    const dist = Math.hypot((ref[0][0] + ref[1][0]) / 2 - mid[0], (ref[0][1] + ref[1][1]) / 2 - mid[1]);
    if (!par || off < par.off - 0.05 || (Math.abs(off - par.off) <= 0.05 && dist < par.dist)) par = { kind: 'parallel', ref, off, dist, dir: [u[0], u[1]] };
  });
  if (par && (!best || par.off < best.off - 0.5)) best = par;            // a square corner wins when both fit about as well
  if (!best) return none;
  const k = d[0] * d[2] * best.dir[0] + d[1] * d[2] * best.dir[1];       // how far along the guide (the projection of last → p)
  return { p: [r4(last[0] + best.dir[0] * k), r4(last[1] + best.dir[1] * k)], kind: best.kind, ref: best.ref, at: last, off: best.off };
}

/** the guide with the grid on (5.36.1): first for the point as the grid put it (`snapped`); when that one is too far off (3° off at 3 m
 *  can put the next grid point 4.8° off, past the tolerance, and no ∟ showed), for the pointer itself (`raw`): then the point lies
 *  exactly on the guide and only its length goes onto the grid (`grid` m). Same answer as guideAt. */
export function guideOnGrid(prev, last, raw, snapped, lines = [], grid = 0, opts = {}) {
  const g = guideAt(prev, last, snapped, lines, opts);
  if (g.kind || !raw) return g;
  const h = guideAt(prev, last, raw, lines, opts);
  if (!h.kind) return g;
  const dx = h.p[0] - last[0], dz = h.p[1] - last[1], L = Math.hypot(dx, dz), Lg = grid > 0 ? Math.round(L / grid) * grid : L;
  if (Lg < GUIDE.min || L < 1e-9) return h;
  return { ...h, p: [r4(last[0] + (dx / L) * Lg), r4(last[1] + (dz / L) * Lg)] };
}

/** the lines of a floor a guide looks at: its walls and the edges of its rooms, blocks and floor openings; `extra`: more polygons (the
 *  areas of the plot); `drawn`: the points drawn so far (their lines except the last one, which is the line before) */
export function guideLines(f, extra = [], drawn = []) {
  const out = [];
  (f?.walls || []).forEach((w) => out.push([w.a, w.b]));
  [...(f?.rooms || []), ...(f?.blocks || []), ...(f?.holes || []), ...extra].forEach((r) => {
    const pts = r?.points || [];
    pts.forEach((a, i) => out.push([a, pts[(i + 1) % pts.length]]));
  });
  for (let i = 0; i + 2 < drawn.length; i++) out.push([drawn[i], drawn[i + 1]]);
  return out;
}
