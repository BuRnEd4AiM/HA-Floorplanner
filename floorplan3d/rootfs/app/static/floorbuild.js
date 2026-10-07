/* 3D build of one floor (step 21 of the split, #137): room floors with their light layers, warning pulse and name, the rims of floor
 * openings, the placeholder blocks (part 1), the stairs and the walls (part 2), the devices with their tap balls, camera cones and value
 * labels (part 3). build() in app.js walks the floors and calls these. Which device gets a label is pure (unit test). */
import * as THREE from './vendor/three.module.min.js';
import { floorShapes } from './blocks.js';
import { polyArea } from './rooms.js';
import { stairLocal, polyToWorld, stairFloors, storeysShown } from './stairs.js';
import { inIso, clipWallToRoom } from './roomclip.js';
import { buildWall, wallLength } from './walls.js';
import { atticUniforms, cutAtRoof } from './atticclip.js';
import { solarPose, groundFn } from './solarroof.js';
import { addPickProxy, underFloors, holoify } from './modelfx.js';

export const GROUND_COVER = new Set(['lawn', 'terrace', 'path']);   // lie flat on the ground: never over the floors of the house
export const OUTDOOR = new Set(['picture', 'tree', 'bush', 'pool', 'lawn', 'terrace', 'path', 'fence']);   // keep their natural colours in the hologram theme
const LABEL_DOMAINS = new Set(['sensor', 'binary_sensor', 'climate', 'cover']);   // "important": measured values
/** value labels on devices: none, only the important ones (sensors, climate, covers) or every device with an entity */
export function wantsLabel(d, mode) {
  if (mode === 'none' || !d.entity) return false;
  return mode === 'all' || LABEL_DOMAINS.has(d.entity.split('.')[0]);
}

/** the label of a room: its name, in the (legacy) top view with the area */
export function roomLabel(r, topView, imperial) {
  if (!topView) return r.name;
  const a = polyArea(r.points);
  return `${r.name} · ${imperial ? `${(a * 10.7639).toFixed(0)} ft²` : `${a.toFixed(1)} m²`}`;
}
/** the middle of a room (mean of its corners), where its name floats */
export const roomCenter = (points) => points.reduce((a, p) => [a[0] + p[0] / points.length, a[1] + p[1] / points.length], [0, 0]);

/** ctx: settings(), floorIdx(), topView(), imperial(), belowVis(), mat(color, ghost, extra), roomLightMat(kind, alpha, ghost), textSprite(text),
 *  railing(g, room, f, holo, ghost) (roof terrace), lowWalls(), roomMeshes (Map), alerts ({ hasRoom(id), pulses }), registry (Map), pickables (Array), floorOpenings(i), floorH, holoEdge,
 *  houseMode(), halfCut(), elev(i), stairMesh(st, holo, ghost, edge, upTo) (stairtool.js), cutawayInfo(w, group), openingHandle(w, o, g),
 *  cutawayWalls() (the list of the open floor's walls for the cutaway), makeModel(type, onLoad, d, pose) (models.js), setPicture(model, d),
 *  placeSolar(model, d, roofs), tapBalls, cams, labelSprites (Map), modelLoaded(); textSprite takes (text, opts) */
export function initFloorBuild(ctx) {
  /** the rooms of floor f in its group g. o: { holo, ghost, iso (the focused room), labels (names shown), holes (stairwell openings) } */
  function rooms(g, f, o) {
    const { holo, ghost, iso } = o;
    f.rooms.forEach((r) => {
      if (r.points.length < 3) return;
      if (iso && !ghost && r.id !== iso.id) return;
      const shape = floorShapes(r.points, o.holes);               // the room minus stairwell openings (also where they only overlap it partly)
      const geo = new THREE.ShapeGeometry(shape);
      geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, holo
        ? (ghost ? ctx.roomLightMat('floor', 0.15 + 0.5 * ctx.belowVis(), true)
                 : ctx.roomLightMat('floor', ctx.floorIdx() > 0 ? 1 - 0.65 * ctx.belowVis() : 1))
        : ctx.mat(r.color || '#8a7f70', ghost, { side: THREE.DoubleSide }));
      m.position.y = 0.01;
      m.receiveShadow = true;
      g.add(m);
      if (r.terrace && !ctx.lowWalls()) ctx.railing(g, r, f, holo, ghost);          // roof terrace: railing along the open edges
      let wash = null, glow = null;
      if (!holo) {                                   // solid themes: the light pool lies on the floor as a separate layer
        glow = new THREE.Mesh(geo, ctx.roomLightMat('glow'));
        glow.position.y = 0.014; glow.renderOrder = 1; glow.visible = false; glow.userData.ghost = ghost;
        g.add(glow);
      }
      {                                              // coloured "air" that tints the room's inner walls when a light is on
        const eg = new THREE.ExtrudeGeometry(shape, { depth: ctx.settings().wallHeight, bevelEnabled: false });
        eg.rotateX(-Math.PI / 2);
        wash = new THREE.Mesh(eg, ctx.roomLightMat('wash'));
        wash.userData.ghost = ghost;
        wash.renderOrder = 1;
        g.add(wash);
      }
      ctx.roomMeshes.set(r.id, { mesh: m, room: r, wash, glow, f, ghost });
      if (!ghost && ctx.alerts.hasRoom(r.id)) {      // a warning in this room: the floor pulses red
        const pm = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide }));
        pm.position.y = 0.03; pm.renderOrder = 2;
        g.add(pm); ctx.alerts.pulses.push(pm.material);
      }
      if (!ghost) {
        m.userData = { kind: 'room', id: r.id };
        ctx.registry.set(r.id, m); ctx.pickables.push(m);
      }
      if (r.name && o.labels) {
        const c = roomCenter(r.points);
        const sp = ctx.textSprite(roomLabel(r, ctx.topView(), ctx.imperial()));
        sp.position.set(c[0], 0.45, c[1]);
        if (ghost) { sp.material.transparent = true; sp.material.opacity = 0.25 + 0.5 * ctx.belowVis(); }
        g.add(sp);
      }
    });
  }
  /** floor openings drawn by hand: a rim like a wall top, so the opening reads from above */
  function holeRims(g, f, o) {
    if (o.ghost) return;
    (f.holes || []).forEach((h) => {
      if (h.points.length < 3) return;
      const rim = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(h.points.map(([x, z]) => new THREE.Vector3(x, 0.03, z))),
        new THREE.LineBasicMaterial({ color: o.holo ? ctx.holoEdge : 0xff9f43 }));
      g.add(rim);
    });
  }
  /** placeholder blocks: a solid mass for a floor that is not drawn; the stairwells and floor openings of floor i + 1 run through it */
  function blocks(g, f, i, o) {
    if (o.iso || !(f.blocks || []).length) return;
    const shaftHoles = ctx.floorOpenings(i + 1);
    f.blocks.forEach((b) => {
      if (b.points.length < 3) return;
      const shape = floorShapes(b.points, shaftHoles);
      const eg = new THREE.ExtrudeGeometry(shape, { depth: b.h || ctx.floorH, bevelEnabled: false });
      eg.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(eg, o.holo
        ? new THREE.MeshBasicMaterial({ color: 0x123f96, transparent: true, opacity: 0.5, depthWrite: false })
        : ctx.mat('#b9b3a8', false));
      m.position.y = -0.02;
      if (o.holo) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(eg), new THREE.LineBasicMaterial({ color: ctx.holoEdge, transparent: true, opacity: 0.7 })));
      g.add(m);
      ctx.registry.set(b.id, m);
    });
  }
  /** stairs (a 'down' stair starts one floor lower and arrives at this floor). o: as rooms, plus edge (the hologram edge material) */
  function stairs(g, f, i, o) {
    const { holo, ghost, iso } = o, H = ctx.floorH, open = ctx.floorIdx(), house = ctx.houseMode();
    (f.stairs || []).forEach((st) => {
      if (iso) {                                   // a focused room still shows the stair standing in it
        const hp = polyToWorld(st, stairLocal(st, H).hole);
        const c = hp.reduce((q, p) => [q[0] + p[0] / hp.length, q[1] + p[1] / hp.length], [0, 0]);
        if (ghost || !inIso(iso, c[0], c[1])) return;
      }
      // the stair that comes up into the floor shown is seen through its opening: drawn solid, not faded like the rest below
      const arriving = ghost && !house && (st.dir || 'up') === 'up' && i < open && open <= i + stairFloors(st);   // a stair over several floors counts for every floor it reaches
      const sGhost = ghost && !arriving;
      const sEdge = arriving && holo ? new THREE.LineBasicMaterial({ color: ctx.holoEdge, transparent: true, opacity: 0.95 }) : o.edge;
      const sg = ctx.stairMesh(st, holo, sGhost, sEdge, storeysShown(st, i, open, house));   // no storeys hanging over the open floor (#229, #246)
      sg.position.set(st.x, st.dir === 'down' ? -H * stairFloors(st) : 0, st.z);
      sg.rotation.y = THREE.MathUtils.degToRad(st.rot || 0);
      g.add(sg);
      ctx.registry.set(st.id, sg);
    });
  }
  /** the walls with their doors and windows; on the open floor they take part in the cutaway and can be picked */
  function walls(g, f, i, o) {
    const { holo, ghost, iso } = o, low = ctx.lowWalls(), half = ctx.halfCut() && !low;
    const attic = o.roofClip ? atticUniforms(o.roofClip) : null;   // under the roof (#260): the walls end at the slopes, not inside a dormer (#265)
    f.walls.forEach((w0) => {
      let w = w0;
      if (wallLength(w) < 0.01) return;
      if (iso && !ghost) { w = clipWallToRoom(iso, w); if (!w) return; }
      const wallMat = holo
        ? new THREE.MeshBasicMaterial({ color: 0x1a5fcf, transparent: true, opacity: ghost ? 0.04 + 0.2 * ctx.belowVis() : ctx.settings().wallOpacity, depthWrite: false, side: THREE.DoubleSide })
        : ctx.mat('#d9d4cc', ghost);
      const wg = buildWall(w, { material: wallMat, ghost, low, cut: half ? 0.5 : 0, makeMat: ctx.mat, holo, edgeMaterial: o.edge });
      if (half) {                                                // what sticks out above the cut (door leaves, window frames) is clipped off
        const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), ctx.elev(i) + (w.height || 2.6) * 0.5 + 0.001);
        wg.traverse((x) => { if (x.material) [].concat(x.material).forEach((m) => { m.clippingPlanes = [plane]; }); });
      }
      if (attic) wg.traverse((x) => { if (x.material) [].concat(x.material).forEach((m) => cutAtRoof(m, attic)); });
      g.add(wg);
      if (!ghost) {
        const info = ctx.cutawayInfo(w, wg);
        info.handles = (w.openings || []).map((op) => ctx.openingHandle(w, op, g));
        ctx.cutawayWalls().push(info);
        ctx.registry.set(w.id, wg); ctx.pickables.push(wg);
      }
      wg.children.forEach((c) => { if (c.userData?.kind === 'opening') { ctx.registry.set(c.userData.id, c); if (!ghost) ctx.pickables.push(c); } });
    });
    (f.dormerWalls || []).forEach((w) => {                       // the windows of the dormers over this floor: only the window, the dormer is the wall
      const [ox, oz] = [(w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2];
      if (iso && !ghost && !inIso(iso, ox, oz)) return;
      const wg = buildWall(w, { material: null, ghost, low, makeMat: ctx.mat, holo, bare: true });
      if (half) {
        const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), ctx.elev(i) + (f.walls[0]?.height || 2.6) * 0.5 + 0.001);
        wg.traverse((x) => { if (x.material) [].concat(x.material).forEach((m) => { m.clippingPlanes = [plane]; }); });
      }
      g.add(wg);
      if (!ghost) w.openings.forEach((op) => ctx.openingHandle(w, op, g));
      wg.children.forEach((c) => { if (c.userData?.kind === 'opening') { ctx.registry.set(c.userData.id, c); if (!ghost) ctx.pickables.push(c); } });
    });
  }
  /** the devices of floor f. o: as rooms, plus roofs (the roofs of a roof floor, for solar panels on them) */
  function devices(g, f, o) {
    const { holo, ghost, iso } = o, roofs = o.roofs;
    const half = ctx.halfCut() && !ctx.lowWalls(), halfAt = (f.walls[0]?.height || 2.6) * 0.5 - 0.05, mode = ctx.settings().labelMode;
    const holo1 = (m) => holoify(m, ghost, ctx.belowVis());
    f.devices.forEach((d) => {
      if (iso && !ghost && !inIso(iso, d.x, d.z)) return;
      const onRoof = roofs && d.type === 'solarpanel' ? solarPose(d, roofs) : null;
      const model = ctx.makeModel(d.type, (m) => { if (!ghost) addPickProxy(m); ctx.tapBalls.moved(d.id); if (GROUND_COVER.has(d.type)) underFloors(m); if (holo && !OUTDOOR.has(d.type)) holo1(m); ctx.modelLoaded(); }, d, onRoof ? { ...onRoof, groundAt: onRoof.mount === 'stand' ? groundFn(d, roofs, onRoof.y + (d.y ?? 0)) : undefined } : undefined);   // on a rack the posts reach the roof (#208)
      if (d.type === 'picture') ctx.setPicture(model, d);
      model.position.set(d.x, d.y ?? 0, d.z);
      model.rotation.order = 'YXZ';                                   // turn around the vertical axis first, then tilt / roll the object itself
      model.rotation.set(THREE.MathUtils.degToRad(d.tiltX || 0), THREE.MathUtils.degToRad(d.rot || 0), THREE.MathUtils.degToRad(d.tiltZ || 0));
      if (onRoof) { ctx.placeSolar(model, d, roofs); model.userData.onRoof = onRoof.mount; }
      model.scale.set((d.scale || 1) * (d.sx || 1), (d.scale || 1) * (d.sy || 1), (d.scale || 1) * (d.sz || 1));   // uniform size x independent stretch per axis
      if (d.mirror) model.scale.x *= -1;                              // mirrored shape (left-right)
      if (!ghost) addPickProxy(model);
      if (holo && !OUTDOOR.has(d.type)) holo1(model);
      model.traverse((x) => {
        if (!x.isMesh) return;
        x.castShadow = !holo;
        if (ghost && !holo) { x.material = x.material.clone(); x.material.transparent = true; x.material.opacity = 0.25; }
      });
      if (GROUND_COVER.has(d.type)) underFloors(model);
      model.userData.kind = 'device';
      model.userData.id = d.id;
      model.userData.ghost = ghost;
      g.add(model);
      ctx.registry.set(d.id, model);
      if (half && (d.y || 0) >= halfAt) { model.userData.cutHidden = true; model.visible = false; }   // half section: what hangs above the cut (ceiling lamps, LED ring, high pictures) would float in the air
      if (!ghost && !model.userData.cutHidden) { ctx.pickables.push(model); const tb = ctx.tapBalls.add(g, model, d); if (tb) ctx.pickables.push(tb); }
      if (d.type === 'camera' && !ghost && (d.fov ?? 90) > 0) {
        const cone = ctx.cams.addCone(d);
        g.add(cone);
        ctx.pickables.push(cone);
      }
      if (wantsLabel(d, mode) && o.labels) {
        const sp = ctx.textSprite('…', { size: 30, scaleX: 1.5, scaleY: 0.375, pill: true });
        sp.position.set(d.x, (d.y || 0) + 0.3 + 0.2 * (d.scale || 1), d.z);
        if (ghost) { sp.material.transparent = true; sp.material.opacity = 0.25 + 0.5 * ctx.belowVis(); }
        g.add(sp);
        ctx.labelSprites.set(d.id, sp);
      }
    });
  }
  return { rooms, holeRims, blocks, stairs, walls, devices };
}
