/* Tap balls (#238): in the live mode a small glowing ball floats over everything that can be tapped, lit in the light's colour while it is
 * on; it is a tap target of its own (with a bigger invisible finger ball). Pure placement and colour rules (unit test: tests/tapballs.test.mjs);
 * the balls are three.js meshes beside the device models in the floor group (not inside them, so they never change a model's size). */
import * as THREE from './vendor/three.module.min.js';
import { LIVE_NO_TAP } from './pickrules.js';

export const BALL = { r: 0.09, finger: 0.26, lift: 0.22, ceilingGap: 0.08, on: 0xffc94d, off: 0x8a9bb3 };

/** does device d get a ball: it is linked to something that can be switched or opened, and it can be tapped in the live mode */
export function wantsBall(d) {
  if (!d || d.hideModel || LIVE_NO_TAP.has(d.type)) return false;
  return !!(d.entity || d.ledEntity || (d.segs || []).some((s) => s.entity));
}

/** height of the ball over the floor: `lift` m above the top of the device; where that would reach the ceiling (a ceiling lamp) it hangs
 *  `lift` m below the device instead. minY / maxY: the device's bottom and top over the floor, ceiling: the room height */
export function ballY(minY, maxY, ceiling) {
  if (maxY + BALL.lift + BALL.r <= ceiling - BALL.ceilingGap) return maxY + BALL.lift;
  return Math.max(BALL.r, minY - BALL.lift);
}

/** colour and opacity of the ball: the light's colour (or warm white) while on, a quiet grey-blue while off */
export function ballLook(on, rgb) {
  if (!on) return { color: BALL.off, opacity: 0.7 };
  return { color: Array.isArray(rgb) ? ((rgb[0] & 255) << 16) | ((rgb[1] & 255) << 8) | (rgb[2] & 255) : BALL.on, opacity: 0.95 };
}

/** ctx: ceiling() (the room height) */
export function initTapBalls(ctx) {
  const geo = new THREE.SphereGeometry(BALL.r, 20, 14), fingerGeo = new THREE.SphereGeometry(BALL.finger, 10, 8);
  const fingerMat = new THREE.MeshBasicMaterial({ visible: false });
  const balls = new Map();                 // device id -> { ball, model, group, placed }
  /** a ball for device d next to its model in the floor group; returns it (for the pick list), or null when d does not want one */
  function add(group, model, d) {
    if (!wantsBall(d)) return null;
    const ball = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: BALL.off, transparent: true, opacity: 0.7, depthTest: false }));
    ball.renderOrder = 10;
    ball.userData = { kind: 'device', id: d.id, tapBall: true, touchOnly: true };   // touchOnly: only the live mode can hit it (see pickHit)
    const finger = new THREE.Mesh(fingerGeo, fingerMat);
    finger.userData = { proxy: true, touchOnly: true };
    ball.add(finger);
    ball.visible = false;
    group.add(ball);
    balls.set(d.id, { ball, model, group, placed: false });
    return ball;
  }
  /** put a ball over its model: the model's size is measured (without its hit boxes) in the floor group's frame */
  function place(b) {
    b.group.updateWorldMatrix(true, true);
    const box = new THREE.Box3(), inv = b.group.matrixWorld.clone().invert();
    b.model.traverse((o) => {
      if (!o.isMesh || o.userData.proxy || !o.geometry) return;
      o.geometry.computeBoundingBox();
      box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld).applyMatrix4(inv));
    });
    if (box.isEmpty()) return false;
    const c = box.getCenter(new THREE.Vector3());
    b.ball.position.set(c.x, ballY(box.min.y, box.max.y, ctx.ceiling()), c.z);
    return true;
  }
  /** show the ball of device `id` in the live mode only (placed over the model the first time it shows), in the colour of its state */
  function update(id, on, rgb, live, shown = true) {
    const b = balls.get(id);
    if (!b) return;
    b.ball.visible = live && shown;
    if (b.ball.visible && !b.placed) b.placed = place(b);
    const look = ballLook(on, rgb);
    b.ball.material.color.setHex(look.color); b.ball.material.opacity = look.opacity;
  }
  /** the model changed (loaded later, moved): measure again the next time the ball shows */
  const moved = (id) => { const b = balls.get(id); if (b) b.placed = false; };
  function clear() { balls.forEach((b) => b.ball.material.dispose()); balls.clear(); }
  /** everything may have moved (back in the live mode after editing): measure all again */
  const remeasure = () => balls.forEach((b) => { b.placed = false; });
  return { add, update, moved, remeasure, clear, has: (id) => balls.has(id), ball: (id) => balls.get(id)?.ball || null };
}
