// Unit tests for garden.js (🌱 the garden on 🧺 Haushalt, #533: the zones, the rain, the card; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const G = await import(`${process.env.STATIC_DIR || '/tmp/static'}/garden.js`);
const ents = [
  { entity_id: 'valve.gartenventil', name: 'Gartenventil' }, { entity_id: 'switch.bewaesserung_beet', name: 'Bewässerung Beet' },
  { entity_id: 'switch.gartenlicht', name: 'Gartenlicht' }, { entity_id: 'switch.kaffee', name: 'Kaffeemaschine' },
  { entity_id: 'sensor.boden_feuchte', name: 'Rasen Bodenfeuchte', unit: '%', dc: 'moisture' }, { entity_id: 'sensor.bad_feuchte', name: 'Bad', unit: '%', dc: 'humidity' },
];

test('zones: every valve and the switches named like watering, not the garden light; a choice in ⚙ wins', () => {
  assert.deepEqual(G.findZones(ents, []), ['valve.gartenventil', 'switch.bewaesserung_beet']);
  assert.deepEqual(G.findZones(ents, ['switch.kaffee', 'light.x']), ['switch.kaffee']);
  assert.equal(G.findMoisture(ents), 'sensor.boden_feuchte');
  assert.equal(G.zoneService('valve.a', true), 'open_valve');
  assert.equal(G.zoneService('switch.a', false), 'turn_off');
});

test('the rain of today and tomorrow from the daily forecast', () => {
  const now = new Date(2026, 9, 26, 12).getTime(), day = (n) => new Date(2026, 9, 26 + n, 12).toISOString();
  assert.deepEqual(G.rainOf([{ t: day(0), p: 0 }, { t: day(1), p: 4.2 }, { t: day(2), p: 9 }], now), { today: 0, tomorrow: 4.2 });
  assert.deepEqual(G.rainOf([], now), { today: null, tomorrow: null });
});

test('the card: which zone runs and until when (the add-on\'s timer), when it last watered, the soil', () => {
  const now = Date.parse('2026-10-26T12:00:00Z');
  const states = { 'valve.gartenventil': { state: 'open', lc: now / 1000 - 120 }, 'switch.bewaesserung_beet': { state: 'off', lc: now / 1000 - 3600 },
    'sensor.boden_feuchte': { state: '33.6' } };
  const v = G.gardenView(['valve.gartenventil', 'switch.bewaesserung_beet'], states, { timers: { 'valve.gartenventil': now + 480000 }, moisture: 'sensor.boden_feuchte',
    names: { 'valve.gartenventil': 'Rasen' }, now });
  assert.equal(v.running, true);
  assert.deepEqual(v.zones.map((z) => [z.name, z.on, z.until]), [['Rasen', true, now + 480000], ['switch.bewaesserung_beet', false, null]]);
  assert.equal(v.lastWater, now - 3600000);
  assert.equal(v.moisture, 34);
  assert.deepEqual(G.cleanGarden({ zones: ['valve.a', 'valve.a', 'light.b'], minutes: 15 }), { zones: ['valve.a'], minutes: 15 });
  assert.deepEqual(G.cleanGarden({ minutes: 7 }), { zones: [], minutes: 10 });
});
