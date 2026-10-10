/* What the scene does to a device model (#137, step 24): the invisible hit boxes (a tight one, and a bigger one for fingers in the live mode),
 * the hologram look (translucent blue with glowing edges, lit parts remembered for state changes) and drawing flat things under the floors.
 * three.js only, no app state. */
import * as THREE from './vendor/three.module.min.js';
import { sectionHex } from './ledring.js';

/** the colours of the hologram theme */
export const HOLO = { fill: 0x1f6fe0, edge: 0x3df2ff, on: 0xff9d2e, onEdge: 0xffd08a, floor: 0x0a1830, floorLit: 0xff9d2e };

/** the hit boxes of a model: one around it (at least 35 cm), and a bigger one that only the live mode uses (lamps are easy to hit with a finger) */
export function addPickProxy(model) {
  if (model.userData.ownProxy) return;                        // LED ring: one hit box per section, made by the model
  model.children.filter((c) => c.userData.proxy).forEach((c) => { model.remove(c); c.geometry.dispose(); });
  const saved = { p: model.position.clone(), r: model.rotation.clone(), s: model.scale.clone() };
  model.position.set(0, 0, 0); model.rotation.set(0, 0, 0); model.scale.set(1, 1, 1);
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  box.applyMatrix4(model.matrixWorld.clone().invert());
  model.position.copy(saved.p); model.rotation.copy(saved.r); model.scale.copy(saved.s);
  model.updateMatrixWorld(true);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const proxy = new THREE.Mesh(
    new THREE.BoxGeometry(Math.max(size.x + 0.1, 0.35), Math.max(size.y + 0.1, 0.35), Math.max(size.z + 0.1, 0.35)),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  proxy.position.copy(box.getCenter(new THREE.Vector3()));
  proxy.userData.proxy = true;
  model.add(proxy);
  const wide = (v) => Math.max(v + 0.25, 0.6);                // a bigger hit box that only the live mode uses: lamps are easy to hit with a finger
  const touch = new THREE.Mesh(new THREE.BoxGeometry(wide(size.x), wide(size.y), wide(size.z)), new THREE.MeshBasicMaterial({ visible: false }));
  touch.position.copy(proxy.position);
  touch.userData.proxy = true; touch.userData.touchOnly = true;
  model.add(touch);
}

/** a flat thing on the ground (lawn, terrace, path) is drawn under the floors of the house */
export function underFloors(m) {
  m.traverse((o) => { if (o.isMesh) { o.renderOrder = -0.5; [].concat(o.material).forEach((x) => { x.depthWrite = false; }); } });
}

/** Turn a model into a translucent blue wireframe hologram; lit parts are remembered for state changes. */
export function holoify(model, ghost, belowVis) {
  const glow = new Set(model.userData.glow || []), led = new Set(model.userData.led || []);
  const meshes = [];
  model.traverse((o) => { if (o.isMesh && !o.userData.proxy && !o.userData.holo) meshes.push(o); });
  const hg = model.userData.holoGlow ||= { fill: [], edge: [] }, hl = model.userData.holoLed ||= { fill: [], edge: [] };
  const segOf = new Map();                                     // LED ring: material -> its section
  (model.userData.segs || []).forEach((sg) => { sg.holo ||= { fill: [], edge: [] }; sg.glow.forEach((m) => segOf.set(m, sg)); });
  for (const o of meshes) {
    const isGlow = glow.has(o.material), isLed = led.has(o.material), sg = segOf.get(o.material);
    o.material = new THREE.MeshBasicMaterial({ color: HOLO.fill, transparent: true, opacity: ghost ? 0.03 + 0.2 * belowVis : (model.userData.solid ? 0.8 : 0.38), depthWrite: !!model.userData.solid && !ghost, side: model.userData.solid ? THREE.DoubleSide : THREE.FrontSide });
    o.userData.holo = true;
    const em = new THREE.LineBasicMaterial({ color: HOLO.edge, transparent: true, opacity: ghost ? 0.08 + 0.55 * belowVis : 0.95 });
    o.add(new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 25), em));
    if (isGlow) { hg.fill.push(o.material); hg.edge.push(em); }
    if (isLed) { hl.fill.push(o.material); hl.edge.push(em); }
    if (sg) { sg.holo.fill.push(o.material); sg.holo.edge.push(em); }
  }
}

/** LED ring: every section lit in its light's colour (lit: [{ on, rgb }] per section); while editing, a section that is off is tinted in its
 *  own soft colour (the same as in the 2D plan) so you can see where each one runs (#325) */
export function ringLook(model, lit, { ghost = false, bv = 1, edit = false } = {}) {
  const OFF = 0xfff2cc;
  model.userData.segs.forEach((sg, i) => {
    const { on, rgb: c } = lit[i] || {}, mark = edit && !on && !ghost ? new THREE.Color(sectionHex(i)) : null;
    sg.glow.forEach((m) => {
      m.emissive.set(on ? (c ? new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255) : 0xffd27a) : 0x000000); m.emissiveIntensity = on ? 1.4 : 0;
      if (mark) m.color.copy(mark); else m.color.setHex(OFF);
    });
    if (!sg.holo) return;
    const op = ghost ? (on ? 0.12 + 0.5 * bv : 0.03 + 0.2 * bv) : (on ? 1 : mark ? 0.6 : 0.45);
    sg.holo.fill.forEach((m) => { if (on && c) m.color.setRGB(c[0] / 255, c[1] / 255, c[2] / 255); else if (mark) m.color.copy(mark); else m.color.setHex(on ? HOLO.on : HOLO.fill); m.opacity = op; });
    sg.holo.edge.forEach((m) => { if (on && c) m.color.setRGB(Math.min(1, c[0] / 255 + 0.35), Math.min(1, c[1] / 255 + 0.35), Math.min(1, c[2] / 255 + 0.35)); else if (mark) m.color.copy(mark); else m.color.setHex(on ? HOLO.onEdge : HOLO.edge); });
  });
}
