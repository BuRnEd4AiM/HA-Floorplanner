// Unit tests for roofs.js (roof boxes; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const R = await import(`${dir}/roofs.js`);

const sq = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const floor = (kind, rooms = [], walls = []) => ({ kind, rooms, walls });

test('roof box: everything under the roof floor, basements and the roof floor itself do not count', () => {
  const floors = [floor('basement', [{ points: sq(-5, -5, 20, 20) }]), floor('floor', [{ points: sq(0, 0, 8, 6) }], [{ a: [0, 0], b: [10, 0] }]), floor('roof')];
  assert.deepEqual(R.roofBoxOf(floors, 2), { x0: 0, x1: 10, z0: 0, z1: 6 });
  assert.equal(R.autoRoofBox([floor('floor'), floor('roof')], 1), null);
});
test('roof box of one building of several: a wall that shows only in part counts with its part (#451)', () => {
  const f = { ...floor('floor', [{ points: sq(14, 0, 18, 4) }], [{ id: 'w', a: [0, 0], b: [18, 0] }]), wallCuts: new Map([['w', [[14 / 18, 1]]]]) };
  const box = R.autoRoofBox([f, floor('roof')], 1);
  assert.ok(Math.abs(box.x0 - 14) < 1e-9 && box.x1 === 18 && box.z0 === 0 && box.z1 === 4, JSON.stringify(box));
});
test('roof box: a roof terrace (and what lies below it) has no roof', () => {
  const floors = [
    floor('floor', [{ points: sq(0, 0, 8, 6) }, { points: sq(8, 0, 12, 6) }]),                        // the garage at x 8..12
    floor('floor', [{ points: sq(0, 0, 8, 6) }, { points: sq(8, 0, 12, 6), terrace: true }]),        // its roof is a terrace
    floor('roof')];
  assert.deepEqual(R.roofBoxOf(floors, 2), { x0: 0, x1: 8, z0: 0, z1: 6 });
});
test('roof box: a size set by hand wins when it is valid', () => {
  const floors = [floor('floor', [{ points: sq(0, 0, 8, 6) }]), { ...floor('roof'), roof: { box: { x0: 1, x1: 5, z0: 2, z1: 4 } } }];
  assert.deepEqual(R.roofBoxOf(floors, 1), { x0: 1, x1: 5, z0: 2, z1: 4 });
  floors[1].roof.box = { x0: 5, x1: 1, z0: 2, z1: 4 };                                                // turned round: ignored
  assert.deepEqual(R.roofBoxOf(floors, 1), { x0: 0, x1: 8, z0: 0, z1: 6 });
});
test('further roof: only a complete, non-empty box', () => {
  assert.deepEqual(R.partBox({ box: { x0: 0, x1: 2, z0: 0, z1: 3, extra: 1 } }), { x0: 0, x1: 2, z0: 0, z1: 3 });
  assert.equal(R.partBox({ box: { x0: 0, x1: 0, z0: 0, z1: 3 } }), null);
  assert.equal(R.partBox({ box: { x0: 0, x1: 2, z0: 0 } }), null);
  assert.equal(R.partBox(null), null);
});
test('terrace railing: also along edges that are open from corner to corner (no wall at all)', async () => {
  const T = await import(`${dir}/vendor/three.module.min.js`);
  const ui = R.initRoofs({ layout: () => ({ floors: [] }), elev: () => 0, mat: () => new T.MeshBasicMaterial(), HOLO: {}, camera: () => null, settings: () => ({}), wallSee: 0.3, editingRoof: () => false });
  const g = new T.Group();
  ui.railing(g, { points: sq(0, 0, 6, 5), terrace: true }, { walls: [] }, false, false);
  assert.equal(g.children.length, 1);                                          // the rails and posts of all edges in one mesh (balcony3d.js, #646)
  const bb = new T.Box3().setFromObject(g);
  assert.ok(bb.min.x < 0.01 && bb.max.x > 5.99 && bb.min.z < 0.01 && bb.max.z > 4.99 && bb.max.y > 1, JSON.stringify(bb));   // every edge fenced
  assert.ok(g.children[0].geometry.getAttribute('position').count >= 24 * (4 * 2 + 4 * 5), 'two rails and the posts on each edge');
  const g2 = new T.Group();
  ui.railing(g2, { points: sq(0, 0, 6, 5), terrace: true }, { walls: [[0, 0, 6, 0], [6, 0, 6, 5], [6, 5, 0, 5], [0, 5, 0, 0]].map(([a, b, c, d]) => ({ a: [a, b], b: [c, d], thickness: 0.2 })) }, false, false);
  assert.equal(g2.children.length, 0);                                         // walls all round: nothing to fence
});
test('balcony railing: glass panes and wood are their own meshes (#646)', async () => {
  const T = await import(`${dir}/vendor/three.module.min.js`);
  const ui = R.initRoofs({ layout: () => ({ floors: [] }), elev: () => 0, mat: () => new T.MeshBasicMaterial(), HOLO: {}, camera: () => null, settings: () => ({}), wallSee: 0.3, editingRoof: () => false });
  const kinds = (rail) => { const g = new T.Group(); ui.railing(g, { points: sq(0, 0, 4, 2), terrace: true, rail }, { walls: [] }, false, false); return g.children.map((m) => m.userData.railing).sort(); };
  assert.deepEqual(kinds(undefined), ['metal']);
  assert.deepEqual(kinds('glass'), ['glass', 'metal']);
  assert.deepEqual(kinds('wood'), ['wood']);
});
