/* ▲ The plateaus of the plot in 3D (#566): the edge of every plateau (an area with a height, levels.js) from the lawn up to its top, a
 * retaining wall of stones (natural stone, concrete, clinker, gabions: WALL_LOOKS) with cover stones on top, or a bank of lawn that runs
 * down to the lawn. Its surface lies on top (yard3d.js lifts it). Cut open with the earth (clip: the plane of earth.js) like the areas. */
import * as THREE from './vendor/three.module.min.js';
import { plateausOf, cleanRise, offsetPoly, WALL_LOOKS, LEVELS } from './levels.js';

const TEX_M = 1.2;                         // one picture of the wall covers 1.2 x 1.2 m
const textures = new Map();
/** the stones of a wall look, drawn once: rows of stones of different sizes and shades, the joints between them */
function wallTexture(key) {
  if (textures.has(key)) return textures.get(key);
  const look = WALL_LOOKS[key] || WALL_LOOKS.stone, c = document.createElement('canvas'), g = c.getContext('2d');
  c.width = c.height = 256;
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  g.fillStyle = look.joint; g.fillRect(0, 0, 256, 256);
  const brick = key === 'brick', plain = key === 'concrete', gab = key === 'gabion';
  if (plain) {                                             // concrete: smooth with the lines of its formwork
    g.fillStyle = look.stones[0]; g.fillRect(0, 0, 256, 256);
    g.fillStyle = 'rgba(0,0,0,.08)'; for (let y = 64; y < 256; y += 64) g.fillRect(0, y, 256, 2);
    for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '0,0,0' : '255,255,255'},.05)`; g.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 6, 2 + rnd() * 4); }
  } else {
    for (let y = 0, row = 0; y < 256; row++) {
      const h = brick ? 256 / 18 : gab ? 10 + rnd() * 10 : 26 + rnd() * 22, hh = Math.min(h, 256 - y);
      for (let x = brick ? (row % 2) * -14 : -rnd() * 30; x < 256;) {
        const w = brick ? 28 : gab ? 12 + rnd() * 14 : 36 + rnd() * 54, col = look.stones[Math.floor(rnd() * look.stones.length)];
        const gap = brick ? 1.5 : gab ? 1 : 2.5;
        g.fillStyle = col; g.beginPath();
        if (g.roundRect) g.roundRect(x + gap, y + gap, w - 2 * gap, hh - 2 * gap, brick ? 1 : gab ? 3 : 6); else g.rect(x + gap, y + gap, w - 2 * gap, hh - 2 * gap);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + gap + 2, y + gap + 1, Math.max(0, w - 2 * gap - 4), 2);
        g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x + gap + 2, y + hh - gap - 3, Math.max(0, w - 2 * gap - 4), 2);
        x += w;
      }
      y += h;
    }
    if (gab) { g.strokeStyle = 'rgba(40,42,46,.55)'; g.lineWidth = 1.5; for (let k = 0; k <= 256; k += 32) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 256); g.stroke(); g.beginPath(); g.moveTo(0, k); g.lineTo(256, k); g.stroke(); } }   // the wire mesh
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  textures.set(key, t);
  return t;
}
/** the faces between two rings of points (the same number of corners): ring a at height ya, ring b at yb; u along the ring in metres */
function band(a, ya, b, yb) {
  const pos = [], uv = [], n = a.length;
  let u = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, len = Math.hypot(a[j][0] - a[i][0], a[j][1] - a[i][1]), slant = Math.hypot(b[i][0] - a[i][0], b[i][1] - a[i][1], yb - ya);
    const p = [[a[i][0], ya, a[i][1]], [a[j][0], ya, a[j][1]], [b[j][0], yb, b[j][1]], [b[i][0], yb, b[i][1]]];
    const t = [[u, 0], [u + len, 0], [u + len, slant], [u, slant]];
    [0, 1, 2, 0, 2, 3].forEach((k) => { pos.push(...p[k]); uv.push(t[k][0] / TEX_M, t[k][1] / TEX_M); });
    u += len;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

/** lay the edges of the plateaus into parent. y: the height of the lawn; holo: the hologram theme; clip: the plane that cuts the earth open,
 *  or null. Returns the meshes */
export function buildPlateaus(parent, areas, { y = 0, holo = false, clip = null } = {}) {
  const out = [];
  const add = (geo, mat, extra = {}) => {
    if (clip) [].concat(mat).forEach((m) => { m.clippingPlanes = [clip]; });
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = !holo; m.receiveShadow = !holo;
    Object.assign(m.userData, extra);
    parent.add(m); out.push(m);
    return m;
  };
  plateausOf(areas).forEach((a) => {
    const h = cleanRise(a.rise), pts = a.points, top = y + h, look = WALL_LOOKS[a.wall] || WALL_LOOKS.stone;
    if (a.edge === 'slope') {                                 // a bank of lawn: from the edge of the plateau down to the lawn, 2 : 3
      const foot = offsetPoly(pts, h * LEVELS.slopeRun);
      const mat = holo ? new THREE.MeshBasicMaterial({ color: 0x1d6b4a, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false })
        : new THREE.MeshStandardMaterial({ color: 0x6fa858, roughness: 0.95, side: THREE.DoubleSide });
      add(band(pts, top, foot, y), mat, { plateau: a.id, edge: 'slope' });
      return;
    }
    const wall = holo ? new THREE.MeshBasicMaterial({ color: 0x1a5fcf, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false })
      : new THREE.MeshStandardMaterial({ map: wallTexture(a.wall), roughness: 0.92, side: THREE.DoubleSide });
    add(band(pts, y - 0.02, pts, top - 0.05), wall, { plateau: a.id, edge: 'wall' });
    // the cover stones on top: a slab 5 cm thick, 3 cm over the face of the wall (the surface of the plateau lies on it)
    const capPts = offsetPoly(pts, 0.03), shape = new THREE.Shape(capPts.map(([x, z]) => new THREE.Vector2(x, -z)));
    const cap = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false, curveSegments: 1 }).rotateX(-Math.PI / 2);
    const capMat = holo ? new THREE.MeshBasicMaterial({ color: 0x3dffb0, transparent: true, opacity: 0.3, depthWrite: false })
      : new THREE.MeshStandardMaterial({ color: look.cap, roughness: 0.8 });
    add(cap, capMat, { plateau: a.id, edge: 'cap' }).position.y = top - 0.05;
  });
  return out;
}
