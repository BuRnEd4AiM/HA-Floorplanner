/* 🏠 The turning house on the Start page (5.28.0; the rules: housespin.js). The 3D view's own renderer draws it (no second copy of the
 * house in memory), from a camera of its own that circles the whole building shown: into a corner of the 3D canvas, which lies hidden
 * under the page, and from there into the page's own canvas. app.js calls frame(now) while the Start page lies over the house; nothing is
 * drawn while the picture is out of sight. A tap opens the 3D view from the same side, still turning until the first touch (handOff). */
import * as THREE from './vendor/three.module.min.js';
import { spinPose, spinStep, spinRegion, spinSeen, spinSpeed, SPIN_FPS } from './housespin.js';

/** ctx: renderer, scene, canvas (the 3D view's), fov, fps() (optional: fewer on a weak tablet), ready() (the whole house is built, before
 *  the first picture), house() ({ cx, cz, size, y0, y1 } of the building shown), prepare(cam) (the 3D view ready for this camera: the
 *  walls that sink between camera and house, the doors that move) */
export function initHouseSpin(ctx) {
  const el = document.createElement('canvas');
  el.className = 'apSpin'; el.setAttribute('aria-hidden', 'true');
  const g2 = el.getContext('2d');
  const cam = new THREE.PerspectiveCamera(ctx.fov || 50, 2, 0.1, 500);
  const keep = new THREE.Vector4(), cur = new THREE.Vector4();
  let angle = 0.7, last = 0, drawn = false;

  function frame(now) {
    if (!el.isConnected || !g2) return;
    if (now - last < 1000 / (ctx.fps?.() || SPIN_FPS) - 2) return;
    const r = el.getBoundingClientRect();
    if (!spinSeen(r, innerHeight)) { last = now; return; }          // scrolled away: it waits where it is
    const R = ctx.renderer, src = R.domElement, pr = R.getPixelRatio();
    const reg = spinRegion(r.width, r.height, src.width / pr, src.height / pr);
    if (!reg) return;
    ctx.ready?.();
    const b = ctx.house();
    if (!b) return;
    if (drawn) angle = spinStep(angle, now - last);
    last = now;
    cam.aspect = reg.w / reg.h; cam.updateProjectionMatrix();
    const p = spinPose(b, b.y0, b.y1, angle, { fov: cam.fov, aspect: cam.aspect });
    cam.position.set(...p.pos); cam.lookAt(...p.target);
    ctx.prepare?.(cam);
    const scissor = R.getScissorTest();
    R.getViewport(keep);
    try {
      R.setViewport(0, 0, reg.w, reg.h); R.setScissor(0, 0, reg.w, reg.h); R.setScissorTest(true);
      R.render(ctx.scene, cam);
      R.getCurrentViewport(cur);                                   // in the canvas's own pixels, counted from the bottom
      if (el.width !== cur.z || el.height !== cur.w) { el.width = cur.z; el.height = cur.w; }
      else g2.clearRect(0, 0, el.width, el.height);
      g2.drawImage(src, cur.x, src.height - cur.y - cur.w, cur.z, cur.w, 0, 0, cur.z, cur.w);
      drawn = true;
    } catch { /* a lost WebGL context: the card stays as it is */ } finally {
      R.setScissorTest(scissor); R.setViewport(keep);
    }
    const sky = ctx.canvas?.style.background || '';                // the sky of the hour and the weather (skyui.js), as in the 3D view
    if (el.style.background !== sky) el.style.background = sky;
  }
  /** the 3D view opens from the picture: its camera on the same side, turning on until the first touch; true when it turns */
  function handOff(camera, controls) {
    if (!drawn) return false;
    const t = controls.target, rh = Math.hypot(camera.position.x - t.x, camera.position.z - t.z);
    if (rh) { camera.position.x = t.x + rh * Math.sin(angle); camera.position.z = t.z + rh * Math.cos(angle); }
    controls.autoRotate = true; controls.autoRotateSpeed = spinSpeed();
    controls.update();
    return true;
  }
  return { el, frame, handOff, angle: () => angle, drawn: () => drawn };
}
