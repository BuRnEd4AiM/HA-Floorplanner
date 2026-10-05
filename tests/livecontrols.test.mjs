// Unit tests for livecontrols.js and roompanel.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const L = await import(`${process.env.STATIC_DIR || '/tmp/static'}/livecontrols.js`);
const R = await import(`${process.env.STATIC_DIR || '/tmp/static'}/roompanel.js`);
const G = await import(`${process.env.STATIC_DIR || '/tmp/static'}/rooms.js`);

test('service body: domain from the entity, scenes and scripts are always turned on, data only when given', () => {
  assert.deepEqual(L.serviceBody('light.a', 'toggle'), { domain: 'light', service: 'toggle', entity_id: 'light.a' });
  assert.deepEqual(L.serviceBody('scene.abend', 'toggle'), { domain: 'scene', service: 'turn_on', entity_id: 'scene.abend' });
  assert.deepEqual(L.serviceBody('script.x', 'turn_off'), { domain: 'script', service: 'turn_on', entity_id: 'script.x' });
  assert.deepEqual(L.serviceBody('climate.k', 'set_temperature', { temperature: 21 }), { domain: 'climate', service: 'set_temperature', entity_id: 'climate.k', data: { temperature: 21 } });
});
test('quick action: toggle where possible, the first action otherwise, nothing for sensors', () => {
  assert.equal(L.quickService('light.a'), 'toggle');
  assert.equal(L.quickService('cover.b'), 'open_cover');
  assert.equal(L.quickService('lock.c'), 'lock');
  assert.equal(L.quickService('scene.d'), 'turn_on');
  assert.equal(L.quickService('sensor.t'), null);
});
test('every action has a label', () => {
  for (const acts of Object.values(L.ACTIONS)) for (const a of acts) assert.ok(L.ACTION_LABEL[a], a);
});
test('colours: hex and rgb convert both ways', () => {
  assert.deepEqual(L.hexToRgb('#ff9500'), [255, 149, 0]);
  assert.equal(L.rgbToHex([255, 149, 0]), '#ff9500');
  assert.equal(L.rgbToHex([1.4, 0, 254.6]), '#0100ff');
  for (const h of L.COLOR_PRESETS) assert.equal(L.rgbToHex(L.hexToRgb(h)), h);
});
test('scenes with: only scenes that set one of the lights', () => {
  const states = { 'scene.a': { members: ['light.x', 'light.y'] }, 'scene.b': { members: ['light.z'] }, 'scene.c': {}, 'light.x': { members: ['light.x'] } };
  assert.deepEqual(L.scenesWith(states, ['light.x']), ['scene.a']);
  assert.deepEqual(L.scenesWith(states, ['light.q']), []);
});
test('common effects: only what every light has; none for no lights', () => {
  assert.deepEqual(L.commonEffects([{ fx: ['Rainbow', 'Fire', 'Ocean'] }, { fx: ['Fire', 'Rainbow'] }]), ['Rainbow', 'Fire']);
  assert.deepEqual(L.commonEffects([{ fx: ['A'] }, {}]), []);
  assert.deepEqual(L.commonEffects([]), []);
});
test('room entities: placed in the room or in its area, only existing ones, no duplicates', () => {
  const sq = [[0, 0], [4, 0], [4, 4], [0, 4]];
  const env = {
    devices: [{ entity: 'light.in', x: 1, z: 1 }, { entity: 'light.out', x: 9, z: 9 }, { entity: 'switch.in', x: 2, z: 2 }, { entity: 'light.gone', x: 1, z: 1 }],
    areas: [{ id: 'wz', entities: ['light.area', 'light.in', 'scene.abend'] }],
    states: { 'light.in': {}, 'light.out': {}, 'switch.in': {}, 'light.area': {}, 'scene.abend': {} },
    pointInPoly: G.pointInPoly,
  };
  assert.deepEqual(L.roomEntityIds(env, { points: sq, area: 'wz' }, 'light').sort(), ['light.area', 'light.in']);
  assert.deepEqual(L.roomEntityIds(env, { points: sq }, 'light'), ['light.in']);
  assert.deepEqual(L.roomEntityIds(env, { points: sq, area: 'wz' }, 'scene'), ['scene.abend']);
});

test('room panel groups: binary sensors with sensors, fans and helpers with switches, scripts with scenes', () => {
  assert.equal(R.rpGroupOf('binary_sensor'), 'sensor');
  assert.equal(R.rpGroupOf('fan'), 'switch');
  assert.equal(R.rpGroupOf('input_boolean'), 'switch');
  assert.equal(R.rpGroupOf('script'), 'scene');
  assert.equal(R.rpGroupOf('light'), 'light');
  assert.ok(R.inRoomPanel('cover.rollo') && R.inRoomPanel('binary_sensor.door') && !R.inRoomPanel('weather.home') && !R.inRoomPanel('person.anna'));
});
const room = { points: [[0, 0], [4, 0], [4, 3], [0, 3]] };
const floor = { walls: [
  { a: [0, 0], b: [4, 0], openings: [{ id: 'd1', type: 'door', pos: 1, width: 0.9 }] },                // on the room
  { a: [0, 0], b: [0, 3], openings: [{ id: 'w1', type: 'window', pos: 1.5, width: 1.2, entity: 'binary_sensor.w' }] },
  { a: [10, 0], b: [14, 0], openings: [{ id: 'far', type: 'door', pos: 2, width: 0.9 }] }] };            // another room
test('room openings: the doors and windows on the walls of the room, not those of other rooms', () => {
  assert.deepEqual(R.roomOpenings(room, floor).map((o) => o.id), ['d1', 'w1']);
});
test('room opening spans: from - to along the wall, with type and sensor', () => {
  const s = R.roomOpeningSpans(room, floor);
  assert.equal(s.length, 2);
  assert.deepEqual(s[0], { id: 'd1', type: 'door', entity: '', a: [0.55, 0], b: [1.45, 0] });
  assert.equal(s[1].entity, 'binary_sensor.w');
  assert.ok(Math.abs(s[1].a[1] - 0.9) < 1e-9 && Math.abs(s[1].b[1] - 2.1) < 1e-9);
});
test('area text: m² with one decimal, whole square feet in imperial units', () => {
  assert.equal(R.areaText(room.points, false), '12.0 m²');
  assert.equal(R.areaText(room.points, true), '129 ft²');
});
test('geometry: polygon area in either direction and distance to the outline', () => {
  assert.equal(G.polyArea(room.points), 12);
  assert.equal(G.polyArea([...room.points].reverse()), 12);
  assert.equal(G.distToPoly(2, 1.5, room.points), 1.5);
  assert.equal(G.distToPoly(6, 0, room.points), 2);
});
