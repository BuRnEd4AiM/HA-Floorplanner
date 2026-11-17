// Unit tests for radiomap.js (📡 Funk-Karte, 5.17.0): what a signal value means and the list of the plan, the weakest first
// (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const R = await import(`${process.env.STATIC_DIR || '/tmp/static'}/radiomap.js`);

test('what a value means: dBm (WiFi, ZHA rssi), LQI (Zigbee2MQTT linkquality), %', () => {
  assert.deepEqual(R.signalOf({ state: '-54', unit: 'dBm' }), { v: -54, unit: 'dBm', q: 'good', text: '-54 dBm' });
  assert.equal(R.signalOf({ state: '-72', unit: 'dBm' }).q, 'mid');
  assert.equal(R.signalOf({ state: '-89', unit: 'dBm' }).q, 'bad');
  assert.deepEqual(R.signalOf({ state: '168', unit: 'lqi' }, 'sensor.x_linkquality'), { v: 168, unit: 'lqi', q: 'good', text: 'LQI 168' });
  assert.equal(R.signalOf({ state: '74' }, 'sensor.x_linkquality').q, 'mid');      // no unit: the name says it
  assert.equal(R.signalOf({ state: '31' }, 'sensor.x_linkquality').q, 'bad');
  assert.equal(R.signalOf({ state: '-60' }, 'sensor.x_rssi').unit, 'dBm');        // negative: dBm
  assert.equal(R.signalOf({ state: '45', unit: '%' }).q, 'mid');
  assert.equal(R.signalOf({ state: 'unavailable', unit: 'lqi' }), null);
  assert.equal(R.signalOf(null), null);
});

test('the list of the plan: devices and window contacts with a signal, the weakest first', () => {
  const layout = { floors: [{ name: 'EG', devices: [{ id: 'd1', name: 'Licht', entity: 'light.a' }, { id: 'd2', entity: 'light.b' }, { id: 'd3', entity: 'light.none' }],
    walls: [{ openings: [{ id: 'o1', name: 'Fenster', entity: 'binary_sensor.f' }] }] }, { name: 'OG', devices: [{ id: 'd4', entity: 'climate.c' }] }] };
  const of = { 'light.a': 'sensor.a_linkquality', 'light.b': 'sensor.b_linkquality', 'binary_sensor.f': 'sensor.f_linkquality', 'climate.c': 'sensor.c_wifi_signal' };
  const states = { 'sensor.a_linkquality': { state: '160', unit: 'lqi' }, 'sensor.b_linkquality': { state: '20', unit: 'lqi' },
    'sensor.f_linkquality': { state: '70', unit: 'lqi' }, 'sensor.c_wifi_signal': { state: '-85', unit: 'dBm' } };
  const rows = R.radioRows(layout, states, of);
  assert.deepEqual(rows.map((r) => [r.id, r.q, r.floor]), [['d2', 'bad', 0], ['d4', 'bad', 1], ['o1', 'mid', 0], ['d1', 'good', 0]]);
  assert.equal(rows.find((r) => r.id === 'o1').kind, 'opening');
  assert.equal(rows.find((r) => r.id === 'd2').name, 'light.b');                   // no name: the entity
  assert.deepEqual(R.counts(rows), { good: 1, mid: 1, bad: 2 });
  assert.deepEqual(R.radioRows(null, states, of), []);
});
