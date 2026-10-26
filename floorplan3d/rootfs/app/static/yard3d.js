/* 🏡 The areas of the plot in 3D (#538): every area (yard, terrace, drive, bed, pond ...) a flat mesh on the ground with the pattern of its
 * surface (yard.js SURFACES, the textures of the floors: finishtex.js), the later ones a little higher so they lie on top; a pond shines.
 * Cut open with the earth (clip: the plane of earth.js) so nothing lies over the basement in the section. */
import * as THREE from './vendor/three.module.min.js';
import { SURFACES, cleanAreas, surfaceFinish, surfaceColor } from './yard.js';
import { finishMaterial } from './finishtex.js';
import { floorUVs } from './floortex.js';

const STEP = 0.0015;                       // each later area this much higher (and drawn after): it lies on top

/** lay the areas into parent. y: the height of the ground; holo: the hologram theme (only a faint colour); low: the "fast" mode (no
 *  pattern); clip: the plane that cuts the earth open, or null. Returns the meshes */
export function buildYards(parent, areas, { y = 0, holo = false, low = false, clip = null } = {}) {
  return cleanAreas(areas).map((a, i) => {
    const geo = new THREE.ShapeGeometry(new THREE.Shape(a.points.map(([x, z]) => new THREE.Vector2(x, -z)))).rotateX(-Math.PI / 2);
    const s = SURFACES[a.surface], fin = holo ? null : surfaceFinish(a.surface);
    let m;
    if (holo) m = new THREE.MeshBasicMaterial({ color: surfaceColor(a.surface), transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
    else if (s.water) m = new THREE.MeshStandardMaterial({ color: s.color, roughness: 0.06, metalness: 0.2, transparent: true, opacity: 0.9 });
    else { floorUVs(geo, fin, a.points); m = finishMaterial(fin, low); }
    m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -1 - i;
    if (clip) m.clippingPlanes = [clip];
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.y = y + i * STEP;
    mesh.renderOrder = i;
    mesh.receiveShadow = true;
    mesh.userData.yard = a.id;
    parent.add(mesh);
    return mesh;
  });
}
