// Unit tests for roomcard.js (the room card with tabs, 5.10.0, docs/ideen-5.10; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const R = await import(`${dir}/roomcard.js`);
const t = (k, p = {}) => k + (Object.keys(p).length ? JSON.stringify(p) : '');
const num = (v, d = 1) => (Math.round(v * 10 ** d) / 10 ** d).toLocaleString('de-DE');

test('tabOf: scenes go with the lights, sensors with the heating, media / switches / cameras are devices', () => {
  assert.equal(R.tabOf('light'), 'light'); assert.equal(R.tabOf('scene'), 'light');
  assert.equal(R.tabOf('cover'), 'cover'); assert.equal(R.tabOf('climate'), 'climate'); assert.equal(R.tabOf('sensor'), 'climate');
  ['media_player', 'switch', 'camera'].forEach((g) => assert.equal(R.tabOf(g), 'devices'));
  assert.equal(R.tabOf('other'), null);
});

test('roomTabs: only tabs with something in them, in order, with their badges', () => {
  const full = { lights: 5, lightsOn: 3, scenes: 3, covers: [60], thermostats: 1, temp: 21.4, sensors: 4, devices: 3, devicesOn: 2, openings: 3, open: 2, heatIcon: '' };
  const tabs = R.roomTabs(full, t, (v) => `${num(v)}°`);
  assert.deepEqual(tabs.map((x) => x.key), ['light', 'cover', 'climate', 'devices', 'open']);
  assert.deepEqual(tabs.map((x) => x.badge), ['3/5', '60 %', '21,4°', 'rp.nOn{"n":2}', 'rp.nOpen{"n":2}']);
  assert.equal(tabs.find((x) => x.key === 'open').alert, true);
  assert.equal(tabs.find((x) => x.key === 'light').icon, '💡');
  // the heating rules' icon goes with the temperature (the owner: whether the heating plan is at work must not get lost)
  assert.equal(R.roomTabs({ ...full, heatIcon: '⏸️' }, t, (v) => `${num(v)}°`).find((x) => x.key === 'climate').badge, '21,4° ⏸️');
  // sensors without a thermostat: the tab "Werte"
  const vals = R.roomTabs({ sensors: 2, temp: null }, t);
  assert.deepEqual(vals.map((x) => [x.key, x.badge, x.icon]), [['values', '2', '📊']]);
  // scenes alone still give the light tab; all windows shut: no alert
  assert.deepEqual(R.roomTabs({ scenes: 2, openings: 2, open: 0 }, t).map((x) => [x.key, x.badge, x.alert]), [['light', '2', false], ['open', 'rp.allShut', false]]);
  assert.deepEqual(R.roomTabs({}, t), []);
});

test('coverBadge: one position, the same position of several, else how many', () => {
  assert.equal(R.coverBadge([60]), '60 %');
  assert.equal(R.coverBadge([100, 100]), '100 %');
  assert.equal(R.coverBadge([0, 100, 50]), '3×');
  assert.equal(R.coverBadge([null]), '1×');
  assert.equal(R.coverBadge([]), '');
});

test('pickTab: the last chosen tab when the room has it, Klima and Werte stand for each other, else the first', () => {
  const tabs = [{ key: 'light' }, { key: 'cover' }, { key: 'climate' }];
  assert.equal(R.pickTab(tabs, 'cover'), 'cover');
  assert.equal(R.pickTab(tabs, 'open'), 'light');
  assert.equal(R.pickTab(tabs, null), 'light');
  assert.equal(R.pickTab([{ key: 'values' }], 'climate'), 'values');
  assert.equal(R.pickTab(tabs, 'values'), 'climate');
  assert.equal(R.pickTab([], 'light'), null);
  assert.equal(R.tabGroup('values'), 'climate'); assert.equal(R.tabGroup('cover'), 'cover');
});

test('roomChips: the values on top with their tab, CO₂ coloured, °F, kW, open windows red', () => {
  const c = R.roomChips({ temp: 21.44, humid: 47.6, co2: 920, power: 168, open: 3, co2Bad: 1200 }, num);
  assert.deepEqual(c.map((x) => [x.key, x.text, x.tone, x.tab]), [['temp', '21,4 °C', '', 'climate'], ['humid', '48 %', '', 'climate'], ['co2', '920 ppm', 'warn', 'climate'],
    ['power', '168 W', '', 'climate'], ['open', '', 'bad', 'open']]);
  assert.equal(c.find((x) => x.key === 'open').n, 3);
  assert.equal(R.roomChips({ temp: 20 }, num, true)[0].text, '68 °F');
  assert.equal(R.roomChips({ power: 2450 }, num)[0].text, '2,5 kW');
  assert.deepEqual(R.roomChips({ temp: null, humid: null, co2: null, power: null, open: 0 }, num), []);
});

test('co2Tone: green, yellow from 800 ppm, red from the airing limit', () => {
  assert.equal(R.co2Tone(600), 'good'); assert.equal(R.co2Tone(800), 'warn'); assert.equal(R.co2Tone(1199), 'warn'); assert.equal(R.co2Tone(1200), 'bad');
  assert.equal(R.co2Tone(1000, 1000), 'bad'); assert.equal(R.co2Tone(700, 700), 'bad'); assert.equal(R.co2Tone(null), '');
});

test('roomPower: the sum of the sensors in W and kW, null without one', () => {
  const st = { 'sensor.a': { state: '100', unit: 'W' }, 'sensor.b': { state: '0.5', unit: 'kW' }, 'sensor.c': { state: '21', unit: '°C' },
    'sensor.d': { state: 'unavailable', unit: 'W' }, 'switch.e': { state: '5', unit: 'W' } };
  assert.equal(R.roomPower(['sensor.a', 'sensor.b', 'sensor.c', 'sensor.d', 'switch.e'], st), 600);
  assert.equal(R.roomPower(new Set(['sensor.c']), st), null);
  assert.equal(R.roomPower([], st), null);
});

test('quickKeys: light, scenes, then cover and climate, filled up to four', () => {
  const tabs = (...k) => k.map((key) => ({ key }));
  assert.deepEqual(R.quickKeys(tabs('light', 'cover', 'climate', 'devices', 'open'), 3), ['light', 'scenes', 'cover', 'climate']);
  assert.deepEqual(R.quickKeys(tabs('light', 'devices', 'open'), 0), ['light', 'devices', 'open']);
  assert.deepEqual(R.quickKeys(tabs('values', 'open'), 0), ['values', 'open']);
  assert.deepEqual(R.quickKeys(tabs('light'), 2), ['light', 'scenes']);
  assert.equal(R.quickTab('scenes'), 'light'); assert.equal(R.quickTab('cover'), 'cover');
});

test('sheetMove: a tap toggles, pulled up = everything, pushed down = small again or closed', () => {
  assert.equal(R.sheetMove(2, false), 'toggle');
  assert.equal(R.sheetMove(-40, false), 'full');
  assert.equal(R.sheetMove(40, true), 'peek');
  assert.equal(R.sheetMove(40, false), 'close');
  assert.equal(R.sheetMove(15, true), null);
});

test('roomIcon: a symbol by the name of the room, else a house', () => {
  assert.equal(R.roomIcon('Wohnzimmer'), '🛋️'); assert.equal(R.roomIcon('Schlafzimmer'), '🛏️'); assert.equal(R.roomIcon('Küche'), '🍳');
  assert.equal(R.roomIcon('Bad oben'), '🛁'); assert.equal(R.roomIcon('Living room'), '🛋️'); assert.equal(R.roomIcon('SZFL'), '🏠');
});

test('sceneIcon and shortName', () => {
  assert.equal(R.sceneIcon('Wohnzimmer Gemütlich'), '🛋️');
  assert.equal(R.sceneIcon('TV-Abend'), '🎬');
  assert.equal(R.sceneIcon('Gute Nacht'), '🌙');
  assert.equal(R.sceneIcon('Wohnzimmer Aus'), '⏻');
  assert.equal(R.sceneIcon('Living room off'), '⏻');
  assert.equal(R.sceneIcon('Ausflug'), '✨');
  assert.equal(R.sceneIcon('Irgendwas', true), '▶️');
  assert.equal(R.shortName('Wohnzimmer Gemütlich', 'Wohnzimmer'), 'Gemütlich');
  assert.equal(R.shortName('TV-Abend', 'Wohnzimmer'), 'TV-Abend');
  assert.equal(R.shortName('Wohnzimmer', 'Wohnzimmer'), 'Wohnzimmer');
});
