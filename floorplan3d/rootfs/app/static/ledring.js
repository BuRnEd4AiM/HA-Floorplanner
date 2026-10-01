/* LED ring: an LED band along a path (polyline, open or closed), e.g. a cove light all around a room under the ceiling.
   The band is split into sections, every section can drive its own Home Assistant light; a section without one uses the
   ring's main entity.
   Data on the device: pts = [[x, z], ...] relative to (d.x, d.z), closed = true|false, inset (m),
   segs = [{ entity, from, to }]: from / to are metres along the path, counted from the first point.
   Without from / to (older rings, "one per wall") every wall of the path is one section. */

export const RING_DEFAULT_INSET = 0.15;
export const RING_MIN_SECTION = 0.05;                         // shortest section (m)

const r3 = (v) => Math.round(v * 1000) / 1000;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** number of walls (straight pieces) of the path */
export const edgeCount = (d) => { const n = (d.pts || []).length; return n < 2 ? 0 : d.closed === false ? n - 1 : n; };

/** the path's walls in device space, each with its start (s0) along the path */
export function pathEdges(d) {
  const p = d.pts || [];
  let s = 0;
  return Array.from({ length: edgeCount(d) }, (_, i) => {
    const a = p[i], b = p[(i + 1) % p.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const e = { i, a, b, s0: s, len };
    s += len;
    return e;
  });
}
export const pathLength = (d) => pathEdges(d).reduce((s, e) => s + e.len, 0);

const pointOnEdge = (e, s) => { const t = e.len ? clamp((s - e.s0) / e.len, 0, 1) : 0; return [e.a[0] + (e.b[0] - e.a[0]) * t, e.a[1] + (e.b[1] - e.a[1]) * t]; };

/** point at `s` metres along the path (device space) */
export function pointAt(d, s) {
  const E = pathEdges(d);
  if (!E.length) return [0, 0];
  return pointOnEdge(E.find((q) => s <= q.s0 + q.len) || E[E.length - 1], s);
}

/** straight pieces of the path between from and to (a section around a corner has two or more) */
export function piecesLocal(d, from, to) {
  return pathEdges(d).flatMap((e) => {
    const a = Math.max(from, e.s0), b = Math.min(to, e.s0 + e.len);
    return b - a > 1e-6 ? [[pointOnEdge(e, a), pointOnEdge(e, b)]] : [];
  });
}

/** true when the sections have their own start / end (instead of one per wall) */
export const hasRanges = (d) => (d.segs || []).some((sg) => typeof sg?.from === 'number' && typeof sg?.to === 'number');

/** the sections: [{ i, from, to }] in metres along the path */
export function ringSections(d) {
  const L = pathLength(d);
  if (hasRanges(d)) {
    return d.segs.map((sg, i) => {
      const from = clamp(+sg.from || 0, 0, L), to = clamp(typeof sg.to === 'number' ? sg.to : L, from, L);
      return { i, from, to };
    });
  }
  return pathEdges(d).map((e) => ({ i: e.i, from: e.s0, to: e.s0 + e.len }));
}
export const ringCount = (d) => ringSections(d).length;

/** entity that drives section i (its own one, otherwise the main entity of the ring) */
export const segEntity = (d, i) => d.segs?.[i]?.entity || d.entity || '';

/** every entity the ring uses, without duplicates */
export const ringEntities = (d) => [...new Set(Array.from({ length: ringCount(d) }, (_, i) => segEntity(d, i)).filter(Boolean))];

/* ---- device space <-> floor coordinates (like the 3D model: scale, mirror, then turn about y) ---- */
function frame(d) {
  const a = ((d.rot || 0) * Math.PI) / 180, k = d.scale || 1;
  return { cs: Math.cos(a), sn: Math.sin(a), kx: k * (d.sx || 1) * (d.mirror ? -1 : 1), kz: k * (d.sz || 1) };
}
export function toWorld(d, [px, pz]) {
  const { cs, sn, kx, kz } = frame(d), lx = px * kx, lz = pz * kz;
  return [d.x + lx * cs + lz * sn, d.z - lx * sn + lz * cs];
}
function toLocal(d, x, z) {
  const { cs, sn, kx, kz } = frame(d), dx = x - d.x, dz = z - d.z;
  return [(dx * cs - dz * sn) / (kx || 1), (dx * sn + dz * cs) / (kz || 1)];
}

/** the path's walls in floor coordinates */
export function pathWorld(d) {
  return pathEdges(d).map((e) => ({ i: e.i, a: toWorld(d, e.a), b: toWorld(d, e.b), s0: e.s0, len: e.len }));
}

/** sections in floor coordinates: pieces to draw, middle point and length */
export function ringSectionsWorld(d) {
  return ringSections(d).map((sc) => ({
    ...sc, len: sc.to - sc.from,
    pieces: piecesLocal(d, sc.from, sc.to).map(([a, b]) => [toWorld(d, a), toWorld(d, b)]),
    mid: toWorld(d, pointAt(d, (sc.from + sc.to) / 2)),
    ends: [toWorld(d, pointAt(d, sc.from)), toWorld(d, pointAt(d, sc.to))],
  }));
}

/** metres along the path of the path point nearest to (x, z) (floor coordinates) */
export function projectOnPath(d, x, z) {
  const [px, pz] = toLocal(d, x, z);
  let best = 0, bd = Infinity;
  pathEdges(d).forEach((e) => {
    const dx = e.b[0] - e.a[0], dz = e.b[1] - e.a[1], L2 = dx * dx + dz * dz || 1e-9;
    const t = clamp(((px - e.a[0]) * dx + (pz - e.a[1]) * dz) / L2, 0, 1);
    const dd = Math.hypot(px - (e.a[0] + dx * t), pz - (e.a[1] + dz * t));
    if (dd < bd) { bd = dd; best = e.s0 + t * e.len; }
  });
  return best;
}

/* ---- editing the sections (all keep the lights of the sections by their number) ---- */
const keepEntity = (d, i) => (d.segs?.[i]?.entity ? { entity: d.segs[i].entity } : {});

/** sections with their own start / end, taken over from the current ones */
export function makeRanges(d) {
  if (hasRanges(d)) return;
  d.segs = ringSections(d).map((sc) => ({ ...keepEntity(d, sc.i), from: r3(sc.from), to: r3(sc.to) }));
}
/** n sections of equal length along the whole path */
export function splitEven(d, n) {
  const L = pathLength(d), cnt = clamp(Math.round(n) || 1, 1, Math.max(1, Math.floor(L / RING_MIN_SECTION)));
  d.segs = Array.from({ length: cnt }, (_, i) => ({ ...keepEntity(d, i), from: r3((L * i) / cnt), to: r3((L * (i + 1)) / cnt) }));
}
/** back to one section per wall */
export function perWall(d) {
  d.segs = pathEdges(d).map((e) => keepEntity(d, e.i));
}
/** cut section i in the middle; the new second half has no light of its own yet */
export function splitSection(d, i) {
  makeRanges(d);
  const sg = d.segs[i];
  if (!sg || sg.to - sg.from < 2 * RING_MIN_SECTION) return;
  const m = r3((sg.from + sg.to) / 2);
  d.segs.splice(i + 1, 0, { from: m, to: sg.to });
  sg.to = m;
}
export function removeSection(d, i) {
  if (ringCount(d) <= 1) return;
  makeRanges(d);
  d.segs.splice(i, 1);
}
/** set start and / or end of section i (metres along the path), kept inside the path and at least 5 cm long */
export function setRange(d, i, from, to) {
  makeRanges(d);
  const sg = d.segs[i], L = pathLength(d);
  if (!sg) return;
  let f = from ?? sg.from, t = to ?? sg.to;
  if (from != null) f = clamp(f, 0, Math.max(0, t - RING_MIN_SECTION));
  if (to != null) t = clamp(t, Math.min(L, f + RING_MIN_SECTION), L);
  sg.from = r3(f); sg.to = r3(t);
}

/** keep the sections valid after the shape changed */
export function fitSegs(d) {
  if (hasRanges(d)) {
    const L = pathLength(d);
    d.segs = d.segs.filter((sg) => typeof sg.from === 'number' && sg.from < L - 1e-6).map((sg) => ({ ...sg, to: r3(Math.min(L, sg.to)) }));
    if (!d.segs.length) perWall(d);
    return;
  }
  const n = edgeCount(d), s = (d.segs || []).slice(0, n);
  while (s.length < n) s.push({});
  d.segs = s;
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
    if (Math.abs(den) < 1e-6) continue;                      // straight corner: the two walls become one
    const t = ((l2.px - l1.px) * l2.uz - (l2.pz - l1.pz) * l2.ux) / den;
    out.push([l1.px + l1.ux * t, l1.pz + l1.uz * t]);
  }
  return out.length >= 3 ? out : p.map((q) => [...q]);
}

/** ring along a room's walls: centre, points relative to it, one empty section per wall */
export function ringFromRoom(points, inset = RING_DEFAULT_INSET) {
  const poly = insetPoly(points, inset);
  const cx = poly.reduce((s, q) => s + q[0], 0) / poly.length, cz = poly.reduce((s, q) => s + q[1], 0) / poly.length;
  return { x: r3(cx), z: r3(cz), pts: poly.map(([x, z]) => [r3(x - cx), r3(z - cz)]), closed: true, segs: poly.map(() => ({})) };
}
