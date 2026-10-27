/* 3D build of one floor (step 21 of the split, #137): room floors with their light layers, warning pulse and name, the rims of floor
 * openings, the placeholder blocks (part 1), the stairs and the walls (part 2), the devices with their tap balls, camera cones and value
 * labels (part 3). build() in app.js walks the floors and calls these. Which device gets a label is pure (unit test). */
import * as THREE from './vendor/three.module.min.js';
import { floorShapes } from './blocks.js';
import { polyArea } from './rooms.js';
import { fmtArea } from './i18n.js';
import { stairLocal, polyToWorld, stairFloors, storeysShown } from './stairs.js';
import { inIso, deviceInIso, clipWallToRoom, wallPieces } from './roomclip.js';
import { buildWall, wallLength } from './walls.js';
import { atticUniforms, cutAtRoof } from './atticclip.js';
import { solarPose, groundFn } from './solarroof.js';
import { addPickProxy, underFloors, holoify } from './modelfx.js';
import { shutterEntity, shutterSide, shutterLabelY } from './shutters.js';
import { openingPoint } from './openings.js';
import { openingBallAt, BALL } from './tapballs.js';
import { pillFinger } from './labels.js';
import { isHeater } from './heating.js';
import { houseFootprint } from './earth.js';
import { slabDepth, wallUpTo, wallUnder, inRoom, shutterLabelIn } from './housefloors.js';
import { patternOf, floorHex } from './floorcover.js';
import { facadeOf, facadeFinish } from './facade.js';
import { floorUVs, floorLook } from './floortex.js';
import { wallSkins, hasSkins } from './finishes.js';
import { dressWall } from './wallskin.js';
import { lifter, wallWithShift, doorSteps, cleanRaise, innerPoint } from './levels.js';

export const GROUND_COVER = new Set(['lawn', 'terrace', 'path']);   // lie flat on the ground: never over the floors of the house
export const OUTDOOR = new Set(['picture', 'tree', 'bush', 'pool', 'lawn', 'terrace', 'path', 'fence', 'steps']);   // keep their natural colours in the hologram theme
const LABEL_HALF = 0.25;                                             // half the height of a value label and a little air (m)
const LABEL_DOMAINS = new Set(['sensor', 'binary_sensor', 'climate', 'cover']);   // "important": measured values
/** value labels on devices: none, only the important ones (sensors, climate, covers) or every device with an entity */
export function wantsLabel(d, mode) {
  if (mode === 'none' || !d.entity) return false;
  return mode === 'all' || LABEL_DOMAINS.has(d.entity.split('.')[0]);
}

/** the label of a room: its name, in the (legacy) top view with the area */
export function roomLabel(r, topView, imperial) {
  if (!topView) return r.name;
  return `${r.name} · ${fmtArea(polyArea(r.points), imperial)}`;
}
/** the middle of a room (mean of its corners), where its name floats */
export const roomCenter = (points) => points.reduce((a, p) => [a[0] + p[0] / points.length, a[1] + p[1] / points.length], [0, 0]);

/** ctx: settings(), floorIdx(), topView(), imperial(), belowVis(), fast() (the "fast" performance mode), mat(color, ghost, extra), roomLightMat(kind, alpha, ghost), textSprite(text),
 *  railing(g, room, f, holo, ghost) (roof terrace), lowWalls(), roomMeshes (Map), alerts ({ hasRoom(id), pulses }), registry (Map), pickables (Array), floorOpenings(i), floorH, holoEdge,
 *  houseMode(), halfCut(), elev(i), stairMesh(st, holo, ghost, edge, upTo) (stairtool.js), cutawayInfo(w, group), openingHandle(w, o, g),
 *  cutawayWalls() (the list of the open floor's walls for the cutaway), makeModel(type, onLoad, d, pose) (models.js), setPicture(model, d),
 *  placeSolar(model, d, roofs), tapBalls, cams, labelSprites (Map), modelLoaded(), roomName(f, id, sprite) (the name of a room on a floor
 *  that is not dimmed, roomlabels.js), plotAreas() (the areas of the plot: a plateau lifts what stands on it, #566); textSprite takes (text, opts).
 *  The floors stacked like a real house (housefloors.js): o.stack = { covered (a floor with rooms lies over this one), slab (this floor stands
 *  on a ceiling), upTo (the roof box over this storey: its walls reach up to the roof) }, null otherwise */
export function initFloorBuild(ctx) {
  /** how much the things of floor f go up: a plateau under them, a room with a higher floor (levels.js, #566) */
  const upOf = (f) => lifter(f, ctx.plotAreas?.() || []);
  /** a group in g lifted by h (g itself when nothing is lifted) */
  const liftGroup = (g, h) => { if (!h) return g; const lg = new THREE.Group(); lg.position.y = h; g.add(lg); return lg; };
  /** stacked (housefloors.js): the ceiling floor f stands on, from the top of the walls below up to its floor, in the outline of the floor
   *  (its walls with their thickness, rooms and blocks), with its stairwells and floor openings left open; its edge closes the facade */
  function slab(g, f, i, o) {
    if (!o.stack?.slab) return;
    const d = slabDepth(ctx.floorH, ctx.settings().wallHeight);
    if (!d) return;
    let rings = houseFootprint([f], 0);
    if (!rings.length) rings = [...f.rooms, ...(f.blocks || [])].filter((r) => r.points.length >= 3).map((r) => r.points);
    const up = upOf(f), byLift = new Map();                       // a building on a plateau: its ceiling goes up with it (#566)
    rings.forEach((ring) => { const h = up.any ? up.ground(...innerPoint(ring)) : 0; byLift.set(h, [...(byLift.get(h) || []), ring]); });
    byLift.forEach((list, lift) => {
      const shapes = list.flatMap((ring) => floorShapes(ring, o.holes));
      if (!shapes.length) return;
      const eg = new THREE.ExtrudeGeometry(shapes, { depth: d, bevelEnabled: false, curveSegments: 1 });
      eg.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(eg, o.holo
        ? new THREE.MeshBasicMaterial({ color: 0x1a5fcf, transparent: true, opacity: o.ghost ? 0.06 : 0.35, depthWrite: false })
        : ctx.mat('#cbc4b8', o.ghost));
      m.position.y = -d - 0.003 + lift;                          // just under the room floors
      m.castShadow = m.receiveShadow = !o.holo;
      m.userData.slab = true;
      if (o.holo && o.edge) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(eg, 30), o.edge));
      g.add(m);
    });
  }
  /** stacked: the room names, value labels, balls and offline signs of a floor that lies under another one are hidden by what is in front
   *  of them (the floors above, the walls), so they show only where you can look into the floor, not through the floors over it */
  function inside(g, o) {
    if (!o.stack?.covered) return;
    g.traverse((x) => { if (x.isSprite) x.material.depthTest = true; });
  }
  /** the side of a floor that lies higher (or lower) than its storey (#566): from the storey's level up to the room's floor (down into a
   *  lower one), seen in the doors and in the cut; only the sides, the room's floor lies on top */
  function podium(g, shape, raise, lift, holo, ghost) {
    const eg = new THREE.ExtrudeGeometry(shape, { depth: Math.abs(raise), bevelEnabled: false, curveSegments: 1 });
    eg.rotateX(-Math.PI / 2);
    const side = holo ? new THREE.MeshBasicMaterial({ color: 0x1a5fcf, transparent: true, opacity: ghost ? 0.06 : 0.3, depthWrite: false, side: THREE.DoubleSide })
      : ctx.mat('#b9b0a2', ghost, { side: THREE.DoubleSide });
    const m = new THREE.Mesh(eg, [new THREE.MeshBasicMaterial({ visible: false }), side]);   // the caps are not drawn, only the sides
    m.position.y = Math.min(lift, lift - raise) + 0.004;
    m.castShadow = m.receiveShadow = !holo;
    m.userData.podium = true;
    g.add(m);
  }
  /** the steps at the doors between floors of different height (levels.js doorSteps), on the lower side */
  function stepsAtDoors(g, f, o, up) {
    if (o.iso && !o.ghost) return;
    doorSteps(f).forEach((s) => {
      const h = s.top - s.bottom;
      if (h <= 0.005) return;
      const m = new THREE.Mesh(new THREE.BoxGeometry(s.w, h, s.d), o.holo
        ? new THREE.MeshBasicMaterial({ color: 0x1a5fcf, transparent: true, opacity: o.ghost ? 0.08 : 0.4, depthWrite: false })
        : ctx.mat('#cdbfa8', o.ghost));
      m.position.set(s.x, up.ground(s.x, s.z) + s.bottom + h / 2 + 0.005, s.z);
      m.rotation.y = Math.atan2(s.ux, s.uz);
      m.castShadow = m.receiveShadow = !o.holo;
      m.userData.doorStep = s.door;
      g.add(m);
    });
  }
  /** the rooms of floor f in its group g. o: { holo, ghost, iso (the focused room), labels (names shown), holes (stairwell openings) } */
  function rooms(g, f, o) {
    const { holo, ghost, iso } = o, up = upOf(f);
    f.rooms.forEach((r) => {
      if (r.points.length < 3) return;
      if (iso && !ghost && r.id !== iso.id) return;
      const shape = floorShapes(r.points, o.holes);               // the room minus stairwell openings (also where they only overlap it partly)
      const geo = new THREE.ShapeGeometry(shape);
      geo.rotateX(-Math.PI / 2);
      const cover = patternOf(r, { holo, low: ctx.fast() });     // parquet, tiles, stone ... (#427, #448): its pattern, else one colour
      if (cover) floorUVs(geo, cover, r.points);                 // turned and scaled like the finish says, from the room's corner
      const m = new THREE.Mesh(geo, holo
        ? (ghost ? ctx.roomLightMat('floor', 0.15 + 0.5 * ctx.belowVis(), true)
                 : ctx.roomLightMat('floor', ctx.floorIdx() > 0 ? 1 - 0.65 * ctx.belowVis() : 1))
        : ctx.mat(cover ? '#ffffff' : floorHex(r), ghost, { side: THREE.DoubleSide, ...(cover ? floorLook(cover) : {}) }));
      if (cover) m.material.userData.cover = cover;
      const lift = up.room(r), raise = cleanRaise(r.raise);       // on a plateau, a floor higher or lower than the storey (levels.js, #566)
      m.position.y = 0.01 + lift;
      m.receiveShadow = true;
      g.add(m);
      if (raise) podium(g, shape, raise, lift, holo, ghost);
      if (r.terrace && !ctx.lowWalls()) ctx.railing(liftGroup(g, lift), r, f, holo, ghost);   // roof terrace: railing along the open edges
      let wash = null, glow = null;
      if (!holo) {                                   // solid themes: the light pool lies on the floor as a separate layer
        glow = new THREE.Mesh(geo, ctx.roomLightMat('glow'));
        glow.position.y = 0.014 + lift; glow.renderOrder = 1; glow.visible = false; glow.userData.ghost = ghost;
        g.add(glow);
      }
      {                                              // coloured "air" that tints the room's inner walls when a light is on
        const eg = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.3, (ctx.settings().wallHeight || 2.6) - Math.max(0, raise)), bevelEnabled: false });
        eg.rotateX(-Math.PI / 2);
        wash = new THREE.Mesh(eg, ctx.roomLightMat('wash'));
        wash.position.y = lift;
        wash.userData.ghost = ghost;
        wash.renderOrder = 1;
        g.add(wash);
      }
      ctx.roomMeshes.set(r.id, { mesh: m, room: r, wash, glow, f, ghost });
      if (!ghost && ctx.alerts.hasRoom(r.id)) {      // a warning in this room: the floor pulses red
        const pm = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide }));
        pm.position.y = 0.03 + lift; pm.renderOrder = 2;
        g.add(pm); ctx.alerts.pulses.push(pm.material);
      }
      if (!ghost) {
        m.userData = { kind: 'room', id: r.id };
        ctx.registry.set(r.id, m); ctx.pickables.push(m);
      }
      if (r.name && o.labels) {
        const c = roomCenter(r.points);
        const sp = ctx.textSprite(roomLabel(r, ctx.topView(), ctx.imperial()));
        sp.position.set(c[0], 0.45 + lift, c[1]);
        if (ghost) { sp.material.transparent = true; sp.material.opacity = 0.25 + 0.5 * ctx.belowVis(); }
        ctx.roomName?.(f, r.id, sp);                            // it steps aside while the label over the room shows (#430, roomlabels.js); the whole house: all of them, the see-through basement too (#464)
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
    const shaftHoles = ctx.floorOpenings(i + 1), up = upOf(f);
    f.blocks.forEach((b) => {
      if (b.points.length < 3) return;
      const shape = floorShapes(b.points, shaftHoles);
      const eg = new THREE.ExtrudeGeometry(shape, { depth: b.h || ctx.floorH, bevelEnabled: false });
      eg.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(eg, o.holo
        ? new THREE.MeshBasicMaterial({ color: 0x123f96, transparent: true, opacity: 0.5, depthWrite: false })
        : ctx.mat('#b9b3a8', false));
      m.position.y = -0.02 + (up.any ? up.ground(...innerPoint(b.points)) : 0);
      if (o.holo) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(eg), new THREE.LineBasicMaterial({ color: ctx.holoEdge, transparent: true, opacity: 0.7 })));
      g.add(m);
      ctx.registry.set(b.id, m);
    });
  }
  /** stairs (a 'down' stair starts one floor lower and arrives at this floor). o: as rooms, plus edge (the hologram edge material) */
  function stairs(g, f, i, o) {
    const { holo, ghost, iso } = o, H = ctx.floorH, open = ctx.floorIdx(), house = ctx.houseMode(), up = upOf(f);
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
      sg.position.set(st.x, (st.dir === 'down' ? -H * stairFloors(st) : 0) + up.ground(st.x, st.z), st.z);   // on a plateau: up with it (#566)
      sg.rotation.y = THREE.MathUtils.degToRad(st.rot || 0);
      g.add(sg);
      ctx.registry.set(st.id, sg);
    });
  }
  /** the roller shutters in the windows of wall w (#331): a ball on top of the window (a tap in the live mode opens the shutter's card,
   *  #335) and, like the value label of a device, a label over it with how far it is open (openings.js writes it; labels: the floor shows
   *  its labels) */
  function shutterParts(g, w, labels, covered = false, lift = 0) {
    const mode = ctx.settings().labelMode, ceiling = ctx.settings().wallHeight || 2.6;
    (w.openings || []).forEach((op) => {
      const e = shutterEntity(op);
      if (!e) return;
      const at = openingBallAt(w, op);
      if (covered) at.y = inRoom(at.y, ceiling, BALL.r + BALL.ceilingGap);   // stacked: the ball stays in the room, under the ceiling
      at.y += lift;                                            // the wall stands on a plateau (#566)
      const tb = ctx.tapBalls.add(g, null, { id: op.id, entity: e }, at, 'opening');
      if (tb) ctx.pickables.push(tb);
      if (!labels || !wantsLabel({ entity: e }, mode)) return;
      const sp = ctx.textSprite('…', { size: 30, scaleX: 1.5, scaleY: 0.375, pill: true }), [x, z] = openingPoint(w, op);
      sp.position.set(x, (covered ? shutterLabelIn(shutterLabelY(op), at.y - lift, ceiling, LABEL_HALF) : shutterLabelY(op)) + lift, z);
      sp.userData.atWindow = true;                             // the balls need not keep clear of it: it is over the window's own ball (#335)
      g.add(sp);
      ctx.labelSprites.set(op.id, sp);
    });
  }
  /** the walls with their doors and windows; on the open floor they take part in the cutaway and can be picked */
  function walls(g, f, i, o) {
    const { holo, ghost, iso } = o, low = ctx.lowWalls(), half = ctx.halfCut() && !low, look = facadeOf(ctx.settings());   // window frames, wall colour (#428)
    const up = upOf(f), wallH = ctx.settings().wallHeight;        // a plateau lifts the walls, doors and windows go up beside a raised room (#566)
    const attic = o.roofClip ? atticUniforms(o.roofClip) : null;   // under the roof (#260): the walls end at the slopes, not inside a dormer (#265)
    const hosted = new Map();                                     // dormer windows cut into a wall of this floor (#275), by wall id
    (f.dormerWalls || []).forEach((d) => { if (d.host) hosted.set(d.host, [...(hosted.get(d.host) || []), ...d.openings]); });
    const dormerOut = new Map();                                  // roller shutters (#331) hang outside: a dormer window's dormer knows where that is
    (f.dormerWalls || []).forEach((d) => d.openings.forEach((op) => dormerOut.set(op.id, d.outside)));
    const sideOf = (w) => (op) => dormerOut.get(op.id) ?? shutterSide(w, op, f.rooms);
    const facade = facadeFinish(ctx.settings()), skins = !holo && !ghost && hasSkins(f, facade);   // finishes on the walls (#448)
    let outline = null;                                          // the outline of the floor: a side outside it gets the facade
    const dressOf = (w) => (skins ? (grp, pieces, len) => {
      if (facade && !outline) outline = houseFootprint([f], 0);
      dressWall(grp, pieces, wallSkins(w, f.rooms, { facade, outline }), { t: w.thickness || 0.2, len, fast: ctx.fast() });
    } : null);
    f.walls.forEach((w1) => wallPieces(hosted.has(w1.id) ? { ...w1, openings: [...(w1.openings || []), ...hosted.get(w1.id)] } : w1, f.wallCuts).forEach((w0) => {   // one building of several: only its parts (#451)
      let w = up.any ? wallWithShift(w0, f.rooms, wallH) : w0;
      if (wallLength(w) < 0.01) return;
      if (iso && !ghost) { w = clipWallToRoom(iso, w); if (!w) return; }
      if (o.stack?.upTo && !low && !half && wallUnder(w, o.stack.upTo)) w = { ...w, height: wallUpTo(w.height, ctx.settings().wallHeight, ctx.floorH) };   // stacked: up to the roof
      const wallMat = holo
        ? new THREE.MeshBasicMaterial({ color: 0x1a5fcf, transparent: true, opacity: ghost ? 0.04 + 0.2 * ctx.belowVis() : ctx.settings().wallOpacity, depthWrite: false, side: THREE.DoubleSide })
        : ctx.mat(look.wall, ghost);
      const wg = buildWall(w, { material: wallMat, ghost, low, cut: half ? 0.5 : 0, makeMat: ctx.mat, holo, edgeMaterial: o.edge, shutterSide: sideOf(w), windowFrame: look.frame, dress: dressOf(w) });
      const lift = up.wall(w);
      wg.position.y = lift;
      if (half) {                                                // what sticks out above the cut (door leaves, window frames) is clipped off
        const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), ctx.elev(i) + lift + (w.height || 2.6) * 0.5 + 0.001);
        wg.traverse((x) => { if (x.material) [].concat(x.material).forEach((m) => { m.clippingPlanes = [plane]; }); });
      }
      if (attic) wg.traverse((x) => { if (x.material) [].concat(x.material).forEach((m) => cutAtRoof(m, attic)); });
      g.add(wg);
      if (!ghost) {
        const info = ctx.cutawayInfo(w, wg);
        info.handles = (w.openings || []).map((op) => { const h = ctx.openingHandle(w, op, g); if (lift && h?.mesh) h.mesh.position.y += lift; return h; });
        ctx.cutawayWalls().push(info);
        if (!ctx.registry.has(w.id)) ctx.registry.set(w.id, wg);   // a wall in parts: its first part
        ctx.pickables.push(wg);
        shutterParts(g, w, o.labels, !!o.stack?.covered, lift);
      }
      wg.children.forEach((c) => { if (c.userData?.kind === 'opening') { ctx.registry.set(c.userData.id, c); if (!ghost) ctx.pickables.push(c); } });
    }));
    (f.dormerWalls || []).forEach((w) => {                       // the windows of the dormers over this floor: only the window, the dormer is the wall
      if (w.host) return;                                        // cut into a wall of the room, drawn with it (above)
      const [ox, oz] = [(w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2];
      if (iso && !ghost && !inIso(iso, ox, oz)) return;
      const wg = buildWall(w, { material: null, ghost, low, makeMat: ctx.mat, holo, bare: true, shutterSide: sideOf(w), windowFrame: look.frame });
      const lift = up.wall(w);
      wg.position.y = lift;
      if (half) {
        const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), ctx.elev(i) + lift + (f.walls[0]?.height || 2.6) * 0.5 + 0.001);
        wg.traverse((x) => { if (x.material) [].concat(x.material).forEach((m) => { m.clippingPlanes = [plane]; }); });
      }
      g.add(wg);
      if (!ghost) { w.openings.forEach((op) => { const h = ctx.openingHandle(w, op, g); if (lift && h?.mesh) h.mesh.position.y += lift; }); shutterParts(g, w, o.labels, !!o.stack?.covered, lift); }
      wg.children.forEach((c) => { if (c.userData?.kind === 'opening') { ctx.registry.set(c.userData.id, c); if (!ghost) ctx.pickables.push(c); } });
    });
    if (up.any) stepsAtDoors(g, f, o, up);
  }
  /** the devices of floor f. o: as rooms, plus roofs (the roofs of a roof floor, for solar panels on them) */
  function devices(g, f, o) {
    const { holo, ghost, iso } = o, roofs = o.roofs, up = upOf(f);
    const half = ctx.halfCut() && !ctx.lowWalls(), halfAt = (f.walls[0]?.height || 2.6) * 0.5 - 0.05, mode = ctx.settings().labelMode;
    const holo1 = (m) => holoify(m, ghost, ctx.belowVis());
    f.devices.forEach((d) => {
      if (iso && !ghost && !deviceInIso(iso, d.x, d.z, f.rooms)) return;   // not a device behind a wall in the next room (#358)
      const onRoof = roofs && d.type === 'solarpanel' ? solarPose(d, roofs) : null;
      const model = ctx.makeModel(d.type, (m) => { if (!ghost) addPickProxy(m); ctx.tapBalls.moved(d.id); if (GROUND_COVER.has(d.type)) underFloors(m); if (holo && !OUTDOOR.has(d.type)) holo1(m); ctx.modelLoaded(); }, d, onRoof ? { ...onRoof, groundAt: onRoof.mount === 'stand' ? groundFn(d, roofs, onRoof.y + (d.y ?? 0)) : undefined } : undefined);   // on a rack the posts reach the roof (#208)
      if (d.type === 'picture') ctx.setPicture(model, d);
      const lift = up.device(d);                                      // on a plateau, in a room with a higher floor (#566)
      model.position.set(d.x, (d.y ?? 0) + lift, d.z);
      model.rotation.order = 'YXZ';                                   // turn around the vertical axis first, then tilt / roll the object itself
      model.rotation.set(THREE.MathUtils.degToRad(d.tiltX || 0), THREE.MathUtils.degToRad(d.rot || 0), THREE.MathUtils.degToRad(d.tiltZ || 0));
      if (onRoof) { ctx.placeSolar(model, d, roofs); model.position.y += lift; model.userData.onRoof = onRoof.mount; }
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
      const label = wantsLabel(d, mode) && o.labels, tapPill = label && isHeater(d) && !ghost && !model.userData.cutHidden;   // a heater shows only its temperature, no ball: the pill is tapped
      if (!ghost && !model.userData.cutHidden) { ctx.pickables.push(model); const tb = tapPill ? null : ctx.tapBalls.add(g, model, d); if (tb) ctx.pickables.push(tb); }
      if (d.type === 'camera' && !ghost && (d.fov ?? 90) > 0) {
        const cone = ctx.cams.addCone(d);
        cone.position.y += lift;
        g.add(cone);
        ctx.pickables.push(cone);
      }
      if (label) {
        const sp = ctx.textSprite('…', { size: 30, scaleX: 1.5, scaleY: 0.375, pill: true });
        const ly = (d.y || 0) + 0.3 + 0.2 * (d.scale || 1);
        sp.position.set(d.x, (o.stack?.covered ? inRoom(ly, ctx.settings().wallHeight || 2.6, LABEL_HALF) : ly) + lift, d.z);   // stacked: in the room
        if (ghost) { sp.material.transparent = true; sp.material.opacity = 0.25 + 0.5 * ctx.belowVis(); }
        g.add(sp);
        ctx.labelSprites.set(d.id, sp);
        if (tapPill) ctx.pickables.push(pillFinger(sp, { kind: 'device', id: d.id }));
      }
    });
  }
  return { slab, inside, rooms, holeRims, blocks, stairs, walls, devices };
}
