/* Tap balls (#238): in the live mode a small round badge floats over everything that can be tapped, with a little icon of what it controls
 * (#240), lit in the light's colour while it is on; it is a tap target of its own (with a bigger invisible finger ball). Pure placement,
 * icon and colour rules (unit test: tests/tapballs.test.mjs); the balls are three.js objects beside the device models in the floor group
 * (not inside them, so they never change a model's size). */
import * as THREE from './vendor/three.module.min.js';
import { LIVE_NO_TAP } from './pickrules.js';

export const BALL = { r: 0.22, finger: 0.28, gap: 0.04, maxShift: 0.9, lift: 0.26, ceilingGap: 0.08, on: 0xffc94d, off: 0x5d6f8a };

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

/** colour and opacity of the ball: the light's colour (or warm white) while on, a quiet grey-blue while off */
export function ballLook(on, rgb) {
  if (!on) return { color: BALL.off, opacity: 0.85 };
  return { color: Array.isArray(rgb) ? ((rgb[0] & 255) << 16) | ((rgb[1] & 255) << 8) | (rgb[2] & 255) : BALL.on, opacity: 1 };
}

export function initTapBalls(ctx) {   // ctx: ceiling(), labelsIn(group) -> [{ x, y, z }] (value labels the balls keep clear of)
  const fingerGeo = new THREE.SphereGeometry(BALL.finger, 10, 8), fingerMat = new THREE.MeshBasicMaterial({ visible: false });
  const balls = new Map();                 // device id -> { ball (the finger ball, parent), sprite, canvas, key, model, group, placed, base, icon }
  let unsettled = false;                   // a ball was placed anew: push the balls apart again (settle)
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
  /** a ball for device d next to its model in the floor group; returns it (for the pick list), or null when d does not want one */
  function add(group, model, d) {
    if (!wantsBall(d) || typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 96;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthTest: false }));
    sprite.scale.set(BALL.r * 2, BALL.r * 2, 1);
    sprite.renderOrder = 10;
    sprite.userData = { touchOnly: true };
    const ball = new THREE.Mesh(fingerGeo, fingerMat);              // the (invisible) finger ball is the tap target, the badge hangs in it
    ball.userData = { kind: 'device', id: d.id, tapBall: true, touchOnly: true };   // touchOnly: only the live mode can hit it (see pickHit)
    ball.add(sprite);
    ball.visible = false;
    group.add(ball);
    const b = { ball, sprite, canvas, key: '', model, group, placed: false, icon: ballIcon(d) };
    balls.set(d.id, b);
    paint(b, BALL.off);
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
    b.base = { x: c.x, y: ballY(box.min.y, box.max.y, ctx.ceiling()), z: c.z };
    b.ball.position.set(b.base.x, b.base.y, b.base.z);
    unsettled = true;
    return true;
  }
  /** show the ball of device `id` in the live mode only (placed over the model the first time it shows), in the colour of its state */
  function update(id, on, rgb, live, shown = true) {
    const b = balls.get(id);
    if (!b) return;
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
      .forEach((q, i) => list[i].ball.position.set(q.x, q.y, q.z)));
  }
  /** the model changed (loaded later, moved): measure again the next time the ball shows */
  const moved = (id) => { const b = balls.get(id); if (b) b.placed = false; };
  /** everything may have moved (back in the live mode after editing): measure all again */
  const remeasure = () => balls.forEach((b) => { b.placed = false; });
  function clear() { balls.forEach((b) => { b.sprite.material.map.dispose(); b.sprite.material.dispose(); }); balls.clear(); }
  return { add, update, settle, moved, remeasure, clear, has: (id) => balls.has(id), ball: (id) => balls.get(id)?.ball || null };
}
