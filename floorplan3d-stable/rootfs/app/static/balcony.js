/* 🏗 Balconies and roof terraces (#646, before: the roof terrace of #87). A room with `terrace: true` is open: no roof over it, a wooden
 * floor and a railing along every edge that is not a wall. Its fields (all optional):
 * - `rail`: how the railing looks: 'metal' (posts and two rails, the default), 'glass' (glass panes with a hand rail) or 'wood' (slats);
 * - `posts`: true = supports from its outer corners down to the ground.
 * Where such a room hangs free (a balcony: on an upper floor beyond the storey below, on the ground floor of a house on a slope (#629) where the
 * ground lies well below it), it stands on a thin plate of its own instead of the ceiling of the house, and the ground floor's plinth and the
 * hole in the earth leave it out: the slope goes on under it.
 * Here: which terrace rooms hang free, where the railing runs and of which parts it is made, where the supports stand.
 * Pure (no three.js, no DOM; unit test: tests/balcony.test.mjs); balcony3d.js builds the meshes. */
import polygonClipping from './vendor/polygon-clipping.js';
import { rangeOver } from './terrain.js';
import { pointInPoly, polyArea } from './rooms.js';

export const BALCONY = {
  plate: 0.18,      // the plate under a free balcony (m)
  low: 0.3,         // ground floor on a slope: it hangs free where the ground under it lies at least this much below its floor
  share: 0.5,       // ... and at least this share of it lies beyond the storey below (the basement)
  railH: 1.0,       // height of the railing
  post: 0.14,       // a support: square, this wide
  inset: 0.12,      // a support stands this far inside the edges
  span: 4.5,        // a free edge longer than this gets supports in between
};
export const RAILS = ['metal', 'glass', 'wood'];
/** the railing of a room: one of RAILS, 'metal' when unset or unknown */
export const cleanRail = (v) => (RAILS.includes(v) ? v : 'metal');

const okRoom = (r) => Array.isArray(r?.points) && r.points.length >= 3;
const closed = (pts) => [[...pts.map((p) => [+p[0], +p[1]]), [+pts[0][0], +pts[0][1]]]];

/** the outline of a storey as polygons (polygon-clipping): its walls with their thickness, its rooms (not its open terraces) and blocks */
export function storeyOutline(floors) {
  const polys = [];
  (floors || []).forEach((f) => {
    (f?.walls || []).forEach((w) => {
      const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], L = Math.hypot(dx, dz);
      if (L < 1e-3) return;
      const t = (+w.thickness || 0.2) / 2, nx = (-dz / L) * t, nz = (dx / L) * t;
      polys.push(closed([[w.a[0] + nx, w.a[1] + nz], [w.b[0] + nx, w.b[1] + nz], [w.b[0] - nx, w.b[1] - nz], [w.a[0] - nx, w.a[1] - nz]]));
    });
    [...(f?.rooms || []).filter((r) => !r.terrace), ...(f?.blocks || [])].forEach((r) => { if (okRoom(r)) polys.push(closed(r.points)); });
  });
  return polys;
}

/** how much of the polygon `pts` (0 … 1) lies outside the polygons `polys` (storeyOutline) */
export function outsideShare(pts, polys) {
  const all = polyArea(pts);
  if (all < 1e-6) return 0;
  if (!polys?.length) return 1;
  try {
    const rest = polygonClipping.difference(closed(pts), ...polys);
    const area = rest.reduce((s, poly) => s + poly.reduce((a, ring, k) => a + (k ? -1 : 1) * polyArea(ring.slice(0, -1)), 0), 0);
    return Math.max(0, Math.min(1, area / all));
  } catch { return 0; }
}

/** the ids of the terrace rooms of floor i that hang free (balconies): on a floor above the ground floor (groundIdx) when at least half of
 *  the room lies beyond the storey below; on the ground floor only on a slope (hf: the height of the ground (x, z) => h, terrain.js, null
 *  when level) where the ground under all of it lies at least BALCONY.low below its floor and it is not over the basement. Never in a
 *  basement. */
export function freeBalconies(floors, i, groundIdx = 0, hf = null) {
  const f = floors?.[i], out = new Set();
  if (!f || i < groundIdx) return out;
  const open = (f.rooms || []).filter((r) => r.terrace && okRoom(r));
  if (!open.length || (i === groundIdx && !hf)) return out;
  const under = storeyOutline(i > groundIdx ? [floors[i - 1]] : floors.slice(0, groundIdx));
  open.forEach((r) => {
    if (outsideShare(r.points, under) < BALCONY.share) return;
    if (i === groundIdx && rangeOver(hf, r.points)[1] > -BALCONY.low) return;
    out.add(r.id);
  });
  return out;
}
/** the floors with the rooms `ids` of floor i left out (the outline of the house without its free balconies) */
export const withoutRooms = (floors, i, ids) => (floors || []).map((f, k) => (k === i && ids?.size ? { ...f, rooms: (f.rooms || []).filter((r) => !ids.has(r.id)) } : f));

/** is the point (x, z) at one of the walls (on it or within `margin` m of its face) */
export function atWall(walls, x, z, margin = 0.12) {
  return (walls || []).some((w) => {
    const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], l2 = dx * dx + dz * dz || 1;
    const k = Math.max(0, Math.min(1, ((x - w.a[0]) * dx + (z - w.a[1]) * dz) / l2));
    return Math.hypot(x - (w.a[0] + k * dx), z - (w.a[1] + k * dz)) < (+w.thickness || 0.2) / 2 + margin;
  });
}

/** where the railing of a room runs: the stretches [{ a: [x, z], b: [x, z] }] of its edges where `covered(x, z)` is false (no wall, no
 *  bridge arriving), each longer than 15 cm; the edges are looked at every `step` m */
export function railRuns(pts, covered, step = 0.2) {
  const runs = [];
  for (let i = 0; i < pts.length; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length], len = Math.hypot(bx - ax, bz - az);
    if (len < 0.1) continue;
    const n = Math.max(1, Math.ceil(len / step)), at = (u) => [ax + (bx - ax) * u, az + (bz - az) * u];
    let run = null;
    const flush = (end) => {
      if (run === null) return;
      const a = at(run), b = at(end);
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 0.15) runs.push({ a, b });
      run = null;
    };
    for (let k = 0; k < n; k++) {
      const [mx, mz] = at((k + 0.5) / n);
      if (covered(mx, mz)) flush(k / n); else if (run === null) run = k / n;
    }
    flush(1);
  }
  return runs;
}

/** the parts of a railing of length `len` along its run: boxes { mat: metal | glass | wood, u0, u1 (along the run), y0, y1 (over the
 *  floor), th (across, centred on the run) } */
export function railParts(len, style, H = BALCONY.railH) {
  const parts = [], s = cleanRail(style);
  const box = (mat, u0, u1, y0, y1, th) => parts.push({ mat, u0, u1, y0, y1, th });
  const posts = (gap, w, mat) => {
    const n = Math.max(1, Math.ceil(len / gap)), at = [];
    for (let p = 0; p <= n; p++) { const u = (len * p) / n; at.push(u); box(mat, u - w / 2, u + w / 2, 0, H, w); }
    return at;
  };
  if (s === 'wood') {
    posts(1.5, 0.08, 'wood');
    box('wood', 0, len, H - 0.05, H + 0.01, 0.1);                       // the hand rail on top, a little wider
    box('wood', 0, len, 0.08, 0.13, 0.05);                              // the rail at the bottom
    const n = Math.max(1, Math.floor(len / 0.12));
    for (let k = 1; k < n; k++) { const u = (len * k) / n; box('wood', u - 0.02, u + 0.02, 0.13, H - 0.05, 0.02); }   // the slats
  } else if (s === 'glass') {
    const at = posts(1.2, 0.05, 'metal');
    box('metal', 0, len, H - 0.025, H + 0.025, 0.05);                   // the hand rail
    for (let k = 0; k + 1 < at.length; k++) box('glass', at[k] + 0.04, at[k + 1] - 0.04, 0.08, H - 0.06, 0.012);   // a pane between two posts
  } else {
    posts(1.2, 0.05, 'metal');                                          // as the roof terrace always looked: posts, a top rail, a knee rail
    box('metal', 0, len, H - 0.025, H + 0.025, 0.05);
    box('metal', 0, len, H * 0.5 - 0.0175, H * 0.5 + 0.0175, 0.035);
  }
  return parts;
}

/** where the supports of a balcony stand: inside each convex corner that is not at a wall (`nearWall(x, z)`), and in between along a free
 *  edge longer than BALCONY.span; each BALCONY.inset m inside the edges */
export function supportSpots(pts, nearWall = () => false) {
  const n = pts.length, out = [];
  if (n < 3) return out;
  const sgn = Math.sign(pts.reduce((s, [x1, z1], i) => { const [x2, z2] = pts[(i + 1) % n]; return s + x1 * z2 - x2 * z1; }, 0)) || 1;
  const unit = (dx, dz) => { const l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; };
  const d = BALCONY.inset;
  for (let k = 0; k < n; k++) {
    const p = pts[(k + n - 1) % n], c = pts[k], q = pts[(k + 1) % n];
    const cross = (c[0] - p[0]) * (q[1] - c[1]) - (c[1] - p[1]) * (q[0] - c[0]);
    if (Math.sign(cross) !== sgn || nearWall(c[0], c[1])) continue;      // a corner pointing inwards, or one at the house
    const u1 = unit(q[0] - c[0], q[1] - c[1]), u2 = unit(p[0] - c[0], p[1] - c[1]);
    const b = unit(u1[0] + u2[0], u1[1] + u2[1]), half = Math.acos(Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1]))) / 2;
    const dist = Math.min(0.5, d / Math.max(0.2, Math.sin(half)));
    out.push([c[0] + b[0] * dist, c[1] + b[1] * dist]);
  }
  for (let k = 0; k < n; k++) {
    const a = pts[k], b = pts[(k + 1) % n], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len <= BALCONY.span) continue;
    const m = Math.ceil(len / BALCONY.span), [ux, uz] = unit(b[0] - a[0], b[1] - a[1]);
    let [nx, nz] = [-uz, ux];
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (!pointInPoly(mid[0] + nx * 0.05, mid[1] + nz * 0.05, pts)) { nx = -nx; nz = -nz; }   // the normal that points into the room
    for (let j = 1; j < m; j++) {
      const x = a[0] + (b[0] - a[0]) * (j / m), z = a[1] + (b[1] - a[1]) * (j / m);
      if (!nearWall(x, z)) out.push([x + nx * d, z + nz * d]);
    }
  }
  return out;
}
