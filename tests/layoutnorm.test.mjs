// Unit tests for layoutnorm.js (a loaded floor plan made complete, #137 step 23; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const N = await import(`${process.env.STATIC_DIR || '/tmp/static'}/layoutnorm.js`);

test('an empty plan gets one floor in the language of the user', () => {
  for (const raw of [null, {}, { floors: [] }]) {
    const l = N.normalizeLayout(raw, 'Ground floor', () => 'f1');
    assert.equal(l.floors.length, 1); assert.equal(l.floors[0].name, 'Ground floor'); assert.equal(l.floors[0].id, 'f1');
    assert.deepEqual(l.floors[0].holes, []); assert.equal(l.floors[0].kind, 'floor');
  }
});
test('every floor gets its lists and a kind, every wall its openings; what is there stays', () => {
  const raw = { floors: [{ id: 'a', name: 'KG', kind: 'basement', walls: [{ id: 'w' }], devices: [{ id: 'd' }] }] };
  const l = N.normalizeLayout(raw, 'x', () => 'n');
  assert.equal(l, raw);                                                          // changed in place
  const f = l.floors[0];
  assert.equal(f.kind, 'basement'); assert.deepEqual(f.devices, [{ id: 'd' }]);
  for (const k of ['rooms', 'blocks', 'stairs', 'holes']) assert.deepEqual(f[k], []);
  assert.deepEqual(f.walls[0].openings, []);
});
test('the add-on\'s "Erdgeschoss" of a new house shows in the user\'s language, but only while nothing is drawn', () => {
  const fresh = { floors: [{ name: 'Erdgeschoss', walls: [], rooms: [], devices: [], blocks: [] }] };
  N.localizeDefaults(fresh, 'Ground floor'); assert.equal(fresh.floors[0].name, 'Ground floor');
  const drawn = { floors: [{ name: 'Erdgeschoss', walls: [{}], rooms: [], devices: [], blocks: [] }] };
  N.localizeDefaults(drawn, 'Ground floor'); assert.equal(drawn.floors[0].name, 'Erdgeschoss');
  const two = { floors: [{ name: 'Erdgeschoss' }, { name: 'OG' }] };
  N.localizeDefaults(two, 'Ground floor'); assert.equal(two.floors[0].name, 'Erdgeschoss');
});
