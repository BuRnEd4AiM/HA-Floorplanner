/* ⛰ The ground on a slope in 3D (#629): the parts earth.js, yard3d.js and plateau3d.js build when the plot has spot heights (terrain.js).
 * - the lawn: its flat shape split into small triangles that follow the ground;
 * - the sides of the earth: from the ground down to the bottom, along the plot and round the house, with the soil layers starting at the
 *   ground (so the topsoil always lies on top); the face of the cut in the whole-house view the same way;
 * - a plinth under the parts of the house without a basement where the ground lies lower than the ground floor;
 * - an area of the plot (a path, a bed) that follows the ground; a line (the plot's outline) laid on the ground;
 * - the wall of a plateau from the ground up to its top (or from its top up to the ground where the slope lies higher: it holds the hill).
 * hf: the height of the ground (x, z) => h of terrain.js heightField. */
import * as THREE from './vendor/three.module.min.js';
import { splitTris, flatTris, TERRAIN } from './terrain.js';

const STEP = TERRAIN.step;

/** a flat geometry of three.js (lying in x/z at y 0) split up and laid on the ground: y = hf(x, z) + dy; with normals and uv 0 */
export function drapeGeometry(geo, hf, dy = 0) {
  const pos = geo.attributes.position, idx = geo.index;
  const flat = splitTris(flatTris(pos.array, idx ? idx.array : null), STEP);
  for (let i = 0; i < flat.length; i += 3) flat[i + 1] = hf(flat[i], flat[i + 2]) + dy;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(flat, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((flat.length / 3) * 2), 2));
  g.computeVertexNormals();
  return g;
}

/** the points along a closed ring every STEP m at most: [[x, z, u (metres along the ring)], ...] (the first point again at the end) */
function along(ring, closed = true) {
  const out = [];
  let u = 0;
  const n = closed ? ring.length : ring.length - 1;
  for (let i = 0; i < n; i++) {
    const [ax, az] = ring[i], [bx, bz] = ring[(i + 1) % ring.length], L = Math.hypot(bx - ax, bz - az), k = Math.max(1, Math.ceil(L / STEP));
    for (let j = 0; j < k; j++) out.push([ax + ((bx - ax) * j) / k, az + ((bz - az) * j) / k, u + (L * j) / k]);
    u += L;
  }
  const last = closed ? ring[0] : ring[ring.length - 1];
  out.push([last[0], last[1], u]);
  return out;
}

/** a wall of quads standing on the points pts ([[x, z, u], ...]) from lo(x, z) up to hi(x, z); uv: u along, v = y - (hi - layer) (metres,
 *  so the soil layers start at the top) */
function curtain(pts, lo, hi, layer = 0) {
  const pos = [], uv = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, az, au] = pts[i], [bx, bz, bu] = pts[i + 1];
    const a0 = lo(ax, az), a1 = hi(ax, az), b0 = lo(bx, bz), b1 = hi(bx, bz);
    if (a1 - a0 < 1e-4 && b1 - b0 < 1e-4) continue;
    const va = a1 - layer, vb = b1 - layer;
    pos.push(ax, a0, az, bx, b0, bz, bx, b1, bz, ax, a0, az, bx, b1, bz, ax, a1, az);
    uv.push(au, a0 - va, bu, b0 - vb, bu, b1 - vb, au, a0 - va, bu, b1 - vb, au, a1 - va);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

/** the sides of the earth: along every ring (the plot, the holes of the house) from `bottom` up to the ground (- 0.02); layer: how deep the
 *  soil picture reaches (its repeat is set to 1 / layer) */
export function earthSides(rings, hf, bottom, layer) {
  const parts = rings.map((r) => curtain(along(r), () => bottom, (x, z) => hf(x, z) - 0.02, layer));
  return mergeFlat(parts);
}

/** the face of the cut through the earth (earth.js cutCrossings gives the stretches [t0, t1] of the line p + t u in the earth) */
export function cutFace(px, pz, ux, uz, ts, hf, bottom, layer) {
  const parts = [];
  for (let i = 0; i + 1 < ts.length; i += 2) {
    const A = [px + ux * ts[i], pz + uz * ts[i]], B = [px + ux * ts[i + 1], pz + uz * ts[i + 1]];
    parts.push(curtain(along([A, B], false).map(([x, z, u]) => [x, z, u + ts[i]]), () => bottom, (x, z) => hf(x, z) - 0.02, layer));
  }
  return mergeFlat(parts);
}

/** one geometry of several (position, uv) */
function mergeFlat(parts) {
  const pos = [], uv = [];
  parts.forEach((g) => { pos.push(...g.attributes.position.array); uv.push(...g.attributes.uv.array); g.dispose(); });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

/** a line along the points (the plot's outline) laid on the ground, dy above it */
export function drapeLine(ring, hf, dy = 0.03) {
  return along(ring).map(([x, z]) => new THREE.Vector3(x, hf(x, z) + dy, z));
}

/** the plinth under parts of the house without a basement: from the ground floor (just under 0) down to `bottom` (the lowest ground under
 *  them, a bit deeper); rings [[x, z], ...] */
export function plinthGeometry(rings, bottom) {
  const shapes = rings.map((ring) => new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z))));
  const depth = Math.max(0.05, -0.02 - bottom);
  const g = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: false, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -0.02 - depth, 0);
  return g;
}

/** the wall of a plateau with top `top` on the ground of a slope: along its ring from the ground (a little under it) up to the top, or from
 *  the top up to the ground where the ground lies higher (upOnly: only that part, beside a bank), for plateau3d.js */
export function plateauWall(ring, hf, top, upOnly = false) {
  return curtain(along(ring), (x, z) => (upOnly ? top : Math.min(hf(x, z) - 0.04, top)), (x, z) => Math.max(hf(x, z), top), 0);
}
