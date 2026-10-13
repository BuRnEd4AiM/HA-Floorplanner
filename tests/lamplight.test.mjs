// Unit tests for lamplight.js (the light of the lamps on the floor: a lamp on a relay, a light colour of its own, #367; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const L = await import(`${process.env.STATIC_DIR || '/tmp/static'}/lamplight.js`);
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const ON = new Set(['on']);
const settings = { glowRadius: 3.5, defaultLightColor: '#ffc861' };
const room = { id: 'r1', points: [[0, 0], [5, 0], [5, 5], [0, 5]] }, next = { id: 'r2', points: [[5, 0], [10, 0], [10, 5], [5, 5]] };

test('lamps: the lighting types and the sections of an LED ring, not furniture or a wall switch', () => {
  for (const type of ['light', 'pendant', 'spot', 'walllamp', 'lamp', 'strip', 'ledseg']) assert.ok(L.isLamp({ type }), type);
  for (const type of ['switch', 'sofa', 'washer', 'tv']) assert.ok(!L.isLamp({ type }), type);
  assert.ok(!L.isLamp(null));
});
test('colour: the one Home Assistant reports wins, else the one set on the lamp, else none (the default of the settings)', () => {
  assert.deepEqual(L.hexRgb('#ff8000'), [255, 128, 0]);
  assert.equal(L.hexRgb('red'), null);
  assert.equal(L.hexRgb(undefined), null);
  assert.deepEqual(L.lampRgb({ lightColor: '#e8f0ff' }, { state: 'on', rgb: [255, 0, 0] }), [255, 0, 0]);
  assert.deepEqual(L.lampRgb({ lightColor: '#e8f0ff' }, { state: 'on' }), [232, 240, 255]);   // a relay reports no colour: cool white as set
  assert.equal(L.lampRgb({}, { state: 'on' }), null);
});
test('reach: a light and a lamp on a relay light the room fully, another switch a little, anything else not at all', () => {
  assert.equal(L.lampReach({ type: 'light' }, 'light.a'), 1);
  assert.equal(L.lampReach({ type: 'pendant' }, 'switch.relais'), 1);          // #367: a lamp switched by a relay
  assert.equal(L.lampReach({ type: 'switch' }, 'switch.relais'), 0.6);         // a wall switch or a plug: as before
  assert.equal(L.lampReach({ type: 'light' }, 'sensor.t'), 0);
  assert.equal(L.lampReach({ type: 'light' }, ''), 0);
});
test('the light colour field: lamps and things with a light entity, not an LED ring (its sections have their own lights) or a plain switch', () => {
  assert.ok(L.wantsLightColor({ type: 'pendant', entity: 'switch.relais' }));
  assert.ok(L.wantsLightColor({ type: 'light', entity: '' }));
  assert.ok(L.wantsLightColor({ type: 'switch', entity: 'light.flur' }));
  assert.ok(!L.wantsLightColor({ type: 'ledring', entity: 'light.ring' }));
  assert.ok(!L.wantsLightColor({ type: 'switch', entity: 'switch.steckdose' }));
  assert.ok(!L.wantsLightColor(null));
});
test('a lamp on a relay lights its room as far as a light and in its own colour (#367)', () => {
  const states = { 'switch.relais': { state: 'on' }, 'light.a': { state: 'on' } };
  const relay = L.lampLights([{ type: 'pendant', x: 2, z: 2, y: 1.9, entity: 'switch.relais', lightColor: '#ffffff' }], room, { states, onStates: ON, settings });
  const light = L.lampLights([{ type: 'pendant', x: 2, z: 2, y: 1.9, entity: 'light.a' }], room, { states, onStates: ON, settings });
  assert.equal(relay.length, 1);
  near(relay[0].r, light[0].r);
  assert.deepEqual(relay[0].c, [0.8, 0.8, 0.8]);                                // white times the strength of a ceiling lamp
  near(light[0].c[0], 0.8); near(light[0].c[1], 0.8 * 200 / 255); near(light[0].c[2], 0.8 * 97 / 255);   // the default colour
  assert.equal(L.lampLights([{ type: 'pendant', x: 2, z: 2, entity: 'switch.relais' }], room, { states: { 'switch.relais': { state: 'off' } }, onStates: ON, settings }).length, 0);
});
test('which room a lamp lights: its own, also from just outside its edge (on its wall), never the room next door', () => {
  const states = { 'light.a': { state: 'on' } }, env = { states, onStates: ON, settings, rooms: [room, next] };
  const wall = [{ type: 'walllamp', x: 2, z: -0.1, entity: 'light.a' }];          // 10 cm outside the outline
  assert.equal(L.lampLights(wall, room, env).length, 1);
  const inNext = [{ type: 'light', x: 5.1, z: 2, entity: 'light.a' }];           // 10 cm inside the next room
  assert.equal(L.lampLights(inNext, room, env).length, 0);
  assert.equal(L.lampLights(inNext, next, env).length, 1);
  assert.equal(L.lampLights([{ type: 'light', x: 2, z: -1, entity: 'light.a' }], room, env).length, 0);   // a metre away: not this room
});
test('brightness, a long LED ring section, a Nanoleaf layout, at most MAX_LIGHTS', () => {
  const states = { 'light.a': { state: 'on', brightness: 0 } }, env = { states, onStates: ON, settings };
  const dim = L.lampLights([{ type: 'light', x: 1, z: 1, entity: 'light.a' }], room, env)[0];
  near(dim.r, 3.5 * (0.7 + 0.5 * 0.12) * 0.85); near(dim.c[0], 0.12 * 0.8);   // off-dimmed: 12 % light
  const seg = L.lampLights([{ type: 'ledseg', x: 1, z: 1, len: 10, entity: 'light.a' }], room, env)[0];
  near(seg.r, 3.5 * (0.7 + 0.5 * 0.12) * 0.5 * 1.6);
  const leaves = L.lampLights([{ type: 'nanoleaf', x: 2, z: 2, y: 1.4, entity: 'light.a', panels: [{ x: 0, y: 0 }, { x: 0.2, y: 0 }, { x: 0.4, y: 0 }] }], room, env);
  assert.equal(leaves.length, 3);
  const many = Array.from({ length: 12 }, (_, i) => ({ type: 'light', x: 0.3 + i * 0.35, z: 2, entity: 'light.a' }));
  assert.equal(L.lampLights(many, room, env).length, L.MAX_LIGHTS);
});
