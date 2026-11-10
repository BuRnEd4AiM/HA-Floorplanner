// Unit tests for roomsource.js (where a room's temperature and humidity come from, #705; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const S = await import(`${dir}/roomsource.js`);
const R = await import(`${dir}/roomtiles.js`);
const C = await import(`${dir}/climate.js`);
const near = (a, b, eps = 1e-6) => assert.ok(a !== null && Math.abs(a - b) < eps, `${a} != ${b}`);

// the living room of #705: a thermostat (23 °C), a Netatmo module (22.8 °C) and a dingz switch whose own warmth gives 20.5 °C
const states = {
  'climate.01_wohnzimmer_erdgeschoss': { state: 'heat', ct: 23, ch: 48 },
  'sensor.netatmo_wohnzimmer_temperatur': { state: '22.8', unit: '°C', dc: 'temperature' },
  'sensor.dingz_wohnzimmer_temperatur': { state: '20.5', unit: '°C', dc: 'temperature' },
  'sensor.netatmo_wohnzimmer_luftfeuchtigkeit': { state: '52', unit: '%', dc: 'humidity' },
  'sensor.netatmo_wohnzimmer_co2': { state: '900', unit: 'ppm', dc: 'carbon_dioxide' },
  'sensor.aussen': { state: '50', unit: '°F', dc: 'temperature' },
  'light.decke': { state: 'on' },
};
const ids = ['climate.01_wohnzimmer_erdgeschoss', 'sensor.netatmo_wohnzimmer_temperatur', 'sensor.dingz_wohnzimmer_temperatur',
  'sensor.netatmo_wohnzimmer_luftfeuchtigkeit', 'sensor.netatmo_wohnzimmer_co2', 'light.decke'];

test('the reading of one entity: a thermostat what it measures, a sensor in its unit, nothing else', () => {
  near(S.entityReading('climate.01_wohnzimmer_erdgeschoss', states['climate.01_wohnzimmer_erdgeschoss'], 'temp'), 23);
  near(S.entityReading('climate.01_wohnzimmer_erdgeschoss', states['climate.01_wohnzimmer_erdgeschoss'], 'humid'), 48);
  assert.equal(S.entityReading('climate.01_wohnzimmer_erdgeschoss', states['climate.01_wohnzimmer_erdgeschoss'], 'co2'), null);
  near(S.entityReading('sensor.aussen', states['sensor.aussen'], 'temp'), 10);              // °F → °C
  assert.equal(S.entityReading('sensor.netatmo_wohnzimmer_temperatur', states['sensor.netatmo_wohnzimmer_temperatur'], 'humid'), null);
  assert.equal(S.entityReading('light.decke', states['light.decke'], 'temp'), null);
  assert.equal(S.entityReading('sensor.x', { state: 'unavailable', unit: '°C' }, 'temp'), null);
  assert.equal(S.entityReading('sensor.x', undefined, 'temp'), null);
});

test('#705: automatic as before (the mean of the sensors), the thermostat or one sensor when chosen', () => {
  near(S.readingFrom(ids, states, 'temp'), 21.65);                                        // (22.8 + 20.5) / 2: what the label showed
  near(S.readingFrom(ids, states, 'temp', {}, 'climate'), 23);
  near(S.readingFrom(ids, states, 'temp', {}, 'sensor.netatmo_wohnzimmer_temperatur'), 22.8);
  near(S.readingFrom(ids, states, 'humid', {}, ''), 52);
  near(S.readingFrom(ids, states, 'humid', {}, 'climate'), 48);
  assert.equal(S.readingFrom(ids, states, 'temp', {}, 'sensor.gone'), null);               // the chosen one does not report: nothing, no other
  assert.equal(S.readingFrom(['sensor.netatmo_wohnzimmer_temperatur'], states, 'temp', {}, 'climate'), null);   // no thermostat in the room
  near(S.readingFrom(['climate.01_wohnzimmer_erdgeschoss'], states, 'temp'), 23);          // only a thermostat: automatic takes it
});

test('the sensors of a thermostat count as the thermostat (#370)', () => {
  const st = { ...states, 'sensor.thermo_temp': { state: '24', unit: '°C', dc: 'temperature' } };
  const partOf = { 'sensor.thermo_temp': 'climate.01_wohnzimmer_erdgeschoss' };
  near(S.readingFrom([...ids, 'sensor.thermo_temp'], st, 'temp', partOf), 21.65);
  near(S.readingFrom([...ids, 'sensor.thermo_temp'], st, 'temp', partOf, 'climate'), 23.5);
});

test('the source of a room: only known values, setting it, automatic removes the field', () => {
  const room = { id: 'wz' };
  assert.equal(S.sourceOf(room, 'temp'), '');
  S.setSource(room, 'temp', 'climate');
  assert.equal(room.tempFrom, 'climate');
  assert.equal(S.sourceOf(room, 'temp'), 'climate');
  S.setSource(room, 'humid', 'sensor.netatmo_wohnzimmer_luftfeuchtigkeit');
  assert.equal(S.sourceOf(room, 'humid'), 'sensor.netatmo_wohnzimmer_luftfeuchtigkeit');
  assert.equal(S.sourceOf(room, 'co2'), '');
  S.setSource(room, 'temp', '');
  assert.ok(!('tempFrom' in room));
  S.setSource(room, 'temp', 'not an entity');
  assert.ok(!('tempFrom' in room));
  assert.equal(S.sourceOf({ tempFrom: 'Sensor X' }, 'temp'), '');
  assert.equal(S.sourceOf({ tempFrom: 42 }, 'temp'), '');
  S.setSource(room, 'co2', 'sensor.x');
  assert.ok(!('co2From' in room));
});

test('the choices of the field: the values now, shown only when more than one thing measures', () => {
  const c = S.sourceChoices(ids, states, 'temp');
  near(c.auto, 21.65); near(c.thermo, 23);
  assert.deepEqual(c.sensors.map((x) => x.id), ['sensor.dingz_wohnzimmer_temperatur', 'sensor.netatmo_wohnzimmer_temperatur']);
  assert.equal(c.show, true);
  assert.equal(S.sourceChoices(['climate.01_wohnzimmer_erdgeschoss'], states, 'temp').show, false);   // only the thermostat: nothing to choose
  const h = S.sourceChoices(ids, states, 'humid');
  assert.equal(h.show, true); near(h.thermo, 48); assert.equal(h.sensors.length, 1);
  const gone = S.sourceChoices(['climate.01_wohnzimmer_erdgeschoss'], states, 'temp', {}, 'sensor.gone');
  assert.equal(gone.show, true);                                                           // a choice is stored: the field stays to undo it
  assert.deepEqual(gone.sensors, [{ id: 'sensor.gone', v: null }]);
  assert.equal(S.sourceChoices([], {}, 'temp').thermo, null);
});

test('the room tiles, labels and the climate page follow the room', () => {
  const room = { id: 'wz', area: 'living_room', points: [[0, 0], [4, 0], [4, 4], [0, 4]], tempFrom: 'climate' };
  near(R.roomReading(ids, states, 'temp'), 21.65);
  near(R.roomReading(ids, states, 'temp', {}, S.sourceOf(room, 'temp')), 23);
  const sum = R.roomSummary(room, { rooms: [room], walls: [], devices: [] }, { placed: [], areaEntities: ids, states, isOn: () => false, isOpen: () => false, openingEntities: () => [] });
  near(sum.temp, 23);
  const rows = C.climateRooms([{ id: 'wz', name: 'Wohnzimmer', ids, from: { temp: 'climate', humid: 'sensor.netatmo_wohnzimmer_luftfeuchtigkeit' } }], states, []);
  near(rows[0].temp, 23); near(rows[0].humid, 52); near(rows[0].co2, 900);
  const auto = C.climateRooms([{ id: 'wz', name: 'Wohnzimmer', ids }], states, []);
  near(auto[0].temp, 21.65);
});
