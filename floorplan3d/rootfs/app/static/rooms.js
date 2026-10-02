/* Automatic room detection (#17): every closed loop of walls becomes a room.
 * Pure geometry, no DOM: the walls of a floor go in, polygons of the closed areas come out.
 *
 * Steps: split the walls where they meet or cross (T-junctions too), build a graph of the wall centre lines, drop dead ends,
 * walk all faces of that planar graph, throw away the outer face and tiny areas, and skip what already is a room. */

const EPS = 0.02;                                   // points closer than 2 cm are the same corner
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);

/** signed area (shoelace): > 0 for the faces that are rooms (see `faces`) */
export function signedArea(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) { const [x1, z1] = pts[i], [x2, z2] = pts[(i + 1) % pts.length]; s += x1 * z2 - x2 * z1; }
  return s / 2;
}

export function pointInPoly(x, z, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/** distance of p from segment a-b and the parameter (0..1) of the closest point */
function onSegment(p, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1e-12;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / L2));
  return { d: dist(p, [a[0] + dx * t, a[1] + dz * t]), t };
}

/** a point that really lies inside the polygon (the centroid may fall outside an L shape) */
export function interiorPoint(pts) {
  const zs = pts.map((p) => p[1]), z0 = Math.min(...zs), z1 = Math.max(...zs);
  for (const f of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8]) {
    const z = z0 + (z1 - z0) * f, xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [xa, za] = pts[i], [xb, zb] = pts[(i + 1) % pts.length];
      if ((za > z) !== (zb > z)) xs.push(xa + ((z - za) * (xb - xa)) / (zb - za));
    }
    xs.sort((p, q) => p - q);
    let best = null;
    for (let i = 0; i + 1 < xs.length; i += 2) if (!best || xs[i + 1] - xs[i] > best[1] - best[0]) best = [xs[i], xs[i + 1]];
    if (best && best[1] - best[0] > 0.05) return [(best[0] + best[1]) / 2, z];
  }
  return pts[0];
}

/** graph of the wall centre lines: nodes = corners and junctions, edges = wall pieces between them */
export function wallGraph(walls) {
  const segs = walls.filter((w) => dist(w.a, w.b) > 0.01).map((w) => [w.a, w.b]);
  const cuts = segs.map(([a, b]) => [{ t: 0, p: a }, { t: 1, p: b }]);       // points on each segment where it is split
  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      const [a, b] = segs[i], [c, d] = segs[j];
      const rx = b[0] - a[0], rz = b[1] - a[1], sx = d[0] - c[0], sz = d[1] - c[1];
      const den = rx * sz - rz * sx;
      if (Math.abs(den) > 1e-9) {                                           // crossing (or meeting) lines
        const t = ((c[0] - a[0]) * sz - (c[1] - a[1]) * sx) / den, u = ((c[0] - a[0]) * rz - (c[1] - a[1]) * rx) / den;
        const tol1 = EPS / Math.hypot(rx, rz), tol2 = EPS / Math.hypot(sx, sz);
        if (t >= -tol1 && t <= 1 + tol1 && u >= -tol2 && u <= 1 + tol2) {
          const tt = Math.max(0, Math.min(1, t)), uu = Math.max(0, Math.min(1, u));
          cuts[i].push({ t: tt, p: [a[0] + rx * tt, a[1] + rz * tt] });
          cuts[j].push({ t: uu, p: [c[0] + sx * uu, c[1] + sz * uu] });
        }
      }
      for (const [p, k, seg] of [[c, i, [a, b]], [d, i, [a, b]], [a, j, [c, d]], [b, j, [c, d]]]) {   // an end lying on the other wall (T-junction, collinear walls)
        const o = onSegment(p, seg[0], seg[1]);
        if (o.d < EPS) cuts[k].push({ t: o.t, p });
      }
    }
  }
  const nodes = [];
  const nodeOf = (p) => {
    let i = nodes.findIndex((q) => dist(p, q) < EPS);
    if (i < 0) { nodes.push([p[0], p[1]]); i = nodes.length - 1; }
    return i;
  };
  const edges = new Set();
  cuts.forEach((list) => {
    list.sort((p, q) => p.t - q.t);
    const ids = list.map((c) => nodeOf(c.p));
    for (let k = 0; k + 1 < ids.length; k++) if (ids[k] !== ids[k + 1]) edges.add(ids[k] < ids[k + 1] ? `${ids[k]}:${ids[k + 1]}` : `${ids[k + 1]}:${ids[k]}`);
  });
  const adj = nodes.map(() => new Set());
  edges.forEach((e) => { const [u, v] = e.split(':').map(Number); adj[u].add(v); adj[v].add(u); });
  return { nodes, adj };
}

/** every closed face of the wall graph as a polygon (list of [x, z]) */
export function faces(walls) {
  const { nodes, adj } = wallGraph(walls);
  let dead = true;
  while (dead) {                                                           // walls that end nowhere do not close anything
    dead = false;
    adj.forEach((s, u) => { if (s.size === 1) { const [v] = s; adj[v].delete(u); s.clear(); dead = true; } });
  }
  const order = adj.map((s, u) => [...s].sort((p, q) => Math.atan2(nodes[p][1] - nodes[u][1], nodes[p][0] - nodes[u][0]) - Math.atan2(nodes[q][1] - nodes[u][1], nodes[q][0] - nodes[u][0])));
  const seen = new Set(), out = [];
  adj.forEach((s, u0) => s.forEach((v0) => {
    if (seen.has(`${u0}>${v0}`)) return;
    const ring = [];
    let u = u0, v = v0, guard = 0;
    while (!seen.has(`${u}>${v}`) && guard++ < 10000) {
      seen.add(`${u}>${v}`);
      ring.push(u);
      const nb = order[v], i = nb.indexOf(u);
      const w = nb[(i - 1 + nb.length) % nb.length];                       // turn to the next wall around the face
      u = v; v = w;
    }
    if (ring.length >= 3) out.push(ring.map((i) => nodes[i]));
  }));
  return out;
}

/** drop corner points that lie on a straight line (junctions of T-walls) */
export function simplify(pts) {
  let out = pts.slice(), changed = true;
  while (changed && out.length > 3) {
    changed = false;
    for (let i = 0; i < out.length; i++) {
      const a = out[(i - 1 + out.length) % out.length], b = out[i], c = out[(i + 1) % out.length];
      if (onSegment(b, a, c).d < 0.01) { out.splice(i, 1); changed = true; break; }
    }
  }
  return out;
}

/**
 * The rooms to create: closed areas of the walls that are not a room yet.
 * `existing`: rooms already on the floor ({ points }); `minArea` in m².
 */
export function detectRooms(walls, existing = [], { minArea = 0.5 } = {}) {
  const rooms = [];
  for (const f of faces(walls)) {
    const poly = simplify(f);
    if (poly.length < 3) continue;
    const area = signedArea(poly);
    if (area < minArea) continue;                                          // the outer face runs the other way round; slivers are no rooms
    const [x, z] = interiorPoint(poly);
    if (existing.some((r) => pointInPoly(x, z, r.points))) continue;       // already a room there
    rooms.push({ points: poly.map(([px, pz]) => [+px.toFixed(3), +pz.toFixed(3)]), area });
  }
  return rooms.sort((p, q) => p.points[0][1] - q.points[0][1] || p.points[0][0] - q.points[0][0]);
}
