/* Ground: earth around the basement with lawn on top (or a light hint of it), the plot outline as its shape when one is drawn, and in the
 * whole-house view a cut through the earth on the camera's side like a section drawing: soil layers from the lawn down to the bottom of the
 * basement. The outline of the house and where the cut line runs through earth are pure functions (tested); initEarth builds the meshes. */
import * as THREE from './vendor/three.module.min.js';
import polygonClipping from './vendor/polygon-clipping.js';

/** outline of the house at ground level: walls (with their thickness) and rooms / blocks of the floors up to the ground floor (or of the
 *  basements only), merged into outer rings [[x, z], ...] */
export function houseFootprint(floors, groundIdx, basementsOnly = false) {
  const polys = [];
  floors.slice(0, groundIdx + 1).filter((f) => !basementsOnly || f.kind === 'basement').forEach((f) => {
    f.walls.forEach((w) => {
      const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], L = Math.hypot(dx, dz);
      if (L < 1e-3) return;
      const t = (w.thickness || 0.2) / 2 + 0.01, nx = (-dz / L) * t, nz = (dx / L) * t, ex = (dx / L) * t, ez = (dz / L) * t;
      polys.push([[[w.a[0] - ex + nx, w.a[1] - ez + nz], [w.b[0] + ex + nx, w.b[1] + ez + nz], [w.b[0] + ex - nx, w.b[1] + ez - nz], [w.a[0] - ex - nx, w.a[1] - ez - nz], [w.a[0] - ex + nx, w.a[1] - ez + nz]]]);
    });
    [...f.rooms, ...(f.blocks || [])].forEach((r) => { if (r.points.length >= 3) polys.push([[...r.points.map((p) => [p[0], p[1]]), [r.points[0][0], r.points[0][1]]]]); });   // placeholder blocks are house too
  });
  if (!polys.length) return [];
  try { return polygonClipping.union(...polys).map((poly) => poly[0].slice(0, -1)); } catch { return []; }   // outer rings only
}
/** where a cut line (point p, direction u) runs through earth: the line parameters where it crosses the edges of the ground outline and the
 *  house (even-odd), sorted; pairs [t0, t1], [t2, t3] ... are the stretches in the earth */
export function cutCrossings(px, pz, ux, uz, rings) {
  const ts = [];
  rings.forEach((ring) => ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length], ex = b[0] - a[0], ez = b[1] - a[1], den = ux * ez - uz * ex;
    if (Math.abs(den) < 1e-9) return;
    const t = ((a[0] - px) * ez - (a[1] - pz) * ex) / den, k = ((a[0] - px) * uz - (a[1] - pz) * ux) / den;
    if (k >= 0 && k < 1) ts.push(t);
  }));
  return ts.sort((x, y) => x - y);
}
/** the facade the camera looks at (dx, dz is one of the four axis directions) and where the cut plane goes: just inside that outer wall.
 *  Returns null when the camera is straight above the middle. */
export function cutPlane(cam, info) {
  let dx = cam.x - info.cx, dz = cam.z - info.cz;
  if (Math.hypot(dx, dz) < 1e-3) return null;
  if (Math.abs(dx) > Math.abs(dz)) { dx = Math.sign(dx); dz = 0; } else { dz = Math.sign(dz); dx = 0; }
  const ext = Math.max(...info.corners.map(([x, z]) => (x - info.cx) * dx + (z - info.cz) * dz)) - 0.08;   // the basement wall is laid bare
  return { dx, dz, px: info.cx + dx * ext, pz: info.cz + dz * ext };
}

/** ctx: layout(), groundIdx(), floorH, settings(), houseMode() */
export function initEarth(ctx) {
  const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), -1000);   // nothing cut until the camera says where
  let info = null;                                                     // { cx, cz, corners, rings, depth, cap, key } while the earth is cut
  let lawn = false, ground = false, box = null;                        // solid lawn is drawn / any ground is drawn (it replaces the grid)
  let soilTex = null;
  function soilTexture() {                       // earth layers for the sides and the cut: topsoil, loam, clay, gravel
    if (soilTex) return soilTex;
    const c = document.createElement('canvas'); c.width = 64; c.height = 256;
    const x = c.getContext('2d');
    [[0, 22, '#4f6b2e'], [22, 70, '#5a3d24'], [70, 150, '#7a5634'], [150, 210, '#8d6a44'], [210, 256, '#6e6155']].forEach(([a, b, col]) => { x.fillStyle = col; x.fillRect(0, a, 64, b - a); });
    for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${i % 3 ? '30,20,10' : '200,180,150'},${0.15 + (i % 5) * 0.05})`; x.fillRect((i * 37) % 64, 22 + ((i * 53) % 234), 2, 2); }
    soilTex = new THREE.CanvasTexture(c);
    soilTex.wrapS = soilTex.wrapT = THREE.RepeatWrapping;
    soilTex.colorSpace = THREE.SRGBColorSpace;
    return soilTex;
  }
  function reset() { info = null; lawn = false; ground = false; }
  function build(world, holo) {
    const layout = ctx.layout(), settings = ctx.settings(), nb = ctx.groundIdx();
    const foot = houseFootprint(layout.floors, nb);
    if (!foot.length) return;
    const xs = foot.flat().map((p) => p[0]), zs = foot.flat().map((p) => p[1]);
    const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
    const all = layout.floors.flatMap((f) => [...f.walls.flatMap((w) => [w.a, w.b]), ...f.rooms.flatMap((r) => r.points), ...(f.blocks || []).flatMap((b) => b.points)]);
    const ax = all.map((p) => p[0]), az = all.map((p) => p[1]);                  // the whole house, upper floors and blocks included
    const [hx0, hx1, hz0, hz1] = [Math.min(x0, ...ax), Math.max(x1, ...ax), Math.min(z0, ...az), Math.max(z1, ...az)];
    const margin = Math.max(0.5, +settings.earthMargin || 5);                      // ⚙ "lawn around the house"
    const outline = layout.plot?.boundary?.length >= 3 ? layout.plot.boundary
      : [[hx0 - margin, hz0 - margin], [hx1 + margin, hz0 - margin], [hx1 + margin, hz1 + margin], [hx0 - margin, hz1 + margin]];
    const depth = nb > 0 ? nb * ctx.floorH + 0.4 : 0.4;   // without a basement: a slab of ground the house stands on
    let holes = nb > 0 ? houseFootprint(layout.floors, nb, true) : foot;           // only the basement is cut out of the earth: parts without one (garage ...) stand on the ground
    if (layout.plot?.boundary?.length >= 3) {                     // a plot smaller than the house: only cut out what lies on it
      try { holes = polygonClipping.intersection(holes.map((r) => [[...r, r[0]]]), [[...outline, outline[0]]]).map((poly) => poly[0].slice(0, -1)); } catch { /* keep the house outline */ }
    }
    box = [Math.min(...outline.map((p) => p[0])), Math.max(...outline.map((p) => p[0])), Math.min(...outline.map((p) => p[1])), Math.max(...outline.map((p) => p[1]))];
    const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, -z)));
    holes.forEach((ring) => shape.holes.push(new THREE.Path(ring.map(([x, z]) => new THREE.Vector2(x, -z)))));
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -depth - 0.02, 0);
    const solid = settings.earth === 'solid', cut = solid && nb > 0 && ctx.houseMode(), clip = cut ? [plane] : [];   // without a basement there is nothing to show in a cut
    const tex = soilTexture().clone(); tex.needsUpdate = true; tex.repeat.set(0.5, 1 / depth);
    const lawnMat = new THREE.MeshBasicMaterial({ color: holo ? 0x1d6b4a : 0x6fa858, transparent: !solid || holo, opacity: solid ? (holo ? 0.85 : 1) : 0.2, depthWrite: solid, side: THREE.DoubleSide, clippingPlanes: clip });
    const soil = new THREE.MeshBasicMaterial({ map: solid ? tex : null, color: solid ? (holo ? 0x8a6a8a : 0xffffff) : 0x6b4a2f, transparent: !solid || holo, opacity: solid ? (holo ? 0.9 : 1) : 0.22, depthWrite: solid, side: THREE.DoubleSide, clippingPlanes: clip });
    const none = new THREE.MeshBasicMaterial({ visible: false });
    const earth = new THREE.Mesh(geo, [none, soil]);              // the block: only its sides (soil); its caps are not drawn ...
    earth.renderOrder = -1;
    const top = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2), lawnMat);   // ... the lawn on top is a mesh of its own,
    top.position.y = -0.02;                                       // so looking into the cut never shows a green bottom
    top.renderOrder = -1;
    world.add(top);
    earth.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), new THREE.LineBasicMaterial({ color: holo ? 0x3dffb0 : 0x7a5a38, transparent: true, opacity: holo ? 0.5 : 0.6, clippingPlanes: clip })));
    world.add(earth);
    lawn = solid; ground = true;
    if (cut) {
      const cap = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ map: tex, color: holo ? 0x8a6a8a : 0xffffff, transparent: holo, opacity: holo ? 0.9 : 1, side: THREE.DoubleSide }));
      world.add(cap);
      info = { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, corners: [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], rings: [outline, ...holes], depth, cap, key: '' };
    }
  }
  /** the face of the cut: a wall of soil layers from the lawn down to the bottom of the basement where the cut line runs through earth */
  function capGeometry(px, pz, ux, uz, rings, depth) {
    const ts = cutCrossings(px, pz, ux, uz, rings);
    const pos = [], uv = [], top = -0.02, bot = -depth - 0.02;
    for (let i = 0; i + 1 < ts.length; i += 2) {
      const [t0, t1] = [ts[i], ts[i + 1]], A = [px + ux * t0, pz + uz * t0], B = [px + ux * t1, pz + uz * t1];
      pos.push(A[0], bot, A[1], B[0], bot, B[1], B[0], top, B[1], A[0], bot, A[1], B[0], top, B[1], A[0], top, A[1]);
      uv.push(t0 / 2, 0, t1 / 2, 0, t1 / 2, 1, t0 / 2, 0, t1 / 2, 1, t0 / 2, 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return g;
  }
  /** the cut follows the camera: the earth in front of the facade that faces the camera is taken away */
  function updateCut(camPos) {
    if (!info) return;
    const c = cutPlane(camPos, info);
    if (!c) { plane.set(new THREE.Vector3(0, -1, 0), -1000); info.cap.visible = false; return; }   // straight from above: nothing to cut
    plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(-c.dx, 0, -c.dz), new THREE.Vector3(c.px, 0, c.pz));
    const key = `${Math.round(Math.atan2(c.dz, c.dx) * 200)}`;            // rebuild the cut face only when the view turned a little
    if (key === info.key) return;
    info.key = key;
    info.cap.geometry.dispose();
    info.cap.geometry = capGeometry(c.px - c.dx * 0.01, c.pz - c.dz * 0.01, -c.dz, c.dx, info.rings, info.depth);
    info.cap.visible = true;
  }
  return { plane, build, reset, updateCut, cut: () => !!info, info: () => info, lawn: () => lawn, ground: () => ground, box: () => box };
}
