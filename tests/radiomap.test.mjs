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
test('offInPlan: the switched-off signals of the plan\'s devices and contacts without a signal, each once (📡 Alle einschalten, 5.28.2)', () => {
  const layout = { floors: [
    { devices: [{ id: 'a', entity: 'light.a' }, { id: 'b', entity: 'sensor.b_temp' }, { id: 'c', entity: 'light.c' }, { id: 'n' }],
      walls: [{ openings: [{ id: 'w', entity: 'binary_sensor.w' }] }] },
    { devices: [{ id: 'b2', entity: 'sensor.b_hum' }] }] };
  const of = { 'light.c': 'sensor.c_linkquality' };
  const offOf = { 'light.a': 'sensor.a_linkquality', 'sensor.b_temp': 'sensor.b_linkquality', 'sensor.b_hum': 'sensor.b_linkquality',
    'binary_sensor.w': 'sensor.w_lqi', 'light.c': 'sensor.c_old', 'light.elsewhere': 'sensor.x_linkquality' };
  assert.deepEqual(R.offInPlan(layout, of, offOf), ['sensor.a_linkquality', 'sensor.b_linkquality', 'sensor.w_lqi']);
  assert.deepEqual(R.offInPlan(layout, of, {}), []);
  assert.deepEqual(R.offInPlan(null, of, offOf), []);
});
test('Matter (5.28.3): linkOf reads the link of a Matter device: dBm first, else LQI, else only the quality', () => {
  assert.deepEqual(R.linkOf({ q: 'mid', strength: 'medium', network: 'wifi', rssi: -71, lqi: null }),
    { v: -71, unit: 'dBm', q: 'mid', text: '-71 dBm', via: 'matter', net: 'wifi' });
  assert.equal(R.linkOf({ q: 'good', lqi: 3 }).text, 'LQI 3');
  assert.deepEqual(R.linkOf({ q: 'bad' }), { v: 0, unit: '', q: 'bad', text: '', via: 'matter', net: '' });
  assert.equal(R.linkOf({ q: 'odd' }), null);
  assert.equal(R.linkOf(null), null);
});
test('Matter (5.28.3): radioRows takes the Matter link of a device without a signal value, the signal entity first', () => {
  const layout = { floors: [{ name: 'OG', devices: [{ id: 'm', name: 'Thread-Sensor', entity: 'sensor.thread' }, { id: 'z', name: 'Zigbee', entity: 'light.z' },
    { id: 'w', name: 'Beides', entity: 'light.w' }], walls: [] }] };
  const states = { 'sensor.z_linkquality': { state: '200', unit: 'lqi' }, 'sensor.w_rssi': { state: '-60', unit: 'dBm' } };
  const of = { 'light.z': 'sensor.z_linkquality', 'light.w': 'sensor.w_rssi' };
  const links = { 'sensor.thread': { q: 'bad', strength: 'weak', network: 'thread', rssi: -90 }, 'light.w': { q: 'bad', rssi: -95 } };
  const rows = R.radioRows(layout, states, of, undefined, links);
  assert.deepEqual(rows.map((r) => [r.id, r.q, r.text, r.sig]), [['m', 'bad', '-90 dBm', 'matter'], ['z', 'good', 'LQI 200', 'sensor.z_linkquality'],
    ['w', 'good', '-60 dBm', 'sensor.w_rssi']]);   // the weak first; the good ones in the order of the plan (dBm and LQI do not compare)
  assert.equal(R.radioRows(layout, {}, of, undefined, links).find((r) => r.id === 'w').text, '-95 dBm');   // no value of its entity yet
  assert.equal(R.radioRows(layout, states, of).length, 2);                                                // without links: as before
});
