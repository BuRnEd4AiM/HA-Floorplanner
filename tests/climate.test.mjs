// Unit tests for climate.js (the page 🌡 Klima of the tab bar, #483; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const C = await import(`${process.env.STATIC_DIR || '/tmp/static'}/climate.js`);
const STOPS = [{ v: 400, c: '#0f0' }, { v: 800, c: '#ff0' }, { v: 1200, c: '#f80' }, { v: 2000, c: '#f00' }];
const states = {
  'climate.wz': { state: 'heat', hvac: 'heating', ct: 21.2, ch: 48, tt: 22 },
  'climate.buero': { state: 'cool', hvac: 'cooling', ct: 23, tt: 21 },
  'climate.bad': { state: 'off', ct: 19, tt: 23 },
  'sensor.wz_temp': { state: '21.6', unit: '°C' },
  'sensor.wz_co2': { state: '920', unit: 'ppm', dc: 'carbon_dioxide' },
  'sensor.sz_co2': { state: '1350', unit: 'ppm', dc: 'carbon_dioxide' },
  'sensor.sz_temp': { state: '65.5', unit: '°F' },
  'sensor.flur_hum': { state: '52', unit: '%', dc: 'humidity' },
  'water_heater.wp': { state: 'heat_pump', ct: 48, tt: 50 },
  'light.x': { state: 'on' },
};

test('the air: aired from the third stop of the CO₂ scale on (normally 1200 ppm)', () => {
  assert.equal(C.airLimit(STOPS), 1200);
  assert.equal(C.airLimit([{ v: 2000 }, { v: 500 }, { v: 1000 }]), 2000);       // sorted first
  assert.equal(C.airLimit([]), 1200); assert.equal(C.airLimit(null), 1200);
});
test('a room: the average temperature (thermostat and sensor, °F turned into °C), humidity, air, its thermostat and what it does', () => {
  const wz = C.roomClimate(['climate.wz', 'sensor.wz_temp', 'sensor.wz_co2', 'light.x'], states, STOPS);
  assert.equal(wz.temp, (21.2 + 21.6) / 2); assert.equal(wz.humid, 48); assert.equal(wz.co2, 920); assert.equal(wz.air, 'good');
  assert.equal(wz.climate, 'climate.wz'); assert.equal(wz.mode, 'heating'); assert.equal(wz.target, 22);
  const sz = C.roomClimate(new Set(['sensor.sz_co2', 'sensor.sz_temp']), states, STOPS);
  assert.equal(sz.air, 'bad'); assert.ok(Math.abs(sz.temp - 18.611) < 0.01); assert.equal(sz.climate, null); assert.equal(sz.mode, null); assert.equal(sz.target, null);
  const bad = C.roomClimate(['climate.bad'], states, STOPS);
  assert.equal(bad.mode, 'off'); assert.equal(bad.target, null);                 // off: no target to show
  assert.deepEqual(C.roomClimate(['climate.gone'], states, STOPS).climate, null); // an entity Home Assistant does not know
});
test('the rooms of the page: only those with a temperature or a thermostat, in their order', () => {
  const rooms = [
    { id: 'a', name: 'Wohnzimmer', floor: 0, ids: ['climate.wz', 'sensor.wz_co2'], open: ['Fenster'] },
    { id: 'b', name: 'Flur', floor: 0, ids: ['sensor.flur_hum'] },
    { id: 'c', name: 'Schlafzimmer', floor: 1, ids: ['sensor.sz_temp', 'sensor.sz_co2'] },
  ];
  const out = C.climateRooms(rooms, states, STOPS);
  assert.deepEqual(out.map((r) => r.id), ['a', 'c']);
  assert.deepEqual(out[0].open, ['Fenster']); assert.deepEqual(out[1].open, []);
  assert.deepEqual(C.climateRooms(null, states, STOPS), []);
});
test('too cold / too warm: by the target, else under 17 or over 26 degrees', () => {
  assert.equal(C.attention({ temp: 20.5, target: 22 }), 'cold');
  assert.equal(C.attention({ temp: 21.5, target: 22 }), null);
  assert.equal(C.attention({ temp: 23.6, target: 22 }), 'warm');
  assert.equal(C.attention({ temp: 16.5, target: null }), 'cold');
  assert.equal(C.attention({ temp: 26.5 }), 'warm');
  assert.equal(C.attention({ temp: null, target: 22 }), null);
});
test('an open window while it heats or cools is a waste, not while it is off', () => {
  assert.equal(C.wasting({ open: ['Fenster'], mode: 'heating' }), true);
  assert.equal(C.wasting({ open: ['Fenster'], mode: 'cooling' }), true);
  assert.equal(C.wasting({ open: ['Fenster'], mode: 'off' }), false);
  assert.equal(C.wasting({ open: [], mode: 'heating' }), false);
});
test('thermostats and water heaters in no room', () => {
  assert.deepEqual(C.looseClimates(states, ['climate.wz', 'climate.bad']), [{ entity: 'climate.buero', kind: 'climate' }, { entity: 'water_heater.wp', kind: 'water' }]);
  assert.deepEqual(C.looseClimates({}, []), []);
});
test('the tips: an open window while it heats first, then bad air, the worst first', () => {
  const tips = C.climateTips([
    { name: 'Küche', air: 'bad', co2: 1300, open: [], mode: null },
    { name: 'Wohnzimmer', air: 'good', co2: 900, open: ['Fenster'], mode: 'heating' },
    { name: 'Schlafzimmer', air: 'bad', co2: 1500, open: [], mode: 'idle' },
  ]);
  assert.deepEqual(tips.map((x) => [x.key, x.room]), [['window', 'Wohnzimmer'], ['air', 'Schlafzimmer'], ['air', 'Küche']]);
  assert.deepEqual(C.climateTips([]), []);
});
test('the page has something: a thermostat or water heater, or a temperature sensor placed in the plan', () => {
  assert.equal(C.hasClimate({ 'climate.a': {} }), true);
  assert.equal(C.hasClimate({ 'water_heater.a': {} }), true);
  assert.equal(C.hasClimate({ 'sensor.t': { unit: '°C' } }, ['sensor.t']), true);
  assert.equal(C.hasClimate({ 'sensor.t': { unit: '°C' } }, []), false);            // a sensor somewhere in Home Assistant is not enough
  assert.equal(C.hasClimate({ 'sensor.p': { unit: 'W' } }, ['sensor.p']), false);
  assert.equal(C.hasClimate(null), false);
});
test('the filter "only those that need a look": too cold / warm, an open window while heating, bad air', () => {
  const rooms = [{ id: 1, temp: 21, target: 21, air: 'good', open: [] }, { id: 2, temp: 18, target: 21, open: [] }, { id: 3, temp: 21, air: 'bad', open: [] },
    { id: 4, temp: 21, target: 21, open: ['x'], mode: 'heating' }];
  assert.deepEqual(C.filterRooms(rooms, 'notice').map((r) => r.id), [2, 3, 4]);
  assert.equal(C.filterRooms(rooms, 'all').length, 4);
  assert.deepEqual(C.FILTERS, ['all', 'notice']);
});
