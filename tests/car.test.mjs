// Unit tests for car.js (🚗 the car on 🧺 Haushalt, #533: its entities found by their names, the card, "☀ Nur mit Sonne laden"; run like
// offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const C = await import(`${process.env.STATIC_DIR || '/tmp/static'}/car.js`);
const ents = [
  { entity_id: 'sensor.auto_ladestand', name: 'Auto Ladestand', unit: '%', dc: 'battery' },
  { entity_id: 'sensor.handy_anna_battery_level', name: 'Handy Anna Akku', unit: '%', dc: 'battery' },
  { entity_id: 'sensor.batterie_ladung', name: 'Hausbatterie', unit: '%' },
  { entity_id: 'sensor.auto_reichweite', name: 'Auto Reichweite', unit: 'km' },
  { entity_id: 'binary_sensor.auto_laedt', name: 'Auto lädt', dc: 'battery_charging' },
  { entity_id: 'sensor.wallbox_leistung', name: 'Wallbox Leistung', unit: 'kW', dc: 'power' },
  { entity_id: 'sensor.auto_voll_um', name: 'Auto voll um', dc: 'timestamp' },
  { entity_id: 'select.evcc_garage_mode', name: 'Garage Modus', ctl: { options: ['off', 'now', 'minpv', 'pv'] } },
  { entity_id: 'select.hausmodus', name: 'Hausmodus', ctl: { options: ['Zu Hause', 'Urlaub'] } },
];

test('the car is found by its names, not the phone or the house battery; a choice in ⚙ wins', () => {
  assert.deepEqual(C.findCar(ents, {}), { battery: 'sensor.auto_ladestand', range: 'sensor.auto_reichweite', charging: 'binary_sensor.auto_laedt',
    power: 'sensor.wallbox_leistung', ends: 'sensor.auto_voll_um', mode: 'select.evcc_garage_mode', name: '' });
  assert.equal(C.findCar(ents, { battery: 'sensor.batterie_ladung', name: ' Zoe ' }).battery, 'sensor.batterie_ladung');
  assert.equal(C.findCar(ents, { name: ' Zoe ' }).name, 'Zoe');
  assert.equal(C.hasCar(C.findCar(ents.slice(1, 3), {})), false);      // only a phone and the house battery: no car
  assert.equal(C.findCar([{ entity_id: 'sensor.evcc_garage_vehicle_soc', name: 'Garage Vehicle Soc', unit: '%' }], {}).battery, 'sensor.evcc_garage_vehicle_soc');
});

test('the card: charge, range, charging with its power, full at; the sun mode of evcc or a switch', () => {
  const f = C.findCar(ents, {}), now = Date.parse('2026-10-26T12:00:00Z');
  const states = { 'sensor.auto_ladestand': { state: '63.6', unit: '%' }, 'sensor.auto_reichweite': { state: '311.6', unit: 'km' },
    'binary_sensor.auto_laedt': { state: 'on' }, 'sensor.wallbox_leistung': { state: '3.2', unit: 'kW' }, 'sensor.auto_voll_um': { state: '2026-10-26T15:30:00Z' },
    'select.evcc_garage_mode': { state: 'now' } };
  const v = C.carView(f, states, now);
  assert.deepEqual({ ...v, solar: null }, { level: 64, range: 312, rangeUnit: 'km', charging: true, watts: 3200, ends: Date.parse('2026-10-26T15:30:00Z'), solar: null });
  assert.deepEqual(v.solar, { entity: 'select.evcc_garage_mode', on: false, kind: 'select' });
  assert.deepEqual(C.solarCall(v.solar, true), ['select.evcc_garage_mode', 'select_option', { option: 'pv' }]);
  assert.deepEqual(C.solarCall({ ...v.solar, on: true }, false), ['select.evcc_garage_mode', 'select_option', { option: 'now' }]);
  const notCharging = C.carView(f, { ...states, 'binary_sensor.auto_laedt': { state: 'off' } }, now);
  assert.equal(notCharging.charging, false); assert.equal(notCharging.ends, null);
  const sw = C.solarMode({ mode: 'switch.nur_pv' }, { 'switch.nur_pv': { state: 'on' } });
  assert.deepEqual(sw, { entity: 'switch.nur_pv', on: true, kind: 'switch' });
  assert.deepEqual(C.solarCall(sw, false), ['switch.nur_pv', 'turn_off', undefined]);
  const left = C.carView({ battery: 'sensor.a', charging: 'binary_sensor.c', ends: 'sensor.rest' }, { 'sensor.a': { state: '50' }, 'binary_sensor.c': { state: 'on' },
    'sensor.rest': { state: '90', unit: 'min' } }, now);
  assert.equal(left.ends, now + 90 * 60000);
});

test('the choices kept in the settings', () => {
  assert.deepEqual(C.cleanCar({ battery: 'sensor.a', range: 'x', fridge: 'sensor.b', name: '  Auto  ' }), { battery: 'sensor.a', name: 'Auto' });
  assert.deepEqual(C.cleanCar(null), {});
});
