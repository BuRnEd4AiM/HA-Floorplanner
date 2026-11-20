// Unit tests for housecheck.js (🩺 Haus-Check with 🔧 Wartung; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const H = await import(`${process.env.STATIC_DIR || '/tmp/static'}/housecheck.js`);
const t = (k, p = {}) => k + (Object.keys(p).length ? JSON.stringify(p) : '');

test('reminders: checked, due in days, done today', () => {
  const list = H.cleanReminders([{ id: 'm_abc', name: ' Filter ', icon: '❄️', every: 90, last: '2026-09-01' }, { id: 'm_abc' }, { id: 'x' }, { id: 'm_new', every: 0 }]);
  assert.deepEqual(list.map((r) => [r.id, r.name, r.every, r.last]), [['m_abc', 'Filter', 90, '2026-09-01'], ['m_new', '?', 90, '']]);
  assert.equal(H.daysLeft(list[0], '2026-11-20'), 10);      // 1 Sept + 90 days = 30 Nov
  assert.equal(H.daysLeft(list[1], '2026-11-20'), 0);       // never done: due now
  assert.equal(H.markDone(list, 'm_new', '2026-11-20')[1].last, '2026-11-20');
  assert.match(H.newId(list), /^m_[a-z0-9]{6}$/);
});

test('the check: urgent (batteries, offline, due), soon (weak radio, updates, next 14 days), later', () => {
  const r = H.check({ batteries: [{ id: 'd1', name: 'Fenster Küche', level: 9 }], offline: [{ id: 'd2', name: 'Bewegung Flur', room: 'Flur' }],
    radio: [{ id: 'd3', name: 'Thermostat', q: 'bad', text: 'LQI 31' }, { id: 'd4', name: 'Gut', q: 'good', text: 'LQI 200' }], updates: [{ id: 'update.core', name: 'Core' }],
    reminders: [{ id: 'm_due', name: 'Rauchmelder', every: 365, last: '2025-01-01' }, { id: 'm_soon', name: 'Filter', every: 90, last: '2026-09-01' }, { id: 'm_later', name: 'Bürste', every: 60, last: '2026-11-10' }],
    today: '2026-11-20' }, t);
  assert.deepEqual(r.urgent.map((x) => [x.kind, x.id]), [['battery', 'd1'], ['offline', 'd2'], ['care', 'm_due']]);
  assert.deepEqual(r.soon.map((x) => [x.kind, x.id]), [['radio', 'd3'], ['update', 'update.core'], ['care', 'm_soon']]);
  assert.deepEqual(r.later.map((x) => x.id), ['m_later']);
  assert.equal(r.urgent[0].right, '9 %'); assert.equal(r.soon[2].right, 'hc.inDays{"n":10}');
});

test('suggestions from the plan: smoke detector, washer, radiator …; not twice, not one already there', () => {
  const devices = [{ id: 'd12', name: 'Rauchmelder Flur', type: 'sensor', entity: 'binary_sensor.rauch' }, { id: 'k_d7', name: 'Waschmaschine', type: 'washer' },
    { id: 'rd1', name: 'Heizkörper', type: 'radiator' }, { id: 'x', name: 'Sofa', type: 'sofa' }, { id: 'l1', name: 'Licht Waschküche', type: 'light' }];   // not the lamp of the laundry
  const s = H.suggestions(devices, [], t);
  assert.deepEqual(s.map((x) => [x.device, x.key, x.every]), [['d12', 'mt.smoke', 365], ['k_d7', 'mt.lint', 90], ['rd1', 'mt.bleed', 365]]);
  const have = [{ device: 'd12', name: s[0].name }];
  assert.ok(!H.suggestions(devices, have, t).some((x) => x.device === 'd12'));
});
