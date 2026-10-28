// Unit tests for roomsensors.js (🌡 Raumfühler, #573: the sensors' temperatures in the page's states, the sensors offered for a thermostat,
// what the card and the line on 🌡 Klima say; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const R = await import(`${process.env.STATIC_DIR || '/tmp/static'}/roomsensors.js`);
const t = (k, v) => (v ? `${k} ${JSON.stringify(v)}` : k);
const deg = (v) => (v === null ? '–' : `${String(v).replace('.', ',')}°`);
const states = () => ({
  'climate.wz': { state: 'heat', ct: 25.1, tt: 21 },
  'climate.hm': { state: 'heat', ct: 23, tt: 22.5 },
  'sensor.wz': { state: '20.5', unit: '°C', dc: 'temperature' },
  'sensor.hm': { state: '20.0', unit: '°C' },
  'sensor.trv_local': { state: '25.1', unit: '°C', dc: 'temperature' },
  'sensor.gone': { state: 'unavailable', unit: '°C', dc: 'temperature' },
  'sensor.power': { state: '300', unit: 'W', dc: 'power' },
  'sensor.kueche': { state: '22.1', unit: '°C' },
});

test('the sensors temperature is shown as the thermostats own, the wish as the target of a moved one, both back when taken away', () => {
  const st = states();
  const cfg = { on: true, map: { 'climate.wz': { s: 'sensor.wz', way: 'auto' }, 'climate.hm': { s: 'sensor.hm', way: 'auto' } } };
  const status = { 'climate.wz': { way: 'cal', off: -4.6 }, 'climate.hm': { way: 'shift', wish: 20, want: 22.5 } };
  assert.equal(R.applySensors(st, cfg, status), 2);
  assert.deepEqual([st['climate.wz'].ct, st['climate.wz'].ct0, st['climate.wz'].tt, st['climate.wz'].rs], [20.5, 25.1, 21, 'sensor.wz']);
  assert.deepEqual([st['climate.hm'].ct, st['climate.hm'].tt, st['climate.hm'].tt0], [20, 20, 22.5]);
  R.applySensors(st, cfg, status);                                     // again: the same, the thermostat's own values kept
  assert.equal(st['climate.wz'].ct0, 25.1);
  st['sensor.wz'] = { state: 'unavailable' };
  R.applySensors(st, cfg, status);
  assert.equal(st['climate.wz'].ct, 25.1);                           // the sensor does not report: the thermostat's own
  st['climate.hm'] = { state: 'off', ct: 22, tt: 22.5 };             // a new state from Home Assistant
  R.applySensors(st, cfg, status);
  assert.deepEqual([st['climate.hm'].ct, st['climate.hm'].tt, st['climate.hm'].ct0], [20, 22.5, 22]);   // off: its own target
  st['climate.hm'] = { state: 'heat', ct: 22, tt: 5 };               // the window rule holds it as cold as it goes (#577): its own target
  R.applySensors(st, cfg, { ...status, 'climate.hm': { way: 'shift', wish: 20, set: 5, hold: true } });
  assert.equal(st['climate.hm'].tt, 5);
  R.applySensors(st, { ...cfg, on: false }, status);
  assert.deepEqual(st['climate.wz'], { state: 'heat', ct: 25.1, tt: 21 });
  assert.equal(R.applySensors(null, cfg, status), 0);
});

test('sensors offered: those of the room first, never the thermostats own, the first of the room suggested', () => {
  const rooms = [{ id: 'r1', name: 'Wohnzimmer', ids: ['climate.wz', 'sensor.wz', 'sensor.trv_local'] }, { id: 'r2', name: 'Küche', ids: ['sensor.kueche'] }];
  const c = R.sensorChoices('climate.wz', rooms, states(), { 'sensor.trv_local': 'climate.wz' });
  assert.equal(c.room.id, 'r1');
  assert.deepEqual(c.same, ['sensor.wz']);
  assert.deepEqual(c.other, ['sensor.kueche', 'sensor.gone', 'sensor.hm']);   // by room, then the ones in no room
  assert.equal(c.suggest, 'sensor.wz');
  assert.equal(R.sensorChoices('climate.hm', rooms, states(), {}).suggest, null);
  assert.ok(R.isTempSensor('sensor.x', { unit: '°F' }) && !R.isTempSensor('sensor.x', { unit: 'W' }) && !R.isTempSensor('binary_sensor.x', { dc: 'temperature' }));
  assert.equal(R.sensorValue(states(), 'sensor.gone'), null);
  assert.equal(R.sensorValue({ s: { state: '200' } }, 's'), null);
});

test('what the card says of a thermostat', () => {
  const line = (st, way = 'auto') => R.sensorLine(st, way, t, deg, deg);
  assert.deepEqual(line(null), { way: null, tone: 'off', text: 'rs.notYet' });
  assert.equal(line(null, 'shift').way, 'shift');
  assert.deepEqual(line({ way: 'cal', kind: 'off', off: -4.6 }), { way: 'cal', tone: 'ok', text: '✓ rs.calOk {"v":"−4,6°"}' });
  assert.equal(line({ way: 'cal', kind: 'off', off: 0, want: -1.7, wait: true }).text, '⏳ rs.calWait {"v":"−1,7°"}');
  assert.match(line({ way: 'cal', kind: 'off', off: -5, want: -5, edge: true }).text, /rs\.edge/);
  assert.equal(line({ way: 'cal', kind: 'ext', sent: 20.5 }).text, '✓ rs.sent {"v":"20,5°"}');
  assert.deepEqual(line({ way: 'shift', wish: 20, want: 22.5 }), { way: 'shift', tone: 'ok', text: 'rs.shiftText {"wish":"20°","at":"22,5°"}' });
  assert.equal(line({ way: 'shift', wish: null }).text, 'rs.off');
  assert.deepEqual(line({ way: 'shift', wish: 21, set: 5, hold: true }), { way: 'shift', tone: 'wait', text: '⏸️ rs.hold {"wish":"21°"}' });   // #577
  assert.equal(line({ way: 'shift', lost: true, wish: 20 }).tone, 'warn');
  assert.deepEqual(line({ way: 'show', nocal: true }), { way: 'show', tone: 'warn', text: '⚠️ rs.nocal' });
  assert.equal(line({ way: 'show' }).text, 'rs.showText');
  assert.equal(R.signed(0, deg), '±0°');
  assert.equal(R.platformName('mqtt'), 'Zigbee2MQTT / MQTT');
  assert.equal(R.platformName('something'), 'something');
  assert.equal(R.platformName(null), '');
  assert.deepEqual(R.sensorCfg({ sensors: { map: { a: 1 } } }), { on: true, every: 10, min: 0.5, map: { a: 1 } });
  assert.equal(R.sensorCfg(null).on, true);
});

test('the line under a thermostat on 🌡 Klima and the log', () => {
  const s = { ct: 20.5, ct0: 25.1, rs: 'sensor.wz' };
  assert.deepEqual(R.roomSensorChip({ way: 'cal', kind: 'off', off: -4.6 }, s, t, deg, deg),
    { text: '🌡 rs.chipSensor {"v":"20,5°"} · rs.chipOwn {"v":"25,1°"}', chip: { cls: 'cal', text: '🎯 rs.chipCal {"v":"−4,6°"}' } });
  assert.equal(R.roomSensorChip({ way: 'shift', wish: 20, want: 22.5 }, s, t, deg, deg).chip.text, '↕ rs.chipAt {"v":"22,5°"}');
  assert.equal(R.roomSensorChip({ way: 'cal', kind: 'off', off: -4.6, raw: 25.2 }, { ...s, ct0: 20.6 }, t, deg, deg).text,   // reports with its offset
    '🌡 rs.chipSensor {"v":"20,5°"} · rs.chipOwn {"v":"25,2°"}');
  assert.equal(R.roomSensorChip({ way: 'shift', lost: true }, s, t, deg, deg).chip.cls, 'warn');
  assert.equal(R.roomSensorChip(null, s, t, deg, deg).chip, null);
  assert.equal(R.roomSensorChip(null, { ct: 21 }, t, deg, deg), null);           // no sensor: no line
  assert.equal(R.sensorLog({ act: 'cal', v: -4.6 }, t, 'WZ', deg).text, 'rs.log.cal {"name":"WZ","v":"-4,6°"}');
  assert.equal(R.sensorLog({ act: 'wish', v: 23 }, t, 'WZ', deg).sub, 'rs.log.wishSub');
  assert.equal(R.sensorLog({ act: 'back' }, t, 'WZ', deg).icon, '↩');
});
