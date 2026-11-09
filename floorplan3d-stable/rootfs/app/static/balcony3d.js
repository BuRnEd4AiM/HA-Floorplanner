/* 🏗 Balconies and roof terraces in 3D (#646): the railing of an open room (metal, glass or wood; before in roofs.js), the plate under a
 * balcony that hangs free and its supports down to the ground. Which room hangs free, where the railing runs and of which parts it is made
 * are the pure rules of balcony.js. */
import * as THREE from './vendor/three.module.min.js';
import { mergeGeometries } from './vendor/utils/BufferGeometryUtils.js';
import { floorShapes } from './blocks.js';
import { onBridge } from './bridge.js';
import { BALCONY, railRuns, railParts, supportSpots, atWall, freeBalconies } from './balcony.js';

const HOLO_RAIL = 0x3df2ff;
/** the material of a part of the railing (metal, glass, wood) */
function railMaterial(kind, holo, ghost) {
  if (holo) return new THREE.MeshBasicMaterial({ color: HOLO_RAIL, transparent: true, opacity: kind === 'glass' ? (ghost ? 0.05 : 0.22) : ghost ? 0.12 : 0.85, depthWrite: kind !== 'glass' });
  if (kind === 'glass') return new THREE.MeshStandardMaterial({ color: '#cfe6f0', roughness: 0.05, metalness: 0.1, transparent: true, opacity: ghost ? 0.1 : 0.3, depthWrite: false, side: THREE.DoubleSide });
  if (kind === 'wood') return new THREE.MeshStandardMaterial({ color: '#8a5a32', roughness: 0.8, transparent: ghost, opacity: ghost ? 0.25 : 1 });
  return new THREE.MeshStandardMaterial({ color: '#8d949b', roughness: 0.45, metalness: 0.6, transparent: ghost, opacity: ghost ? 0.25 : 1 });
}
/** boxes [{ geo }] merged into one mesh per material and added to g */
function addMerged(g, byKind, matOf, tag) {
  byKind.forEach((geos, kind) => {
    const m = new THREE.Mesh(mergeGeometries(geos, false), matOf(kind));
    geos.forEach((x) => x.dispose());
    m.castShadow = kind !== 'glass'; m.receiveShadow = true;
    m.userData[tag] = kind;
    g.add(m);
  });
}

/** Railing round an open room (a balcony, a roof terrace): along every edge that is not a wall and where no bridge arrives (the bridges of
 *  this floor, and `bridges`: more bridge devices in this floor's frame, e.g. the one coming over from the next house); its look: room.rail */
export function buildRailing(g, room, f, holo, ghost, bridges = []) {
  const landing = [...(f.devices || []).filter((d) => d.type === 'bridge'), ...bridges];
  const covered = (x, z) => landing.some((d) => onBridge(d, x, z)) || atWall(f.walls, x, z);   // a wall (also in a doorway) already closes this spot
  const byKind = new Map();
  railRuns(room.points, covered).forEach(({ a, b }) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / len, uz = (b[1] - a[1]) / len, rot = -Math.atan2(uz, ux);
    railParts(len, room.rail).forEach((p) => {
      const geo = new THREE.BoxGeometry(p.u1 - p.u0, p.y1 - p.y0, p.th), u = (p.u0 + p.u1) / 2;
      geo.rotateY(rot);
      geo.translate(a[0] + ux * u, (p.y0 + p.y1) / 2, a[1] + uz * u);
      if (!byKind.has(p.mat)) byKind.set(p.mat, []);
      byKind.get(p.mat).push(geo);
    });
  });
  addMerged(g, byKind, (k) => railMaterial(k, holo, ghost), 'railing');
}

/** ctx: layout() (the floors drawn), groundIdx(), terrain() (the height of the ground on a slope (x, z) => h, null when level), elev(i),
 *  groundAt(x, z) (a plateau under the spot, 0 else), mat(color, ghost, extra) */
export function initBalconies(ctx) {
  const indexOf = (f) => ctx.layout().floors.findIndex((x) => x === f || (f?.id && x.id === f.id));
  /** the ids of the free balconies of floor i (balcony.js) */
  const free = (i) => (i < 0 ? new Set() : freeBalconies(ctx.layout().floors, i, ctx.groundIdx(), ctx.terrain()));
  /** the height of the ground (over the floor of the ground floor) at (x, z): a plateau, else the slope, else 0 */
  const groundY = (x, z) => ctx.groundAt?.(x, z) || ctx.terrain()?.(x, z) || 0;

  /** the plate under a free balcony and, with room.posts, its supports down to the ground; g is the room's group (lifted by `lift`) */
  function build(g, room, f, o, lift = 0) {
    const i = indexOf(f);
    if (!free(i).has(room.id)) return;
    const d = BALCONY.plate;
    const geo = new THREE.ExtrudeGeometry(floorShapes(room.points, []), { depth: d, bevelEnabled: false, curveSegments: 1 });
    geo.rotateX(-Math.PI / 2);
    const plate = new THREE.Mesh(geo, o.holo
      ? new THREE.MeshBasicMaterial({ color: 0x1a5fcf, transparent: true, opacity: o.ghost ? 0.06 : 0.35, depthWrite: false })
      : ctx.mat('#cbc4b8', o.ghost));
    plate.position.y = -d - 0.005;                                     // just under the room's floor
    plate.castShadow = plate.receiveShadow = !o.holo;
    plate.userData.balconyPlate = room.id;
    if (o.holo && o.edge) plate.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), o.edge));
    g.add(plate);
    if (!room.posts) return;
    const base = ctx.elev(i) + lift, top = -d - 0.005, byKind = new Map([['post', []]]);
    supportSpots(room.points, (x, z) => atWall(f.walls, x, z, 0.3)).forEach(([x, z]) => {
      const bottom = groundY(x, z) - base - 0.05;                      // a little into the ground
      if (top - bottom < 0.1) return;
      const pg = new THREE.BoxGeometry(BALCONY.post, top - bottom, BALCONY.post);
      pg.translate(x, (top + bottom) / 2, z);
      byKind.get('post').push(pg);
    });
    if (!byKind.get('post').length) return;
    addMerged(g, byKind, () => (o.holo ? new THREE.MeshBasicMaterial({ color: 0x1a5fcf, transparent: true, opacity: o.ghost ? 0.08 : 0.4, depthWrite: false })
      : ctx.mat('#9d978d', o.ghost)), 'balconyPosts');
  }
  return { free, build };
}
