/* Value badges: keep them from covering each other. Badges that land on top of each other on the screen (two lamps at one spot) are pushed apart,
 * downwards one by one. Done with the sprite's anchor point (`center`), so the badge stays tied to its device. */
import * as THREE from './vendor/three.module.min.js';

/** the pure part: items { x, y, w, h } (screen pixels, sorted from top to bottom, then left to right) get a `shift` downwards so that nothing is covered any more */
export function placeBadges(items) {
  const placed = [];
  for (const it of items) {
    it.shift = 0;
    let moved = true, guard = 0;
    while (moved && guard++ < 12) {                                  // move down until nothing is covered any more
      moved = false;
      for (const o of placed) {
        if (Math.abs(it.x - o.x) < (it.w + o.w) / 2 && Math.abs(it.y + it.shift - (o.y + o.shift)) < (it.h + o.h) / 2) {
          it.shift = o.y + o.shift + (it.h + o.h) / 2 + 2 - it.y; moved = true;
        }
      }
    }
    placed.push(it);
  }
  return items;
}

/** ctx: settings(), labelSprites (Map), camera, canvas; returns declutterLabels(), to be called every frame */
export function initBadges(ctx) {
  const v = new THREE.Vector3();
  return function declutterLabels() {
    const { camera, canvas, labelSprites } = ctx;
    if (ctx.settings().labelMode === 'none' || labelSprites.size < 2 || !camera.isPerspectiveCamera) return;
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (W < 10) return;
    const k = H / 2 / Math.tan((camera.fov * Math.PI) / 360);          // pixels per world unit at distance 1
    const items = [];
    labelSprites.forEach((sp) => {
      if (!sp.visible || !sp.parent?.visible) return;
      sp.getWorldPosition(v);
      const dist = v.distanceTo(camera.position);
      v.project(camera);
      if (v.z >= 1 || Math.abs(v.x) > 1.3 || Math.abs(v.y) > 1.3) { sp.center.set(0.5, 0.5); return; }
      const ppu = k / Math.max(dist, 0.1), len = String(sp.userData.text || '').length;
      items.push({ sp, x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, ppu,
        w: Math.min(0.95, (len * 16 + 30) / 256) * sp.scale.x * ppu, h: 0.69 * sp.scale.y * ppu, shift: 0 });
    });
    items.sort((p, q) => p.y - q.y || p.x - q.x);
    placeBadges(items).forEach((it) => it.sp.center.set(0.5, 0.5 + it.shift / (it.sp.scale.y * it.ppu)));   // anchor up = badge down
  };
}
