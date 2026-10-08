// Unit tests for phonenav.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const P = await import(`${process.env.STATIC_DIR || '/tmp/static'}/phonenav.js`);
const lb = { house: 'Ganzes Haus' };
const floors = [
  { name: 'Keller', rooms: [], devices: [] },
  { name: 'Erdgeschoss', rooms: [], devices: [] },
  { name: 'Obergeschoss', rooms: [], devices: [] },
];

test('the button names the floor shown, or the whole house', () => {
  assert.equal(P.phoneFloorModel(floors, 1, false, lb).label, 'Erdgeschoss');
  assert.equal(P.phoneFloorModel(floors, 1, true, lb).label, 'Ganzes Haus');
});
test('the list: every floor (the one shown marked), then the whole house', () => {
  const m = P.phoneFloorModel(floors, 2, false, lb);
  assert.deepEqual(m.items.map((i) => [i.kind, i.label, i.active]),
    [['floor', 'Keller', false], ['floor', 'Erdgeschoss', false], ['floor', 'Obergeschoss', true], ['house', 'Ganzes Haus', false]]);
  assert.deepEqual(m.items.filter((i) => i.kind === 'floor').map((i) => i.fi), [0, 1, 2]);
});
test('whole house: only that entry is marked', () => {
  const m = P.phoneFloorModel(floors, 0, true, lb);
  assert.deepEqual(m.items.filter((i) => i.active).map((i) => i.kind), ['house']);
});
test('a single empty floor has no whole-house entry, one with devices has', () => {
  assert.deepEqual(P.phoneFloorModel([floors[0]], 0, false, lb).items.map((i) => i.kind), ['floor']);
  assert.deepEqual(P.phoneFloorModel([{ name: 'W', rooms: [], devices: [{}] }], 0, false, lb).items.map((i) => i.kind), ['floor', 'house']);
});
