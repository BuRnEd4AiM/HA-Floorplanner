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
test('value labels: none, the important ones (sensors, climate, covers) or every device with an entity', () => {
  const sensor = { entity: 'sensor.t' }, lamp = { entity: 'light.a' }, plant = { entity: '' };
  assert.equal(F.wantsLabel(sensor, 'important'), true);
  assert.equal(F.wantsLabel({ entity: 'cover.r' }, 'important'), true);
  assert.equal(F.wantsLabel(lamp, 'important'), false);
  assert.equal(F.wantsLabel(lamp, 'all'), true);
  assert.equal(F.wantsLabel(sensor, 'none'), false);
  assert.equal(F.wantsLabel(plant, 'all'), false);
});
test('garden things lie under the floors and keep their colours in the hologram look', () => {
  assert.ok(F.GROUND_COVER.has('lawn') && !F.GROUND_COVER.has('tree'));
  assert.ok(F.OUTDOOR.has('tree') && F.OUTDOOR.has('lawn') && !F.OUTDOOR.has('sofa'));
});
