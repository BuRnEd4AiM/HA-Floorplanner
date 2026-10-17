// Unit tests for energyprefs.js (taking over the energy dashboard of Home Assistant, the setup check list, #407; run like offline.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const S = process.env.STATIC_DIR || '/tmp/static';
const P = await import(`${S}/energyprefs.js`);
const E = await import(`${S}/energycalc.js`);

const W = (v) => ({ state: String(v), unit: 'W', dc: 'power' });
const KWH = (v) => ({ state: String(v), unit: 'kWh', dc: 'energy' });
const PCT = (v) => ({ state: String(v), unit: '%' });

test('power sensors of the energy dashboard: the user\'s own choice first, then stat_rate', () => {
  assert.deepEqual(P.rateOf({ stat_rate: 'sensor.made', power_config: { stat_rate_inverted: 'sensor.mine' } }), { entity: 'sensor.mine', flipped: true });
  assert.deepEqual(P.rateOf({ power_config: { stat_rate_from: 'sensor.a', stat_rate_to: 'sensor.b' } }), { split: true, from: 'sensor.a', to: 'sensor.b' });
  assert.deepEqual(P.rateOf({ power_config: { stat_rate: 'sensor.p' } }), { entity: 'sensor.p', flipped: false });
  assert.deepEqual(P.rateOf({ stat_rate: 'sensor.p' }), { entity: 'sensor.p', flipped: false });
  assert.equal(P.rateOf({ stat_rate: 'external:stat' }), null);                 // a statistic that is not an entity
  assert.equal(P.rateOf(null), null);
});
test('grid, solar and battery with power sensors: signs turned to the tab\'s (battery plus = charging)', () => {
  const prefs = { energy_sources: [
    { type: 'grid', stat_energy_from: 'sensor.imp_kwh', stat_energy_to: 'sensor.exp_kwh', stat_rate: 'sensor.grid_w' },
    { type: 'solar', stat_energy_from: 'sensor.pv1_kwh', stat_rate: 'sensor.pv1_w' },
    { type: 'solar', stat_energy_from: 'sensor.pv2_kwh', stat_rate: 'sensor.pv2_w' },
    { type: 'battery', stat_energy_from: 'sensor.bout', stat_energy_to: 'sensor.bin', stat_rate: 'sensor.bat_w', stat_soc: 'sensor.bat_soc' },
    { type: 'gas', stat_energy_from: 'sensor.gas_m3' }, { type: 'water', stat_energy_from: 'sensor.water_m3' }, { type: 'water', stat_energy_from: 'external:x' },
  ] };
  const p = P.fromEnergyPrefs(prefs);
  assert.deepEqual(p.grid, { entity: 'sensor.grid_w', invert: false });
  assert.deepEqual(p.solar, ['sensor.pv1_w', 'sensor.pv2_w']);
  assert.deepEqual(p.battery, { level: 'sensor.bat_soc', entity: 'sensor.bat_w', invert: true });   // Home Assistant: plus = discharging
  assert.deepEqual(p.meters, [{ kind: 'gas', entity: 'sensor.gas_m3' }, { kind: 'water', entity: 'sensor.water_m3' }]);
  assert.equal(p.empty, false);
  const inv = P.fromEnergyPrefs({ energy_sources: [{ type: 'battery', power_config: { stat_rate_inverted: 'sensor.b' } }] });
  assert.deepEqual(inv.battery, { level: '', entity: 'sensor.b', invert: false });               // its sign is already the tab's
  const two = P.fromEnergyPrefs({ energy_sources: [{ type: 'battery', power_config: { stat_rate_from: 'sensor.dis', stat_rate_to: 'sensor.chg' } },
    { type: 'grid', power_config: { stat_rate_from: 'sensor.in', stat_rate_to: 'sensor.out' } }] });
  assert.deepEqual(two.battery, { level: '', split: true, charge: 'sensor.chg', discharge: 'sensor.dis' });
  assert.deepEqual(two.grid, { split: true, imp: 'sensor.in', exp: 'sensor.out' });
});
test('the older form of the grid (flow_from, flow_to, power) is read too', () => {
  const p = P.fromEnergyPrefs({ energy_sources: [{ type: 'grid', flow_from: [{ stat_energy_from: 'sensor.i' }], flow_to: [{ stat_energy_to: 'sensor.o' }],
    power: [{ stat_rate: 'sensor.netz_w', power_config: { stat_rate_inverted: 'sensor.netz_raw' } }] }] });
  assert.deepEqual(p.grid, { entity: 'sensor.netz_raw', invert: true });
});
test('only energy meters: the power sensor on the same device, marked as a guess', () => {
  const states = { 'sensor.meter_power': W(300), 'sensor.meter_import': KWH(1200), 'sensor.inv_power': W(800), 'sensor.inv_energy': KWH(5),
    'sensor.bms_soc': PCT(71), 'sensor.bms_power': W(-200), 'sensor.p_in': W(10), 'sensor.p_out': W(0) };
  const siblings = { 'sensor.meter_import': ['sensor.meter_power', 'sensor.meter_export'], 'sensor.inv_energy': ['sensor.inv_power', 'sensor.inv_temp'],
    'sensor.bms_out': ['sensor.bms_power', 'sensor.bms_soc'] };
  const p = P.fromEnergyPrefs({ energy_sources: [{ type: 'grid', stat_energy_from: 'sensor.meter_import' }, { type: 'solar', stat_energy_from: 'sensor.inv_energy' },
    { type: 'battery', stat_energy_from: 'sensor.bms_out' }] }, siblings, states);
  assert.deepEqual(p.grid, { entity: 'sensor.meter_power', invert: false, guess: true });
  assert.deepEqual(p.solar, ['sensor.inv_power']);
  assert.equal(p.solarGuess, true);
  assert.deepEqual(p.battery, { level: 'sensor.bms_soc', entity: 'sensor.bms_power', invert: false, guess: true });
  const split = P.fromEnergyPrefs({ energy_sources: [{ type: 'grid', stat_energy_from: 'sensor.a', stat_energy_to: 'sensor.b' }] },
    { 'sensor.a': ['sensor.p_in'], 'sensor.b': ['sensor.p_out'] }, states);
  assert.deepEqual(split.grid, { split: true, imp: 'sensor.p_in', exp: 'sensor.p_out', guess: true });
  const named = P.fromEnergyPrefs({ energy_sources: [{ type: 'grid', stat_energy_from: 'sensor.a' }] },
    { 'sensor.a': ['sensor.grid_export_power', 'sensor.grid_import_power'] }, { 'sensor.grid_export_power': W(0), 'sensor.grid_import_power': W(5) });
  assert.deepEqual(named.grid, { split: true, imp: 'sensor.grid_import_power', exp: 'sensor.grid_export_power', guess: true });
  assert.equal(P.fromEnergyPrefs({ energy_sources: [] }).empty, true);
  assert.equal(P.fromEnergyPrefs(null).empty, true);
});
test('taking it over: grid, solar and battery replaced, rooms and house kept, "not counted" of the battery kept', () => {
  const energy = { grid: { entity: 'sensor.old', invert: true }, rooms: { r1: ['sensor.x'] }, house: { entity: 'sensor.h' }, battery: { balance: false, entity: 'sensor.ob' } };
  const done = P.applyPrefs(energy, { grid: { split: true, imp: 'sensor.i', exp: 'sensor.o' }, solar: ['sensor.pv'], battery: { level: 'sensor.soc', entity: 'sensor.b', invert: true } });
  assert.deepEqual(done, ['grid', 'solar', 'battery']);
  assert.deepEqual(energy, { grid: { split: true, imp: 'sensor.i', exp: 'sensor.o' }, rooms: { r1: ['sensor.x'] }, house: { entity: 'sensor.h' },
    solar: { entities: ['sensor.pv'] }, battery: { balance: false, level: 'sensor.soc', entity: 'sensor.b', invert: true } });
  const e2 = {};
  assert.deepEqual(P.applyPrefs(e2, { grid: { entity: 'sensor.g', invert: false }, solar: [], battery: null }), ['grid']);
  assert.deepEqual(e2, { grid: { entity: 'sensor.g' } });
});
test('the check list: what is set up, what is missing, meters of the energy dashboard not in the plan', () => {
  const layout = { floors: [{ id: 'f', rooms: [{ id: 'r1', points: [] }, { id: 'r2', points: [] }], devices: [{ id: 'm', type: 'watermeter', entity: 'sensor.water_m3' }] }], energy: {} };
  let bal = E.energyBalance({}, layout);
  let cl = Object.fromEntries(P.setupChecklist(bal, layout, {}).map((c) => [c.key, c]));
  assert.equal(cl.grid.level, 'todo');
  assert.equal(cl.solar.level, 'info');
  assert.equal(cl.house.level, 'info');
  assert.deepEqual([cl.rooms.level, cl.rooms.params], ['info', { n: 0, m: 2 }]);
  assert.equal(cl.meters.level, 'warn');                                       // a water meter without a reading
  assert.equal(cl.sums, undefined);                                            // nothing to add up without the grid
  layout.energy = { grid: { entity: 'sensor.g' }, solar: { entities: ['sensor.pv'] }, rooms: { r1: ['sensor.r1'], r2: ['sensor.r2'] } };
  const states = { 'sensor.g': W(-500), 'sensor.pv': W(2000), 'sensor.r1': W(100), 'sensor.r2': W(200), 'sensor.water_m3': { state: '12.5', unit: 'm³' } };
  bal = E.energyBalance(states, layout);
  const prop = { meters: [{ kind: 'water', entity: 'sensor.water_m3' }, { kind: 'gas', entity: 'sensor.gas_m3' }] };
  cl = Object.fromEntries(P.setupChecklist(bal, layout, states, prop).map((c) => [c.key, c]));
  assert.deepEqual([cl.grid.level, cl.solar.level, cl.rooms.level, cl.sums.level], ['ok', 'ok', 'ok', 'ok']);
  assert.deepEqual([cl.meters.level, cl.meters.params.missing], ['todo', [{ kind: 'gas', entity: 'sensor.gas_m3' }]]);
  states['sensor.g'] = W(-3000);                                               // the calculation goes below 0 (a sign is off), the rooms above it
  cl = Object.fromEntries(P.setupChecklist(E.energyBalance(states, layout), layout, states).map((c) => [c.key, c]));
  assert.deepEqual([cl.sums.level, cl.sums.params.n], ['warn', 2]);
  assert.equal(cl.meters.level, 'ok');
  assert.equal(P.setupChecklist(E.energyBalance({}, { floors: [{ rooms: [], devices: [] }] }), { floors: [{ rooms: [], devices: [] }] }, {}).some((c) => c.key === 'rooms'), false);
});
