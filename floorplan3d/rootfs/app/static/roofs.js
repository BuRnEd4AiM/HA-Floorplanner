/* Roofs (#137, step 19): the roof box of a roof floor, the roof surfaces with dormers and further roofs, the railing round a roof terrace,
 * solar panels lying on the roof (#176) and the fading of the roofs when the camera comes close. The boxes are pure (unit test:
 * tests/roofs.test.mjs), the rest draws with three.js. */
import * as THREE from './vendor/three.module.min.js';
import { dormerParts } from './dormer.js';
import { onBridge } from './bridge.js';
import { roofFrame, solarPose } from './solarroof.js';

/** footprint (bounding box) of everything under a roof floor */
export function roofBoxOf(floors, i) {
  const b = floors[i]?.roof?.box;                  // size set by hand in the roof panel
  if (b && [b.x0, b.x1, b.z0, b.z1].every(Number.isFinite) && b.x1 > b.x0 && b.z1 > b.z0) return { x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 };
  return autoRoofBox(floors, i);
}
export function autoRoofBox(floors, i) {
  // a roof terrace (an open room) has no roof, and neither has what lies below it (the garage): their walls and rooms do not count
  const zones = floors.flatMap((f, fi) => f.rooms.filter((r) => r.terrace && r.points.length >= 3).map((r) => {
    const xs = r.points.map((p) => p[0]), zs = r.points.map((p) => p[1]);
    return { fi, x0: Math.min(...xs) - 0.2, x1: Math.max(...xs) + 0.2, z0: Math.min(...zs) - 0.2, z1: Math.max(...zs) + 0.2 };
  }));
  const open = (k, ps) => zones.some((z) => z.fi >= k && ps.every(([x, zz]) => x >= z.x0 && x <= z.x1 && zz >= z.z0 && zz <= z.z1));
  const pts = [];
  floors.forEach((f, k) => {
    if (k >= i || f.kind === 'basement' || f.kind === 'roof') return;
    f.walls.forEach((w) => { if (!open(k, [w.a, w.b])) pts.push(w.a, w.b); });
    f.rooms.forEach((r) => { if (!r.terrace && !open(k, r.points)) pts.push(...r.points); });
  });
  if (!pts.length) return null;
  const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
}
export function partBox(p) {
  const b = p?.box;
  return b && [b.x0, b.x1, b.z0, b.z1].every(Number.isFinite) && b.x1 > b.x0 && b.z1 > b.z0 ? { x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 } : null;
}

/** ctx: layout(), elev(i), mat(color, ghost, extra), HOLO, camera(), editingRoof(), settings(), wallSee */
export function initRoofs(ctx) {
  const roofs = [];                  // roofs that thin out when the camera comes close
  const mat = (...a) => ctx.mat(...a), HOLO = ctx.HOLO;
  /** Railing round a roof terrace: posts and two rails along every edge that is not a wall and where no bridge arrives (the bridges of
   *  this floor, and `bridges`: more bridge devices in this floor's frame, e.g. the one coming over from the next house) */
  function buildRailing(g, room, f, holo, ghost, bridges = []) {
    const pts = room.points, H = 1.0, step = 0.2;
    const mat = holo ? new THREE.MeshBasicMaterial({ color: 0x3df2ff, transparent: true, opacity: ghost ? 0.12 : 0.85 })
      : new THREE.MeshStandardMaterial({ color: '#8d949b', roughness: 0.45, metalness: 0.6, transparent: ghost, opacity: ghost ? 0.25 : 1 });
    const landing = [...(f.devices || []).filter((d) => d.type === 'bridge'), ...bridges];
    const covered = (x, z) => landing.some((d) => onBridge(d, x, z)) || f.walls.some((w) => {                          // a wall (also in a doorway) already closes this spot
      const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], l2 = dx * dx + dz * dz || 1;
      const k = Math.max(0, Math.min(1, ((x - w.a[0]) * dx + (z - w.a[1]) * dz) / l2));
      return Math.hypot(x - (w.a[0] + k * dx), z - (w.a[1] + k * dz)) < (w.thickness || 0.2) / 2 + 0.12;
    });
    const bar = (x0, z0, x1, z1, y, th) => {
      const len = Math.hypot(x1 - x0, z1 - z0);
      const m = new THREE.Mesh(new THREE.BoxGeometry(len, th, th), mat);
      m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
      m.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
      g.add(m);
    };
    const post = (x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.05, H, 0.05), mat); m.position.set(x, H / 2, z); g.add(m); };
    for (let i = 0; i < pts.length; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[(i + 1) % pts.length], len = Math.hypot(bx - ax, bz - az);
      if (len < 0.1) continue;
      const n = Math.max(1, Math.ceil(len / step)), at = (u) => [ax + (bx - ax) * u, az + (bz - az) * u];
      let run = null;
      const flush = (end) => {
        if (run === null) return;                                       // a stretch that starts at the corner starts at 0 (was skipped before)
        const [x0, z0] = at(run), [x1, z1] = at(end);
        if (Math.hypot(x1 - x0, z1 - z0) > 0.15) {
          bar(x0, z0, x1, z1, H, 0.05); bar(x0, z0, x1, z1, H * 0.5, 0.035);
          const posts = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 1.2));
          for (let p = 0; p <= posts; p++) post(x0 + ((x1 - x0) * p) / posts, z0 + ((z1 - z0) * p) / posts);
        }
        run = null;
      };
      for (let k = 0; k < n; k++) {
        const [mx, mz] = at((k + 0.5) / n);
        if (covered(mx, mz)) flush(k / n); else if (run === null) run = k / n;
      }
      flush(1);
    }
  }
  /** roof surface as triangles; pitch in degrees, ridge along the longer side unless set */
  function roofGeometry(bb, r) {
    const { alongX, a0, a1, b0, b1, bc, h, ins } = roofFrame(bb, r);       // a = ridge axis, b = across (shared with the solar panels on the roof)
    const P = (a, b, y) => (alongX ? [a, y, b] : [b, y, a]);
    const tris = [];
    const quad = (p, q, u, v) => tris.push(p, q, u, p, u, v);
    if (r.type === 'flat') {
      quad(P(a0, b0, 0.1), P(a1, b0, 0.1), P(a1, b1, 0.1), P(a0, b1, 0.1));
      quad(P(a0, b0, 0), P(a0, b1, 0), P(a1, b1, 0), P(a1, b0, 0));
    } else {
      quad(P(a0, b0, 0), P(a1, b0, 0), P(a1 - ins, bc, h), P(a0 + ins, bc, h));
      quad(P(a1, b1, 0), P(a0, b1, 0), P(a0 + ins, bc, h), P(a1 - ins, bc, h));
      tris.push(P(a0, b1, 0), P(a0, b0, 0), P(a0 + ins, bc, h));
      tris.push(P(a1, b0, 0), P(a1, b1, 0), P(a1 - ins, bc, h));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
    geo.computeVertexNormals();
    return geo;
  }
  /** one roof (the main one, or a further one of the house): `spec` has type / pitch / overhang / dormers, `bb` is its base, `y0` lifts it onto the floor it sits on */
  function drawRoof(g, bb, spec, y0, tag, holo, ghost) {
    const geo = roofGeometry(bb, spec);
    const m = new THREE.Mesh(geo, holo
      ? new THREE.MeshBasicMaterial({ color: 0x123f96, transparent: true, opacity: ghost ? 0.15 : 0.45, side: THREE.DoubleSide, depthWrite: false })
      : mat('#a4493b', ghost, { side: THREE.DoubleSide }));
    const mats = [m.material];
    if (holo) { const em = new THREE.LineBasicMaterial({ color: HOLO.edge, transparent: true, opacity: 0.9 }); m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), em)); mats.push(em); }
    m.position.y = y0; m.userData.roofPart = tag;
    g.add(m);
    const fade = (mesh, ms) => { if (!ghost) roofs.push({ mesh, mats: ms.map((x) => ({ x, base: x.opacity, transparent: x.transparent, depthWrite: x.depthWrite })), box: null }); };
    fade(m, mats);
    (spec.dormers || []).forEach((d) => {                                 // dormers (Gauben): wall, little roof and window out of one slope
      const parts = dormerParts(bb, spec, d);
      if (!parts) return;
      const part = (tris, material, edgeAngle) => {
        if (!tris.length) return;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
        geo.computeVertexNormals();
        const pm = new THREE.Mesh(geo, material), ms = [material];
        if (holo) { const em = new THREE.LineBasicMaterial({ color: HOLO.edge, transparent: true, opacity: 0.9 }); pm.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, edgeAngle), em)); ms.push(em); }
        pm.position.y = y0; pm.userData.roofPart = tag;
        g.add(pm); fade(pm, ms);
      };
      const hm = (opacity) => new THREE.MeshBasicMaterial({ color: 0x123f96, transparent: true, opacity: ghost ? 0.15 : opacity, side: THREE.DoubleSide, depthWrite: false });
      part(parts.wall, holo ? hm(0.5) : mat('#d9d3c6', ghost, { side: THREE.DoubleSide }), 20);
      part(parts.roof, holo ? hm(0.45) : mat('#8f3b2f', ghost, { side: THREE.DoubleSide }), 20);
      part(parts.glass, new THREE.MeshBasicMaterial({ color: holo ? 0x3df2ff : 0x9fd4ff, transparent: true, opacity: ghost ? 0.2 : 0.75, side: THREE.DoubleSide, depthWrite: false }), 90);
    });
  }
  /** the roofs of roof floor i: the main one and further roofs, each with its base box and lift (also where solar panels lie, #176) */
  function roofList(i) {
    const f = ctx.layout().floors[i], out = [];
    if (f?.kind !== 'roof') return out;
    const bb = roofBoxOf(ctx.layout().floors, i);
    if (bb) out.push({ bb, spec: f.roof || (f.roof = { type: 'gable', pitch: 35, overhang: 0.4 }), y0: 0, tag: 'main' });
    (f.roof?.parts || []).forEach((p, pi) => {                              // further roofs: an annex with its own roof, on the floor it stands on
      const pb = partBox(p);
      if (!pb) return;
      const lv = ctx.layout().floors.findIndex((x) => x.id === p.level);
      out.push({ bb: pb, spec: p, y0: lv >= 0 && ctx.layout().floors[lv].kind !== 'roof' ? ctx.elev(lv + 1) - ctx.elev(i) : 0, tag: p.id || `part${pi}` });   // the same id as roofmove.js uses
    });
    return out;
  }
  function buildRoof(g, i, f, holo, ghost) { roofList(i).forEach((R) => drawRoof(g, R.bb, R.spec, R.y0, R.tag, holo, ghost)); }
  /** a solar panel on the roof floor lies on the roof surface (#176): height and tilt follow the roof under it */
  function placeSolar(model, d, list) {
    const sol = solarPose(d, list);
    model.position.y = (d.y ?? 0) + sol.y;
    const deg = THREE.MathUtils.degToRad;
    model.rotation.x = sol.tilt ? sol.tilt.tiltX : deg(d.tiltX || 0); model.rotation.z = sol.tilt ? sol.tilt.tiltZ : deg(d.tiltZ || 0);
    return sol;
  }
  function updateRoofFade() {
    for (const r of roofs) {
      if (!r.box) { r.mesh.updateWorldMatrix(true, false); r.box = new THREE.Box3().setFromObject(r.mesh); }
      const d = r.box.distanceToPoint(ctx.camera().position);
      const editing = ctx.editingRoof();                                            // the roof floor is open: the roof (and its dormers) must stay clearly visible
      const k = Math.max(editing ? 0.85 : 0.12, Math.min(ctx.settings().seeThrough && !editing ? ctx.wallSee : 1, (d - 2.5) / 4.5));          // fully there beyond ~7 m, mostly gone up close; with see-through walls the roof stays see-through from afar too
      r.mats.forEach((m) => { m.x.opacity = m.base * k; m.x.transparent = m.transparent || k < 0.999; m.x.depthWrite = m.depthWrite && k > 0.95; });
    }
  }
  return {
    box: (i) => roofBoxOf(ctx.layout().floors, i), autoBox: (i) => autoRoofBox(ctx.layout().floors, i), list: roofList,
    build: buildRoof, railing: buildRailing, placeSolar, updateFade: updateRoofFade, reset: () => { roofs.length = 0; }, faded: roofs,
  };
}
