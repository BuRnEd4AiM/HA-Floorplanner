// Unit tests for floorbuild.js (the flat parts of a floor in 3D, split step 21 part 1 of #137; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const F = await import(`${process.env.STATIC_DIR || '/tmp/static'}/floorbuild.js`);
const room = { name: 'Küche', points: [[0, 0], [4, 0], [4, 3], [0, 3]] };

test('a room name floats in the middle of its corners', () => {
  assert.deepEqual(F.roomCenter(room.points), [2, 1.5]);
});
test('room label: the name, in the top view with the area in m² or ft²', () => {
  assert.equal(F.roomLabel(room, false, false), 'Küche');
  assert.equal(F.roomLabel(room, true, false), 'Küche · 12.0 m²');
  assert.equal(F.roomLabel(room, true, true), 'Küche · 129 ft²');
});
