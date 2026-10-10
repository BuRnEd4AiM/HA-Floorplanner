/* Tap balls (#238): in the live mode a small round badge floats over everything that can be tapped, with a little icon of what it controls
 * (#240), lit in the light's colour while it is on; it is a tap target of its own (with a bigger invisible finger ball). Pure placement,
 * icon and colour rules (unit test: tests/tapballs.test.mjs); the balls are three.js objects beside the device models in the floor group
 * (not inside them, so they never change a model's size). */
import * as THREE from './vendor/three.module.min.js';
import { LIVE_NO_TAP } from './pickrules.js';
import { shutterBallY } from './shutters.js';

export const BALL = { r: 0.3, finger: 0.4, gap: 0.04, maxShift: 0.9, lift: 0.26, ceilingGap: 0.08, on: 0xffc94d, off: 0x5d6f8a };

/** does device d get a ball: it is linked to something that can be switched or opened, and it can be tapped in the live mode */
export function wantsBall(d) {
  if (!d || d.hideModel || LIVE_NO_TAP.has(d.type)) return false;
  return !!(d.entity || d.ledEntity || (d.segs || []).some((s) => s.entity));
}

const TYPE_ICON = { camera: '📷', tv: '📺', tv_wall: '📺', speaker: '🔊', vacuum: '🧹', thermostat: '🌡', radiator: '🌡', boiler: '🌡', washer: '🫧',
  router: '📶', smoke: '🚨', wallbox: '🔌', battery: '🔋', fan: '🌀', solarpanel: '☀', inverter: '☀', powermeter: '⚡', houseentry: '⚡', fusebox: '⚡',
  watermeter: '🚰', gasmeter: '🔥', heatmeter: '♨' };
const DOMAIN_ICON = { light: '💡', cover: '🪟', switch: '🔌', input_boolean: '⏻', fan: '🌀', media_player: '📺', climate: '🌡', camera: '📷', lock: '🔒',
  vacuum: '🧹', scene: '✨', script: '✨', button: '⏺', siren: '🚨', valve: '🚰', water_heater: '🌡', humidifier: '💧', alarm_control_panel: '🛡' };
/** the little icon in the ball: what the device controls (its entity's kind), some device types have their own (a camera, a TV ...) */
export function ballIcon(d) {
  const e = d?.entity || d?.ledEntity || (d?.segs || []).find((s) => s.entity)?.entity || '', domain = e.split('.')[0];
  if (domain === 'light') return '💡';                                   // a lamp, an LED strip, a TV backlight: all a light bulb
  return TYPE_ICON[d?.type] || DOMAIN_ICON[domain] || (domain === 'sensor' || domain === 'binary_sensor' ? 'ℹ' : '●');
}

/** height of the ball over the floor: `lift` m above the top of the device; where that would reach the ceiling (a ceiling lamp) it hangs
 *  `lift` m below the device instead. minY / maxY: the device's bottom and top over the floor, ceiling: the room height */
export function ballY(minY, maxY, ceiling) {
  if (maxY + BALL.lift + BALL.r <= ceiling - BALL.ceilingGap) return maxY + BALL.lift;
  return Math.max(BALL.r, minY - BALL.lift);
}

/** where the ball of a window's roller shutter floats (#331), in floor coordinates: at the middle of window o along its wall w, on top of
 *  the window where the shutter rolls up (#335: also where that reaches the ceiling, the ball shows through everything) */
export function openingBallAt(w, o) {
  const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) || 1, k = (o.pos || 0) / L;
  return { x: w.a[0] + (w.b[0] - w.a[0]) * k, y: shutterBallY(o), z: w.a[1] + (w.b[1] - w.a[1]) * k };
}

/** Push balls apart that would cover each other (#244): points [{ x, y, z }] (their places over the devices), returned moved so that no two
 *  are closer than minDist seen from above (the view looks down at an angle, so a ball over another one hides it too); each one moves at most
 *  maxShift from its own place, sideways only. fixed: things that stay where they are (the value labels), kept fixedDist away. Balls far apart
 *  stay where they are. A few rounds of pushing each overlapping pair apart along the line between them. */
export function spreadBalls(points, minDist = 2 * BALL.r + BALL.gap, maxShift = BALL.maxShift, fixed = [], fixedDist = BALL.r + 0.45) {
  const p = points.map((q) => ({ ...q })), n = p.length;
  for (let round = 0; round < 40; round++) {
    let moved = false;
    for (let i = 0; i < n; i++) for (const f of fixed) {                 // a value label stays, the ball moves away from it
      let dx = p[i].x - f.x, dz = p[i].z - f.z, d = Math.hypot(dx, dz);
      if (d >= fixedDist - 1e-6) continue;
      if (d < 1e-6) { dx = 0; dz = 1; d = 1; } else { dx /= d; dz /= d; }
      const push = fixedDist - Math.min(d, fixedDist) + 1e-4;
      p[i].x += dx * push; p[i].z += dz * push; moved = true;
    }
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      let dx = p[j].x - p[i].x, dz = p[j].z - p[i].z, d = Math.hypot(dx, dz);
      if (d >= minDist - 1e-6) continue;
      if (d < 1e-6) { const a = (i * 2.399963 + j) % (2 * Math.PI); dx = Math.cos(a); dz = Math.sin(a); d = 1; } else { dx /= d; dz /= d; }   // on top of each other: any direction
      const push = (minDist - Math.min(d, minDist)) / 2 + 1e-4;
      p[i].x -= dx * push; p[i].z -= dz * push; p[j].x += dx * push; p[j].z += dz * push;
      moved = true;
    }
    for (let i = 0; i < n; i++) {                                  // never too far from the device it belongs to
      const ox = p[i].x - points[i].x, oz = p[i].z - points[i].z, o = Math.hypot(ox, oz);
      if (o > maxShift) { p[i].x = points[i].x + (ox / o) * maxShift; p[i].z = points[i].z + (oz / o) * maxShift; }
    }
    if (!moved) break;
  }
  return p;
}

/** Push balls apart on the screen (#314): seen at an angle, balls at different heights or depths can land on each other although they are
 *  apart seen from above. items [{ x, y, r }] (screen pixels: centre and radius); returns [{ dx, dy }] (pixels) so that no two overlap
 *  (gap pixels between them), each at most maxShift radii from its own place. Pure and the same for the same input (no jitter while still). */
export function spreadScreen(items, gap = 3, maxShift = 2.5) {
  const p = items.map((q) => ({ x: q.x, y: q.y })), n = p.length;
  for (let round = 0; round < 60; round++) {
    let moved = false;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const need = items[i].r + items[j].r + gap;
      let dx = p[j].x - p[i].x, dy = p[j].y - p[i].y, d = Math.hypot(dx, dy);
      if (d >= need - 1e-6) continue;
      if (d < 1e-6) { const a = (i * 2.399963 + j) % (2 * Math.PI); dx = Math.cos(a); dy = Math.sin(a); } else { dx /= d; dy /= d; }   // on top of each other: any direction
      const push = (need - d) / 2 + 1e-3;
      p[i].x -= dx * push; p[i].y -= dy * push; p[j].x += dx * push; p[j].y += dy * push;
      moved = true;
    }
    for (let i = 0; i < n; i++) {                                  // never too far from the device it belongs to
      const ox = p[i].x - items[i].x, oy = p[i].y - items[i].y, o = Math.hypot(ox, oy), m = maxShift * items[i].r;
      if (o > m) { p[i].x = items[i].x + (ox / o) * m; p[i].y = items[i].y + (oy / o) * m; }
    }
    if (!moved) break;
  }
  return p.map((q, i) => ({ dx: q.x - items[i].x, dy: q.y - items[i].y }));
}

/** colour and opacity of the ball: the light's colour (or warm white) while on, a quiet grey-blue while off */
export function ballLook(on, rgb) {
  if (!on) return { color: BALL.off, opacity: 0.85 };
  return { color: Array.isArray(rgb) ? ((rgb[0] & 255) << 16) | ((rgb[1] & 255) << 8) | (rgb[2] & 255) : BALL.on, opacity: 1 };
}

export function initTapBalls(ctx) {   // ctx: ceiling(), labelsIn(group) -> [{ x, y, z }] (value labels the balls keep clear of)
  const fingerGeo = new THREE.SphereGeometry(BALL.finger, 10, 8), fingerMat = new THREE.MeshBasicMaterial({ visible: false });
  const balls = new Map();                 // device id -> { ball (the finger ball, parent), sprite, canvas, key, model, group, placed, base, home (after settle), icon }
  let unsettled = false;                   // a ball was placed anew: push the balls apart again (settle)
  let lastView = '';                       // camera and screen the balls were last pushed apart for on the screen (declutter)
  /** draw the round badge: the state colour with a light rim and the icon in the middle */
  function paint(b, color) {
    const key = `${color}`;
    if (b.key === key) return;
    b.key = key;
    const c = b.canvas, g = c.getContext('2d'), s = c.width, hex = `#${color.toString(16).padStart(6, '0')}`;
    g.clearRect(0, 0, s, s);
    g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 6, 0, Math.PI * 2);
    g.fillStyle = hex; g.fill();
    g.lineWidth = 6; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.stroke();
    g.font = `${Math.round(s * 0.5)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
    g.fillText(b.icon, s / 2, s / 2 + s * 0.03);
    b.sprite.material.map.needsUpdate = true;
  }
  /** a ball for device d next to its model in the floor group; returns it (for the pick list), or null when d does not want one.
   *  at: { x, y, z } in the floor group, a fixed place instead of over a model, and kind: what a tap on it hits (the roller shutter of a
   *  window, #331: 'opening'; its model is the window, which sits in a wall that sinks with the cutaway, so it is not measured) */
  function add(group, model, d, at = null, kind = 'device') {
    if (!wantsBall(d) || typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthTest: false }));
    sprite.scale.set(BALL.r * 2, BALL.r * 2, 1);
    sprite.renderOrder = 10;
    sprite.userData = { touchOnly: true };
    const ball = new THREE.Mesh(fingerGeo, fingerMat);              // the (invisible) finger ball is the tap target, the badge hangs in it
    ball.userData = { kind, id: d.id, tapBall: true, touchOnly: true };   // touchOnly: only the live mode can hit it (see pickHit)
    ball.add(sprite);
    ball.visible = false;
    group.add(ball);
    const b = { ball, sprite, canvas, key: '', model, group, placed: false, icon: ballIcon(d), at };
    balls.set(d.id, b);
    paint(b, BALL.off);
    return ball;
  }
  /** put a ball over its model: the model's size is measured (without its hit boxes) in the floor group's frame; a ball with a fixed
   *  place goes there */
  function place(b) {
    if (b.at) {
      b.base = { ...b.at };
      b.ball.position.set(b.base.x, b.base.y, b.base.z);
      unsettled = true;
      return true;
    }
    b.group.updateWorldMatrix(true, true);
    const box = new THREE.Box3(), inv = b.group.matrixWorld.clone().invert();
    b.model.traverse((o) => {
      if (!o.isMesh || o.userData.proxy || !o.geometry) return;
      o.geometry.computeBoundingBox();
      box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld).applyMatrix4(inv));
    });
    if (box.isEmpty()) return false;
    const c = box.getCenter(new THREE.Vector3());
    b.base = { x: c.x, y: ballY(box.min.y, box.max.y, ctx.ceiling()), z: c.z };
    b.ball.position.set(b.base.x, b.base.y, b.base.z);
    unsettled = true;
    return true;
  }
  /** show the ball of device `id` in the live mode only (placed over the model the first time it shows), in the colour of its state */
  function update(id, on, rgb, live, shown = true) {
    const b = balls.get(id);
    if (!b) return;
    if (b.ball.visible !== (live && shown)) lastView = '';
    b.ball.visible = live && shown;
    if (b.ball.visible && !b.placed) b.placed = place(b);
    const look = ballLook(on, rgb);
    paint(b, look.color); b.sprite.material.opacity = look.opacity;
  }
  /** after the balls were placed: the ones that show are pushed apart where they would cover each other, per floor (#244) */
  function settle() {
    if (!unsettled) return;
    unsettled = false;
    const byGroup = new Map();
    balls.forEach((b) => { if (b.ball.visible && b.placed && b.base) (byGroup.get(b.group) || byGroup.set(b.group, []).get(b.group)).push(b); });
    byGroup.forEach((list, group) => spreadBalls(list.map((b) => b.base), undefined, undefined, ctx.labelsIn?.(group) || [])
      .forEach((q, i) => { list[i].home = q; list[i].ball.position.set(q.x, q.y, q.z); }));
    lastView = '';
  }
  /** every frame: balls that land on each other on the screen move apart there (#314), sideways to the view; only worked out again when
   *  the camera, the screen size or the balls changed */
  const v = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
  function declutter(camera, W, H) {
    if (!camera?.isPerspectiveCamera || W < 10) return;
    camera.updateMatrixWorld();                                      // where the camera stands this frame (the renderer updates it only later)
    const list = [];
    balls.forEach((b) => { if (b.ball.visible && b.placed && b.home) list.push(b); });
    const key = `${W}x${H}|${list.length}|${camera.matrixWorld.elements.map((x) => x.toFixed(3)).join(',')}|${camera.fov}|${camera.aspect.toFixed(3)}`;
    if (key === lastView) return;
    lastView = key;
    if (list.length < 2) { list.forEach((b) => b.ball.position.set(b.home.x, b.home.y, b.home.z)); return; }
    const k = H / 2 / Math.tan((camera.fov * Math.PI) / 360);          // pixels per metre at distance 1
    const items = [], shown = [];
    list.forEach((b) => {
      b.group.updateWorldMatrix(true, false);
      const w = b.group.localToWorld(v.set(b.home.x, b.home.y, b.home.z)).clone(), dist = w.distanceTo(camera.position);
      v.copy(w).project(camera);
      if (v.z >= 1 || Math.abs(v.x) > 1.3 || Math.abs(v.y) > 1.3) { b.ball.position.set(b.home.x, b.home.y, b.home.z); return; }   // off screen: stays
      const ppu = k / Math.max(dist, 0.1);
      items.push({ x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, r: BALL.r * ppu });
      shown.push({ b, w, ppu });
    });
    right.set(1, 0, 0).applyQuaternion(camera.quaternion); up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    spreadScreen(items).forEach((o, i) => {
      const { b, w, ppu } = shown[i];
      w.addScaledVector(right, o.dx / ppu).addScaledVector(up, -o.dy / ppu);
      b.ball.position.copy(b.group.worldToLocal(w));
    });
  }
  /** the model changed (loaded later, moved): measure again the next time the ball shows */
  const moved = (id) => { const b = balls.get(id); if (b) b.placed = false; };
  /** everything may have moved (back in the live mode after editing): measure all again */
  const remeasure = () => balls.forEach((b) => { b.placed = false; });
  function clear() { balls.forEach((b) => { b.sprite.material.map.dispose(); b.sprite.material.dispose(); }); balls.clear(); }
  return { add, update, settle, declutter, moved, remeasure, clear, has: (id) => balls.has(id), shown: (id) => !!balls.get(id)?.ball.visible, ball: (id) => balls.get(id)?.ball || null };
}
