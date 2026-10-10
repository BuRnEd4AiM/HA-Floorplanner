// Unit tests for renames.js (entities renamed in Home Assistant; run like offline.test.mjs, see there). Same cases as tests/test_renames.py.
import test from 'node:test';
import assert from 'node:assert/strict';

const R = await import(`${process.env.STATIC_DIR || '/tmp/static'}/renames.js`);

const plan = () => ({ version: 1, floors: [{ id: 'f1', devices: [
  { id: 'd1', type: 'sensor', name: 'H1-AZFA-TEM01 Temperatur', entity: 'sensor.old_temperature' },
  { id: 'd2', type: 'lamp', name: 'Leselampe', entity: 'light.a', model: 'lamp.glb' },
  { id: 'd3', type: 'ledring', name: 'light.a', entity: 'light.a', segs: [{ entity: 'light.a' }, { entity: 'light.z' }] },
  { id: 'd4', type: 'tv', name: 'TV', entity: 'media_player.tv', ledEntity: 'light.a' },
], walls: [{ openings: [{ entity: 'binary_sensor.door', paneEntities: ['binary_sensor.door', 'binary_sensor.p2'] }] }] }],
labels: { 'light.a': 'oben' } });

test('new ids everywhere, Home Assistant names only where the name was not typed by hand', () => {
  const p = plan();
  const n = R.rewriteIds(p, { 'light.a': 'light.b', 'sensor.old_temperature': 'sensor.new_temperature', 'binary_sensor.door': 'binary_sensor.tuer' },
    { 'sensor.new_temperature': ['H1-AZFA-TEM01 Temperatur', 'H1-BUE-TEM01 Temperatur'], 'light.b': ['Lampe', 'Lampe neu'] });
  const d = p.floors[0].devices;
  assert.deepEqual(d[0], { id: 'd1', type: 'sensor', name: 'H1-BUE-TEM01 Temperatur', entity: 'sensor.new_temperature' });
  assert.equal(d[1].entity, 'light.b'); assert.equal(d[1].name, 'Leselampe'); assert.equal(d[1].model, 'lamp.glb');
  assert.equal(d[2].name, 'light.b'); assert.deepEqual(d[2].segs, [{ entity: 'light.b' }, { entity: 'light.z' }]);
  assert.equal(d[3].ledEntity, 'light.b');
  assert.deepEqual(p.floors[0].walls[0].openings[0], { entity: 'binary_sensor.tuer', paneEntities: ['binary_sensor.tuer', 'binary_sensor.p2'] });
  assert.deepEqual(p.labels, { 'light.b': 'oben' });
  assert.equal(n, 10);
});
test('nothing to rename: nothing changes', () => {
  const p = plan();
  assert.equal(R.rewriteIds(p, { 'light.other': 'light.x' }, {}), 0);
  assert.deepEqual(p, plan());
  assert.equal(R.rewriteIds(p), 0);
});
test('swapped ids, also as keys', () => {
  const o = { 'light.a': 1, 'light.b': 2, list: ['light.a', 'light.b'] };
  assert.equal(R.rewriteIds(o, { 'light.a': 'light.b', 'light.b': 'light.a' }), 4);
  assert.deepEqual(o, { 'light.b': 1, 'light.a': 2, list: ['light.b', 'light.a'] });
});
test('a name like a property of every object is not taken for an entity', () => {
  const o = { entity: 'constructor', name: 'x', list: ['toString'] };
  assert.equal(R.rewriteIds(o, {}, {}), 0);
  assert.deepEqual(o, { entity: 'constructor', name: 'x', list: ['toString'] });
});
test('an open view: plan, undo list, settings and entity list follow; nothing drawn again when its plan has none of the ids', () => {
  const layout = plan(), undo = [JSON.stringify(plan())], calls = [];
  const renamed = R.initRenames({ layout: () => layout, mapUndo: (fn) => undo.forEach((s, i) => { undo[i] = fn(s); }),
    refresh: () => calls.push('refresh'), refetchSettings: () => calls.push('settings'), poll: () => calls.push('poll') });
  renamed({ ids: { 'light.a': 'light.b' }, names: {}, settings: true });
  assert.equal(layout.floors[0].devices[1].entity, 'light.b');
  assert.equal(JSON.parse(undo[0]).floors[0].devices[1].entity, 'light.b');
  assert.deepEqual(calls, ['refresh', 'settings', 'poll']);
  calls.length = 0;
  renamed({ ids: { 'light.other': 'light.x' } });
  assert.deepEqual(calls, ['poll']);
});
test('the undo list (JSON text): rewritten, or the same text when nothing changes', () => {
  const text = JSON.stringify(plan());
  assert.equal(R.rewriteJson(text, { 'light.nope': 'light.x' }, {}), text);
  const out = JSON.parse(R.rewriteJson(text, { 'light.a': 'light.b' }, {}));
  assert.equal(out.floors[0].devices[1].entity, 'light.b');
});
