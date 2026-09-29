import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';

/* Geräte-Typen: label, Standardhöhe (y) über dem Boden. Alle Maße in Metern. */
export const DEVICE_TYPES = {
  light:      { label: 'Deckenlampe', y: 2.55 },
  lamp:       { label: 'Stehlampe',   y: 0 },
  switch:     { label: 'Schalter',    y: 1.1 },
  sensor:     { label: 'Sensor',      y: 1.8 },
  thermostat: { label: 'Heizung',     y: 0.2 },
  tv:         { label: 'TV',          y: 0.5 },
  sofa:       { label: 'Sofa',        y: 0 },
  bed:        { label: 'Bett',        y: 0 },
  table:      { label: 'Tisch',       y: 0 },
  door:       { label: 'Tür',         y: 0, hidden: true },     // legacy: doors/windows are wall openings now
  window:     { label: 'Fenster',     y: 0.9, hidden: true },
  plant:      { label: 'Pflanze',     y: 0 },
};

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05, ...extra });

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y + h / 2, z);
  return m;
}
function cyl(rt, rb, h, material, x = 0, y = 0, z = 0, seg = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  m.position.set(x, y + h / 2, z);
  return m;
}
function glowMat(color = 0xfff2cc) {
  return new THREE.MeshStandardMaterial({ color, emissive: 0x000000, emissiveIntensity: 0, roughness: 0.4 });
}

const builders = {
  light(g) {
    const glow = glowMat();
    g.add(cyl(0.03, 0.03, 0.25, std('#555'), 0, 0.05, 0, 8));
    const shade = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), glow);
    shade.rotation.x = Math.PI;
    shade.position.y = 0.05;
    g.add(shade);
    g.userData.glow = [glow];
  },
  lamp(g) {
    const glow = glowMat();
    g.add(cyl(0.18, 0.2, 0.03, std('#333')));
    g.add(cyl(0.015, 0.015, 1.4, std('#333'), 0, 0.03, 0, 8));
    g.add(cyl(0.12, 0.2, 0.28, glow, 0, 1.4));
    g.userData.glow = [glow];
  },
  switch(g) {
    g.add(box(0.08, 0.08, 0.02, std('#f2f2f2'), 0, -0.04, 0));
    g.add(box(0.03, 0.03, 0.01, std('#888'), 0, -0.015, 0.015));
  },
  sensor(g) {
    const glow = glowMat(0x9fe8ff);
    g.add(box(0.07, 0.07, 0.04, std('#eee'), 0, -0.035, 0));
    g.add(cyl(0.015, 0.015, 0.012, glow, 0, -0.02, 0.03, 12).rotateX(Math.PI / 2));
    g.userData.glow = [glow];
  },
  thermostat(g) {
    const glow = glowMat(0xff9a5c);
    g.add(box(0.9, 0.6, 0.08, std('#f4f4f4')));
    for (let i = 0; i < 6; i++) g.add(box(0.03, 0.5, 0.02, std('#dcdcdc'), -0.36 + i * 0.145, 0.05, 0.05));
    g.add(box(0.06, 0.04, 0.01, glow, 0.38, 0.5, 0.045));
    g.userData.glow = [glow];
  },
  tv(g) {
    const glow = glowMat(0x9db8ff);
    g.add(box(1.2, 0.5, 0.45, std('#5a4630'), 0, -0.5, 0));       // Lowboard
    g.add(box(1.1, 0.65, 0.04, std('#111'), 0, 0.02, 0));
    g.add(box(1.04, 0.59, 0.01, glow, 0, 0.05, 0.025));
    g.add(box(0.2, 0.03, 0.15, std('#222'), 0, 0, 0));
    g.userData.glow = [glow];
  },
  sofa(g) {
    const c = std('#6b7a8f');
    g.add(box(2.0, 0.4, 0.9, c));
    g.add(box(2.0, 0.5, 0.2, c, 0, 0.4, -0.35));
    g.add(box(0.2, 0.25, 0.7, c, -0.9, 0.4, 0.1));
    g.add(box(0.2, 0.25, 0.7, c, 0.9, 0.4, 0.1));
  },
  bed(g) {
    g.add(box(1.6, 0.3, 2.0, std('#8b6b4a')));
    g.add(box(1.5, 0.2, 1.9, std('#e8e6df'), 0, 0.3, 0.02));
    g.add(box(1.6, 0.9, 0.08, std('#8b6b4a'), 0, 0, -1.0));
    g.add(box(0.55, 0.12, 0.35, std('#fff'), -0.38, 0.5, -0.75));
    g.add(box(0.55, 0.12, 0.35, std('#fff'), 0.38, 0.5, -0.75));
  },
  table(g) {
    const wood = std('#a07b52');
    g.add(box(1.4, 0.05, 0.8, wood, 0, 0.72, 0));
    [[-0.63, -0.33], [0.63, -0.33], [-0.63, 0.33], [0.63, 0.33]].forEach(([x, z]) => g.add(box(0.06, 0.72, 0.06, wood, x, 0, z)));
  },
  door(g) {
    g.add(box(0.95, 2.05, 0.05, std('#8a6a48'), 0, 0, 0));
    g.add(box(1.05, 0.05, 0.1, std('#d0d0d0'), 0, 2.05, 0));
    g.add(cyl(0.02, 0.02, 0.12, std('#bbb'), 0.38, 1.0, 0.05, 8).rotateX(Math.PI / 2));
  },
  window(g) {
    const glass = new THREE.MeshStandardMaterial({ color: 0x9cc9ee, transparent: true, opacity: 0.45, roughness: 0.1 });
    const frame = std('#f2f2f2');
    g.add(box(1.2, 1.2, 0.02, glass));
    g.add(box(1.28, 0.05, 0.1, frame, 0, 0, 0));
    g.add(box(1.28, 0.05, 0.1, frame, 0, 1.2, 0));
    g.add(box(0.05, 1.2, 0.1, frame, -0.6, 0, 0));
    g.add(box(0.05, 1.2, 0.1, frame, 0.6, 0, 0));
    g.add(box(0.04, 1.2, 0.08, frame, 0, 0, 0));
  },
  plant(g) {
    g.add(cyl(0.16, 0.12, 0.3, std('#b4633c')));
    const leaf = std('#3f8f4a');
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.18 + (i % 2) * 0.05, 10, 8), leaf);
      const a = (i / 5) * Math.PI * 2;
      s.position.set(Math.cos(a) * 0.12, 0.6 + (i % 3) * 0.15, Math.sin(a) * 0.12);
      g.add(s);
    }
  },
};

/* ---------- custom GLB models ---------- */
const loader = new GLTFLoader();
const glbCache = new Map();          // name -> Promise<Object3D> (normalised template)

function loadGlb(name) {
  if (!glbCache.has(name)) {
    glbCache.set(name, loader.loadAsync(`api/models/${encodeURIComponent(name)}`).then((gltf) => {
      const root = gltf.scene;
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      const k = 1 / (Math.max(size.x, size.y, size.z) || 1);      // fit into a 1 m cube, user scales further
      const wrap = new THREE.Group();
      root.scale.multiplyScalar(k);
      const b2 = new THREE.Box3().setFromObject(root);
      root.position.set(-(b2.min.x + b2.max.x) / 2, -b2.min.y, -(b2.min.z + b2.max.z) / 2);
      wrap.add(root);
      return wrap;
    }).catch((err) => { glbCache.delete(name); throw err; }));
  }
  return glbCache.get(name);
}
export function forgetGlb(name) { glbCache.delete(name); }

export function isCustom(type) { return typeof type === 'string' && type.startsWith('glb:'); }

/** Build a device model. For custom models a placeholder is shown until the GLB has loaded;
 *  `onReady` is called afterwards so the caller can refresh shadows/selection helpers. */
export function makeModel(type, onReady) {
  const g = new THREE.Group();
  if (isCustom(type)) {
    const ph = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x888888, transparent: true, opacity: 0.4, wireframe: true }));
    ph.position.y = 0.25;
    g.add(ph);
    loadGlb(type.slice(4)).then((tpl) => {
      g.remove(ph);
      const inst = tpl.clone(true);
      inst.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      g.add(inst);
      onReady?.(g);
    }).catch(() => { ph.material.color.set(0xff5555); });
    return g;
  }
  (builders[type] || builders.sensor)(g);
  return g;
}
