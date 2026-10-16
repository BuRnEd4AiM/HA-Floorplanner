// Unit tests for ledzones.js: the LED zones of a piece (a mirror's light behind it and in front, the bar's edge and plinth) with entities of
// their own (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const Z = await import(`${dir}/ledzones.js`);
const { lampLights } = await import(`${dir}/lamplight.js`);
const { linkedDevice } = await import(`${dir}/pickrules.js`);
const { ballIcon } = await import(`${dir}/tapballs.js`);

const mirror = (over = {}) => ({ id: 'm1', type: 'mirror_led_zones', x: 1, z: 1, y: 1.1, entity: 'light.mirror', ...over });
const ON = new Set(['on']);

test('the zones of a type: their keys and how many; none for other types', () => {
  assert.deepEqual(Z.zoneKeys('mirror_led_zones'), ['back', 'front', 'bottom']);
  assert.equal(Z.zoneCount('bar_counter'), 2);
  assert.equal(Z.zoneCount('mirror_led'), 0);
  assert.equal(Z.zoneCount('light'), 0);
  assert.equal(Z.zoneCount(undefined), 0);
});
test('a zone without an entity of its own follows the device', () => {
  const d = mirror({ leds: ['light.back', '', 'light.below'] });
  assert.deepEqual([0, 1, 2].map((i) => Z.zoneEntity(d, i)), ['light.back', 'light.mirror', 'light.below']);
  assert.equal(Z.zoneEntity(mirror({ entity: '' }), 1), '');
  assert.deepEqual(Z.zoneEntities(d), ['light.back', 'light.mirror', 'light.below']);
  assert.deepEqual(Z.zoneEntities(mirror()), ['light.mirror']);
});
test('own zone entities: only the ones that are not the device entity, each once', () => {
  const d = mirror({ leds: ['light.back', 'light.mirror', 'light.back'] });
  assert.deepEqual(Z.ownZoneEntities(d), ['light.back']);
  assert.ok(Z.hasOwnZones(d));
  assert.ok(!Z.hasOwnZones(mirror()) && !Z.hasOwnZones(mirror({ leds: ['', 'light.mirror'] })));
  assert.ok(!Z.hasOwnZones({ type: 'light', entity: 'light.a', leds: ['light.b'] }));     // a type without zones has none
  assert.deepEqual(Z.pieceEntities(d), ['light.mirror', 'light.back']);
  assert.deepEqual(Z.pieceEntities({ type: 'light', entity: 'light.a' }), ['light.a']);
  assert.deepEqual(Z.pieceEntities(undefined), []);
});
test('linking a zone: the list stays as short as it can and goes when no zone has its own entity', () => {
  const d = mirror();
  Z.setZone(d, 2, 'light.below');
  assert.deepEqual(d.leds, ['', '', 'light.below']);
  Z.setZone(d, 0, 'light.back');
  assert.deepEqual(d.leds, ['light.back', '', 'light.below']);
  Z.setZone(d, 2, '');
  assert.deepEqual(d.leds, ['light.back']);
  Z.setZone(d, 0, '');
  assert.ok(!('leds' in d));
  Z.setZone(d, 5, 'light.x');                                  // beyond the zones of the piece: nothing
  assert.ok(!('leds' in d));
});
test('sections: an LED ring has its own, a piece its zones', () => {
  const ring = { type: 'ledring', entity: 'light.all', segs: [{ entity: 'light.s1' }, {}] };
  assert.equal(Z.sectionEntity(ring, 0), 'light.s1');
  assert.equal(Z.sectionEntity(ring, 1), 'light.all');
  assert.equal(Z.sectionEntity(mirror({ leds: ['light.back'] }), 0), 'light.back');
  assert.equal(Z.sectionEntity(mirror({ leds: ['light.back'] }), 1), 'light.mirror');
});
test('a zone with its own entity lights the room as an LED zone of its own; one that follows the device does not count twice', () => {
  const d = mirror({ leds: ['light.back', '', 'light.below'] });
  const zl = Z.zoneLights(d);
  assert.deepEqual(zl.map((e) => [e.entity, e.type, e.x, e.z]), [['light.back', 'ledzone', 1, 1], ['light.below', 'ledzone', 1, 1]]);
  assert.ok(zl.every((e) => !e.leds && e.id === 'm1'));
  assert.deepEqual(zl.map((e) => [e.name, e.zone]), [['', 0], ['', 2]]);
  assert.deepEqual(Z.zoneLights(d, (dv, key) => `${dv.type} · ${key}`).map((e) => e.name), ['mirror_led_zones · back', 'mirror_led_zones · bottom']);
  assert.equal(Z.zoneLights(mirror({ leds: ['light.x', 'light.x'] })).length, 1);           // two zones on one light: one light of the room
  assert.deepEqual(Z.zoneLights(mirror()), []);
  const room = { id: 'r', points: [[0, 0], [3, 0], [3, 3], [0, 3]] };
  const states = { 'light.mirror': { state: 'off' }, 'light.back': { state: 'on', rgb: [0, 0, 255] }, 'light.below': { state: 'off' } };
  const lit = lampLights([d, ...zl], room, { states, onStates: ON, rooms: [room], settings: { glowRadius: 3, defaultLightColor: '#ffc861' } });
  assert.equal(lit.length, 1);
  assert.deepEqual(lit[0].c.map((v) => +v.toFixed(2)), [0, 0, 0.4]);       // blue, as strong as an LED zone (k 0.4)
  const relay = lampLights([{ ...zl[0], entity: 'switch.back' }], room, { states: { 'switch.back': { state: 'on' } }, onStates: ON, rooms: [room], settings: { glowRadius: 3, defaultLightColor: '#ffc861' } });
  assert.equal(relay.length, 1);                                             // an LED zone on a relay lights like a lamp
});
test('every placed entity as a device of its own: the backlight of a TV, the sections of an LED ring, the zones with their own lights', () => {
  const ring = { id: 'r', type: 'ledring', x: 0, z: 0, y: 2.5, entity: 'light.all', closed: true, pts: [[-1, -1], [1, -1], [1, 1], [-1, 1]], segs: [{ entity: 'light.s1' }, {}, {}, {}] };
  const tv = { id: 't', type: 'tv_wall', x: 3, z: 0, entity: 'media_player.tv', ledEntity: 'light.tv' };
  const out = Z.entityDevices([ring, tv, mirror({ leds: ['light.back'] }), { id: 'l', type: 'light', x: 5, z: 5, entity: 'light.a' }], 'LED ring');
  assert.deepEqual(out.map((e) => [e.type, e.entity]), [['ledseg', 'light.s1'], ['ledseg', 'light.all'], ['ledseg', 'light.all'], ['ledseg', 'light.all'],
    ['tv_wall', 'media_player.tv'], ['tv_led', 'light.tv'], ['mirror_led_zones', 'light.mirror'], ['ledzone', 'light.back'], ['light', 'light.a']]);
  assert.equal(out[0].name, 'LED ring · 1');
  assert.deepEqual(Z.switchEntities(ring), ['light.s1', 'light.all']);
  assert.deepEqual(Z.switchEntities(mirror({ leds: ['light.back'] })), ['light.mirror', 'light.back']);
  assert.deepEqual(Z.switchEntities({ type: 'light', entity: 'light.a' }), ['light.a']);
  assert.deepEqual(Z.switchEntities(null), []);
});
test('the live card: each zone, its entity and whether it is on', () => {
  const d = mirror({ leds: ['light.back'] });
  assert.deepEqual(Z.zoneStates(d, { 'light.back': { state: 'on' }, 'light.mirror': { state: 'off' } }, ON),
    [{ key: 'back', entity: 'light.back', on: true }, { key: 'front', entity: 'light.mirror', on: false }, { key: 'bottom', entity: 'light.mirror', on: false }]);
});
test('a piece linked only through its zones can be tapped and shows a light bulb', () => {
  const d = mirror({ entity: '', leds: ['', 'light.front'] });
  assert.ok(linkedDevice(d));
  assert.ok(!linkedDevice(mirror({ entity: '' })));
  assert.equal(ballIcon(d), '💡');
  assert.equal(ballIcon({ type: 'sauna_cabin', entity: 'climate.sauna' }), '🧖');
  assert.equal(ballIcon({ type: 'projector', entity: 'media_player.beamer' }), '📽');
});
