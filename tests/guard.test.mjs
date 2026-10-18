// Unit tests for guard.js (the holiday alarm on the screens, #456; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const G = await import(`${process.env.STATIC_DIR || '/tmp/static'}/guard.js`);
const E = (entity_id, state, dc, name) => ({ entity_id, state, dc, name: name || entity_id });
const LAY = { floors: [{ name: 'EG', rooms: [{ name: 'Flur', points: [[0, 0], [4, 0], [4, 3], [0, 3]] }],
  walls: [{ a: [0, 0], b: [4, 0], openings: [{ type: 'door', pos: 2, entity: 'binary_sensor.kontakt' }, { type: 'window', pos: 1, paneEntities: ['binary_sensor.fluegel'] }] }],
  devices: [{ x: 1, z: 1, entity: 'binary_sensor.pir' }] }] };

test('where a sensor is in the plan: a device, or the contact of a door / window', () => {
  assert.deepEqual(G.placeOf(LAY, 'binary_sensor.pir'), { floor: 'EG', room: 'Flur', kind: null });
  assert.deepEqual(G.placeOf(LAY, 'binary_sensor.kontakt'), { floor: 'EG', room: 'Flur', kind: 'door' });
  assert.deepEqual(G.placeOf(LAY, 'binary_sensor.fluegel'), { floor: 'EG', room: 'Flur', kind: 'window' });
  assert.equal(G.placeOf(LAY, 'binary_sensor.x'), null);
  assert.equal(G.placeOf({}, 'binary_sensor.x'), null);
});
test('the sensors to choose: by device class or by the plan, grouped, with state; a chosen one Home Assistant lost stays', () => {
  const g = G.sensorChoices([E('binary_sensor.haustuer', 'off', 'door', 'Haustür'), E('binary_sensor.kontakt', 'on', null, 'Kontakt'),
    E('binary_sensor.fluegel', 'unavailable', null, 'Flügel'), E('binary_sensor.pir', 'off', 'motion', 'PIR'), E('binary_sensor.rauch', 'off', 'smoke'),
    E('light.x', 'on', null)], LAY, ['binary_sensor.weg']);
  assert.deepEqual(g.map((x) => x.group), ['door', 'window', 'motion']);
  assert.deepEqual(g[0].items.map((i) => [i.entity, i.where, i.state]), [['binary_sensor.kontakt', 'EG · Flur', 'open'], ['binary_sensor.haustuer', '', 'closed'], ['binary_sensor.weg', '', 'offline']]);
  assert.deepEqual(g[1].items.map((i) => [i.name, i.state]), [['Flügel', 'offline']]);
  assert.deepEqual(G.sensorChoices([], {}, []), []);
});
test('what can be switched on at an alarm', () => {
  const a = G.actionChoices([E('siren.flur', 'off'), E('light.b', 'off', null, 'B'), E('light.a', 'off', null, 'A'), E('script.alarm', 'off'), E('input_boolean.x', 'off'), E('lock.y', 'locked')], ['siren.weg']);
  assert.deepEqual(a.map((g) => [g.group, g.items.map((i) => i.entity)]), [['siren', ['siren.flur', 'siren.weg']], ['light', ['light.a', 'light.b']], ['switch', ['input_boolean.x']], ['script', ['script.alarm']]]);
});
test('which chosen sensors are open or offline before arming', () => {
  assert.deepEqual(G.openNow(['binary_sensor.a', 'binary_sensor.b', 'binary_sensor.c'], [E('binary_sensor.a', 'on', 'door', 'A'), E('binary_sensor.b', 'off', 'door', 'B')]),
    [{ entity: 'binary_sensor.a', name: 'A', state: 'open' }, { entity: 'binary_sensor.c', name: 'binary_sensor.c', state: 'offline' }]);
  assert.deepEqual(G.openNow(undefined, []), []);
});
test('the lock screen: shown while not off, what it says, the seconds count on', () => {
  assert.equal(G.screenOf({ phase: 'off' }, 0).show, false);
  assert.equal(G.screenOf(null, 0).show, false);
  assert.deepEqual(G.screenOf({ phase: 'arming', left: 30 }, 25), { show: true, tone: 'arming', key: 'gd.arming', left: 25, what: null });
  assert.equal(G.screenOf({ phase: 'armed' }, 0).key, 'gd.armed');
  const w = { name: 'Haustür', why: 'open' };
  assert.deepEqual(G.screenOf({ phase: 'entry', what: w }, 12), { show: true, tone: 'entry', key: 'gd.entry', left: 12, what: w });
  assert.equal(G.screenOf({ phase: 'alarm', what: { ...w, why: 'offline' } }, 0).key, 'gd.alarmOffline');
  assert.equal(G.leftNow({ left: 30 }, 1000, 6400), 25);
  assert.equal(G.leftNow({ left: 3 }, 0, 9000), 0);
});
test('the keypad', () => {
  assert.equal(G.pressKey('12', '3'), '123');
  assert.equal(G.pressKey('123', '⌫'), '12');
  assert.equal(G.pressKey('123', 'C'), '');
  assert.equal(G.pressKey('12345678', '9'), '12345678');
  assert.equal(G.pressKey('1', 'x'), '1');
});
