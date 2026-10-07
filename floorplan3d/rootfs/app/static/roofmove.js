/* Moving roofs (#255): on the open roof floor every roof (the main one and the further ones) can be picked and dragged, in 3D and in the 2D
 * plan, or nudged with the arrow keys. A roof is a rectangle (its base box); the main roof follows the house by itself until it is first
 * moved, then it keeps its own box ("size set by hand"). Solar panels lying on a roof go along; dormers sit on the roof anyway. Pure
 * (unit test: tests/roofmove.test.mjs). */

/** the selection id of the main roof of floor f (a further roof uses its own id) */
export const mainRoofId = (f) => `${f.id}:roof`;

const okBox = (b) => !!b && [b.x0, b.x1, b.z0, b.z1].every(Number.isFinite) && b.x1 > b.x0 && b.z1 > b.z0;

/** the roofs of roof floor f as rectangles: [{ id, main, name, box }]; autoBox: the box the main roof takes from the house below (or null) */
export function roofRects(f, autoBox) {
  if (f?.kind !== 'roof') return [];
  const r = f.roof || {}, out = [];
  const main = okBox(r.box) ? r.box : autoBox;
  if (okBox(main)) out.push({ id: mainRoofId(f), main: true, name: '', box: { x0: main.x0, x1: main.x1, z0: main.z0, z1: main.z1 } });
  (r.parts || []).forEach((p, i) => { if (okBox(p.box)) out.push({ id: p.id || `part${i}`, main: false, name: p.name || '', box: { ...p.box } }); });
  return out;
}

/** the roof under the point (x, z): the smallest rectangle that holds it (a small further roof inside the main one wins), or null */
export function roofAt(rects, x, z) {
  const hit = rects.filter(({ box: b }) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1);
  hit.sort((a, b) => (a.box.x1 - a.box.x0) * (a.box.z1 - a.box.z0) - (b.box.x1 - b.box.x0) * (b.box.z1 - b.box.z0));
  return hit[0] || null;
}

/** the box of roof `id` that can be changed: the main roof gets a box of its own the first time (from autoBox); null when there is none */
export function roofBoxFor(f, id, autoBox) {
  const r = (f.roof ||= {});
  if (id === mainRoofId(f)) {
    if (!okBox(r.box)) { if (!okBox(autoBox)) return null; r.box = { x0: autoBox.x0, x1: autoBox.x1, z0: autoBox.z0, z1: autoBox.z1 }; }
    return r.box;
  }
  const p = (r.parts || []).find((q, i) => (q.id || `part${i}`) === id);
  return p && okBox(p.box) ? p.box : null;
}

const r3 = (v) => +v.toFixed(3);
/** the solar panels of floor f lying on a roof with base box b: they go along when it moves */
export const panelsOn = (f, b) => (f.devices || []).filter((d) => d.type === 'solarpanel' && d.x >= b.x0 && d.x <= b.x1 && d.z >= b.z0 && d.z <= b.z1);
/** move roof `id` of floor f by (dx, dz) metres; the solar panels lying on it (on this floor, inside its box) go along. true when moved */
export function moveRoof(f, id, dx, dz, autoBox) {
  if (!dx && !dz) return false;
  const b = roofBoxFor(f, id, autoBox);
  if (!b) return false;
  panelsOn(f, b).forEach((d) => { d.x = r3(d.x + dx); d.z = r3(d.z + dz); });
  b.x0 = r3(b.x0 + dx); b.x1 = r3(b.x1 + dx); b.z0 = r3(b.z0 + dz); b.z1 = r3(b.z1 + dz);
  return true;
}

/** the smallest width and depth a roof can be dragged to (m) */
export const MIN_ROOF = 1;
/** the 8 size handles of a roof box b in the 2D plan: its corners and the middle of each side; which: 'nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'
 *  (n = the side with the smaller z, the top in the plan) */
export function roofHandles(b) {
  const mx = (b.x0 + b.x1) / 2, mz = (b.z0 + b.z1) / 2;
  return [['nw', b.x0, b.z0], ['n', mx, b.z0], ['ne', b.x1, b.z0], ['e', b.x1, mz], ['se', b.x1, b.z1], ['s', mx, b.z1], ['sw', b.x0, b.z1], ['w', b.x0, mz]]
    .map(([which, x, z]) => ({ which, x, z }));
}
/** a size handle `which` of a roof dragged to (x, z): the box from `start` with the handle's sides there (on the `grid`, 0 = free), the other
 *  sides stay, never smaller than MIN_ROOF */
export function resizeBox(start, which, x, z, grid) {
  const snap = (v) => (grid > 0 ? Math.round(v / grid) * grid : v), b = { x0: start.x0, x1: start.x1, z0: start.z0, z1: start.z1 };
  if (which.includes('w')) b.x0 = r3(Math.min(snap(x), b.x1 - MIN_ROOF));
  if (which.includes('e')) b.x1 = r3(Math.max(snap(x), b.x0 + MIN_ROOF));
  if (which.includes('n')) b.z0 = r3(Math.min(snap(z), b.z1 - MIN_ROOF));
  if (which.includes('s')) b.z1 = r3(Math.max(snap(z), b.z0 + MIN_ROOF));
  return b;
}
/** give roof `id` of floor f the box nb (the main roof then keeps it, "size set by hand"); true when it changed. Solar panels stay where they are */
export function setRoofBox(f, id, nb, autoBox) {
  const b = roofBoxFor(f, id, autoBox);
  if (!b || !okBox(nb) || ['x0', 'x1', 'z0', 'z1'].every((k) => b[k] === nb[k])) return false;
  b.x0 = r3(nb.x0); b.x1 = r3(nb.x1); b.z0 = r3(nb.z0); b.z1 = r3(nb.z1);
  return true;
}

/** a drag from a start box by the pointer's way (wx, wz): the corner lands on the grid (`grid` m, 0 = free); the move still to do */
export function dragStep(start, now, wx, wz, grid) {
  const snap = (v) => (grid > 0 ? Math.round(v / grid) * grid : v);
  return { dx: r3(snap(start.x0 + wx) - now.x0), dz: r3(snap(start.z0 + wz) - now.z0) };
}

/** the roof meshes of floor f in its group g (roofs.js tags them with roofPart) get the selection id of their roof: each(mesh, id) */
export function tagRoofMeshes(g, f, each) {
  g.children.forEach((m) => {
    const tag = m.userData?.roofPart;
    if (!tag) return;
    const id = tag === 'main' ? mainRoofId(f) : tag;
    m.userData.kind = 'roof'; m.userData.id = id;
    each(m, id);
  });
}
