// Unit tests for livepopup.js: the live card is drawn anew only when something it shows changes (#336; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const P = await import(`${process.env.STATIC_DIR || '/tmp/static'}/livepopup.js`);

const lamp = { id: 'd1', type: 'light', name: 'Lampe', entity: 'light.a', x: 2, z: 2 };
const states = () => ({
  'light.a': { since: 1, state: 'on', brightness: 40, rgb: [255, 0, 0], rgbRaw: [255, 0, 0], fx: ['Rainbow', 'Fire'], fxc: null },
  'light.b': { since: 1, state: 'off' },
  'scene.abend': { since: 1, state: 'unknown', members: ['light.a'] },
  'sensor.temp': { since: 1, state: '21.5', unit: '°C' },
});
const base = (over = {}) => ({ dev: lamp, seg: null, lang: 'de', extra: [['r1', 'Wohnzimmer'], false], ids: ['light.a', 'scene.abend', 'light.b'], states: states(), ...over });
const key = (over) => P.popupKey(base(over));

test('an entity the card does not show changes: the same key (the card stays as it is)', () => {
  const st = states(); st['sensor.temp'].state = '22'; st['sensor.temp'].since = 2;
  st['sensor.leistung'] = { state: '95.4', unit: 'W' };
  assert.equal(key({ states: st }), key());
});
test('only the time of the last change (or an attribute the card does not show) changes: the same key', () => {
  const st = states(); st['light.a'].since = 99; st['light.a'].members = ['x']; st['light.a'].rgbRaw = [1, 2, 3];
  assert.equal(key({ states: st }), key());
});
test('what the card shows of a shown entity changes: a new key', () => {
  const change = [
    (s) => { s['light.a'].state = 'off'; }, (s) => { s['light.a'].brightness = 80; }, (s) => { s['light.a'].rgb = [0, 0, 255]; },
    (s) => { s['light.a'].fxc = 'Fire'; }, (s) => { s['light.a'].fx = ['Fire']; }, (s) => { s['light.b'].state = 'on'; },
    (s) => { s['light.a'].unit = '%'; }, (s) => { s['light.b'].position = 40; }, (s) => { delete s['light.b']; },
  ];
  for (const f of change) { const st = states(); f(st); assert.notEqual(key({ states: st }), key(), String(f)); }
});
test('an entity that shows up later (not there yet when the card was drawn) gives a new key', () => {
  const st = states(); delete st['light.b'];
  assert.notEqual(key({ states: st }), key());
});
test('the order and repeats of the entities do not matter, empty ones are left out', () => {
  assert.equal(key({ ids: ['light.b', '', 'light.a', null, 'scene.abend', 'light.a', undefined] }), key());
});
test('another or one more entity on the card (a new scene of the light, a lamp more in the room) gives a new key', () => {
  assert.notEqual(key({ ids: ['light.a', 'scene.abend'] }), key());
  assert.notEqual(key({ ids: ['light.a', 'scene.abend', 'light.b', 'scene.nacht'] }), key());
});
test('the device, the tapped LED ring section, the language, the room and the names of the entities are part of the key', () => {
  assert.notEqual(key({ dev: { ...lamp, name: 'Stehlampe' } }), key());
  assert.notEqual(key({ dev: { ...lamp, entity: 'light.b' } }), key());
  assert.notEqual(key({ seg: 2 }), key());
  assert.notEqual(key({ seg: 2 }), key({ seg: 3 }));
  assert.notEqual(key({ lang: 'en' }), key());
  assert.notEqual(key({ extra: [['r1', 'Küche'], false] }), key());
  assert.notEqual(key({ extra: [['r1', 'Wohnzimmer'], true] }), key());
  assert.notEqual(key({ name: (e) => (e === 'scene.abend' ? 'Abend' : e) }), key());
  assert.equal(key({ dev: { ...lamp } }), key());              // the same device as a new object (plan loaded again): the same key
});
test('the shown part of a state: state, unit, brightness, colour, effects, position; nothing for a missing entity', () => {
  assert.equal(P.shownState(undefined), null);
  assert.deepEqual(P.shownState({ since: 5, state: 'on', unit: '', brightness: 10, rgb: [1, 2, 3], fx: ['A'], fxc: 'A', position: 60, ct: 20 }), ['on', '', 10, [1, 2, 3], ['A'], 'A', 60]);
});
test('without anything given the key still works (nothing shown)', () => {
  assert.equal(typeof P.popupKey({}), 'string');
  assert.equal(P.popupKey({}), P.popupKey({ ids: [], states: {} }));
});
