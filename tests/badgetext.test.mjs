// Unit tests for badgetext.js (value badges, run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const B = await import(`${dir}/badgetext.js`);
const t = (k) => `[${k}]`;

test('sensor values are rounded to one decimal, with their sign and unit', () => {
  assert.equal(B.badgeText({ state: '21.437', unit: '°C', dc: 'temperature' }, 'sensor.t', t), '🌡 21,4 °C');
  assert.equal(B.badgeText({ state: '950', unit: 'W' }, 'sensor.p', t), '⚡ 950 W');
  assert.equal(B.badgeText({ state: '7', unit: 'x' }, 'sensor.n', t), '7 x');
});
test('meters (#136): water, gas and heat get their own sign, also when the sensor says energy', () => {
  assert.equal(B.badgeText({ state: '1234.5678', unit: 'm³', dc: 'water' }, 'sensor.w', t), '🚰 1234,6 m³');
  assert.equal(B.badgeText({ state: '845.21', unit: 'm³', dc: 'gas' }, 'sensor.g', t), '🔥 845,2 m³');
  assert.equal(B.badgeText({ state: '5321', unit: 'kWh', dc: 'energy' }, 'sensor.h', t, 'heatmeter'), '♨ 5321 kWh');
  assert.equal(B.badgeText({ state: '5321', unit: 'kWh', dc: 'energy' }, 'sensor.h', t), '⚡ 5321 kWh');
  assert.equal(B.badgeText({ state: '12', unit: 'm³' }, 'sensor.x', t, 'watermeter'), '🚰 12 m³');
});
test('other domains and missing states', () => {
  assert.equal(B.badgeText(undefined, 'sensor.x', t), '—');
  assert.equal(B.badgeText({ state: 'unavailable' }, 'sensor.x', t), '[off.unavailable]');
  assert.equal(B.badgeText({ state: 'off' }, 'light.x', t), '[live.off]');
  assert.equal(B.badgeText({ state: 'on', brightness: 40 }, 'light.x', t), '💡 40 %');
  assert.equal(B.badgeText({ state: 'open', position: 70 }, 'cover.x', t), '↕ 70 %');
  assert.equal(B.badgeText({ state: 'heat', ct: 20.55 }, 'climate.x', t), '🌡 20,6 °C');
  assert.equal(B.badgeText({ state: 'playing', app: 'Netflix' }, 'media_player.x', t), '▶ Netflix');
  assert.equal(B.badgeText({ state: 'playing' }, 'media_player.sonos', t), '▶ [mp.st.playing]');   // the device list said "▶ playing"
  assert.equal(B.badgeText({ state: 'paused' }, 'media_player.sonos', t), '⏸ [mp.st.paused]');
  assert.equal(B.badgeText({ state: 'idle' }, 'media_player.sonos', t), '[mp.st.idle]');
  assert.equal(B.badgeText({ state: 'off' }, 'media_player.sonos', t), '[live.off]');
  assert.equal(B.badgeText({ state: 'on' }, 'switch.x', t), '[live.on]');
});
test('state text: the value with its unit', () => {
  assert.equal(B.stateText({ state: '3', unit: 'm³' }, t), '3 m³');
  assert.equal(B.stateText(null, t), '—');
});
test('state text in the language of the page where it has the words (#492: "docked", "on" stood in English in the device list)', () => {
  assert.equal(B.stateText({ state: 'on' }, t, 'binary_sensor.praesenz'), '[live.on]');
  assert.equal(B.stateText({ state: 'off' }, t), '[live.off]');
  assert.equal(B.stateText({ state: 'docked' }, t, 'vacuum.robo'), '[dc.st.docked]');
  assert.equal(B.stateText({ state: 'armed_away' }, t, 'alarm_control_panel.haus'), '[dc.st.armed_away]');
  assert.equal(B.stateText({ state: 'playing' }, t, 'media_player.tv'), '[mp.st.playing]');
  assert.equal(B.stateText({ state: 'heat' }, t, 'climate.wz'), 'heat');                 // no words of its own here: as Home Assistant says it
  assert.equal(B.stateText({ state: 'docked' }, t, 'sensor.x'), 'docked');
  assert.equal(B.badgeText({ state: 'cleaning' }, 'vacuum.robo', t), '[dc.st.cleaning]');
  assert.equal(B.stateText({ state: 'not_home' }, t, 'device_tracker.handy'), '[fm.away]');
  assert.equal(B.stateText({ state: 'home' }, t, 'person.anna'), '[fm.home]');
  assert.equal(B.stateText({ state: 'Arbeit' }, t, 'person.anna'), 'Arbeit');                 // a zone: its own name
  assert.equal(B.stateText({ state: 'idle' }, t, 'camera.flur'), '[mp.st.idle]');
  const real = (k) => ({ 'live.on': 'An', 'dc.st.docked': 'An der Station' }[k] ?? k);   // the real t gives the key back when it has no words
  assert.equal(B.stateText({ state: 'docked' }, real, 'vacuum.robo'), 'An der Station');
  assert.equal(B.stateText({ state: 'unknown' }, real, 'vacuum.robo'), 'unknown');
  assert.equal(B.stateText({ state: 'on' }, real, 'switch.x'), 'An');
});
