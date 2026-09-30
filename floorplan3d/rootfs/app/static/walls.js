import * as THREE from './vendor/three.module.min.js';

/* Wall geometry with real openings (doors/windows).
 * Wall data: { id, a:[x,z], b:[x,z], thickness, height, openings:[{id,type,pos,width,height,sill}] }
 * `pos` is the opening centre in meters measured from point a along the wall. */

export const OPENING_DEFAULTS = {
  door:   { width: 0.9, height: 2.05, sill: 0 },
  window: { width: 1.2, height: 1.2,  sill: 0.9 },
};
const EDGE = 0.05;   // minimum solid wall left next to an opening

export const wallLength = (w) => Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);

/** Distance along wall a→b of the point closest to p (unclamped). */
export function projectOnWall(w, [x, z]) {
  const len = wallLength(w) || 1;
  return ((x - w.a[0]) * (w.b[0] - w.a[0]) + (z - w.a[1]) * (w.b[1] - w.a[1])) / len;
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

function buildOpening(o, t, mats0, low) {
  const g = new THREE.Group();
  g.userData = { kind: 'opening', id: o.id };
  // every opening gets its own materials so a contact sensor can tint just this door/window
  const mats = {};
  for (const [k, m] of Object.entries(mats0)) mats[k] = m.clone();
  const cx = 0, w = o.width, h = o.height, s = o.sill;
  const fd = t + 0.02, ft = 0.05;                        // frame depth / thickness
  const x0 = cx - w / 2, x1 = cx + w / 2;
  g.add(boxMesh(x0, x0 + ft, s, s + h, fd, mats.frame));
  g.add(boxMesh(x1 - ft, x1, s, s + h, fd, mats.frame));
  g.add(boxMesh(x0, x1, s + h - ft, s + h, fd, mats.frame));
  let pivot = null;
  if (o.type === 'door') {
    // the leaf hangs on a pivot at the hinge so it can swing open when the contact reports "open"
    pivot = new THREE.Group();
    const hingeX = o.flip ? x1 - ft : x0 + ft;
    pivot.position.set(hingeX, 0, 0);
    const lw = w - 2 * ft;
    const leaf = boxMesh(0, lw, s, s + h - ft, 0.04, mats.door);
    leaf.position.x = o.flip ? -lw / 2 : lw / 2;
    pivot.add(leaf);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), mats.metal);
    knob.position.set(o.flip ? -lw + 0.12 : lw - 0.12, s + 1.0, o.inv ? -0.045 : 0.045);
    pivot.add(knob);
    g.add(pivot);
    pivot.userData.dir = (o.flip ? 1 : -1) * (o.inv ? -1 : 1);       // inv: the leaf swings to the other side of the wall
    pivot.userData.axis = 'y';
    pivot.userData.max = 1.15;
  } else {
    g.add(boxMesh(x0, x1, s, s + ft, fd, mats.frame));
    // window pane tilts inwards around its lower edge when open
    pivot = new THREE.Group();
    pivot.position.set(0, s + ft, 0);
    const pane = boxMesh(x0 + ft, x1 - ft, 0, h - 2 * ft, 0.015, mats.glass);
    pane.position.y = (h - 2 * ft) / 2;
    pivot.add(pane);
    const bar = boxMesh(cx - 0.015, cx + 0.015, 0, h - 2 * ft, 0.04, mats.frame);
    bar.position.y = (h - 2 * ft) / 2;
    pivot.add(bar);
    g.add(pivot);
    pivot.userData.dir = -1;
    pivot.userData.axis = 'x';
    pivot.userData.max = 0.4;
    g.add(boxMesh(x0 - 0.04, x1 + 0.04, s - 0.03, s, fd + 0.08, mats.frame));   // sill ledge
  }
  // invisible, slightly padded hit box: doors and windows stay easy to select even with a lamp or sensor in front of them
  const proxy = new THREE.Mesh(new THREE.BoxGeometry(w, h, t + 0.1), new THREE.MeshBasicMaterial({ visible: false }));
  proxy.position.set(cx, s + h / 2, 0);
  proxy.userData.proxy = true;
  g.add(proxy);
  g.userData.pivot = pivot;
  g.userData.tint = Object.values(mats).map((m) => ({ m, base: m.color.getHex() }));
  g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  g.position.x = o.pos - 0;                              // replaced by caller (needs wall length)
  return g;
}

/** Returns a Group positioned at the wall centre with local x along the wall. */
export function buildWall(w, { material, ghost = false, low = false, makeMat, holo = false, edgeMaterial = null }) {
  const len = wallLength(w);
  const t = w.thickness;
  const H = (w.height || 2.6) * (low ? 0.12 : 1);
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
  const solid = (x0, x1, y0, y1) => {
    y1 = Math.min(y1, H);
    if (x1 - x0 < 0.001 || y1 - y0 < 0.001) return;
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
      const og = buildOpening({ ...o }, t, mats, low);
      og.position.x = c;
      group.add(og);
    }
  }
  solid(cursor, half + t / 2, 0, H);
  return group;
}
