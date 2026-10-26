/* Cabinet builder: the 3D model of a cabinet (closet.js does the maths: its parts, cut by the slopes, as faces by material). One mesh per
 * material, so a cabinet costs a handful of draw calls however many shelves it has. Used by models.js and by the 3D view of the editor. */
import * as THREE from './vendor/three.module.min.js';
import { cleanCloset, closetSolids } from './closet.js';

const METAL = { steel: ['#c4c9ce', 0.6, 0.35], black: ['#26272a', 0.3, 0.5], brass: ['#b8955a', 0.6, 0.35] };
const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05, ...extra });
const darker = (hex, k) => `#${new THREE.Color(hex).multiplyScalar(k).getHexString()}`;

/** the materials of a cabinet in its colours: body, back, plinth, front, glass, mirror, metal (handles, rails), led (glows with the entity) */
export function closetMaterials(c) {
  const [mc, metalness, roughness] = METAL[c.metal] || METAL.steel;
  return {
    body: std(c.body), back: std(darker(c.body, 0.86)), plinth: std(darker(c.body, 0.7)), front: std(c.front, { roughness: 0.45 }),
    glass: std('#cfe3ec', { roughness: 0.05, transparent: true, opacity: 0.3, depthWrite: false }),
    mirror: std('#e2eaef', { roughness: 0.1, metalness: 0.5 }), metal: std(mc, { metalness, roughness }),
    led: new THREE.MeshStandardMaterial({ color: 0xfff2cc, emissive: 0x000000, emissiveIntensity: 0, roughness: 0.4 }),
  };
}

/** a list of convex polygons as one geometry (flat shaded triangles) */
export function facesGeometry(faces) {
  const pos = [], nor = [];
  faces.forEach((f) => {
    const n = new THREE.Vector3();
    f.forEach((p, i) => { const q = f[(i + 1) % f.length]; n.x += (p[1] - q[1]) * (p[2] + q[2]); n.y += (p[2] - q[2]) * (p[0] + q[0]); n.z += (p[0] - q[0]) * (p[1] + q[1]); });
    n.normalize();
    for (let i = 1; i < f.length - 1; i++) [f[0], f[i], f[i + 1]].forEach((p) => { pos.push(p[0], p[1], p[2]); nor.push(n.x, n.y, n.z); });
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return g;
}

/** the cabinet of a device (its settings in dev.cab) into the group g; the LED light inside glows with the device's entity */
export function closetModel(g, dev) {
  const c = cleanCloset(dev?.cab), mats = closetMaterials(c), { faces } = closetSolids(c);
  Object.entries(faces).forEach(([m, list]) => {
    const mesh = new THREE.Mesh(facesGeometry(list), mats[m]);
    if (m === 'glass') mesh.renderOrder = 1;
    g.add(mesh);
  });
  if (faces.led) g.userData.glow = [mats.led];
  return g;
}
