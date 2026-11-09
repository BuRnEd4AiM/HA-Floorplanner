/* 2D plan turning with the 3D view (#212): in "2D + 3D" the plan can turn so that the direction the camera looks points up.
 * The angle maths is pure (unit test: tests/planview.test.mjs); initPlanRotate wires the switch and follows the camera. */

/** the SVG rotation (degrees, clockwise on screen) that puts the camera's view direction (camera -> target, seen from above) up; 0 from straight above */
export function planAngle(cam, target) {
  const dx = target.x - cam.x, dz = target.z - cam.z;
  if (Math.hypot(dx, dz) < 1e-6) return 0;
  return normDeg(-90 - (Math.atan2(dz, dx) * 180) / Math.PI);
}
/** an angle in degrees brought into (-180, 180] */
export function normDeg(a) { let r = ((a % 360) + 360) % 360; if (r > 180) r -= 360; return r; }
/** turn the screen point p round c by deg (clockwise on screen, like SVG rotate) */
export function rotPoint([x, y], [cx, cy], deg) {
  const t = (deg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t), dx = x - cx, dy = y - cy;
  return [cx + dx * c - dy * s, cy + dx * s + dy * c];
}
/** a text along a line at `ang` degrees in a plan turned by `rot`: turn it by half a circle when it would stand on its head */
export function readableAngle(ang, rot) { const e = normDeg(ang + rot); return e > 90 || e < -90 ? normDeg(ang + 180) : ang; }

/** ctx: $, plan(), camera, controls, layoutMode() ('2d' | '3d' | 'split') */
export function initPlanRotate(ctx) {
  const { $ } = ctx;
  let on = false;
  try { on = localStorage.getItem('fp3d.planRotate') === '1'; } catch { /* not stored */ }
  const btn = $('#planRotateBtn');
  function sync() {
    const active = on && ctx.layoutMode() === 'split';
    ctx.plan()?.setRotation(active ? planAngle(ctx.camera.position, ctx.controls.target) : 0);
  }
  function render() { btn.classList.toggle('active', on); }            // the text comes from data-i18n
  btn.addEventListener('click', () => {
    on = !on;
    try { localStorage.setItem('fp3d.planRotate', on ? '1' : '0'); } catch { /* not stored */ }
    render(); sync();
  });
  ctx.controls.addEventListener('change', sync);
  render();
  return { sync, render, isOn: () => on };
}
