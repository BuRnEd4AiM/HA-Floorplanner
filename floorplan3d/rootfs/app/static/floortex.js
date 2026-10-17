/* Floor coverings in 3D (#427): the patterns of floorcover.js drawn on a canvas in the browser (no picture files), one texture per covering
 * shared by every room that has it; the floor of a room (floorbuild.js) gets it, and paintFloor (every state update, app.js) puts the
 * colour of the views Temp. / Humidity / CO₂ over it or the pattern back. The UV coordinates of a room floor are metres, so the pattern
 * repeats every `size` metres. */
import * as THREE from './vendor/three.module.min.js';
import { COVERINGS, floorPaint } from './floorcover.js';

const PX = 512;                                   // one picture of a pattern: 512 x 512
const textures = new Map();                        // covering -> texture

/** a darker / lighter shade of '#rrggbb' (k: factor) */
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
/** the same "random" pattern every time */
function seeded(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

function planks(g, c, rnd) {
  for (let y = 0; y < PX; y += 64) {              // rows of planks (a quarter metre wide at 2 m per picture), each row shifted
    let x = -Math.floor(rnd() * 200);
    while (x < PX) {
      const len = 180 + rnd() * 160, k = 0.86 + rnd() * 0.26;
      g.fillStyle = shade(c.base, k); g.fillRect(x, y, len, 64);
      for (let i = 0; i < 14; i++) {              // the grain
        const yy = y + 4 + rnd() * 56;
        g.strokeStyle = `rgba(60,35,15,${0.05 + rnd() * 0.08})`; g.lineWidth = 1 + rnd();
        g.beginPath(); g.moveTo(x, yy); g.bezierCurveTo(x + len * 0.3, yy + rnd() * 6 - 3, x + len * 0.7, yy + rnd() * 6 - 3, x + len, yy); g.stroke();
      }
      g.fillStyle = 'rgba(40,25,10,.55)'; g.fillRect(x, y, 3, 64);
      x += len;
    }
    g.fillStyle = 'rgba(40,25,10,.5)'; g.fillRect(0, y, PX, 3);
  }
}
function tiles(g, c, rnd) {
  const s = PX / c.n;
  for (let i = 0; i < c.n; i++) for (let j = 0; j < c.n; j++) { g.fillStyle = shade((i + j) % 2 ? c.a : c.b, 0.96 + rnd() * 0.06); g.fillRect(i * s, j * s, s, s); }
  for (let k = 0; k < 4000; k++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.04})`; g.fillRect(rnd() * PX, rnd() * PX, 2, 2); }
  g.strokeStyle = c.grout; g.lineWidth = 4;
  for (let i = 0; i <= c.n; i++) {
    g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, PX); g.stroke();
    g.beginPath(); g.moveTo(0, i * s); g.lineTo(PX, i * s); g.stroke();
  }
}
function concrete(g, c, rnd) {
  g.fillStyle = c.base; g.fillRect(0, 0, PX, PX);
  for (let k = 0; k < 9000; k++) {
    const v = 120 + Math.round(rnd() * 60);
    g.fillStyle = `rgba(${v},${v},${v - 4},${0.15 + rnd() * 0.2})`; g.fillRect(rnd() * PX, rnd() * PX, 1 + rnd() * 3, 1 + rnd() * 3);
  }
  g.strokeStyle = 'rgba(60,60,60,.35)'; g.lineWidth = 2; g.strokeRect(0, 0, PX, PX);   // the joints of the slabs
}
const DRAW = { planks, tiles, concrete };

/** the texture of a covering (drawn once, then shared) */
export function coveringTexture(key) {
  if (textures.has(key)) return textures.get(key);
  const c = COVERINGS[key], cv = document.createElement('canvas');
  cv.width = cv.height = PX;
  DRAW[c.kind](cv.getContext('2d'), c, seeded(7 + key.length));
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1 / c.size, 1 / c.size);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;                              // sharp when seen at an angle (three.js keeps it within what the graphics chip can)
  tex.userData.shared = true;                      // every rebuild keeps it on the graphics card (clearGroup in app.js)
  textures.set(key, tex);
  return tex;
}

/** the floor of the 3D view after a state update: the colour of a view over it (no pattern then), else its pattern or colour. m: its
 *  material; the pattern it was built with is m.userData.cover */
export function paintFloor(m, room, heat) {
  const cover = m.userData.cover || null, p = floorPaint(room, heat, !!cover);
  const map = p.pattern ? coveringTexture(cover) : null;
  if (m.map !== map) { m.map = map; m.needsUpdate = true; }
  m.color.set(p.color);
}
