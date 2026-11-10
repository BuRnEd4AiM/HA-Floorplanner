/* 🏗 Balconies and roof terraces (#646, before: the roof terrace of #87). A room with `terrace: true` is open: no roof over it, a wooden
 * floor and a railing along every edge that is not a wall and where no other open room of the floor joins (#703). Its fields (all optional):
 * - `rail`: how the railing looks: 'metal' (posts and two rails, the default), 'glass' (glass panes with a hand rail) or 'wood' (slats);
 * - `posts`: true = supports from its outer corners down to the ground.
 * Where such a room hangs free (a balcony: on an upper floor beyond the storey below, on the ground floor of a house on a slope (#629) where the
 * ground lies well below it), it stands on a thin plate of its own instead of the ceiling of the house, and the ground floor's plinth and the
 * hole in the earth leave it out: the slope goes on under it. This is decided for each part of the room (#703): a terrace that lies mostly on
 * the garage and reaches out beyond it hangs free only where it reaches out.
 * Here: which parts of the terrace rooms hang free, where the railing runs and of which parts it is made, where the supports stand.
 * Pure (no three.js, no DOM; unit test: tests/balcony.test.mjs); balcony3d.js builds the meshes. */
import polygonClipping from './vendor/polygon-clipping.js';
import { rangeOver } from './terrain.js';
import { pointInPoly, polyArea } from './rooms.js';

export const BALCONY = {
  plate: 0.18,      // the plate under a free balcony (m)
  low: 0.3,         // ground floor on a slope: a part hangs free where the ground under it lies at least this much below its floor
  part: 0.25,       // a free part narrower than this (2 × area / perimeter, m) is left out: a seam along the house, not a balcony (#703)
  gap: 0.02,        // the free parts keep this far off the walls of the house (the earth and the ceilings reach 1 cm beyond a wall)
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

/** the outline of a storey as polygons (polygon-clipping): its walls with their thickness (and `grow` m more all round), its rooms (not its
 *  open terraces) and blocks */
export function storeyOutline(floors, grow = 0) {
  const polys = [];
  (floors || []).forEach((f) => {
    (f?.walls || []).forEach((w) => {
      const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], L = Math.hypot(dx, dz);
      if (L < 1e-3) return;
      const t = (+w.thickness || 0.2) / 2 + grow, nx = (-dz / L) * t, nz = (dx / L) * t, ex = (dx / L) * t, ez = (dz / L) * t;   // the ends reach out as far: closed corners
      polys.push(closed([[w.a[0] - ex + nx, w.a[1] - ez + nz], [w.b[0] + ex + nx, w.b[1] + ez + nz], [w.b[0] + ex - nx, w.b[1] + ez - nz], [w.a[0] - ex - nx, w.a[1] - ez - nz]]));
    });
    [...(f?.rooms || []).filter((r) => !r.terrace), ...(f?.blocks || [])].forEach((r) => { if (okRoom(r)) polys.push(closed(r.points)); });
  });
  return polys;
}
/** the outline the open rooms of floor i lie on (storeyOutline): the storey below, on the ground floor (groundIdx) the basements */
export const outlineBelow = (floors, i, groundIdx = 0, grow = 0) => storeyOutline(i > groundIdx ? [floors?.[i - 1]] : (floors || []).slice(0, groundIdx), grow);

/** the area of a polygon of polygon-clipping (its first ring minus its holes) */
const clipArea = (poly) => poly.reduce((a, ring, k) => a + (k ? -1 : 1) * polyArea(ring.slice(0, -1)), 0);
/** how wide a ring [[x, z], …] is, about: 2 × area / perimeter (a strip: its width, a square: half its side) */
export function ringWidth(r) {
  if (!(r?.length >= 3)) return 0;
  const per = r.reduce((s, p, k) => { const q = r[(k + 1) % r.length]; return s + Math.hypot(q[0] - p[0], q[1] - p[1]); }, 0);
  return per > 0 ? (2 * polyArea(r)) / per : 0;
}
/** the outer rings [[x, z], …] of a polygon operation that are at least BALCONY.part wide, [] when it fails */
function wideRings(fn) {
  let mp;
  try { mp = fn(); } catch { return []; }
  return mp.map((poly) => poly[0].slice(0, -1)).filter((r) => ringWidth(r) >= BALCONY.part);
}

/** the parts of the terrace rooms of floor i that hang free (balconies, #703): Map room id → { rings: [[[x, z], …], …] (the free parts),
 *  whole (the whole room hangs free, nothing of it lies on the house) }. A part hangs free where it lies beyond the storey below (on the
 *  ground floor (groundIdx): beyond the basement) and off the walls of its own floor; on the ground floor only on a slope (hf: the height of
 *  the ground (x, z) => h, terrain.js, null when level) and only where the ground under all of the part lies at least BALCONY.low below its
 *  floor. Never in a basement. Parts narrower than BALCONY.part are left out. */
export function freeParts(floors, i, groundIdx = 0, hf = null) {
  const f = floors?.[i], out = new Map();
  if (!f || i < groundIdx || (i === groundIdx && !hf)) return out;
  const open = (f.rooms || []).filter((r) => r.terrace && okRoom(r));
  if (!open.length) return out;
  const under = outlineBelow(floors, i, groundIdx, BALCONY.gap), walls = storeyOutline([{ walls: f.walls }], BALCONY.gap);   // its own walls stand on the house
  open.forEach((r) => {
    const rings = wideRings(() => polygonClipping.difference(closed(r.points), ...under, ...walls))
      .filter((ring) => i > groundIdx || rangeOver(hf, ring)[1] <= -BALCONY.low);
    if (!rings.length) return;
    const rest = wideRings(() => polygonClipping.difference(closed(r.points), ...walls, ...rings.map(closed)));   // what lies on the house
    out.set(r.id, { rings, whole: !rest.length });
  });
  return out;
}
/** the ids of the terrace rooms of floor i that hang free, all of them or a part (freeParts) */
export const freeBalconies = (floors, i, groundIdx = 0, hf = null) => new Set(freeParts(floors, i, groundIdx, hf).keys());
/** the outline rings [[x, z], …] (e.g. houseFootprint) with the free parts (freeParts' Map) cut away: the ceiling and the plinth under a
 *  terrace stop where it hangs free (#703); outer rings only, the rings as they are when nothing hangs free or the cut fails */
export function withoutParts(rings, parts) {
  const cut = [...(parts?.values?.() || [])].flatMap((p) => p.rings || []);
  if (!cut.length || !rings?.length) return rings || [];
  try {
    return polygonClipping.difference(rings.map(closed), ...cut.map(closed)).filter((poly) => clipArea(poly) > 1e-4).map((poly) => poly[0].slice(0, -1));
  } catch { return rings; }
}

/** is the point (x, z) on the polygons `polys` (storeyOutline) or within `margin` m of their edges: a support there would stand on the house */
export function onOutline(polys, x, z, margin = 0.3) {
  return (polys || []).some((poly) => {
    const ring = poly[0].slice(0, -1);
    return pointInPoly(x, z, ring) || ring.some((a, k) => {
      const b = ring[(k + 1) % ring.length], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
      const u = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2));
      return Math.hypot(x - (a[0] + u * dx), z - (a[1] + u * dz)) < margin;
    });
  });
}
/** is the point (x, z) inside one of the rooms or within `margin` m of one of their edges: where another open room of the floor joins, the
 *  terrace goes on there and needs no railing (#703: a terrace drawn as two rooms) */
export function atRoom(rooms, x, z, margin = 0.05) {
  return (rooms || []).some((r) => okRoom(r) && onOutline([closed(r.points)], x, z, margin));
}

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
