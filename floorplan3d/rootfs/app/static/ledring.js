/* LED ring: one LED strip made of several straight sections (polyline, open or closed), e.g. a cove light all around a room
   under the ceiling. Every section can drive its own Home Assistant light; a section without one uses the ring's main entity.
   Data on the device: pts = [[x, z], ...] relative to (d.x, d.z), closed = true|false, segs = [{ entity }] one per section, inset (m). */

export const RING_DEFAULT_INSET = 0.15;

/** number of straight sections */
export const ringCount = (d) => { const n = (d.pts || []).length; return n < 2 ? 0 : d.closed === false ? n - 1 : n; };

/** entity that drives section i (its own one, otherwise the main entity of the ring) */
export const segEntity = (d, i) => d.segs?.[i]?.entity || d.entity || '';

/** every entity the ring uses, without duplicates */
export const ringEntities = (d) => [...new Set(Array.from({ length: ringCount(d) }, (_, i) => segEntity(d, i)).filter(Boolean))];

/** one section's points in device space (before scale, mirror and rotation) */
export function ringLocalEdges(d) {
  const p = d.pts || [], n = ringCount(d);
  return Array.from({ length: n }, (_, i) => ({ i, a: p[i], b: p[(i + 1) % p.length] }));
}

/** sections in floor coordinates, following the device's position, rotation, size and mirror (like the 3D model) */
export function ringEdges(d) {
  const a = ((d.rot || 0) * Math.PI) / 180, cs = Math.cos(a), sn = Math.sin(a), k = d.scale || 1;
  const kx = k * (d.sx || 1) * (d.mirror ? -1 : 1), kz = k * (d.sz || 1);
  const W = ([px, pz]) => { const lx = px * kx, lz = pz * kz; return [d.x + lx * cs + lz * sn, d.z - lx * sn + lz * cs]; };
  return ringLocalEdges(d).map(({ i, a: pa, b: pb }) => {
    const A = W(pa), B = W(pb);
    return { i, a: A, b: B, mid: [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], len: Math.hypot(B[0] - A[0], B[1] - A[1]) };
  });
}

const signedArea = (p) => p.reduce((s, [x, z], i) => { const [x2, z2] = p[(i + 1) % p.length]; return s + x * z2 - x2 * z; }, 0) / 2;

/** polygon moved inwards by `dist` metres (every edge shifted parallel, corners re-intersected); straight corners are dropped */
export function insetPoly(points, dist) {
  const p = points.filter((q, i) => { const r = points[(i + 1) % points.length]; return Math.hypot(r[0] - q[0], r[1] - q[1]) > 1e-6; });
  const n = p.length;
  if (n < 3 || !dist) return p.map((q) => [...q]);
  const sgn = signedArea(p) > 0 ? 1 : -1;                    // inward normal side depends on the winding
  const lines = p.map((q, i) => {
    const r = p[(i + 1) % n], L = Math.hypot(r[0] - q[0], r[1] - q[1]);
    const ux = (r[0] - q[0]) / L, uz = (r[1] - q[1]) / L, nx = -uz * sgn, nz = ux * sgn;
    return { px: q[0] + nx * dist, pz: q[1] + nz * dist, ux, uz };
  });
  const out = [];
  for (let i = 0; i < n; i++) {
    const l1 = lines[(i - 1 + n) % n], l2 = lines[i];
    const den = l1.ux * l2.uz - l1.uz * l2.ux;
    if (Math.abs(den) < 1e-6) continue;                      // straight corner: the two sections become one
    const t = ((l2.px - l1.px) * l2.uz - (l2.pz - l1.pz) * l2.ux) / den;
    out.push([l1.px + l1.ux * t, l1.pz + l1.uz * t]);
  }
  return out.length >= 3 ? out : p.map((q) => [...q]);
}

/** ring along a room's walls: centre, points relative to it, one empty section per wall */
export function ringFromRoom(points, inset = RING_DEFAULT_INSET) {
  const poly = insetPoly(points, inset);
  const cx = poly.reduce((s, q) => s + q[0], 0) / poly.length, cz = poly.reduce((s, q) => s + q[1], 0) / poly.length;
  const r = (v) => Math.round(v * 1000) / 1000;
  return { x: r(cx), z: r(cz), pts: poly.map(([x, z]) => [r(x - cx), r(z - cz)]), closed: true, segs: poly.map(() => ({})) };
}

/** keep one section entry per section after the shape changed */
export function fitSegs(d) {
  const n = ringCount(d), s = (d.segs || []).slice(0, n);
  while (s.length < n) s.push({});
  d.segs = s;
}
