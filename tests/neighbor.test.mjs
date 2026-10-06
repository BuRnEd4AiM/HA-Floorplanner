// Unit tests for neighbor.js (the neighbour house, #220; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const N = await import(`${dir}/neighbor.js`);
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const fl = (kind, o = {}) => ({ kind, walls: [], rooms: [], devices: [], ...o });

test('a point of the neighbour: moved by x / z, turned like a device', () => {
  assert.deepEqual(N.placePoint([1, 2], { x: 10, z: 5 }), [11, 7]);
  const p = N.placePoint([1, 0], { x: 0, z: 0, rot: 90 });               // like a device turned by 90 degrees: local +x points to -z
  near(p[0], 0); near(p[1], -1);
});
test('floor heights: the ground floor at 0, basements below, upper floors above', () => {
  const floors = [fl('basement'), fl('floor'), fl('floor'), fl('roof')];
  assert.deepEqual(floors.map((f, i) => N.floorElev(floors, i, 3)), [-3, 0, 3, 6]);
});
test('which floors show: all in the whole-house view, else up to the open floor (with the height of the neighbour)', () => {
  const floors = [fl('floor'), fl('floor'), fl('roof')];
  assert.deepEqual(N.shownFloors(floors, {}, 3), [0, 1, 2]);
  assert.deepEqual(N.shownFloors(floors, {}, 3, 3), [0, 1]);              // seen from the 1st floor: its own level, not the roof above
  assert.deepEqual(N.shownFloors(floors, { y: 3 }, 3, 3), [0]);           // standing 3 m higher: only its ground floor reaches up to here
});
test('outline on a level: walls and room edges of the floor at that height, placed into this plan', () => {
  const floors = [fl('floor', { walls: [{ a: [0, 0], b: [4, 0] }] }), fl('floor', { rooms: [{ points: [[0, 0], [2, 0], [2, 2]] }], walls: [{ a: [0, 0], b: [0, 2] }] })];
  const segs = N.outlineAt(floors, { x: 10, z: 0 }, 3, 3);
  assert.equal(segs.length, 4);                                          // one wall and three room edges of the upper floor
  assert.deepEqual(segs[0], [[10, 0], [10, 2]]);
  assert.deepEqual(N.outlineAt(floors, {}, 3, 7), []);
});
test('a neighbour entry keeps its numbers in range', () => {
  assert.deepEqual(N.cleanNeighbor({ house: 'b', x: '2.5', z: null, rot: -90, y: 99 }), { house: 'b', x: 2.5, z: 0, rot: 270, y: 50 });
  assert.deepEqual(N.cleanNeighbor(null), { house: '', x: 0, z: 0, rot: 0, y: 0 });
});
test('a storey of the neighbour a bit higher or lower still counts as the same level (#222)', () => {
  const floors = [fl('floor'), fl('floor', { rooms: [{ points: [[0, 0], [2, 0], [2, 2]] }] })];
  assert.equal(N.outlineAt(floors, { y: 0.6 }, 3, 3).length, 3);                 // 60 cm higher: still the 1st floor
  assert.equal(N.outlineAt(floors, { y: -0.4 }, 3, 3).length, 3);
  assert.equal(N.outlineAt([fl('floor', { rooms: [{ points: [[0, 0], [2, 0], [2, 2]] }] })], {}, 3, 3).length, 0);   // a whole storey lower: not this level
});
test('our device in the neighbour\'s frame: the reverse of placePoint, the turn taken off', () => {
  const nb = { x: 19, z: 2, rot: 90 };
  const local = N.intoNeighbor({ x: 0, z: 0, rot: 30, len: 4 }, nb);
  const back = N.placePoint([local.x, local.z], nb);
  near(back[0], 0); near(back[1], 0);
  assert.equal(local.rot, -60); assert.equal(local.len, 4);
});
test('bridges that reach a floor of the neighbour: start or far end at its height (#222)', () => {
  const nb = { x: 19, z: 0, y: 0.4 };
  const bridges = [{ d: { id: 'a', x: 17, z: 3, rise: 0.4 }, y: 3 }, { d: { id: 'b', x: 17, z: 3 }, y: 0 }];
  assert.deepEqual(N.bridgesAt(bridges, nb, 3.4, 3).map((d) => [d.id, d.x, d.z]), [['a', -2, 3]]);   // only the one on the upper floor, in its frame
  assert.deepEqual(N.bridgesAt(bridges, nb, 6.4, 3), []);
  assert.deepEqual(N.bridgesAt(undefined, nb, 3.4, 3), []);
});
