// Unit tests for roomtiles.js (room tiles in live mode #421, the room reading of the colour views; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const R = await import(`${dir}/roomtiles.js`);
const t = (k, p = {}) => k + (Object.keys(p).length ? JSON.stringify(p) : '');

const room = { id: 'r1', name: 'Wohnzimmer', area: 'wohnzimmer', points: [[0, 0], [6, 0], [6, 4], [0, 4]] };
const win = (id, pos, entity) => ({ id, type: 'window', pos, width: 1.2, entity });
const floor = {
  rooms: [room],
  walls: [{ id: 'w1', a: [0, 0], b: [6, 0], openings: [win('o1', 1.5, 'binary_sensor.fenster_wz'), win('o2', 4.5, 'binary_sensor.fenster2')] },
    { id: 'w2', a: [0, 10], b: [6, 10], openings: [win('o3', 2, 'binary_sensor.fenster_weit')] }],
  devices: [{ id: 'p1', type: 'presence', entity: 'person.anna', x: 2, z: 2 }],
};
const placed = [
  { entity: 'light.decke', x: 3, z: 2 }, { entity: 'light.stehlampe', x: 1, z: 1 }, { entity: 'light.flur', x: 3, z: 8 },
  { entity: 'sensor.wz_temp', x: 2, z: 3 }, { entity: 'climate.wz', x: 5, z: 3 }, { entity: 'sensor.flur_temp', x: 3, z: 8 },
];
const states = {
  'light.decke': { state: 'on', rgb: [255, 140, 110] }, 'light.stehlampe': { state: 'off' }, 'light.flur': { state: 'on' }, 'light.area_led': { state: 'on' },
  'sensor.wz_temp': { state: '21', unit: '°C' }, 'climate.wz': { state: 'heat', ct: 22 }, 'sensor.flur_temp': { state: '15', unit: '°C' },
  'binary_sensor.fenster_wz': { state: 'on' }, 'binary_sensor.fenster2': { state: 'off' }, 'binary_sensor.fenster_weit': { state: 'on' },
  'person.anna': { state: 'home' }, 'binary_sensor.wz_motion': { state: 'on', dc: 'motion' },
};
const ON = new Set(['on', 'home', 'open']);
const ctx = (over = {}) => ({ placed, areaEntities: ['light.area_led'], states, isOn: (e) => ON.has(states[e]?.state), isOpen: (e) => states[e]?.state === 'on',
  openingEntities: (o) => [o.entity].filter(Boolean), ...over });

test('the reading of a room: the average of its sensors and thermostats, °F turned into °C', () => {
  const ids = R.roomEntityIds(room, placed, []);
  assert.deepEqual([...ids].sort(), ['climate.wz', 'light.decke', 'light.stehlampe', 'sensor.wz_temp']);
  assert.equal(R.roomReading(ids, states, 'temp'), 21.5);
  assert.equal(R.roomReading(['sensor.f'], { 'sensor.f': { state: '68', unit: '°F' } }, 'temp'), 20);
  assert.equal(R.roomReading(['sensor.h'], { 'sensor.h': { state: '55', unit: '%', dc: 'humidity' } }, 'humid'), 55);
  assert.equal(R.roomReading(['sensor.c'], { 'sensor.c': { state: '900', unit: 'ppm', dc: 'carbon_dioxide' } }, 'co2'), 900);
  assert.equal(R.roomReading(['sensor.x'], { 'sensor.x': { state: 'unavailable', unit: '°C' } }, 'temp'), null);
  assert.equal(R.roomReading([], {}, 'temp'), null);
  assert.ok(R.roomEntityIds(room, placed, ['light.area_led']).has('light.area_led'), 'the entities of its area count too');
  assert.ok(!R.roomEntityIds({ ...room, area: '' }, placed, ['light.area_led']).has('light.area_led'));
});

test('the summary of a room: temperature, lights on with their colour, open windows, somebody there', () => {
  const s = R.roomSummary(room, floor, ctx());
  assert.equal(s.temp, 21.5);
  assert.equal(s.lights, 2, 'the ceiling light and the LED of its area; the hall light is outside');
  assert.deepEqual(s.rgb, [255, 140, 110]);
  assert.equal(s.open, 1, 'only the open window on its own wall');
  assert.equal(s.occupied, true);
});

test('nobody there, all off, all closed', () => {
  const quiet = { ...states, 'light.decke': { state: 'off' }, 'light.area_led': { state: 'off' }, 'binary_sensor.fenster_wz': { state: 'off' }, 'person.anna': { state: 'not_home' }, 'binary_sensor.wz_motion': { state: 'off', dc: 'motion' } };
  const s = R.roomSummary(room, floor, ctx({ states: quiet, isOn: (e) => ON.has(quiet[e]?.state), isOpen: (e) => quiet[e]?.state === 'on' }));
  assert.deepEqual([s.lights, s.rgb, s.open, s.occupied], [0, null, 0, false]);
});

test('a motion or presence sensor of the room counts as somebody there', () => {
  const f2 = { ...floor, devices: [] };
  const withMotion = R.roomSummary(room, f2, ctx({ areaEntities: ['binary_sensor.wz_motion'] }));
  assert.equal(withMotion.occupied, true);
  const named = R.roomSummary(room, f2, ctx({ areaEntities: ['binary_sensor.buero_praesenz'], states: { ...states, 'binary_sensor.buero_praesenz': { state: 'on' } } }));
  assert.equal(named.occupied, true);
  assert.equal(R.roomSummary(room, f2, ctx({ areaEntities: [] })).occupied, false);
});

test('the texts of a tile', () => {
  const num = (v) => v.toFixed(1).replace('.', ',');
  assert.deepEqual(R.tileTexts({ temp: 21.44, lights: 2, open: 1 }, t, num), { temp: '21,4°', lights: '💡 tile.on{"n":2}', open: '🪟 tile.open' });
  assert.deepEqual(R.tileTexts({ temp: null, lights: 0, open: 0 }, t, num), { temp: '–', lights: '💡 tile.off', open: '' });
  assert.equal(R.tileTexts({ temp: 20, lights: 0, open: 0 }, t, num, true).temp, '68,0°');
});
