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

test('a light in its white mode is taken with its white tone (#564)', () => {
  assert.deepEqual(S.deviceNow('light.steh', { state: 'on', brightness: 60, rgbRaw: [255, 167, 87], kel: 2700 }), { on: true, pct: 60, kelvin: 2700 });
  assert.deepEqual(S.deviceNow('light.led', { state: 'on', rgbRaw: [255, 0, 0], kel: null }), { on: true, rgb: [255, 0, 0] });
});

test('"⇉ Auf alle anwenden" (#564)', () => {
  const ents = {
    'light.a': { on: true, pct: 40, kelvin: 2700 }, 'light.b': { on: true, pct: 90, rgb: [255, 0, 0], fx: 'Rainbow' }, 'light.c': { on: false },
    'switch.k': { on: false }, 'cover.r1': { on: true, pos: 20 }, 'cover.r2': { on: false, pos: 0 },
  };
  const fxOf = (e) => ({ 'light.b': ['Rainbow', 'Kino'], 'light.c': ['Kino'] }[e]);
  let r = S.applyToAll(ents, 'light.a', fxOf);              // a light: the other lights its brightness and white tone, switches on
  assert.equal(r.n, 3);
  assert.deepEqual(r.ents['light.b'], { on: true, pct: 40, kelvin: 2700 });
  assert.deepEqual(r.ents['light.c'], { on: true, pct: 40, kelvin: 2700 });
  assert.deepEqual(r.ents['switch.k'], { on: true });
  assert.deepEqual(r.ents['cover.r1'], ents['cover.r1']);   // roller shutters stay
  assert.deepEqual(ents['light.b'], { on: true, pct: 90, rgb: [255, 0, 0], fx: 'Rainbow' });   // the old ones are left as they were
  r = S.applyToAll({ ...ents, 'light.b': { on: true, pct: 50, rgb: [0, 0, 255], fx: 'Kino' } }, 'light.b', fxOf);   // an effect only where the light has it
  assert.deepEqual(r.ents['light.c'], { on: true, pct: 50, rgb: [0, 0, 255], fx: 'Kino' });
  assert.deepEqual(r.ents['light.a'], { on: true, pct: 50, rgb: [0, 0, 255] });
  r = S.applyToAll(ents, 'light.c');                         // off: everything off
  assert.deepEqual([r.ents['light.a'], r.ents['light.b'], r.ents['switch.k']], [{ on: false }, { on: false }, { on: false }]);
  r = S.applyToAll(ents, 'switch.k');                        // a switch: on / off
  assert.equal(r.n, 2);
  r = S.applyToAll({ ...ents, 'switch.k': { on: true } }, 'switch.k');   // on: a light that is on keeps its colour, one that is off goes on
  assert.equal(r.ents['light.b'], ents['light.b']);
  assert.deepEqual(r.ents['light.c'], { on: true });
  r = S.applyToAll(ents, 'cover.r1');                        // a roller shutter: the others its position, nothing else
  assert.equal(r.n, 1);
  assert.deepEqual(r.ents['cover.r2'], { on: true, pos: 20 });
  assert.equal(S.applyToAll(r.ents, 'cover.r1').n, 0);       // all alike already
  assert.equal(S.applyToAll(ents, 'light.nix').n, 0);
  assert.equal(S.allTargets(ents, 'light.a'), 3);
  assert.equal(S.allTargets(ents, 'cover.r1'), 1);
  assert.equal(S.allTargets({ 'light.a': {} }, 'light.a'), 0);
});

test('the picker by kind (#564)', () => {
  const ents = [{ entity_id: 'switch.kaffee', name: 'Kaffee' }, { entity_id: 'light.led', name: 'LED' }, { entity_id: 'fan.bad', name: 'Lüfter' },
    { entity_id: 'cover.wz', name: 'Rollo' }, { entity_id: 'input_boolean.gast', name: 'Gast' }];
  assert.deepEqual(S.pickable(ents, {}, '', 'light').map((e) => e.entity_id), ['light.led']);
  assert.deepEqual(S.pickable(ents, {}, '', 'switch').map((e) => e.entity_id), ['switch.kaffee', 'fan.bad', 'input_boolean.gast']);
  assert.deepEqual(S.pickable(ents, {}, '', 'cover').map((e) => e.entity_id), ['cover.wz']);
  assert.equal(S.pickable(ents, {}, '', 'all').length, 5);
  assert.equal(S.MAX_ENTS, 100);
});
