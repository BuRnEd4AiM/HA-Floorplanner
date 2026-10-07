/* Picking in the 3D view (step 20 of the split, part 2, #137): the ray from the pointer into the scene, the point on the floor under it,
 * and what a click or tap hits. Which hits count and which one wins are the pure rules in pickrules.js. */
import * as THREE from './vendor/three.module.min.js';
import { skipInLive, linkedDevice, chooseHit, ballOnly } from './pickrules.js';

/** ctx: canvas, camera, pickables (the list of hit targets), isLive(), elev() (height of the open floor), floor(), layout(),
 *  power ({ hides(id), isMode(), pick(e, hits) }), findOpening(id), hasBall(id) (the device's tap ball is shown, #262) */
export function initPicking(ctx) {
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hitVec = new THREE.Vector3();
  function setRay(e) {
    const r = ctx.canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, ctx.camera);
  }
  /** the point [x, z] on the open floor under the pointer, null when the ray misses it */
  function groundPoint(e) {
    setRay(e);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -ctx.elev());
    return ray.ray.intersectPlane(plane, hitVec) ? [hitVec.x, hitVec.z] : null;
  }
  const stealth = (id) => !!ctx.floor()?.devices.find((v) => v.id === id)?.hideModel;
  const deviceOf = (id) => { for (const f of ctx.layout().floors) { const d = f.devices.find((v) => v.id === id); if (d) return d; } return null; };
  /** the type of the device a hit belongs to (null for anything else) */
  const devType = (data) => (data.kind === 'device' ? ctx.floor().devices.find((x) => x.id === data.id)?.type ?? null : null);
  /** what the pointer hits: { data: { kind, id, seg? }, point, distance } or null */
  function pickHit(e) {
    setRay(e);
    const live = ctx.isLive(), hits = [];
    for (const h of ray.intersectObjects(ctx.pickables, true)) {
      if (h.object.userData.touchOnly && !live) continue;                                       // the big finger box is for the live mode only
      let o = h.object, seg = h.object.userData.seg;
      while (o && !o.userData.kind) { o = o.parent; seg ??= o?.userData.seg; }
      if (o && live && skipInLive(o.userData, devType(o.userData))) continue;                  // live mode: doors, windows, camera cones and presence figures take no tap (#234)
      if (o && o.userData.kind === 'device' && ctx.power.hides(o.userData.id)) continue;        // the power editor: only power things are picked
      if (o && o.userData.cone) continue;                                                       // the cone of a camera is never hit, only the camera itself
      if (o && o.userData.kind === 'device' && live && (stealth(o.userData.id) || !linkedDevice(deviceOf(o.userData.id)))) continue;   // an invisible light, or a thing that is linked to nothing, cannot be tapped
      if (o && ballOnly(seg != null ? { ...o.userData, seg } : o.userData, live, ctx.hasBall || (() => false))) continue;   // live mode: a device with a ball only on its ball (#262)
      if (o) hits.push({ data: seg != null ? { ...o.userData, seg } : o.userData, point: h.point, distance: h.distance });   // seg: which LED ring section was tapped
    }
    if (ctx.power.isMode()) return ctx.power.pick(e, hits);           // the power editor: nothing but power devices and cables can be hit
    return chooseHit(hits, live, (id) => !!ctx.findOpening(id)?.opening.entity);
  }
  return { ray, setRay, groundPoint, pickHit, pick: (e) => pickHit(e)?.data ?? null };
}
