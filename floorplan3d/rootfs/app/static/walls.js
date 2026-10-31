import * as THREE from './vendor/three.module.min.js';
import { mergeGeometries } from './vendor/utils/BufferGeometryUtils.js';
import { hasShutter, curtainStyle, shutterSlats, curtainDepth, curtainHangDepth, SHUTTER_UP, SHUTTER_SPEED, CURTAIN_GATHER, CURTAIN_SPEED } from './shutters.js';
import { mergeParts } from './meshmerge.js';
import { windowPanes, paneHinge } from './windowpanes.js';

/* Wall geometry with real openings (doors/windows).
 * Wall data: { id, a:[x,z], b:[x,z], thickness, height, openings:[{id,type,pos,width,height,sill}] }
 * `pos` is the opening centre in meters measured from point a along the wall. */

/* Presets of the opening palette. `type` is door/window, `style` picks the look (stored on the opening and changeable later). */
export const OPENING_DEFAULTS = {
  door:       { type: 'door',   style: 'single',  width: 0.9, height: 2.05, sill: 0 },
  doorEntry:  { type: 'door',   style: 'single',  width: 1.1, height: 2.15, sill: 0 },
  doorGlass:  { type: 'door',   style: 'glass',   width: 0.9, height: 2.05, sill: 0 },
  doorDouble: { type: 'door',   style: 'double',  width: 1.6, height: 2.05, sill: 0 },
  doorSlide:  { type: 'door',   style: 'sliding', width: 1.8, height: 2.1,  sill: 0 },
  doorOpen:   { type: 'door',   style: 'open',    width: 1.0, height: 2.05, sill: 0 },
  doorGap:    { type: 'door',   style: 'gap',     width: 1.0, height: 2.1,  sill: 0 },
  doorGarage: { type: 'door',   style: 'garage',  width: 2.5, height: 2.1,  sill: 0 },
  window:     { type: 'window', style: 'single',  width: 1.0, height: 1.2,  sill: 0.9 },
  window2:    { type: 'window', style: 'double',  width: 1.8, height: 1.2,  sill: 0.9 },
  window3:    { type: 'window', style: 'triple',  width: 2.4, height: 1.2,  sill: 0.9 },
  windowTall: { type: 'window', style: 'double',  width: 1.8, height: 2.1,  sill: 0 },
  windowBath: { type: 'window', style: 'single',  width: 0.6, height: 0.6,  sill: 1.5 },
  windowFixed:{ type: 'window', style: 'fixed',   width: 1.6, height: 1.4,  sill: 0.6 },
};
export const DOOR_STYLES = ['single', 'glass', 'double', 'sliding', 'open', 'gap', 'garage'];
export const WINDOW_STYLES = ['single', 'double', 'triple', 'fixed'];
// the panes of a window live in windowpanes.js (pure, unit test); exported here too, as before
export { WINDOW_HINGES, PANE_HINGES, stylePanes, windowPanes, paneHinge } from './windowpanes.js';
const EDGE = 0.05;   // minimum solid wall left next to an opening

export const wallLength = (w) => Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);

/** Distance along wall a→b of the point closest to p (unclamped). */
export function projectOnWall(w, [x, z]) {
  const len = wallLength(w) || 1;
  return ((x - w.a[0]) * (w.b[0] - w.a[0]) + (z - w.a[1]) * (w.b[1] - w.a[1])) / len;
}

export const MIN_OPENING = 0.1;   // narrowest opening (slit window, #142)
/** the width an opening of `width` gets on wall `w`: unchanged when it fits, otherwise shrunk to the room that is left; null if even MIN_OPENING does not fit */
export function fitOpeningWidth(w, width) {
  const avail = Math.floor((wallLength(w) - 2 * EDGE) * 100) / 100;
  if (avail >= width) return width;
  return avail >= MIN_OPENING ? avail : null;
}

export function clampOpeningPos(w, width, pos) {
  const half = width / 2 + EDGE + w.thickness / 2;
  const len = wallLength(w);
  if (len < width + 2 * EDGE) return null;               // opening does not fit at all
  return Math.min(Math.max(pos, Math.min(half, len / 2)), Math.max(len - half, len / 2));
}

export function openingOverlaps(w, pos, width, ignoreId) {
  return (w.openings || []).some((o) => o.id !== ignoreId && Math.abs(o.pos - pos) < (o.width + width) / 2 + 0.02);
}

function boxMesh(x0, x1, y0, y1, depth, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, depth), material);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
  return m;
}

/** the roller shutter of a window (#331): a curtain of slats that hangs under the lintel between the glass and the face of the wall on
 *  side `side` (local z, the outside), in a rail on either side. Its pivot is scaled in height by openings.js as far as the cover is
 *  closed (shutters.js: curtainScale); it starts rolled up. Returns the pivot. */
function addShutter(g, x0, x1, yB, yT, t, ft, mat, side) {
  const z = side * curtainDepth(t), ch = yT - yB, { n, sh } = shutterSlats(ch);
  const slats = [];
  for (let k = 0; k < n; k++) {
    const b = new THREE.BoxGeometry(x1 - x0 - 2 * ft, sh - 0.008, 0.012);
    b.translate(0, -(k + 0.5) * sh, 0);
    slats.push(b);
  }
  const pivot = new THREE.Group();
  pivot.position.set(0, yT, z);
  const curtain = new THREE.Mesh(mergeGeometries(slats), mat);
  curtain.userData.shutter = true;
  pivot.add(curtain);
  pivot.scale.y = SHUTTER_UP;
  pivot.userData = { axis: 'y', prop: 'scale', base: 0, target: SHUTTER_UP, fresh: true, speed: SHUTTER_SPEED };   // speed: it moves evenly, like a motor
  g.add(pivot);
  [x0 + ft, x1 - ft].forEach((x) => { const r = boxMesh(x - 0.012, x + 0.012, yB, yT, 0.03, mat); r.position.z = z; g.add(r); });   // the rails
  return pivot;
}

/** a cloth curtain of a window (shutters.js: 'left', 'right' or 'split'): one panel that gathers to one side or two that part in the
 *  middle, hanging inside the room on a rod. Its pivot is scaled sideways by openings.js with the cover's position (curtainWidth).
 *  Returns the pivot, or both pivots of a split curtain, in one array. */
function addCurtain(g, x0, x1, yB, yT, t, ft, mat, side, style) {
  const z = -side * curtainHangDepth(t), h = yT - yB, cw = x1 - x0 - 2 * ft;
  const leftEdge = side > 0 ? x1 - ft : x0 + ft;     // seen from inside the room (the plan's left, whichever way the wall was drawn)
  const rightEdge = side > 0 ? x0 + ft : x1 - ft;
  const panel = (gx, d, w) => {
    const pv = new THREE.Group();
    pv.position.set(gx, yB, z);
    const n = 6, strips = [];                        // a few pleats: they squeeze together when the curtain is pulled aside
    for (let k = 0; k < n; k++) {
      const b = new THREE.BoxGeometry(w / n - 0.004, Math.max(0.02, h - 0.02), 0.014);
      b.translate(d * ((k + 0.5) * w) / n, Math.max(0.02, h - 0.02) / 2, k % 2 ? 0.008 : -0.008);
      strips.push(b);
    }
    pv.add(new THREE.Mesh(mergeGeometries(strips), mat));
    pv.scale.x = CURTAIN_GATHER;                      // until the cover reports: open, the window stays visible
    pv.userData = { axis: 'x', prop: 'scale', base: 0, target: CURTAIN_GATHER, fresh: true, speed: CURTAIN_SPEED };
    g.add(pv);
    return pv;
  };
  const rod = boxMesh(x0 + ft, x1 - ft, yT + 0.01, yT + 0.045, 0.035, mat);   // the rod over the window
  rod.position.z = z;
  g.add(rod);
  const atLeft = leftEdge === x1 - ft ? -1 : 1;       // from the left edge towards the middle (-x when the left edge is at +x)
  if (style === 'left') return panel(leftEdge, atLeft, cw);
  if (style === 'right') return panel(rightEdge, -atLeft, cw);
  return [panel(leftEdge, atLeft, cw / 2), panel(rightEdge, -atLeft, cw / 2)];
}

function buildOpening(o, t, mats0, low, shutterMat, side = 1, curtainMat = null) {
  const g = new THREE.Group();
  g.userData = { kind: 'opening', id: o.id };
  // every opening gets its own materials so a contact sensor can tint just this door/window
  const mats = {};
  for (const [k, m] of Object.entries(mats0)) mats[k] = m.clone();
  const cx = 0, w = o.width, h = o.height, s = o.sill;
  const fd = t + 0.02, ft = 0.05;                        // frame depth / thickness
  const x0 = cx - w / 2, x1 = cx + w / 2;
  let pivot = null;
  const st = o.style || (o.type === 'door' ? 'single' : 'double');   // windows saved before styles existed had one centre bar
  if (o.type === 'door' && st === 'gap') return g;       // bare opening in the wall: no frame, no leaf (still tappable via the group)
  g.add(boxMesh(x0, x0 + ft, s, s + h, fd, mats.frame));
  g.add(boxMesh(x1 - ft, x1, s, s + h, fd, mats.frame));
  g.add(boxMesh(x0, x1, s + h - ft, s + h, fd, mats.frame));
  if (o.type === 'door' && st === 'open') {
    // passage without a leaf: only the frame
  } else if (o.type === 'door' && st === 'garage') {
    // sectional garage door: slats under the lintel that roll up (the pivot shrinks towards the top) when the contact / cover reports "open"
    pivot = new THREE.Group();
    pivot.position.set(0, s + h - ft, 0);
    const n = 5, ph = h - ft, sh = ph / n;
    for (let k = 0; k < n; k++) {
      const slat = boxMesh(x0 + ft, x1 - ft, -(k + 1) * sh + 0.008, -k * sh - 0.008, 0.05, k === 1 ? mats.glass : mats.metal);
      pivot.add(slat);
    }
    g.add(pivot);
    pivot.userData.axis = 'y'; pivot.userData.prop = 'scale'; pivot.userData.base = 1; pivot.userData.dir = -1; pivot.userData.max = 0.9;   // 1 = closed, 0.1 = rolled up
  } else if (o.type === 'door' && st === 'sliding') {
    // two glass panels, one in front of the other; the front one slides aside when the contact reports "open"
    const pw = (w - 2 * ft) / 2 + 0.03;
    const back = boxMesh(x0 + ft, x0 + ft + pw, s, s + h - ft, 0.02, mats.glass); back.position.z = -0.03;
    g.add(back);
    pivot = new THREE.Group();
    const front = boxMesh(x1 - ft - pw, x1 - ft, s, s + h - ft, 0.02, mats.glass); front.position.z = 0.03;
    const rim = boxMesh(x1 - ft - pw, x1 - ft - pw + 0.04, s, s + h - ft, 0.03, mats.frame); rim.position.z = 0.03;
    pivot.add(front, rim);
    g.add(pivot);
    pivot.userData.dir = -1; pivot.userData.axis = 'x'; pivot.userData.slide = (w - 2 * ft) / 2; pivot.userData.max = pivot.userData.slide;
    pivot.userData.prop = 'position';
  } else if (o.type === 'door' && st === 'double') {
    // two leaves hinged at both sides, each half the width
    const lw = (w - 2 * ft) / 2;
    const mk = (hingeX, dirX, sign) => {
      const pv = new THREE.Group();
      pv.position.set(hingeX, 0, 0);
      const leaf = boxMesh(0, lw, s, s + h - ft, 0.04, mats.door);
      leaf.position.x = dirX * lw / 2;
      pv.add(leaf);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), mats.metal);
      knob.position.set(dirX * (lw - 0.08), s + 1.0, o.inv ? -0.045 : 0.045);
      pv.add(knob);
      pv.userData.dir = sign * (o.inv ? -1 : 1); pv.userData.axis = 'y'; pv.userData.max = 1.15;
      g.add(pv);
      return pv;
    };
    pivot = mk(x0 + ft, 1, -1);
    const p2 = mk(x1 - ft, -1, 1);
    pivot.userData.followers = [p2];
  } else if (o.type === 'door') {
    // the leaf hangs on a pivot at the hinge so it can swing open when the contact reports "open"
    const glassLeaf = st === 'glass';
    pivot = new THREE.Group();
    const hingeX = o.flip ? x1 - ft : x0 + ft;
    pivot.position.set(hingeX, 0, 0);
    const lw = w - 2 * ft;
    const leaf = boxMesh(0, lw, s, s + h - ft, glassLeaf ? 0.03 : 0.04, glassLeaf ? mats.glass : mats.door);
    leaf.position.x = o.flip ? -lw / 2 : lw / 2;
    pivot.add(leaf);
    if (glassLeaf) {                                     // thin frame around the glass leaf
      const sg = o.flip ? -1 : 1;
      [[0, 0.05], [lw - 0.05, lw]].forEach(([u, v]) => pivot.add(boxMesh(Math.min(sg * u, sg * v), Math.max(sg * u, sg * v), s, s + h - ft, 0.04, mats.frame)));
    }
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), mats.metal);
    knob.position.set(o.flip ? -lw + 0.12 : lw - 0.12, s + 1.0, o.inv ? -0.045 : 0.045);
    pivot.add(knob);
    g.add(pivot);
    pivot.userData.dir = (o.flip ? 1 : -1) * (o.inv ? -1 : 1);       // inv: the leaf swings to the other side of the wall
    pivot.userData.axis = 'y';
    pivot.userData.max = 1.15;
  } else {
    if (o.sill > 0) g.add(boxMesh(x0, x1, s, s + ft, fd, mats.frame));
    const shade = curtainStyle(o), panes = windowPanes(o), inner = h - 2 * ft;
    // window pane(s) swing inwards when open (fixed glazing does not open), each around the edge chosen for it in the properties
    // (paneHinge); multi-pane windows get one pivot per pane so every pane can follow its own sensor
    const mkPane = (u0, u1, i) => {
      const pv = new THREE.Group(), pw = u1 - u0, hinge = paneHinge(o, i);
      let pane, dir = -side, axis = 'x', max = 0.4;
      if (hinge === 'left' || hinge === 'right') {
        const atLeft = hinge === 'left' ? side > 0 : side < 0;   // the hinge on the left seen from inside the room
        pv.position.set(atLeft ? u1 : u0, s + ft, 0);
        pane = atLeft ? boxMesh(-pw, 0, 0, inner, 0.015, mats.glass) : boxMesh(0, pw, 0, inner, 0.015, mats.glass);
        pane.position.y = inner / 2;
        dir = hinge === 'left' ? -1 : 1; axis = 'y'; max = 1.15;
      } else {
        const top = hinge === 'top';
        pv.position.set(0, s + ft + (top ? inner : 0), 0);
        pane = top ? boxMesh(u0, u1, -inner, 0, 0.015, mats.glass) : boxMesh(u0, u1, 0, inner, 0.015, mats.glass);
        dir = top ? side : -side;
      }
      pv.add(pane);
      g.add(pv);
      if (st !== 'fixed' && hinge !== 'fixed') { pv.userData.dir = dir; pv.userData.axis = axis; pv.userData.max = max; }
      return pv;
    };
    const pvs = [];
    for (let i = 0; i < panes; i++) pvs.push(mkPane(x0 + ft + ((w - 2 * ft) * i) / panes, x0 + ft + ((w - 2 * ft) * (i + 1)) / panes, i));
    for (let i = 1; i < panes; i++) {
      const bx = x0 + ft + ((w - 2 * ft) * i) / panes;
      const bar = boxMesh(bx - 0.015, bx + 0.015, 0, inner, 0.04, mats.frame);
      bar.position.y = s + ft + inner / 2;
      g.add(bar);
    }
    if (st !== 'fixed') { pivot = pvs[0]; g.userData.panePivots = pvs; }
    if (o.sill > 0.2) g.add(boxMesh(x0 - 0.04, x1 + 0.04, s - 0.03, s, fd + 0.08, mats.frame));   // sill ledge
    if (shade === 'roller' && shutterMat) g.userData.shutter = addShutter(g, x0, x1, o.sill > 0 ? s + ft : s, s + h - ft, t, ft, shutterMat, side);
    else if (shade && curtainMat) g.userData.shutter = addCurtain(g, x0, x1, o.sill > 0 ? s + ft : s, s + h - ft, t, ft, curtainMat, side, shade);
  }
  // invisible, slightly padded hit box: doors and windows stay easy to select even with a lamp or sensor in front of them
  const proxy = new THREE.Mesh(new THREE.BoxGeometry(w, h, t + 0.1), new THREE.MeshBasicMaterial({ visible: false }));
  proxy.position.set(cx, s + h / 2, 0);
  proxy.userData.proxy = true;
  g.add(proxy);
  g.userData.pivot = pivot;
  g.userData.tint = Object.entries(mats).map(([k, m]) => ({ k, m, base: m.color.getHex() }));   // k: frame, door, metal, glass (openings.js partHex)
  g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  mergeParts(g);                                         // the fixed parts of the frame in one mesh: fewer draw calls (meshmerge.js, #394)
  g.position.x = o.pos - 0;                              // replaced by caller (needs wall length)
  return g;
}

/** Returns a Group positioned at the wall centre with local x along the wall. bare: only the doors / windows, no wall (a dormer window).
 *  shutterSide(o): the side (local z, +1 / -1) the roller shutter of window o hangs on, outside (shutters.js), +1 without it.
 *  windowFrame: the colour of the window frames ('#rrggbb', facade.js, #428), the door frames stay white; null: white as well.
 *  dress(group, pieces, len): puts the finishes on the faces of the wall (wallskin.js, #448); pieces: its solid parts { x0, x1, y0, y1 } */
export function buildWall(w, { material, ghost = false, low = false, cut = 0, makeMat, holo = false, edgeMaterial = null, bare = false, shutterSide = null, windowFrame = null, dress = null }) {
  const len = wallLength(w);
  const t = w.thickness;
  const H = (w.height || 2.6) * (low ? 0.12 : cut || 1);   // `cut`: fraction of the height that stays (half section)
  const group = new THREE.Group();
  group.position.set((w.a[0] + w.b[0]) / 2, 0, (w.a[1] + w.b[1]) / 2);
  group.rotation.y = -Math.atan2(w.b[1] - w.a[1], w.b[0] - w.a[0]);
  if (!ghost) group.userData = { kind: 'wall', id: w.id };

  const openings = [...(w.openings || [])].sort((p, q) => p.pos - q.pos);
  const basic = (color, opacity, depthWrite = true) =>
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: ghost ? Math.min(opacity, 0.1) : opacity, depthWrite });
  const mats = holo ? {
    frame: basic(0x3df2ff, 0.85), door: basic(0xff9d2e, 0.55, false),
    metal: basic(0xffd08a, 1), glass: basic(0x22e0a8, 0.4, false),
  } : {
    frame: makeMat('#f4f4f4', ghost), door: makeMat('#8a6a48', ghost), metal: makeMat('#c9c9c9', ghost),
    glass: makeMat('#9cc9ee', ghost, { opacity: ghost ? 0.15 : 0.45, roughness: 0.1 }),
  };
  const winMats = windowFrame && !holo ? { ...mats, frame: makeMat(windowFrame, ghost) } : mats;   // anthracite window frames (#428)
  // the roller shutters of the windows (#331): one material of their own, not tinted red with an open window
  const shades = (w.openings || []).map(curtainStyle);
  const shutterMat = shades.includes('roller') ? (holo ? basic(0x8fb4ff, 0.8) : makeMat('#a7adb4', ghost)) : null;
  const curtainMat = shades.some((s) => s && s !== 'roller') ? (holo ? basic(0x8fb4ff, 0.8) : makeMat('#d9d0c2', ghost, { roughness: 0.92 })) : null;
  const pieces = [];
  const solid = (x0, x1, y0, y1) => {
    if (bare) return;
    y1 = Math.min(y1, H);
    if (x1 - x0 < 0.001 || y1 - y0 < 0.001) return;
    pieces.push({ x0, x1, y0, y1 });
    const m = boxMesh(x0, x1, y0, y1, t, material);
    m.castShadow = !ghost && !holo; m.receiveShadow = true;
    if (edgeMaterial) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), edgeMaterial));
    group.add(m);
  };

  const half = len / 2;
  let cursor = -half - t / 2;
  for (const o of openings) {
    const c = o.pos - half;
    const x0 = c - o.width / 2, x1 = c + o.width / 2;
    solid(cursor, x0, 0, H);                              // wall before the opening
    solid(x0, x1, o.sill + o.height, H);                  // above
    if (o.sill > 0) solid(x0, x1, 0, o.sill);             // below (windows)
    cursor = x1;
    if (!low) {
      const og = buildOpening({ ...o }, t, o.type === 'window' ? winMats : mats, low, shutterMat, shutterSide && (hasShutter(o) || o.type === 'window') ? shutterSide(o) : 1, curtainMat);
      og.position.x = c;
      group.add(og);
    }
  }
  solid(cursor, half + t / 2, 0, H);
  if (dress && pieces.length) dress(group, pieces, len);
  mergeParts(group);                                     // the pieces round the openings in one mesh (the doors and windows stay apart)
  return group;
}
