/* Cutaway: the walls between the camera and the inside of the house sink down (setting "Auto") or become see-through, so you can look into the
 * rooms from every side; looking almost straight down keeps them. Roof fading and the cut through the earth are updated in the same frame.
 * The decisions are pure functions (tested); initCutaway moves the walls. */

export const CUT_LOW = 0.14;                    // height factor of a sunk wall

/** the wall normal that points away from the middle of the floor (cx, cz) */
export function outwardNormal(w, cx, cz) {
  const mid = [(w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2];
  const len = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) || 1;
  let n = [-(w.b[1] - w.a[1]) / len, (w.b[0] - w.a[0]) / len];
  if (n[0] * (mid[0] - cx) + n[1] * (mid[1] - cz) < 0) n = [-n[0], -n[1]];
  return n;
}
/** the direction from the middle of the floor to the camera on the ground (unit vector) and whether the camera looks almost straight down */
export function viewDirection(cam, cx, cz, floorY) {
  let dx = cam.x - cx, dz = cam.z - cz;
  const horiz = Math.hypot(dx, dz);
  const steep = horiz < (cam.y - floorY) * 0.25;
  dx /= horiz || 1; dz /= horiz || 1;
  return { dx, dz, steep };
}
/** where a wall should go: { low } = height factor (sunk or full), { fade } = opacity factor (see-through or solid).
 *  s: { lowWalls, halfCut, steep, cutaway, seeThrough, wallSee } */
export function wallTargets(n, dx, dz, s) {
  const toward = !s.lowWalls && !s.halfCut && !s.steep && (n[0] * dx + n[1] * dz) > 0.2;
  const sink = s.cutaway && toward && !s.seeThrough;          // see-through walls fade instead of sinking
  return { low: sink ? CUT_LOW : 1, fade: s.seeThrough && toward ? s.wallSee : 1 };
}
/** one smooth step from cur towards target (20 %), snapping when close */
export function approach(cur, target, eps) {
  const v = cur + (target - cur) * 0.2;
  return Math.abs(target - v) < eps ? target : v;
}

/** ctx: camera, elev(), settings(), lowWalls(), halfCut(), isLive(), walls() (the cut-away list of the active floor), center() ({ cx, cz }),
 *  roofsCount(), updateRoofFade(), updateEarthCut(), wallSee */
export function initCutaway(ctx) {
  /** the entry for a wall group of the active floor */
  function info(w, group) {
    const { cx, cz } = ctx.center();
    return { group, n: outwardNormal(w, cx, cz), low: 1 };
  }
  /** fade all materials of a wall to `f` (1 = as built); the built opacity is remembered on the material */
  function setWallFade(c, f) {
    if (c.fadeNow === f) return;
    c.fadeNow = f;
    c.group.traverse((o) => {
      if (!o.material || o.userData?.kind === 'handle') return;
      [].concat(o.material).forEach((m) => {
        const u = m.userData;
        if (u.baseOp === undefined) { u.baseOp = m.opacity; u.baseTr = m.transparent; u.baseDW = m.depthWrite; }
        const tr = f < 1 || u.baseTr;
        m.opacity = u.baseOp * f;
        m.depthWrite = f < 1 ? false : u.baseDW;
        if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; }
      });
    });
  }
  /** every frame */
  function update() {
    if (ctx.roofsCount()) ctx.updateRoofFade();
    ctx.updateEarthCut();
    const walls = ctx.walls();
    if (!walls.length) return;
    const { cx, cz } = ctx.center(), settings = ctx.settings();
    const { dx, dz, steep } = viewDirection(ctx.camera.position, cx, cz, ctx.elev());
    const s = { lowWalls: ctx.lowWalls(), halfCut: ctx.halfCut(), steep, cutaway: settings.cutaway, seeThrough: settings.seeThrough, wallSee: ctx.wallSee };
    const live = ctx.isLive();
    for (const c of walls) {
      const tg = wallTargets(c.n, dx, dz, s);
      c.low = approach(c.low, tg.low, 0.002);
      c.group.scale.y = c.low;
      c.fade = approach(c.fade ?? 1, tg.fade, 0.01);
      setWallFade(c, c.fade);
      const show = (c.low < 0.6 || c.fade < 0.6) && !live;
      c.handles?.forEach((h) => { h.outline.visible = show; });
    }
  }
  return { info, update };
}
