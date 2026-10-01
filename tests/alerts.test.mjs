// Tests for alerts.js: warnings, night dimming, search ranking
// (run: cp floorplan3d/rootfs/app/static/alerts.js /tmp/alerts.mjs && ALERTS_MJS=/tmp/alerts.mjs node --test tests/alerts.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const A = await import(process.env.ALERTS_MJS || '/tmp/alerts.mjs');
const E = (entity_id, state, extra = {}) => ({ entity_id, name: entity_id, state, ...extra });

test('smoke, gas, CO and water sensors that are on raise a warning, others do not', () => {
  const list = A.findAlerts([
    E('binary_sensor.k', 'on', { dc: 'smoke' }), E('binary_sensor.g', 'on', { dc: 'gas' }),
    E('binary_sensor.c', 'on', { dc: 'carbon_monoxide' }), E('binary_sensor.w', 'on', { dc: 'moisture' }),
    E('binary_sensor.k2', 'off', { dc: 'smoke' }), E('binary_sensor.m', 'on', { dc: 'motion' }),
  ]);
  assert.deepEqual(list.map((a) => a.kind), ['smoke', 'gas', 'co', 'water']);
});

test('an alarm panel warns when triggered or about to', () => {
  const kinds = (s) => A.findAlerts([E('alarm_control_panel.h', s)]).map((a) => a.kind);
  assert.deepEqual(kinds('triggered'), ['alarm']);
  assert.deepEqual(kinds('pending'), ['alarm']);
  assert.deepEqual(kinds('armed_away'), []);
});

test('a window open in the rain warns, only while it rains', () => {
  const win = [{ entity: 'binary_sensor.fenster', name: 'Küchenfenster' }, { entity: 'binary_sensor.zu', name: 'Bad' }];
  const ents = (w) => [E('weather.home', w), E('binary_sensor.fenster', 'on'), E('binary_sensor.zu', 'off')];
  assert.deepEqual(A.findAlerts(ents('rainy'), win).map((a) => [a.kind, a.name]), [['rain', 'Küchenfenster']]);
  assert.deepEqual(A.findAlerts(ents('sunny'), win), []);
  assert.deepEqual(A.findAlerts([E('weather.a', 'sunny'), E('weather.b', 'pouring'), E('binary_sensor.fenster', 'on')], win, 'weather.b').map((a) => a.kind), ['rain']);
});

test('night by the clock also across midnight, by the sun from sun.sun', () => {
  const at = (h, m = 0) => new Date(2026, 0, 1, h, m);
  assert.equal(A.nightActive('time', '22:00', '06:00', at(23), ''), true);
  assert.equal(A.nightActive('time', '22:00', '06:00', at(5, 59), ''), true);
  assert.equal(A.nightActive('time', '22:00', '06:00', at(6), ''), false);
  assert.equal(A.nightActive('time', '01:00', '05:00', at(3), ''), true);
  assert.equal(A.nightActive('time', '01:00', '05:00', at(12), ''), false);
  assert.equal(A.nightActive('sun', '', '', at(12), 'below_horizon'), true);
  assert.equal(A.nightActive('sun', '', '', at(12), 'above_horizon'), false);
  assert.equal(A.nightActive('off', '22:00', '06:00', at(23), 'below_horizon'), false);
});

test('search ranks exact and starting matches first', () => {
  assert.ok(A.matchScore('Küche', 'küche') > A.matchScore('Küchenlicht', 'küche'));
  assert.ok(A.matchScore('Licht Küche', 'küche') > 0);
  assert.ok(A.matchScore('Wohnzimmer', 'zimmer') > 0);
  assert.equal(A.matchScore('Bad', 'küche'), 0);
  assert.equal(A.matchScore('Bad', ''), 0);
});
