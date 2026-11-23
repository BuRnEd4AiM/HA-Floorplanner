/* 🏠 A canopy over a door (Vordach, #786: Mario's front door, a small shed roof of wood with tiles on two posts that stand on the landing of
 * the outdoor steps). A device `porchroof` on the floor of the door: its back edge at the wall, its front on a beam over two posts (or
 * hanging on the wall without them). Its fields (all optional): `w` (width), `d` (how far it reaches out), `h` (the underside of the front
 * beam over the floor), `pitch` (degrees), `noPosts`, `cover`: 'tiles' (the default), 'metal' or 'glass'.
 * Here: its size with defaults and limits, the boxes it is made of (models.js draws them), where it goes over a door ("＋ Vordach über die
 * Tür" in the panel of a door) and where its back edge lies (levels.js lifts it with the house there, on a plateau too).
 * Pure (no three.js, no DOM; unit test: tests/porchroof.test.mjs). */
export const PORCH = { w: 2.4, d: 1.2, h: 2.45, pitch: 15, beam: 0.14, post: 0.12 };
export const PORCH_COVERS = ['tiles', 'metal', 'glass'];

const num = (v) => (v === null || v === '' || v === undefined ? NaN : +v);
const clamp = (v, lo, hi, def) => { const n = num(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : def; };
const r3 = (v) => Math.round(v * 1000) / 1000;

/** { w, d, h, pitch, posts, cover } with defaults and limits */
export function porchSize(dev) {
  return { w: clamp(dev?.w, 0.8, 8, PORCH.w), d: clamp(dev?.d, 0.6, 3, PORCH.d), h: clamp(dev?.h, 1.9, 4, PORCH.h), pitch: clamp(dev?.pitch, 5, 35, PORCH.pitch),
    posts: !dev?.noPosts, cover: PORCH_COVERS.includes(dev?.cover) ? dev.cover : 'tiles' };
}

/** the boxes of the canopy in its own frame: x across, y up from the floor, z out from the wall (the wall at -d/2, the front at +d/2):
 *  [{ kind: post | beam | plate | rafter | brace | cover, w (x), h (y), d (z), x, y (the bottom at its middle), z, rx (radians round x: the
 *  +z end down), rz (round z) }] */
export function porchParts(dev) {
  const { w, d, h, pitch, posts } = porchSize(dev), parts = [], tan = Math.tan((pitch * Math.PI) / 180), cos = Math.cos((pitch * Math.PI) / 180);
  const B = PORCH.beam, P = PORCH.post, zf = d / 2 - 0.1, over = 0.12, rx = (pitch * Math.PI) / 180;
  const under = (z) => h + (zf - z) * tan;                                          // the underside of the rafters: on the front beam, up to the wall
  const z0 = -d / 2, z1 = d / 2 + over, zc = (z0 + z1) / 2, L = (z1 - z0) / cos;
  parts.push({ kind: 'beam', w: w + 0.1, h: B, d: 0.12, x: 0, y: r3(h - B), z: r3(zf), rx: 0, rz: 0 });
  parts.push({ kind: 'plate', w, h: 0.12, d: 0.08, x: 0, y: r3(under(z0 + 0.04) - 0.12), z: r3(z0 + 0.04), rx: 0, rz: 0 });   // on the wall
  const n = Math.max(2, Math.ceil(w / 0.7) + 1);
  for (let i = 0; i < n; i++) parts.push({ kind: 'rafter', w: 0.07, h: 0.12, d: r3(L), x: r3(-w / 2 + 0.05 + ((w - 0.1) * i) / (n - 1)), y: r3(under(zc)), z: r3(zc), rx, rz: 0 });
  parts.push({ kind: 'cover', w: r3(w + 0.24), h: 0.05, d: r3(L + 0.04), x: 0, y: r3(under(zc) + 0.12 / cos), z: r3(zc), rx, rz: 0 });
  if (posts) [-1, 1].forEach((s) => {
    const x = s * (w / 2 - 0.1);
    parts.push({ kind: 'post', w: P, h: r3(h - B), d: P, x: r3(x), y: 0, z: r3(zf), rx: 0, rz: 0 });
    const bl = 0.55, bx = x - s * (P / 2 + (bl * Math.SQRT1_2) / 2);                // a head brace from the post up to the beam, inwards
    parts.push({ kind: 'brace', w: bl, h: 0.07, d: 0.07, x: r3(bx), y: r3(h - B - (bl * Math.SQRT1_2) / 2 - 0.035), z: r3(zf), rx: 0, rz: -s * (Math.PI / 4) });   // its inner end up
  });
  return parts;
}

/** where its back edge (at the wall) lies in the plan: the device's x, z, rot (degrees, +z of its own frame turned outwards) */
export function porchBack(dev) {
  const { d } = porchSize(dev), r = ((+dev?.rot || 0) * Math.PI) / 180;
  return [r3((+dev?.x || 0) - Math.sin(r) * (d / 2)), r3((+dev?.z || 0) - Math.cos(r) * (d / 2))];
}

/** a canopy over the door `opId` that leads outside: doors are levels.js outerDoors(floor) ({ wall, op, x, z, ux, uz, level }).
 *  { x, z, rot, w, h } (the device's middle, turned outwards, a little wider than the door, its beam 30 cm over the door), or null */
export function porchAtDoor(doors, opId, dev = {}) {
  const door = (doors || []).find((q) => q.op.id === opId);
  if (!door) return null;
  const { d } = porchSize(dev), th = (+door.wall.thickness || 0.2) / 2, out = th + d / 2;
  const w = Math.max(1.6, Math.min(8, Math.round(((+door.op.width || 1) + 1.2) * 10) / 10));
  const h = Math.max(1.9, Math.min(4, Math.round((Math.max(0, door.level) + (+door.op.sill || 0) + (+door.op.height || 2.1) + 0.3) * 100) / 100));
  return { x: r3(door.x + door.ux * out), z: r3(door.z + door.uz * out), rot: Math.round((Math.atan2(door.ux, door.uz) * 180) / Math.PI), w, h };
}
