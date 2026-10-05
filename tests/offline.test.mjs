// Unit tests for offline.js (run: rm -rf /tmp/static && cp -r floorplan3d/rootfs/app/static /tmp/static && echo '{"type":"module"}' > /tmp/static/package.json && STATIC_DIR=/tmp/static node --test tests/offline.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const O = await import(`${process.env.STATIC_DIR || '/tmp/static'}/offline.js`);
const t = (k) => k;
const pip = () => true;
const env = (over = {}) => ({ layout: { floors: [] }, entities: [{ entity_id: 'x' }], states: {}, t, catOf: (ty) => (ty === 'light' ? 'lighting' : ty === 'sofa' ? 'living' : 'smart'), pointInPoly: pip, ...over });

test('reason: missing entity, unavailable, unknown (but fine for scenes and buttons), online', () => {
  const st = { 'light.a': { state: 'unavailable' }, 'sensor.b': { state: 'unknown' }, 'scene.c': { state: 'unknown' }, 'light.d': { state: 'on' } };
  assert.equal(O.offlineReason(st, 'light.gone'), 'missing');
  assert.equal(O.offlineReason(st, 'light.a'), 'unavailable');
  assert.equal(O.offlineReason(st, 'sensor.b'), 'unknown');
  assert.equal(O.offlineReason(st, 'scene.c'), null);
  assert.equal(O.offlineReason(st, 'light.d'), null);
});
test('nothing is known to be offline before the entities are loaded', () => {
  assert.deepEqual(O.offlineDevices(env({ entities: [], layout: { floors: [{ devices: [{ id: 'd', type: 'light', entity: 'light.x' }], walls: [], rooms: [] }] } })), []);
});
test('a lamp without an entity is "unlinked", furniture without one is fine', () => {
  const layout = { floors: [{ rooms: [{ name: 'Wohnzimmer', points: [] }], walls: [], devices: [{ id: 'l', type: 'light', x: 1, z: 1, name: 'Lampe', entity: '' }, { id: 's', type: 'sofa', x: 2, z: 2, entity: '' }] }] };
  const list = O.offlineDevices(env({ layout }));
  assert.equal(list.length, 1);
  assert.deepEqual([list[0].reason, list[0].id, list[0].room], ['unlinked', 'l', 'Wohnzimmer']);
});
test('a device whose entity is unavailable or gone is listed with its room; a window contact too; online ones are not', () => {
  const layout = { floors: [{ rooms: [{ name: 'Küche', points: [] }], devices: [{ id: 'a', type: 'light', x: 0, z: 0, entity: 'light.a', name: 'A' }, { id: 'b', type: 'light', x: 0, z: 0, entity: 'light.b', name: 'B' }, { id: 'c', type: 'light', x: 0, z: 0, entity: 'light.gone', name: 'C' }],
    walls: [{ a: [0, 0], b: [2, 0], openings: [{ id: 'w', type: 'window', entity: 'binary_sensor.w', name: 'Fenster' }] }] }] };
  const states = { 'light.a': { state: 'unavailable', since: '2026-01-01T00:00:00Z' }, 'light.b': { state: 'on' }, 'binary_sensor.w': { state: 'unavailable' } };
  const list = O.offlineDevices(env({ layout, states }));
  assert.deepEqual(list.map((x) => [x.id, x.reason]).sort(), [['a', 'unavailable'], ['c', 'missing'], ['w', 'unavailable']]);
  assert.equal(list.find((x) => x.id === 'a').since, '2026-01-01T00:00:00Z');
  assert.equal(list.find((x) => x.id === 'w').kind, 'opening');
});
test('a radiator without an entity is not "unlinked" (it is often just drawn)', () => {
  const layout = { floors: [{ rooms: [], walls: [], devices: [{ id: 'r', type: 'radiator', x: 0, z: 0, entity: '' }] }] };
  assert.deepEqual(O.offlineDevices(env({ layout, catOf: () => 'smart' })), []);
});
