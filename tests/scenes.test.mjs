// Unit tests for scenes.js (the scene editor's model, #549; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const S = await import(`${process.env.STATIC_DIR || '/tmp/static'}/scenes.js`);
const t = (k) => k;

test('a device as it is now and in words', () => {
  assert.deepEqual(S.deviceNow('light.led', { state: 'on', brightness: 30.4, rgbRaw: [120, 0, 255], rgb: [1, 1, 1], fxc: 'Rainbow' }), { on: true, pct: 30, rgb: [120, 0, 255], fx: 'Rainbow' });
  assert.deepEqual(S.deviceNow('light.led', { state: 'on', fxc: 'None' }), { on: true });
  assert.deepEqual(S.deviceNow('light.decke', { state: 'off', brightness: 80 }), { on: false });
  assert.deepEqual(S.deviceNow('cover.wz', { state: 'open', position: 20 }), { on: true, pos: 20 });
  assert.deepEqual(S.deviceNow('cover.wz', { state: 'closed' }), { on: false, pos: 0 });
  assert.deepEqual(S.fromStates({ 'switch.k': {}, 'light.x': { on: false } }, { 'switch.k': { state: 'on' } }), { 'switch.k': { on: true }, 'light.x': { on: false } });
  assert.equal(S.deviceWords('light.led', { on: true, pct: 30, fx: 'Rainbow' }, t), 'sc.on · 30 % · Rainbow');
  assert.equal(S.deviceWords('light.led', { on: false }, t), 'sc.off');
  assert.equal(S.deviceWords('cover.wz', { on: true, pos: 20 }, t), '20 %');
});

test('colours, the list of scenes and what can be picked', () => {
  assert.equal(S.hex([255, 0, 128]), '#ff0080');
  assert.deepEqual(S.fromHex('#FF0080'), [255, 0, 128]);
  assert.equal(S.fromHex('red'), null);
  assert.deepEqual(S.kelvinRgb(2000), [255, 170, 80]);
  const states = { 'scene.abend': { cid: '1700' }, 'scene.kino': { cid: 'fp3d_skino', members: ['light.led'] }, 'scene.alt': {}, 'light.x': {} };
  const names = { 'scene.abend': 'Abend', 'scene.kino': 'Kino', 'scene.alt': 'Alt' };
  assert.deepEqual(S.sceneList(states, (e) => names[e]).map((s) => [s.entity, s.ours, s.cid]),
    [['scene.kino', true, 'fp3d_skino'], ['scene.abend', false, '1700'], ['scene.alt', false, null]]);
  assert.ok(S.sceneReady({ name: 'Kino', ents: { 'light.a': {} } }) && !S.sceneReady({ name: ' ', ents: { 'light.a': {} } }) && !S.sceneReady({ name: 'K', ents: {} }));
  const ents = [{ entity_id: 'switch.kaffee', name: 'Kaffee' }, { entity_id: 'light.led', name: 'LED' }, { entity_id: 'climate.wz', name: 'Heizung' }, { entity_id: 'light.bad', name: 'Bad' }];
  assert.deepEqual(S.pickable(ents, { 'light.bad': {} }, '').map((e) => e.entity_id), ['light.led', 'switch.kaffee']);
  assert.deepEqual(S.pickable(ents, {}, 'kaf').map((e) => e.entity_id), ['switch.kaffee']);
});
