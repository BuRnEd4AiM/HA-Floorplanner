/* Roofs (#137, step 19): the roof box of a roof floor, the roof surfaces with dormers (gable, flat, shed; a hole in the slope under each,
 * #339) and roof windows (a hole and a flashing round it, #643, skylight.js; the window itself is drawn with the floor it belongs to), steps in the eaves (#342) and further roofs, the gable walls in the colour of the walls and the shed roof (#628, roofshape.js), the railing round a roof terrace (built in balcony3d.js),
 * solar panels lying on the roof (#176), roofs cut into each other where they meet (the wing of an L-shaped house, #621, roofcut.js) and the fading of the roofs when the camera comes close. The boxes are pure (unit test:
 * tests/roofs.test.mjs), the rest draws with three.js. */
import * as THREE from './vendor/three.module.min.js';
import { dormerParts, roofSurface, fitDormer } from './dormer.js';
import { skylightParts, skylightsAllowed } from './skylight.js';
import { frontHoles } from './dormerwin.js';
import { intervals } from './roofsteps.js';
import { buildRailing } from './balcony3d.js';   // the railing of a roof terrace or a balcony (#646)
import { roofFrame, solarPose } from './solarroof.js';
import { roofY0, partY0, wallTopOf, clipRoofFloor, roofPlanes, dormerRooms, roofOverRoom, roofReach, joinCuts, planesAt } from './attic.js';
import { gableWalls, wallTris, wallThickness, wallHeightOf } from './roofshape.js';
import { facadeOf, facadeFinish } from './facade.js';
import { finishMaterial } from './finishtex.js';
import { wallUV, resolve } from './finishes.js';
import { polyUniforms, clipToPoly } from './atticclip.js';
import { wallPieces } from './roomclip.js';
import { roofSolids, liftSolids, cutTris } from './roofcut.js';

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
    f.walls.flatMap((w) => wallPieces(w, f.wallCuts)).forEach((w) => { if (!open(k, [w.a, w.b])) pts.push(w.a, w.b); });   // one building of several: its parts (#451)
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

/** ctx: layout(), elev(i), mat(color, ghost, extra), HOLO, camera(), editingRoof(), settings(), wallSee, roofShown(i, R) and roofFloors(i)
 *  (several buildings in one plan, #409: which roofs are drawn, the floors the main roof takes its size from), groundAt(x, z) (a plateau
 *  under the roof lifts it with the house, #566; optional) */
export function initRoofs(ctx) {
  /** how much a roof goes up with the plateau under the middle of its box (levels.js) */
  const liftOf = (R) => ctx.groundAt?.((R.bb.x0 + R.bb.x1) / 2, (R.bb.z0 + R.bb.z1) / 2) || 0;
  const roofs = [];                  // roofs that thin out when the camera comes close
  const mat = (...a) => ctx.mat(...a), HOLO = ctx.HOLO;
  /** roof surface as triangles; pitch in degrees, ridge along the longer side unless set; the slopes have a hole under each dormer (#339);
   *  without what lies inside another roof of the floor (cut: its solids in this roof's frame, roofcut.js; the wing of an L-shaped house) */
  function roofGeometry(bb, r, cut = []) {
    const tris = [];
    if (r.type === 'flat') {
      const { alongX, a0, a1, b0, b1 } = roofFrame(bb, r);                  // a = ridge axis, b = across (shared with the solar panels on the roof)
      const P = (a, b, y) => (alongX ? [a, y, b] : [b, y, a]);
      const quad = (p, q, u, v) => tris.push(p, q, u, p, u, v);
      intervals(bb, r, a0, a1).forEach(({ a0: p0, a1: p1, out0, out1 }) => {   // with steps (#342) one piece per stretch where no eave changes
        const q0 = b0 - out0, q1 = b1 + out1;
        quad(P(p0, q0, 0.1), P(p1, q0, 0.1), P(p1, q1, 0.1), P(p0, q1, 0.1));
        quad(P(p0, q0, 0), P(p0, q1, 0), P(p1, q1, 0), P(p1, q0, 0));
      });
    } else tris.push(...roofSurface(bb, r));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(cutTris(tris, cut).flat(), 3));
    geo.computeVertexNormals();
    return geo;
  }
  /** one roof (the main one, or a further one of the house): `spec` has type / pitch / overhang / dormers, `bb` is its base, `y0` lifts it onto the floor it sits on */
  function drawRoof(g, bb, spec, y0, tag, holo, ghost, holesOf = () => [], gable = null, cut = []) {
    const geo = roofGeometry(bb, spec, cut);
    const m = new THREE.Mesh(geo, holo
      ? new THREE.MeshBasicMaterial({ color: 0x123f96, transparent: true, opacity: ghost ? 0.15 : 0.45, side: THREE.DoubleSide, depthWrite: false })
      : mat('#a4493b', ghost, { side: THREE.DoubleSide }));
    const mats = [m.material];
    if (holo) { const em = new THREE.LineBasicMaterial({ color: HOLO.edge, transparent: true, opacity: 0.9 }); m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), em)); mats.push(em); }
    m.position.y = y0; m.userData.roofPart = tag;
    g.add(m);
    const fade = (mesh, ms) => { if (!ghost) roofs.push({ mesh, mats: ms.map((x) => ({ x, base: x.opacity, transparent: x.transparent, depthWrite: x.depthWrite })), box: null }); };
    fade(m, mats);
    const walls = gable ? gableWalls(bb, spec, gable) : [];               // the gables are walls on the house (#628), in the walls' colour or the facade's finish
    if (walls.length) {
      const fin = !holo && !ghost ? resolve(facadeFinish(ctx.settings())) : null, pos = [], uv = [];
      walls.forEach((w) => { const t = wallTris(w); pos.push(...t.pos.flat()); uv.push(...t.uv.flatMap(([u, v]) => (fin ? wallUV(fin, 1, u, v) : [u, v]))); });
      const wgeo = new THREE.BufferGeometry();
      wgeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      wgeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      wgeo.computeVertexNormals();
      const wm = new THREE.Mesh(wgeo, holo ? new THREE.MeshBasicMaterial({ color: 0x123f96, transparent: true, opacity: ghost ? 0.15 : 0.5, depthWrite: false })
        : fin ? finishMaterial(fin, ctx.fast?.()) : mat(facadeOf(ctx.settings()).wall, ghost));
      const wms = [wm.material];
      if (holo) { const em = new THREE.LineBasicMaterial({ color: HOLO.edge, transparent: true, opacity: 0.9 }); wm.add(new THREE.LineSegments(new THREE.EdgesGeometry(wgeo, 20), em)); wms.push(em); }
      wm.position.y = y0; wm.userData.roofPart = tag; wm.userData.gableWall = true;
      g.add(wm); fade(wm, wms);
    }
    /** one part of a dormer or a roof window as its own mesh (key: dormerPart or skylightPart, name: what it is) */
    const part = (tris, material, edgeAngle, name, key = 'dormerPart') => {
      if (!tris.length) return;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
      geo.computeVertexNormals();
      const pm = new THREE.Mesh(geo, material), ms = [material];
      if (holo) { const em = new THREE.LineBasicMaterial({ color: HOLO.edge, transparent: true, opacity: 0.9 }); pm.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, edgeAngle), em)); ms.push(em); }
      pm.position.y = y0; pm.userData.roofPart = tag; pm.userData[key] = name;
      g.add(pm); fade(pm, ms);
    };
    const hm = (opacity) => new THREE.MeshBasicMaterial({ color: 0x123f96, transparent: true, opacity: ghost ? 0.15 : opacity, side: THREE.DoubleSide, depthWrite: false });
    const glassMat = () => new THREE.MeshBasicMaterial({ color: holo ? 0x3df2ff : 0x9fd4ff, transparent: true, opacity: ghost ? 0.2 : 0.75, side: THREE.DoubleSide, depthWrite: false });
    (spec.dormers || []).forEach((d) => {                                 // dormers (Gauben): wall, little roof and window out of one slope
      const parts = dormerParts(bb, spec, d, holesOf(d));
      if (!parts) return;
      part(parts.wall, holo ? hm(0.5) : mat('#d9d3c6', ghost, { side: THREE.DoubleSide }), 20, 'wall');
      part(parts.roof, holo ? hm(0.45) : mat('#8f3b2f', ghost, { side: THREE.DoubleSide }), 20, 'roof');
      if (!d.window || d.hostWall) part(parts.glass, glassMat(), 90, 'glass');
    });
    (skylightsAllowed(spec) ? spec.skylights || [] : []).forEach((s) => {   // roof windows (#643): the flashing round the hole in the slope
      const parts = skylightParts(bb, spec, s);
      if (!parts) return;
      part(parts.flashing, holo ? hm(0.6) : mat('#4a4f55', ghost, { side: THREE.DoubleSide, roughness: 0.5, metalness: 0.4 }), 20, 'flashing', 'skylightPart');
      if (!s.window) part(parts.glass, glassMat(), 90, 'glass', 'skylightPart');   // the real window (with the floor it belongs to) is not there yet
    });
  }
  /** the roofs of roof floor i: the main one and further roofs, each with its base box and lift (also where solar panels lie, #176) */
  function roofList(i) {
    const f = ctx.layout().floors[i], out = [];
    if (f?.kind !== 'roof') return out;
    const bb = roofBoxOf(ctx.roofFloors?.(i) || ctx.layout().floors, i);   // the main roof of one building of several follows that one (#409)
    const spec = f.roof || (f.roof = { type: 'gable', pitch: 35, overhang: 0.4 }), floors = ctx.layout().floors;
    const under = floors.slice(0, i).reverse().find((x) => x.kind !== 'roof' && x.kind !== 'basement'), t = wallThickness(under);
    // from: where the walls under it end, over the base of the roof (a knee wall: up at the roof floor; the walls are lower than a storey:
    // the gap down to them is closed too), for its gable walls (#628); t: their thickness
    const gap = (fl) => Math.max(0, (ctx.floorH || 0) - wallHeightOf(fl, ctx.settings().wallHeight));
    if (bb) { const y0 = roofY0(floors, i, ctx.elev); out.push({ bb, spec, y0, tag: 'main', from: -y0 - gap(under), t }); }   // on a knee wall it starts lower down (#260, #265)
    (f.roof?.parts || []).forEach((p, pi) => {                              // further roofs: an annex on the floor it stands on, or a wing like the main roof (#621)
      const pb = partBox(p);
      if (!pb) return;
      const y0 = partY0(floors, i, p, ctx.elev), lv = floors.find((x) => x.id === p.level && x.kind !== 'roof') || under;
      out.push({ bb: pb, spec: p, y0, tag: p.id || `part${pi}`, from: wallTopOf(floors, i, p, ctx.elev) - gap(lv) - y0, t: wallThickness(lv) });   // the same id as roofmove.js uses
    });
    return out;
  }
  /** where the walls of floor i are cut at the roof over them (#260, #265), in the world frame: { planes (the slopes), rooms (inside the
   *  dormers, kept), groups (one per roof, see joinCuts) }; for the walls of the roof floor itself, and of the storeys under the slopes
   *  when the roof starts on a knee wall lower down; null when nothing cuts them. The further roofs cut too, each over its own box: under
   *  the second wing of an L-shaped house the walls follow its slopes, not those of the main roof (#621) */
  function wallClip(i) {
    const ri = clipRoofFloor(ctx.layout().floors, i), list = ri < 0 ? [] : roofList(ri);
    const main = list.find((r) => r.tag === 'main');
    if (!main) return null;
    const cut = (R, box) => {
      const E = ctx.elev(ri) + liftOf(R);
      return { planes: roofPlanes(R.bb, R.spec, R.y0).map(([x, y, z, d, ...range]) => [x, y, z, d - y * E, ...range]),
        rooms: dormerRooms(R.bb, R.spec, R.y0).map((q) => ({ ...q, top: q.top + E })), box };
    };
    const rank = (R) => (R.spec.level === 'main' ? 0 : R.spec.level ? 2 : 1);   // when not all fit into the shader: the wings first
    return joinCuts([cut(main, null), ...list.filter((R) => R !== main).sort((a, b) => rank(a) - rank(b)).map((R) => cut(R, roofReach(R.bb, R.spec)))]);
  }
  /** is the roof of roof floor ri drawn over a focused room of floor i (outline pts): only when it cuts that floor or has a dormer over the room */
  function overRoom(ri, i, pts) {
    const dormers = roofList(ri).flatMap((R) => dormerRooms(R.bb, R.spec, R.y0));
    return roofOverRoom({ cuts: clipRoofFloor(ctx.layout().floors, i) === ri, dormers, pts });
  }
  /** the holes in the front walls of the dormers of roof R (of roof floor i) for the doors and windows of the walls they stand on (#341): of
   *  the storeys below and of the roof floor itself */
  const holesFor = (i, R) => (d) => {
    const n = fitDormer(R.bb, R.spec, d), floors = ctx.layout().floors;
    return n ? floors.flatMap((f, fi) => (fi > i || (f.kind === 'roof' && fi !== i) ? [] : frontHoles(n, f.walls, ctx.elev(fi) - ctx.elev(i) - R.y0))) : [];
  };
  /** the roofs that are drawn: not those of a building that is not shown (#409) */
  const drawn = (i) => roofList(i).filter((R) => ctx.roofShown?.(i, R) ?? true);
  /** the gable walls of roof R of roof floor i (#628): down to the walls under it, as thick as they are; none where a gable stands inside
   *  another roof of the floor (the inner end of the second wing of an L-shaped house) */
  const gableOf = (i, R) => {
    const others = roofList(i).filter((q) => q.tag !== R.tag).map((q) => q.bb);
    return { from: R.from, t: R.t, skip: (x, z) => others.some((b) => x > b.x0 + 0.05 && x < b.x1 - 0.05 && z > b.z0 + 0.05 && z < b.z1 - 0.05) };
  };
  /** the other roofs drawn on roof floor i as solids in the frame of roof R (#621): R's slopes end where they run into them, in the valleys */
  const cutsOf = (list, R) => list.filter((q) => q !== R).flatMap((q) => liftSolids(roofSolids(q.bb, q.spec), q.y0 + liftOf(q) - R.y0 - liftOf(R)));
  function buildRoof(g, i, f, holo, ghost) { const list = drawn(i); list.forEach((R) => drawRoof(g, R.bb, R.spec, R.y0 + liftOf(R), R.tag, holo, ghost, holesFor(i, R), gableOf(i, R), cutsOf(list, R))); }
  /** the roofs of roof floor i (slopes and dormers) see-through over the floor shown: only the part over the room's outline pts (a
   *  focused room), or all of it (pts null: a whole floor under the roof, #275) */
  function buildOver(g, i, pts, holo) {
    const n0 = g.children.length, u = pts ? polyUniforms(pts) : null;
    const list = drawn(i);
    list.forEach((R) => drawRoof(g, R.bb, R.spec, R.y0 + liftOf(R), R.tag, holo, true, holesFor(i, R), gableOf(i, R), cutsOf(list, R)));
    g.children.slice(n0).forEach((m) => m.traverse((x) => {
      if (!x.material) return;
      [].concat(x.material).forEach((mm) => { mm.transparent = true; mm.opacity = Math.min(mm.opacity, holo ? 0.2 : 0.3); mm.depthWrite = false; if (u) clipToPoly(mm, u); });
      x.userData.roofOver = true;
    }));
  }
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
    build: buildRoof, over: buildOver, overRoom, railing: buildRailing, wallClip, slopesAt: (i, x, z) => planesAt(wallClip(i), x, z), placeSolar, updateFade: updateRoofFade, reset: () => { roofs.length = 0; }, faded: roofs,
  };
}
