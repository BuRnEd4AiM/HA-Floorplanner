/* 3D build of one floor, the flat parts (step 21 of the split, part 1, #137): room floors with their light layers, warning pulse and name,
 * the rims of floor openings and the placeholder blocks. build() in app.js walks the floors and calls these; the walls, stairs and
 * devices follow there. */
import * as THREE from './vendor/three.module.min.js';
import { floorShapes } from './blocks.js';
import { polyArea } from './rooms.js';

/** the label of a room: its name, in the (legacy) top view with the area */
export function roomLabel(r, topView, imperial) {
  if (!topView) return r.name;
  const a = polyArea(r.points);
  return `${r.name} · ${imperial ? `${(a * 10.7639).toFixed(0)} ft²` : `${a.toFixed(1)} m²`}`;
}
/** the middle of a room (mean of its corners), where its name floats */
export const roomCenter = (points) => points.reduce((a, p) => [a[0] + p[0] / points.length, a[1] + p[1] / points.length], [0, 0]);

/** ctx: settings(), floorIdx(), topView(), imperial(), belowVis(), mat(color, ghost, extra), roomLightMat(kind, alpha, ghost), textSprite(text),
 *  railing(g, room, f, holo, ghost) (roof terrace), lowWalls(), roomMeshes (Map), alerts ({ hasRoom(id), pulses }), registry (Map), pickables (Array), floorOpenings(i), floorH, holoEdge */
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
  return { rooms, holeRims, blocks };
}
