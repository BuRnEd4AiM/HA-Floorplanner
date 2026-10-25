// Unit tests for doorbell.js (🔔 the doorbell: which entities ring, their camera and door opener, when a change is a ring; run like
// offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const D = await import(`${process.env.STATIC_DIR || '/tmp/static'}/doorbell.js`);

test('the bells chosen in the settings are checked: a bell is an event or a binary sensor, a camera a camera, the opener a lock or a button', () => {
  assert.deepEqual(D.cleanBells([{ entity: 'event.haustuer_ding', camera: 'camera.haustuer', open: 'lock.haustuer', name: ' Haustür ' }]),
    [{ entity: 'event.haustuer_ding', camera: 'camera.haustuer', open: 'lock.haustuer', name: 'Haustür' }]);
  assert.deepEqual(D.cleanBells([{ entity: 'light.flur', camera: 'camera.x' }, { entity: 'binary_sensor.klingel', camera: 'light.x', open: 'light.x' }]),
    [{ entity: 'binary_sensor.klingel', camera: '', open: '', name: '' }]);
  assert.equal(D.cleanBells([1, 2, 3, 4, 5, 6].map((i) => ({ entity: `event.bell_${i}` }))).length, D.MAX_BELLS);
  assert.equal(D.cleanBells([{ entity: 'event.a' }, { entity: 'event.a' }]).length, 1);
  assert.deepEqual(D.cleanBells('junk'), []);
  for (const open of ['button.summer', 'switch.tueroeffner', 'script.tuer_auf', 'input_button.tuer']) assert.equal(D.cleanBells([{ entity: 'event.a', open }])[0].open, open);
});

test('without a choice the bells are found: an event of the class doorbell, a sensor named like a bell; each gets its camera', () => {
  const ents = [
    { entity_id: 'event.haustuer_ding', name: 'Haustür Klingeln', dc: 'doorbell' },
    { entity_id: 'binary_sensor.klingel_garten', name: 'Gartentor' },
    { entity_id: 'binary_sensor.fenster_kueche', name: 'Fenster Küche', dc: 'window' },
    { entity_id: 'event.taster_flur', name: 'Taster', dc: 'button' },
    { entity_id: 'camera.haustuer', name: 'Haustür' }, { entity_id: 'camera.garten', name: 'Garten' },
  ];
  const bells = D.findBells(ents, []);
  assert.deepEqual(bells.map((b) => [b.entity, b.camera, b.name]), [
    ['event.haustuer_ding', 'camera.haustuer', 'Haustür Klingeln'], ['binary_sensor.klingel_garten', 'camera.garten', 'Gartentor']]);
  const chosen = D.findBells(ents, [{ entity: 'event.taster_flur', camera: 'camera.garten', name: 'Hintertür' }]);
  assert.deepEqual(chosen.map((b) => [b.entity, b.camera, b.name]), [['event.taster_flur', 'camera.garten', 'Hintertür']]);
});

test('the camera of a bell: chosen, else one with a word of the bell in its name, else the only one, else none', () => {
  assert.equal(D.bellCamera({ entity: 'event.vordertuer_ring' }, ['camera.garage', 'camera.vordertuer_hd']), 'camera.vordertuer_hd');
  assert.equal(D.bellCamera({ entity: 'event.vordertuer_ring' }, ['camera.einfahrt']), 'camera.einfahrt');
  assert.equal(D.bellCamera({ entity: 'event.vordertuer_ring' }, ['camera.a', 'camera.b']), '');
  assert.equal(D.bellCamera({ entity: 'event.x', camera: 'camera.b' }, ['camera.a']), 'camera.b');
});

test('a ring: an event with a new time stamp, a binary sensor from off to on; never on first sight, after unavailable or with an old time', () => {
  const now = Date.parse('2026-10-26T01:00:00Z');
  assert.equal(D.isRing('event.tuer', '2026-10-26T00:10:00.000+00:00', '2026-10-26T00:59:50.000+00:00', now), true);
  assert.equal(D.isRing('event.tuer', '2026-10-26T00:10:00.000+00:00', '2026-10-26T00:10:00.000+00:00', now), false);
  assert.equal(D.isRing('event.tuer', undefined, '2026-10-26T00:59:50.000+00:00', now), false);
  assert.equal(D.isRing('event.tuer', 'unavailable', '2026-10-26T00:59:50.000+00:00', now), false);
  assert.equal(D.isRing('event.tuer', '2026-10-25T20:00:00+00:00', '2026-10-25T21:00:00+00:00', now), false);   // Home Assistant restarted
  assert.equal(D.isRing('event.tuer', '2026-10-26T00:10:00+00:00', 'unknown', now), false);
  assert.equal(D.isRing('binary_sensor.klingel', 'off', 'on', now), true);
  assert.equal(D.isRing('binary_sensor.klingel', 'on', 'off', now), false);
  assert.equal(D.isRing('binary_sensor.klingel', 'unavailable', 'on', now), false);
  assert.equal(D.isRing('binary_sensor.klingel', undefined, 'on', now), false);
});

test('the door opener: a lock is unlocked, a button pressed, a switch or script turned on', () => {
  assert.deepEqual(D.openService('lock.haustuer'), ['lock', 'unlock']);
  assert.deepEqual(D.openService('button.summer'), ['button', 'press']);
  assert.deepEqual(D.openService('input_button.summer'), ['input_button', 'press']);
  assert.deepEqual(D.openService('switch.tueroeffner'), ['switch', 'turn_on']);
  assert.deepEqual(D.openService('script.tuer_auf'), ['script', 'turn_on']);
  assert.equal(D.openService('light.flur'), null);
  assert.equal(D.openService(''), null);
});
