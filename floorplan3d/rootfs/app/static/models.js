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
  chair:      { label: 'Stuhl',       y: 0 },
  armchair:   { label: 'Sessel',      y: 0 },
  desk:       { label: 'Schreibtisch', y: 0 },
  diningtable:{ label: 'Esstisch',    y: 0 },
  coffeetable:{ label: 'Couchtisch',  y: 0 },
  wardrobe:   { label: 'Schrank',     y: 0 },
  shelf:      { label: 'Regal',       y: 0 },
  sideboard:  { label: 'Sideboard',   y: 0 },
  kitchen:    { label: 'Küchenzeile', y: 0 },
  fridge:     { label: 'Kühlschrank', y: 0 },
  washer:     { label: 'Waschmaschine', y: 0 },
  bathtub:    { label: 'Badewanne',   y: 0 },
  toilet:     { label: 'WC',          y: 0 },
  basin:      { label: 'Waschtisch',  y: 0 },
  shower:     { label: 'Dusche',      y: 0 },
  carpet:     { label: 'Teppich',     y: 0 },
  car:        { label: 'Auto',        y: 0 },
  tree:       { label: 'Baum',        y: 0 },
  bush:       { label: 'Busch',       y: 0 },
  pool:       { label: 'Pool',        y: 0 },
  lawn:       { label: 'Rasen',       y: 0 },
  terrace:    { label: 'Terrasse',    y: 0 },
  path:       { label: 'Weg',         y: 0 },
  fence:      { label: 'Zaun',        y: 0 },
  orb:        { label: 'Lichtkugel',  y: 0.4 },
  strip:      { label: 'LED-Streifen', y: 0.5 },
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
  orb(g) {                      // glowing ball: one spot of an LED strip / accent light
    const glow = glowMat();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 14), glow));
    g.userData.glow = [glow];
  },
  strip(g) {                    // 1 m LED strip, scale it to the real length
    const glow = glowMat();
    g.add(box(1, 0.025, 0.025, glow, 0, -0.0125, 0));
    g.userData.glow = [glow];
  },
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

Object.assign(builders, {
  chair(g) {
    const w = std('#a07b52');
    g.add(box(0.42, 0.05, 0.42, w, 0, 0.45, 0));
    [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([x, z]) => g.add(box(0.04, 0.45, 0.04, w, x, 0, z)));
    g.add(box(0.42, 0.45, 0.04, w, 0, 0.5, -0.2));
  },
  armchair(g) {
    const c = std('#7a6b8f');
    g.add(box(0.9, 0.4, 0.85, c));
    g.add(box(0.9, 0.45, 0.2, c, 0, 0.4, -0.33));
    g.add(box(0.16, 0.25, 0.65, c, -0.37, 0.4, 0.08));
    g.add(box(0.16, 0.25, 0.65, c, 0.37, 0.4, 0.08));
  },
  desk(g) {
    const w = std('#b08a5c');
    g.add(box(1.4, 0.04, 0.7, w, 0, 0.73, 0));
    g.add(box(0.05, 0.73, 0.65, w, -0.65, 0, 0));
    g.add(box(0.4, 0.6, 0.6, std('#9a7548'), 0.45, 0.13, 0));
    const glow = glowMat(0x9db8ff);
    g.add(box(0.55, 0.32, 0.02, std('#111'), 0, 0.85, -0.2));
    g.add(box(0.5, 0.27, 0.01, glow, 0, 0.875, -0.19));
    g.userData.glow = [glow];
  },
  diningtable(g) {
    const wood = std('#a07b52');
    g.add(box(1.8, 0.05, 0.95, wood, 0, 0.72, 0));
    [[-0.82, -0.4], [0.82, -0.4], [-0.82, 0.4], [0.82, 0.4]].forEach(([x, z]) => g.add(box(0.06, 0.72, 0.06, wood, x, 0, z)));
    const cw = std('#6f5a40');
    [-0.5, 0.5].forEach((x) => [-0.62, 0.62].forEach((z) => {
      g.add(box(0.4, 0.04, 0.4, cw, x, 0.45, z));
      g.add(box(0.4, 0.4, 0.04, cw, x, 0.49, z + (z < 0 ? -0.18 : 0.18)));
    }));
  },
  coffeetable(g) {
    const w = std('#8b6b4a');
    g.add(box(1.0, 0.04, 0.55, w, 0, 0.4, 0));
    [[-0.45, -0.22], [0.45, -0.22], [-0.45, 0.22], [0.45, 0.22]].forEach(([x, z]) => g.add(box(0.04, 0.4, 0.04, w, x, 0, z)));
  },
  wardrobe(g) {
    const w = std('#d8d3c8');
    g.add(box(1.5, 2.1, 0.6, w));
    g.add(box(0.01, 2.0, 0.01, std('#888'), 0, 0.05, 0.305));
    g.add(box(0.03, 0.2, 0.02, std('#888'), -0.06, 1.0, 0.31));
    g.add(box(0.03, 0.2, 0.02, std('#888'), 0.06, 1.0, 0.31));
  },
  shelf(g) {
    const w = std('#a07b52');
    g.add(box(0.9, 1.9, 0.04, std('#8a6a48'), 0, 0, -0.16));
    for (let i = 0; i < 5; i++) g.add(box(0.9, 0.03, 0.34, w, 0, i * 0.45, 0));
    g.add(box(0.03, 1.9, 0.34, w, -0.44, 0, 0));
    g.add(box(0.03, 1.9, 0.34, w, 0.44, 0, 0));
  },
  sideboard(g) {
    g.add(box(1.6, 0.75, 0.42, std('#c9b79a')));
    g.add(box(0.01, 0.65, 0.01, std('#777'), -0.27, 0.05, 0.215));
    g.add(box(0.01, 0.65, 0.01, std('#777'), 0.27, 0.05, 0.215));
  },
  kitchen(g) {
    g.add(box(2.4, 0.86, 0.6, std('#e6e6e6')));
    g.add(box(2.42, 0.04, 0.62, std('#555'), 0, 0.86, 0));
    g.add(box(2.4, 0.7, 0.32, std('#e6e6e6'), 0, 1.4, -0.14));
    [-0.3, 0, 0.3, 0.6].forEach((x) => g.add(cyl(0.09, 0.09, 0.01, std('#222'), x - 0.3, 0.9, 0.05, 16)));
  },
  fridge(g) {
    g.add(box(0.6, 1.8, 0.65, std('#d4dbe0')));
    g.add(box(0.02, 0.5, 0.03, std('#888'), 0.22, 1.1, 0.34));
    g.add(box(0.5, 0.01, 0.01, std('#9aa'), 0, 0.6, 0.33));
  },
  washer(g) {
    g.add(box(0.6, 0.85, 0.6, std('#f0f0f0')));
    const glass = new THREE.MeshStandardMaterial({ color: 0x6fa8d8, roughness: 0.1, metalness: 0.3 });
    g.add(cyl(0.2, 0.2, 0.02, glass, 0, 0.3, 0.3, 24).rotateX(Math.PI / 2));
  },
  bathtub(g) {
    const w = std('#f4f6f8');
    g.add(box(1.7, 0.55, 0.75, w));
    g.add(box(1.5, 0.05, 0.55, new THREE.MeshStandardMaterial({ color: 0x9fd0ee, transparent: true, opacity: 0.7 }), 0, 0.42, 0));
  },
  toilet(g) {
    const w = std('#f4f6f8');
    g.add(box(0.38, 0.38, 0.5, w, 0, 0, 0.05));
    g.add(box(0.38, 0.4, 0.16, w, 0, 0.38, -0.2));
  },
  basin(g) {
    g.add(box(0.6, 0.8, 0.45, std('#c9c4b8')));
    g.add(box(0.5, 0.08, 0.36, std('#f4f6f8'), 0, 0.8, 0));
    g.add(cyl(0.015, 0.015, 0.2, std('#aaa'), 0, 0.88, -0.15, 8));
  },
  shower(g) {
    g.add(box(0.9, 0.06, 0.9, std('#e8ecef')));
    const glass = new THREE.MeshStandardMaterial({ color: 0x9cc9ee, transparent: true, opacity: 0.3, roughness: 0.1 });
    g.add(box(0.9, 2.0, 0.02, glass, 0, 0.06, 0.44));
    g.add(box(0.02, 2.0, 0.9, glass, 0.44, 0.06, 0));
    g.add(cyl(0.1, 0.1, 0.02, std('#aaa'), -0.3, 2.0, -0.3, 12));
  },
  carpet(g) {
    g.add(box(2.0, 0.015, 1.4, std('#7c8aa6')));
  },
  tree(g) {
    g.add(cyl(0.12, 0.16, 1.6, std('#6b4a2f'), 0, 0, 0, 10));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(1.0, 16, 12), std('#3f8f4a')).translateY(2.3));
  },
  bush(g) {
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), std('#4a9a52')).translateY(0.4));
  },
  pool(g) {
    g.add(box(4.0, 0.06, 2.5, std('#d8e4ea')));
    g.add(box(3.7, 0.08, 2.2, std('#2fa8d8', { transparent: true, opacity: 0.8, emissive: 0x0a4a66 })));
  },
  lawn(g) {
    g.add(box(6.0, 0.02, 4.0, std('#5aa04a')));
  },
  terrace(g) {
    g.add(box(4.0, 0.06, 3.0, std('#b9a58a')));
  },
  path(g) {
    g.add(box(1.0, 0.03, 4.0, std('#9a9488')));
  },
  fence(g) {
    g.add(box(3.0, 0.08, 0.06, std('#8a6a44'), 0, 0.85));
    g.add(box(3.0, 0.08, 0.06, std('#8a6a44'), 0, 0.4));
    for (let i = 0; i <= 6; i++) g.add(box(0.07, 1.0, 0.07, std('#8a6a44'), -1.5 + i * 0.5, 0, 0));
  },
  car(g) {
    const body = std('#c4ccd6', { metalness: 0.4 });
    g.add(box(1.8, 0.5, 4.2, body, 0, 0.25, 0));
    g.add(box(1.6, 0.5, 2.2, std('#8fb4d6', { transparent: true, opacity: 0.7 }), 0, 0.75, -0.1));
    const wh = std('#222');
    [[-0.85, -1.3], [0.85, -1.3], [-0.85, 1.3], [0.85, 1.3]].forEach(([x, z]) => g.add(cyl(0.3, 0.3, 0.2, wh, x, 0, z, 16).rotateZ(Math.PI / 2)));
  },
});

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
