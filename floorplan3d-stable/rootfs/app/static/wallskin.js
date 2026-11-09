/* Wall finishes in 3D (#448): a thin skin just in front of each face of a wall that has a finish (finishes.js wallSkins: the room on that
 * side, below a height another one, the facade outside, an accent wall), on the solid parts of the wall only (doors and windows stay
 * open), as part of the wall group: it sinks and fades with the wall (cutaway.js), is cut at the roof and in the half section, and a tap on
 * it picks the wall. One mesh per finish and wall. */
import * as THREE from './vendor/three.module.min.js';
import { skinQuads, wallUV, texKey } from './finishes.js';
import { finishMaterial } from './finishtex.js';

const LIFT = 0.002;                                  // 2 mm in front of the face of the wall

/** add the finishes to wall group g (built by walls.js, local x along the wall from -len/2, z across). pieces: its solid parts { x0, x1,
 *  y0, y1 }; skins: finishes.js wallSkins; t: thickness; fast: one colour, no pictures. Returns the number of meshes added. */
export function dressWall(g, pieces, skins, { t, len, fast = false }) {
  const groups = new Map();
  skinQuads(pieces, skins, len).forEach((q) => {
    const k = `${texKey(q.fin)}|${q.fin.rough}`;
    if (!groups.has(k)) groups.set(k, { fin: q.fin, list: [] });
    groups.get(k).list.push(q);
  });
  groups.forEach(({ fin, list }) => {
    const pos = [], nor = [], uv = [], idx = [];
    list.forEach((q) => {
      const z = q.side * (t / 2 + LIFT), n = pos.length / 3;
      const corners = [[q.x0, q.y0], [q.x1, q.y0], [q.x1, q.y1], [q.x0, q.y1]];
      corners.forEach(([x, y]) => {
        pos.push(x, y, z); nor.push(0, 0, q.side);
        const [u, v] = wallUV(q.fin, q.side, x + len / 2, y);
        uv.push(u, v);
      });
      if (q.side > 0) idx.push(n, n + 1, n + 2, n, n + 2, n + 3); else idx.push(n, n + 2, n + 1, n, n + 3, n + 2);   // the front faces the room
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    const m = new THREE.Mesh(geo, finishMaterial(fin, fast));
    m.receiveShadow = true;
    m.userData.skin = fin.key;                       // never merged with the wall (meshmerge.js), a tap goes on to the wall group
    g.add(m);
  });
  return groups.size;
}
