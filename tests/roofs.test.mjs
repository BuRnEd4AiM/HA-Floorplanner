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
