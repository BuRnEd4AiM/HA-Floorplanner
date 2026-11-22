/* 🏡 The areas of the plot in 3D (#538): every area (yard, terrace, drive, bed, pond ...) a flat mesh on the ground with the pattern of its
 * surface (yard.js SURFACES, the textures of the floors: finishtex.js), the later ones a little higher so they lie on top; a pond shines.
 * Cut open with the earth (clip: the plane of earth.js) so nothing lies over the basement in the section. */
import * as THREE from './vendor/three.module.min.js';
import { SURFACES, cleanAreas, surfaceFinish, surfaceColor } from './yard.js';
import { finishMaterial } from './finishtex.js';
import { floorUVs } from './floortex.js';
import { cleanRise } from './levels.js';
import { drapeGeometry } from './terrain3d.js';
import polygonClipping from './vendor/polygon-clipping.js';

const STEP = 0.0015;                       // each later area this much higher (and drawn after): it lies on top

const v2 = ([x, z]) => new THREE.Vector2(x, -z);
const box = (r) => { const xs = r.map((p) => p[0]), zs = r.map((p) => p[1]); return [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)]; };
const meet = (a, b) => a[0] < b[1] && b[0] < a[1] && a[2] < b[3] && b[2] < a[3];
/** the shapes of an area with the light wells (rings) taken out: one shape when none lies on it */
function shapesOf(points, wells) {
  const ab = box(points), on = (wells || []).filter((r) => meet(ab, box(r)));
  if (on.length) {
    try {
      const closed = (r) => [[...r, r[0]]];
      const left = polygonClipping.difference(closed(points), ...on.map(closed));
      if (left.length) return left.map((poly) => { const sh = new THREE.Shape(poly[0].slice(0, -1).map(v2)); poly.slice(1).forEach((h) => sh.holes.push(new THREE.Path(h.slice(0, -1).map(v2)))); return sh; });
    } catch { /* keep the whole area */ }
  }
  return new THREE.Shape(points.map(v2));
}

/** lay the areas into parent. y: the height of the ground; holo: the hologram theme (only a faint colour); low: the "fast" mode (no
 *  pattern); clip: the plane that cuts the earth open, or null; hf: on a slope the height of the ground (x, z) => h (terrain.js, #629): an
 *  area follows it, a plateau stays level. wells: the outlines of the light wells (#786, lightwell3d.js): an area has a hole over them.
 *  Returns the meshes */
export function buildYards(parent, areas, { y = 0, holo = false, low = false, clip = null, hf = null, wells = [] } = {}) {
  return cleanAreas(areas).map((a, i) => {
    let geo = new THREE.ShapeGeometry(shapesOf(a.points, wells)).rotateX(-Math.PI / 2);
    if (hf && !cleanRise(a.rise)) { const flat = geo; geo = drapeGeometry(flat, hf); flat.dispose(); }
    const s = SURFACES[a.surface], fin = holo ? null : surfaceFinish(a.surface);
    let m;
    if (holo) m = new THREE.MeshBasicMaterial({ color: surfaceColor(a.surface), transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
    else if (s.water) m = new THREE.MeshStandardMaterial({ color: s.color, roughness: 0.06, metalness: 0.2, transparent: true, opacity: 0.9 });
    else { floorUVs(geo, fin, a.points); m = finishMaterial(fin, low); }
    m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -1 - i;
    if (clip) m.clippingPlanes = [clip];
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.y = y + i * STEP + (a.rise || 0);              // a plateau: its surface lies on top (plateau3d.js, #566)
    mesh.renderOrder = i;
    mesh.receiveShadow = true;
    mesh.userData.yard = a.id;
    parent.add(mesh);
    return mesh;
  });
}
