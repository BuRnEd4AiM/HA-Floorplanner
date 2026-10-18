/* Textures and materials of the finishes (#448): the patterns of patterns.js drawn once on a canvas, one colour picture per pattern and
 * colours, one relief (bump map, grey) per pattern, shared by every floor and wall that has it. Kept on the graphics card while they are
 * used (clearGroup in app.js leaves them); when many colours were tried, the pictures no longer shown are freed (sweepTextures). */
import * as THREE from './vendor/three.module.min.js';
import { drawPattern } from './patterns.js';
import { texKey } from './finishes.js';

const PX = 512, BUMP_PX = 256, MAX = 24;          // a colour picture 512 x 512, its relief 256 x 256; 24 of each kept when not shown
const maps = new Map(), bumps = new Map();          // key -> texture, the one used longest ago first
let gen = 0;                                        // which build of the scene it is (sweepTextures)

function canvasTexture(fin, size, height) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  drawPattern(cv.getContext('2d'), size, fin, height);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  if (!height) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;                              // sharp when seen at an angle (three.js keeps it within what the graphics chip can)
  tex.userData.shared = true;                      // every rebuild keeps it on the graphics card (clearGroup in app.js)
  return tex;
}
/** the texture under key, made once */
function cached(store, key, make) {
  const tex = store.get(key) || make();
  store.delete(key); store.set(key, tex);           // the newest at the end
  tex.userData.gen = gen;
  return tex;
}
/** after every build of the scene (app.js): when more than MAX pictures are kept (many colours tried), the ones this build did not use
 *  are freed, those used longest ago first; what is shown is never freed, so a house with many finishes does not draw them again */
export function sweepTextures() {
  for (const store of [maps, bumps]) {
    for (const [k, tex] of store) {
      if (store.size <= MAX) break;
      if (tex.userData.gen < gen) { store.delete(k); tex.dispose(); }
    }
  }
  gen++;
}
/** the colour picture of a finish (null for plain paint) */
export const finishMap = (fin) => (fin.kind === 'plain' ? null : cached(maps, texKey(fin), () => canvasTexture(fin, PX, false)));
/** the relief of a finish (null without one) */
export const finishBump = (fin) => (!fin.bump || fin.kind === 'plain' ? null : cached(bumps, fin.key, () => canvasTexture(fin, BUMP_PX, true)));
/** how deep the relief looks */
export const bumpScale = (fin) => 0.8 * (fin.bump || 0);

/** what a material with finish fin gets (map, bumpMap, roughness ...); fast (the "fast" performance mode): only the colour from afar */
export function finishLook(fin, fast = false) {
  if (fast) return { color: fin.mean, roughness: fin.rough ?? 0.85 };
  if (fin.kind === 'plain') return { color: fin.color, roughness: fin.rough ?? 0.9 };
  const bump = finishBump(fin);
  return { color: '#ffffff', map: finishMap(fin), roughness: fin.rough ?? 0.85, ...(bump ? { bumpMap: bump, bumpScale: bumpScale(fin) } : {}) };
}
/** a new material of finish fin (one per wall: the cutaway fades the walls one by one) */
export const finishMaterial = (fin, fast = false) => new THREE.MeshStandardMaterial({ metalness: 0.02, ...finishLook(fin, fast) });
