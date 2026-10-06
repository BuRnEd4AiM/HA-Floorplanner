/* Tap balls (#238): in the live mode a small round badge floats over everything that can be tapped, with a little icon of what it controls
 * (#240), lit in the light's colour while it is on; it is a tap target of its own (with a bigger invisible finger ball). Pure placement,
 * icon and colour rules (unit test: tests/tapballs.test.mjs); the balls are three.js objects beside the device models in the floor group
 * (not inside them, so they never change a model's size). */
import * as THREE from './vendor/three.module.min.js';
import { LIVE_NO_TAP } from './pickrules.js';

export const BALL = { r: 0.16, finger: 0.26, lift: 0.26, ceilingGap: 0.08, on: 0xffc94d, off: 0x5d6f8a };

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

/** colour and opacity of the ball: the light's colour (or warm white) while on, a quiet grey-blue while off */
export function ballLook(on, rgb) {
  if (!on) return { color: BALL.off, opacity: 0.85 };
  return { color: Array.isArray(rgb) ? ((rgb[0] & 255) << 16) | ((rgb[1] & 255) << 8) | (rgb[2] & 255) : BALL.on, opacity: 1 };
}

/** ctx: ceiling() (the room height) */
export function initTapBalls(ctx) {
  const fingerGeo = new THREE.SphereGeometry(BALL.finger, 10, 8), fingerMat = new THREE.MeshBasicMaterial({ visible: false });
  const balls = new Map();                 // device id -> { ball (the finger ball, parent), sprite, canvas, key, model, group, placed, icon }
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
    paint(b, look.color); b.sprite.material.opacity = look.opacity;
  }
  /** the model changed (loaded later, moved): measure again the next time the ball shows */
  const moved = (id) => { const b = balls.get(id); if (b) b.placed = false; };
  /** everything may have moved (back in the live mode after editing): measure all again */
  const remeasure = () => balls.forEach((b) => { b.placed = false; });
  function clear() { balls.forEach((b) => { b.sprite.material.map.dispose(); b.sprite.material.dispose(); }); balls.clear(); }
  return { add, update, moved, remeasure, clear, has: (id) => balls.has(id), ball: (id) => balls.get(id)?.ball || null };
}
