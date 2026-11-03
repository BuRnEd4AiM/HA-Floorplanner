/* Roofs cut into each other (#621, the second wing of an L-shaped house): where a further roof runs into the main roof, the part of its
 * slopes that lies inside the main roof is cut away, and the main roof loses the part of its slope under the wing, as a dormer cuts a
 * hole into the slope it stands on. What is left meets in the valleys. Every roof of a roof floor cuts every other one.
 * A roof as a solid: the space under its slopes over its base (y 0), as convex pieces (a roof with steps in its eaves, #342: one piece
 * per stretch where no eave changes). A piece is a list of planes [nx, ny, nz, d] with a unit normal pointing out: a point p lies inside
 * when nx*px + ny*py + nz*pz + d < 0 for every plane (see epsOf for what lies on a face). A flat roof is no solid (it cuts nothing, but is cut).
 * Pure, no three.js, no DOM (unit test: tests/roofcut.test.mjs). */
import { roofFrame } from './roofshape.js';
import { intervals } from './roofsteps.js';

const EPS = 1e-4;
/** how far a face is moved: a slope EPS in (a point on it counts as outside, so a slope that lies in the slope of another roof stays), the
 *  base and the upright ends EPS out (a slope that ends there, e.g. at the same gable, is cut right up to it, no thin strip is left) */
const epsOf = (pl) => (pl[1] > 1e-6 && pl[1] < 1 - 1e-9 ? EPS : -EPS);

/** the solid of roof r (base box bb) in the roof's own frame (y 0 = its base): [[plane, ...], ...] convex pieces; [] for a flat roof */
export function roofSolids(bb, r) {
  if (!bb || !r || r.type === 'flat') return [];
  const F = roofFrame(bb, r);
  if (!(F.h > 0)) return [];
  // a plane given along the ridge (a), across it (b) and up (y): ca*a + cb*b + cy*y + d, turned into x / z and to a unit normal
  const P = (ca, cb, cy, d) => {
    const len = Math.hypot(ca, cb, cy) || 1, [nx, nz] = F.alongX ? [ca, cb] : [cb, ca];
    return [nx / len, cy / len, nz / len, d / len];
  };
  const base = P(0, 0, -1, 0);
  if (F.shed) {                                                     // one slope from the low eave (y 0) up to the high side bc (y h)
    const lo = F.hi ? F.b0 : F.b1, k = F.h / (F.bc - lo);           // y = k * (b - lo) on the slope
    return [[P(0, -k, 1, k * lo), base, P(-1, 0, 0, F.a0), P(1, 0, 0, -F.a1), P(0, -1, 0, F.b0), P(0, 1, 0, -F.b1)]];
  }
  const out = [];
  intervals(bb, r, F.a0, F.a1).forEach(({ a0, a1, out0, out1 }) => {
    const e0 = F.b0 - out0, e1 = F.b1 + out1;                       // the two eaves of this stretch (steps move them, the ridge stays)
    const s0 = F.h / (F.bc - e0), s1 = F.h / (e1 - F.bc);
    const piece = [P(0, -s0, 1, s0 * e0), P(0, s1, 1, -s1 * e1), base, P(-1, 0, 0, a0), P(1, 0, 0, -a1)];
    if (F.ins > 0) { const e = F.h / F.ins; piece.push(P(-e, 0, 1, e * F.a0), P(e, 0, 1, -e * F.a1)); }   // a hip roof: its two ends
    out.push(piece);
  });
  return out;
}

/** the solids moved up by dy (the planes of a solid of a roof that lies dy higher than the frame they are used in) */
export const liftSolids = (solids, dy) => (dy ? solids.map((s) => s.map(([nx, ny, nz, d]) => [nx, ny, nz, d - ny * dy])) : solids);

/** split the convex polygon poly ([x, y, z] points) at a plane: { out (the part outside it), inside } */
function split(poly, pl) {
  const [nx, ny, nz, d] = pl, e = epsOf(pl), s = poly.map(([x, y, z]) => nx * x + ny * y + nz * z + d + e);
  if (s.every((v) => v > 0)) return { out: poly, inside: [] };
  if (s.every((v) => v <= 0)) return { out: [], inside: poly };
  const out = [], inside = [];
  poly.forEach((p, i) => {
    const j = (i + 1) % poly.length, q = poly[j];
    (s[i] > 0 ? out : inside).push(p);
    if ((s[i] > 0) !== (s[j] > 0)) {
      const u = s[i] / (s[i] - s[j]), m = [p[0] + u * (q[0] - p[0]), p[1] + u * (q[1] - p[1]), p[2] + u * (q[2] - p[2])];
      out.push(m); inside.push(m);
    }
  });
  return { out, inside };
}
const area2 = (poly) => {                                           // twice the area of a planar polygon
  let x = 0, y = 0, z = 0;
  for (let i = 1; i + 1 < poly.length; i++) {
    const a = poly[0], b = poly[i], c = poly[i + 1], u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    x += u[1] * v[2] - u[2] * v[1]; y += u[2] * v[0] - u[0] * v[2]; z += u[0] * v[1] - u[1] * v[0];
  }
  return Math.hypot(x, y, z);
};

/** the triangles tris ([x, y, z] points, 3 per triangle) without what lies inside one of the solids; every piece kept faces the way its
 *  triangle did */
export function cutTris(tris, solids) {
  if (!solids?.length) return tris;
  const res = [];
  for (let t = 0; t + 2 < tris.length; t += 3) {
    let pieces = [[tris[t], tris[t + 1], tris[t + 2]]];
    for (const solid of solids) {
      const next = [];
      for (const piece of pieces) {
        if (solid.some((pl) => piece.every(([x, y, z]) => pl[0] * x + pl[1] * y + pl[2] * z + pl[3] + epsOf(pl) > 0))) { next.push(piece); continue; }   // wholly outside
        let rest = piece;
        for (const pl of solid) {                                   // what is outside one plane is outside the solid; the rest goes on
          const { out, inside } = split(rest, pl);
          if (out.length >= 3) next.push(out);
          rest = inside;
          if (rest.length < 3) break;
        }
      }
      pieces = next;
      if (!pieces.length) break;
    }
    if (pieces.length === 1 && pieces[0].length === 3 && pieces[0][0] === tris[t]) { res.push(...pieces[0]); continue; }   // untouched
    pieces.forEach((p) => { if (area2(p) > 1e-8) for (let i = 1; i + 1 < p.length; i++) res.push(p[0], p[i], p[i + 1]); });
  }
  return res;
}
