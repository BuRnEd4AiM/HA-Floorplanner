// Unit tests for search.js (where a jump goes, #215; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const S = await import(`${dir}/search.js`);

const floors = [
  { walls: [], devices: [{ id: 'd1', x: 1, z: 2, y: 1.8 }] },
  { walls: [{ a: [0, 0], b: [4, 0], openings: [{ id: 'o1', pos: 1, sill: 0.9, height: 1.2 }] }, { a: [0, 0], b: [0, 3], openings: [{ id: 'o2', pos: 2, height: 2.1 }] }], devices: [{ id: 'd2', x: 5, z: 5 }] },
];
test('a device: its position and height', () => {
  assert.deepEqual(S.targetPoint(floors, { floor: 0, kind: 'device', id: 'd1' }), { x: 1, y: 1.8, z: 2 });
  assert.deepEqual(S.targetPoint(floors, { floor: 1, kind: 'device', id: 'd2' }), { x: 5, y: 0, z: 5 });
});
test('a door or window: its middle on the wall, half way up', () => {
  assert.deepEqual(S.targetPoint(floors, { floor: 1, kind: 'opening', id: 'o1' }), { x: 1, y: 1.5, z: 0 });
  assert.deepEqual(S.targetPoint(floors, { floor: 1, kind: 'opening', id: 'o2' }), { x: 0, y: 1.05, z: 2 });
});
test('nothing to fly to: wrong floor, unknown id or kind', () => {
  assert.equal(S.targetPoint(floors, { floor: 0, kind: 'device', id: 'd2' }), null);
  assert.equal(S.targetPoint(floors, { floor: 9, kind: 'device', id: 'd1' }), null);
  assert.equal(S.targetPoint(floors, { floor: 1, kind: 'room', id: 'r' }), null);
});
