/* Several buildings in one plan (#409): a plan (one house of the house list) can hold more than one building, e.g. the main house and the
 * garden house on one plot, drawn together. The editors name the buildings (layout.buildings) and say which room belongs to which one
 * (room.building); a room without one takes the building of a room on another floor that holds its middle (draw the ground floor, the
 * floors above follow). Walls, doors, windows, devices, stairs and blocks belong to the building of their room, a further roof to that of
 * the rooms under it. A screen shows one building or all of them; what lies in no room (the garden, the carport ...) belongs to the plot
 * and always shows. Bringing another plan of the house list into this one as a building of its own: mergePlan. Pure (no DOM, no three.js;
 * unit test: tests/buildings.test.mjs). */
import { pointInPoly, deviceInIso, clipWallToRoom, ISO_TOL } from './roomclip.js';
import { placePoint, floorElev } from './neighbor.js';

/** the buildings of a plan: [{ id, name }] */
export const buildingsOf = (layout) => (Array.isArray(layout?.buildings) ? layout.buildings.filter((b) => b && typeof b.id === 'string' && b.id) : []);
/** the switch between the buildings shows from two buildings on */
export const showSwitch = (layout) => buildingsOf(layout).length >= 2;
/** the building to show: `want` if the plan has it, else null (all of them) */
export const pickBuilding = (layout, want) => (want && buildingsOf(layout).some((b) => b.id === want) ? want : null);

/** a point inside polygon pts: its centre of area when that lies inside, else the middle of the first stretch inside on a line through it */
export function insidePoint(pts) {
  const n = pts.length;
  let a = 0, cx = 0, cz = 0;
  for (let i = 0; i < n; i++) {
    const [x0, z0] = pts[i], [x1, z1] = pts[(i + 1) % n], c = x0 * z1 - x1 * z0;
    a += c; cx += (x0 + x1) * c; cz += (z0 + z1) * c;
  }
  if (Math.abs(a) > 1e-9) { cx /= 3 * a; cz /= 3 * a; } else { cx = pts.reduce((s, p) => s + p[0], 0) / n; cz = pts.reduce((s, p) => s + p[1], 0) / n; }
  if (pointInPoly(cx, cz, pts)) return [cx, cz];
  const xs = [];
  for (let i = 0; i < n; i++) {
    const [x0, z0] = pts[i], [x1, z1] = pts[(i + 1) % n];
    if ((z0 > cz) !== (z1 > cz)) xs.push(x0 + ((cz - z0) * (x1 - x0)) / (z1 - z0));
  }
  xs.sort((p, q) => p - q);
  return xs.length >= 2 ? [(xs[0] + xs[1]) / 2, cz] : [cx, cz];
}
const polyOk = (r) => Array.isArray(r?.points) && r.points.length > 2;

/** the building room `room` of floor fi takes when it has none of its own: that of a room with one on another floor that holds its
 *  middle, the nearest floor first (the one below before the one above); null: none (the plot) */
export function inheritedBuilding(layout, fi, room) {
  const known = new Set(buildingsOf(layout).map((x) => x.id)), floors = layout?.floors || [];
  const own = (r) => (typeof r.building === 'string' && known.has(r.building) ? r.building : null);
  if (!polyOk(room)) return null;
  const [cx, cz] = insidePoint(room.points);
  const order = floors.map((_, i) => i).filter((i) => i !== fi).sort((p, q) => Math.abs(p - fi) - Math.abs(q - fi) || p - q);
  for (const i of order) {
    const q = (floors[i].rooms || []).find((x) => own(x) && polyOk(x) && pointInPoly(cx, cz, x.points));
    if (q) return own(q);
  }
  return null;
}
/** which building every room belongs to: per floor [{ room, b, auto }] (b: a building id or null = the plot; auto: not its own, taken from
 *  a room on another floor, inheritedBuilding) */
export function roomOwners(layout) {
  const known = new Set(buildingsOf(layout).map((x) => x.id)), floors = layout?.floors || [];
  return floors.map((f, fi) => (f.rooms || []).map((room) => {
    if (typeof room.building === 'string' && known.has(room.building)) return { room, b: room.building, auto: false };
    const b = inheritedBuilding(layout, fi, room);
    return { room, b, auto: b !== null };
  }));
}
/** the box round everything drawn in a plan (walls, rooms, blocks of every floor): { x0, x1, z0, z1 }, null for an empty plan */
export function planBox(layout) {
  const pts = (layout?.floors || []).flatMap((f) => [...(f.walls || []).flatMap((w) => [w.a, w.b]), ...(f.rooms || []).flatMap((r) => r.points || []),
    ...(f.blocks || []).flatMap((b) => b.points || [])]).filter((p) => Array.isArray(p));
  if (!pts.length) return null;
  const [x0, x1, z0, z1] = boxOf(pts);
  return { x0, x1, z0, z1 };
}

const boxOf = (pts) => {
  const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
  return [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
};
/** the buildings a point (a device, a stair) of a floor belongs to, by the rooms of that floor (ro: its entries of roomOwners): [] in no room */
export function pointOwners(ro, x, z) {
  const rooms = ro.map((o) => o.room);
  const hit = ro.find(({ room }) => polyOk(room) && deviceInIso(room, x, z, rooms));   // also a wall lamp on the room's wall (roomclip.js)
  return hit ? [hit.b] : [];
}
/** the buildings a wall belongs to: of every room it runs along or through ([] in no room; a wall between two buildings belongs to both) */
export function wallOwners(ro, w) {
  const [wx0, wx1, wz0, wz1] = boxOf([w.a, w.b]), tol = ISO_TOL;
  return ro.filter(({ room }) => {
    if (!polyOk(room)) return false;
    const [x0, x1, z0, z1] = boxOf(room.points);
    return wx1 >= x0 - tol && wx0 <= x1 + tol && wz1 >= z0 - tol && wz0 <= z1 + tol && !!clipWallToRoom(room, w);
  }).map((o) => o.b);
}
/** shows with building b: belongs to no room, to the plot, or to b */
const shownWith = (owners, b) => !owners.length || owners.some((x) => x === null || x === b);

/** the plan as building b sees it: every floor with only what belongs to b or to the plot (the things themselves are the same objects, only
 *  the lists are new). The plan itself when b is not one of its buildings (all of them shown) */
export function viewOf(layout, b, owners = null) {
  if (!pickBuilding(layout, b)) return layout;
  const ro = owners || roomOwners(layout);
  return { ...layout, floors: (layout.floors || []).map((f, fi) => {
    const o = ro[fi] || [], at = (x, z) => shownWith(pointOwners(o, x, z), b);
    const inside = (k) => !polyOk(k) || at(...insidePoint(k.points));
    const walls = (f.walls || []).filter((w) => shownWith(wallOwners(o, w), b)), ids = new Set(walls.map((w) => w.id));
    return {
      ...f,
      rooms: o.filter((x) => x.b === null || x.b === b).map((x) => x.room),
      walls,
      devices: (f.devices || []).filter((d) => at(d.x || 0, d.z || 0)),
      stairs: (f.stairs || []).filter((s) => at(s.x || 0, s.z || 0)),
      blocks: (f.blocks || []).filter(inside),
      holes: (f.holes || []).filter(inside),
      ...(f.dormerWalls ? { dormerWalls: f.dormerWalls.filter((d) => !d.host || ids.has(d.host)) } : {}),
    };
  }) };
}
/** something of building b (or of the plot) lies on floor vf of viewOf(...): its button shows */
export const floorHas = (vf) => !!vf && ['rooms', 'walls', 'devices', 'stairs', 'blocks', 'holes'].some((k) => (vf[k] || []).length > 0);

/** the building a roof of roof floor i belongs to: its own; a further roof without one takes that of the room under the middle of its box on
 *  the nearest floor below; the main roof without one (and a roof over no room) belongs to the plot (null) and shows with every building */
export function roofOwner(layout, i, spec, box, owners = null) {
  const known = new Set(buildingsOf(layout).map((x) => x.id));
  if (typeof spec?.building === 'string' && known.has(spec.building)) return spec.building;
  if (!box || spec === layout.floors?.[i]?.roof) return null;
  const ro = owners || roomOwners(layout), cx = (box.x0 + box.x1) / 2, cz = (box.z0 + box.z1) / 2;
  for (let k = i - 1; k >= 0; k--) {
    const hit = (ro[k] || []).find(({ room }) => polyOk(room) && pointInPoly(cx, cz, room.points));
    if (hit) return hit.b;
  }
  return null;
}

/** "every building its own roof" on roof floor i: the tallest building keeps the main roof, every other one gets a further roof of the same
 *  kind over its own rooms, on top of its highest floor. autoBox(floors, i): the box a roof takes from the floors below (roofs.js). Returns
 *  { main: building id, parts: [{ building, name, box, level }] } (nothing to do: main null, no parts) */
export function roofsPerBuilding(layout, i, autoBox) {
  const ro = roomOwners(layout), out = { main: null, parts: [] };
  const tops = buildingsOf(layout).map((bd) => {
    let top = -1;
    for (let k = i - 1; k >= 0; k--) if (layout.floors[k].kind !== 'roof' && (ro[k] || []).some((o) => o.b === bd.id)) { top = k; break; }
    return { bd, top };
  }).filter((x) => x.top >= 0);
  if (!tops.length) return out;
  const tallest = tops.reduce((m, x) => (x.top > m.top ? x : m), tops[0]);
  out.main = tallest.bd.id;
  for (const { bd, top } of tops) {
    if (bd === tallest.bd) continue;
    const box = autoBox(viewOf(layout, bd.id, ro).floors, i);
    if (box) out.parts.push({ building: bd.id, name: bd.name, box, level: layout.floors[top].id });
  }
  return out;
}

/* ---- bringing another plan in (#409, step 4) ---- */

/** where floor `sf` of a plan with the floors `sfloors` goes in the plan with the floors `floors`: the index of the floor at the same level
 *  (basement -1, ground floor 0, the next one 1 ...; a roof floor on the roof floor of the same place), or -1 when there is none */
export function matchFloor(floors, sfloors, si, H = 3) {
  const sf = sfloors[si];
  if (sf.kind === 'roof') {
    const nth = sfloors.slice(0, si).filter((x) => x.kind === 'roof').length;
    const roofs = floors.map((f, i) => (f.kind === 'roof' ? i : -1)).filter((i) => i >= 0);
    return roofs[nth] ?? -1;
  }
  const want = floorElev(sfloors, si, H);
  return floors.findIndex((f, i) => f.kind !== 'roof' && Math.abs(floorElev(floors, i, H) - want) < 1e-6);
}

/** Bring plan `src` into plan `dst` (dst is changed, src is not: a copy is taken) as building `bid` named `name`: every floor of src goes
 *  onto the floor of dst at the same level (a new floor where dst has none, put in at the right height), turned by at.rot degrees and moved
 *  by at.x / at.z like a neighbour house (neighbor.js). Everything gets new ids (uid()); the rooms belong to the new building, so do its
 *  roofs, which become further roofs on top of its highest floor (at.autoBox(floors, i): the box of a roof without one, roofs.js).
 *  Returns { floors: how many floors were added, things: how many things were brought in } */
export function mergePlan(dst, src, at, bid, name, uid, H = 3) {
  const s = structuredClone(src);
  const nb = { x: at?.x || 0, z: at?.z || 0, rot: at?.rot || 0 };
  const fresh = [];                                                   // the devices brought in
  const P = (p) => placePoint(p, nb).map((v) => +v.toFixed(4));
  const turn = (r) => (((r || 0) + nb.rot) % 360 + 360) % 360;
  const ids = new Map(), nid = (old) => { if (!ids.has(old)) ids.set(old, uid()); return ids.get(old); };
  dst.buildings = [...buildingsOf(dst), { id: bid, name }];
  let added = 0, things = 0;
  const floorIds = new Map();
  s.floors.forEach((sf, si) => {
    let di = matchFloor(dst.floors, s.floors, si, H);
    if (di < 0) {                                                     // a level this plan does not have: a new floor at the right place
      const nf = { id: uid(), name: sf.name, ...(sf.kind ? { kind: sf.kind } : {}), walls: [], rooms: [], devices: [], stairs: [], blocks: [], holes: [] };
      const want = floorElev(s.floors, si, H);
      let pos = dst.floors.length;
      if (sf.kind !== 'roof') {
        const after = dst.floors.findIndex((f, i) => f.kind === 'roof' || floorElev(dst.floors, i, H) > want);
        if (after >= 0) pos = after;
      }
      dst.floors.splice(pos, 0, nf);
      di = pos;
      added++;
    }
    floorIds.set(sf.id, dst.floors[di].id);
  });
  s.floors.forEach((sf, si) => {
    const df = dst.floors.find((f) => f.id === floorIds.get(sf.id));
    const push = (key, list) => { if (list.length) { df[key] = [...(df[key] || []), ...list]; things += list.length; } };
    push('rooms', (sf.rooms || []).map((r) => ({ ...r, id: nid(r.id), points: (r.points || []).map(P), building: bid })));
    push('walls', (sf.walls || []).map((w) => ({ ...w, id: nid(w.id), a: P(w.a), b: P(w.b), openings: (w.openings || []).map((o) => ({ ...o, id: nid(o.id) })) })));
    push('blocks', (sf.blocks || []).map((k) => ({ ...k, id: nid(k.id), points: (k.points || []).map(P) })));
    push('holes', (sf.holes || []).map((k) => ({ ...k, id: nid(k.id), points: (k.points || []).map(P) })));
    push('stairs', (sf.stairs || []).map((st) => { const [x, z] = P([st.x || 0, st.z || 0]); return { ...st, id: nid(st.id), x, z, rot: turn(st.rot) }; }));
    const devs = (sf.devices || []).map((d) => { const [x, z] = P([d.x || 0, d.z || 0]); return { ...d, id: nid(d.id), x, z, rot: turn(d.rot) }; });
    fresh.push(...devs);
    push('devices', devs);
    if (sf.kind === 'roof' && sf.roof) {                             // its roofs become further roofs of this roof floor, in the new building
      const turnBox = (bx) => { const c = [[bx.x0, bx.z0], [bx.x1, bx.z0], [bx.x1, bx.z1], [bx.x0, bx.z1]].map(P); const [x0, x1, z0, z1] = boxOf(c); return { x0, x1, z0, z1 }; };
      const lv = (id) => (id && floorIds.has(id) ? floorIds.get(id) : undefined);
      const r = (df.roof ||= { type: 'gable', pitch: 35, overhang: 0.4 });
      const ownTop = [...s.floors].slice(0, si).reverse().find((x) => x.kind !== 'roof');
      const list = [];
      const box = sf.roof.box && Number.isFinite(sf.roof.box.x0) ? sf.roof.box : at?.autoBox?.(s.floors, si);
      if (box) list.push({ id: `rp${uid()}`, name, type: sf.roof.type || 'gable', pitch: sf.roof.pitch ?? 35, overhang: sf.roof.overhang ?? 0.4, box: turnBox(box), building: bid, ...(ownTop ? { level: floorIds.get(ownTop.id) } : {}) });
      (sf.roof.parts || []).forEach((p) => { if (p.box) list.push({ ...p, id: `rp${uid()}`, box: turnBox(p.box), building: bid, ...(lv(p.level) ? { level: lv(p.level) } : {}) }); });
      if (list.length) { r.parts = [...(r.parts || []), ...list]; things += list.length; }
    }
  });
  // what pointed at another thing of src points at its copy: LED rings at their room, cables at their device
  fresh.forEach((d) => {
    if (d.room && ids.has(d.room)) d.room = ids.get(d.room);
    if (Array.isArray(d.cables)) d.cables = d.cables.map((c) => ({ ...c, id: uid(), ...(c.to && ids.has(c.to) ? { to: ids.get(c.to) } : {}) }));
  });
  return { floors: added, things };
}
