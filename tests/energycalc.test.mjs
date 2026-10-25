// Unit tests for energycalc.js (the power bookkeeping of the "⚡ Rechnung" tab and the power overview, #378, #379; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const E = await import(`${dir}/energycalc.js`);

const st = (state, unit = '') => ({ state: String(state), unit });
const dev = (type, extra = {}) => ({ id: type + (extra.entity || ''), type, x: 0, z: 0, ...extra });
/** a layout with one floor holding these devices (and rooms), and the tab's settings */
const lay = (devices, energy, rooms = []) => ({ floors: [{ id: 'f', name: 'EG', devices, rooms }], ...(energy ? { energy } : {}) });
const bal = (states, devices, energy, rooms) => E.energyBalance(states, lay(devices, energy, rooms));
const t = (k, p) => (p ? `${k}:${Object.values(p).join(',')}` : k);

test('watts of a sensor: kW converted, no number and charge levels give null', () => {
  assert.equal(E.sensorWatts({ a: st(1.5, 'kW') }, 'a'), 1500);
  assert.equal(E.sensorWatts({ a: st(80, '%') }, 'a'), null);
  assert.equal(E.sensorWatts({ a: st('unavailable') }, 'a'), null);
  assert.equal(E.sensorWatts({}, ''), null);
  assert.ok(E.isPowerState(st(1, 'W')) && E.isPowerState(st(1, 'kW')) && E.isPowerState({ state: '1', dc: 'power' }));
  assert.ok(!E.isPowerState(st(1, 'kWh')) && !E.isPowerState(st(1, '%')) && !E.isPowerState(undefined));
});

/* ---- without settings: from the power devices of the plan, as before ---- */
test('plan: production from inverters, not counted twice with the panels; panels when there is no inverter; never negative', () => {
  assert.equal(bal({ i: st(3, 'kW'), p: st(1000, 'W') }, [dev('inverter', { entity: 'i' }), dev('solarpanel', { entity: 'p' })]).prod, 3000);
  assert.equal(bal({ p: st(1000, 'W'), q: st(500, 'W') }, [dev('solarpanel', { entity: 'p' }), dev('solarpanel', { entity: 'q' })]).prod, 1500);
  assert.equal(bal({ i: st(-300, 'W') }, [dev('inverter', { entity: 'i' })]).prod, 0);
});
test('plan: grid plus draws, minus feeds in; consumption = production + grid', () => {
  const dr = bal({ i: st(0, 'W'), m: st(450, 'W') }, [dev('inverter', { entity: 'i' }), dev('powermeter', { entity: 'm' })]);
  assert.equal(dr.grid, 450); assert.equal(dr.load, 450); assert.equal(dr.imp, 450); assert.equal(dr.exp, 0);
  const fi = bal({ i: st(3000, 'W'), m: st(-1000, 'W') }, [dev('inverter', { entity: 'i' }), dev('powermeter', { entity: 'm' })]);
  assert.equal(fi.grid, -1000); assert.equal(fi.load, 2000); assert.equal(fi.exp, 1000); assert.equal(fi.self, 2000); assert.equal(fi.autarky, 100);
  assert.equal(bal({ m: st(200, 'W') }, [dev('houseentry', { entity: 'm' })]).grid, 200);      // the house connection when there is no meter
  const none = bal({}, [dev('inverter', { entity: 'x' })]);
  assert.equal(none.prod, null); assert.equal(none.load, null); assert.equal(none.battery, null);
  assert.equal(none.sources.grid.from, null); assert.equal(none.sources.solar.from, 'plan');
});
test('plan: battery level in %, charging / discharging from its own sensor, sign can be turned; a text tells only the direction', () => {
  const b = (extra) => dev('battery', { entity: 'lvl', ...extra });
  const s = { lvl: st(82, '%'), w: st(600, 'W') };
  assert.deepEqual(bal(s, [b({ batPower: 'w' })]).battery, { v: 82, flow: 600, dir: 1 });
  assert.deepEqual(bal(s, [b({ batPower: 'w', batInvert: true })]).battery, { v: 82, flow: -600, dir: -1 });
  assert.deepEqual(bal({ lvl: st(82, '%') }, [b({})]).battery, { v: 82, flow: null, dir: null });
  assert.deepEqual(bal({ lvl: st(82, '%'), w: st('discharging') }, [b({ batPower: 'w' })]).battery, { v: 82, flow: null, dir: -1 });
  assert.deepEqual(bal({ w: st(2, 'kW') }, [dev('battery', { entity: 'w' })]).battery, { v: null, flow: 2000, dir: 1 });   // the battery's own sensor reports watts
  assert.deepEqual(bal({ lvl: st(82, '%'), w: st(5, 'W') }, [b({ batPower: 'w' })]).battery, { v: 82, flow: 5, dir: 0 });   // a trickle is idle
});
test('#379: the battery is part of the consumption: charging takes power away, discharging adds it', () => {
  const devs = [dev('inverter', { entity: 'i' }), dev('powermeter', { entity: 'm' }), dev('battery', { entity: 'lvl', batPower: 'w' })];
  const ch = bal({ i: st(3000, 'W'), m: st(0, 'W'), lvl: st(50, '%'), w: st(600, 'W') }, devs);
  assert.equal(ch.load, 2400); assert.equal(ch.counted, 600);
  const dis = bal({ i: st(0, 'W'), m: st(100, 'W'), lvl: st(50, '%'), w: st(-400, 'W') }, devs);
  assert.equal(dis.load, 500);
});

/* ---- the tab's settings ---- */
test('grid: one sensor of the tab wins over the plan, its sign can be turned (also of the plan\'s meter)', () => {
  const devs = [dev('powermeter', { entity: 'm' })], s = { m: st(100, 'W'), g: st(-700, 'W') };
  assert.equal(bal(s, devs, { grid: { entity: 'g' } }).grid, -700);
  assert.equal(bal(s, devs, { grid: { entity: 'g', invert: true } }).grid, 700);
  assert.equal(bal(s, devs, { grid: { invert: true } }).grid, -100);
  assert.equal(bal(s, devs, { grid: { entity: 'g' } }).sources.grid.from, 'set');
  assert.equal(bal({ m: st(0, 'W') }, devs, { grid: { invert: true } }).grid, 0);         // no -0
  assert.ok(Object.is(bal({ m: st(0, 'W') }, devs, { grid: { invert: true } }).grid, 0));
});
test('grid: two sensors (drawn and fed in), counted as positive whatever their sign; nothing chosen yet = the plan', () => {
  const s = { a: st(300, 'W'), b: st(-1.2, 'kW'), m: st(5, 'W') }, devs = [dev('powermeter', { entity: 'm' })];
  assert.equal(bal(s, devs, { grid: { split: true, imp: 'a', exp: 'b' } }).grid, -900);
  assert.equal(bal(s, devs, { grid: { split: true, imp: 'a' } }).grid, 300);
  const empty = bal(s, devs, { grid: { split: true } });
  assert.equal(empty.grid, 5); assert.equal(empty.sources.grid.from, 'plan');
});
test('solar: the tab\'s sensors are added up instead of the plan\'s', () => {
  const s = { i: st(3000, 'W'), a: st(1, 'kW'), b: st(250, 'W') };
  const r = bal(s, [dev('inverter', { entity: 'i' })], { solar: { entities: ['a', 'b', 'a', ''] } });
  assert.equal(r.prod, 1250); assert.deepEqual(r.sources.solar.entities, ['a', 'b']);
});
test('battery: one sensor or charge and discharge apart; left out of the consumption for a hybrid inverter', () => {
  const s = { i: st(2000, 'W'), m: st(0, 'W'), w: st(-500, 'W'), c: st(0, 'W'), d: st(800, 'W'), l: st(64, '%') };
  const devs = [dev('inverter', { entity: 'i' }), dev('powermeter', { entity: 'm' })];
  const one = bal(s, devs, { battery: { entity: 'w', level: 'l' } });
  assert.deepEqual(one.battery, { v: 64, flow: -500, dir: -1 }); assert.equal(one.load, 2500);
  assert.equal(bal(s, devs, { battery: { entity: 'w', invert: true } }).load, 1500);
  const two = bal(s, devs, { battery: { split: true, charge: 'c', discharge: 'd' } });
  assert.deepEqual(two.battery, { v: null, flow: -800, dir: -1 }); assert.equal(two.load, 2800);
  const hybrid = bal(s, devs, { battery: { entity: 'w', balance: false } });
  assert.equal(hybrid.load, 2000); assert.equal(hybrid.counted, 0); assert.equal(hybrid.battery.flow, -500);
  const plan = bal({ ...s, p: st(300, 'W') }, [...devs, dev('battery', { entity: 'p' })], { battery: { invert: true } });   // the tab turns the plan's battery round
  assert.equal(plan.battery.flow, -300);
});
test('house: a sensor of its own is shown, the calculation is compared with it', () => {
  const s = { i: st(1000, 'W'), m: st(200, 'W'), h: st(1150, 'W') };
  const r = bal(s, [dev('inverter', { entity: 'i' }), dev('powermeter', { entity: 'm' })], { house: { entity: 'h' } });
  assert.equal(r.load, 1150); assert.equal(r.calc, 1200); assert.equal(r.measured, 1150);
  assert.deepEqual(E.energyChecks(r), []);                                       // 50 W apart is fine
});
test('rooms: their sensors are added up, the rest is what no room accounts for; a sensor counts once', () => {
  const rooms = [{ id: 'k', name: 'Küche', points: [] }, { id: 'b', name: 'Bad', points: [] }, { id: 'x', name: 'Leer', points: [] }];
  const s = { m: st(1000, 'W'), p1: st(300, 'W'), p2: st(50, 'W'), p3: st('unavailable') };
  const r = bal(s, [dev('powermeter', { entity: 'm' })], { rooms: { k: ['p1', 'p2'], b: ['p2', 'p3', 'm'], gone: ['p1'] } }, rooms);
  assert.deepEqual(r.rooms.map((x) => [x.id, x.watts]), [['k', 350], ['b', null]]);
  assert.equal(r.roomsSum, 350); assert.equal(r.rest, 650);
  assert.deepEqual(r.twice.sort(), ['m', 'p2']);
  assert.deepEqual(E.energyChecks(r).map((c) => c.code), ['twice']);
});

/* ---- checks ---- */
test('checks: a consumption below zero points to a wrong sign, with the signs that would fix it', () => {
  const devs = [dev('inverter', { entity: 'i' }), dev('powermeter', { entity: 'm' })];
  const wrong = bal({ i: st(500, 'W'), m: st(-1500, 'W') }, devs);       // the meter counts the other way round: -1000 W
  assert.equal(wrong.calc, -1000); assert.equal(wrong.load, 0);
  const c = E.energyChecks(wrong);
  assert.equal(c[0].code, 'negative'); assert.deepEqual(c[0].fixes, ['grid']);
  const bat = bal({ i: st(500, 'W'), m: st(0, 'W'), w: st(1200, 'W') }, [...devs, dev('battery', { entity: 'w' })]);   // "charging" 1.2 kW from 0.5 kW: the battery is the other way round
  assert.deepEqual(E.energyChecks(bat)[0].fixes, ['battery']);
  assert.deepEqual(E.energyChecks(bal({ i: st(500, 'W'), m: st(-520, 'W') }, devs)), []);   // a little below 0 is just timing
});
test('checks: house sensor and calculation far apart, the sign that brings them together', () => {
  const s = { i: st(2000, 'W'), m: st(-500, 'W'), h: st(2500, 'W') };     // the meter really draws 500 W but reports it as minus
  const r = bal(s, [dev('inverter', { entity: 'i' }), dev('powermeter', { entity: 'm' })], { house: { entity: 'h' } });
  const c = E.energyChecks(r);
  assert.equal(c.length, 1); assert.equal(c[0].code, 'differs'); assert.deepEqual(c[0].fixes, ['grid']);
  assert.deepEqual(c[0].params, { calc: '1,50 kW', measured: '2,50 kW' });
});
test('checks: the rooms use more than the house', () => {
  const r = bal({ m: st(300, 'W'), p: st(900, 'W') }, [dev('powermeter', { entity: 'm' })], { rooms: { k: ['p'] } }, [{ id: 'k', name: 'K', points: [] }]);
  assert.deepEqual(E.energyChecks(r).map((c) => c.code), ['rooms']);
});
test('flipSign turns the sign of the grid or the battery round and back', () => {
  const e = {};
  E.flipSign(e, 'grid'); assert.deepEqual(e, { grid: { invert: true } });
  E.flipSign(e, 'grid'); assert.deepEqual(e, { grid: {} });
  E.flipSign(e, 'battery'); assert.equal(e.battery.invert, true);
});

/* ---- suggestions for the rooms ---- */
test('suggestRooms: power sensors in the room\'s area or placed in it, not the ones already used, each only once', () => {
  const inPoly = (x, zz, p) => x >= p[0][0] && x <= p[2][0] && zz >= p[0][1] && zz <= p[2][1];
  const sq = (x0, x1) => [[x0, 0], [x1, 0], [x1, 4], [x0, 4]];
  const layout = { floors: [{ devices: [dev('plug', { entity: 'sensor.tv_w', x: 6, z: 1 }), dev('powermeter', { entity: 'sensor.grid', x: 1, z: 1 }), dev('lamp', { entity: 'light.a', x: 1, z: 1 })],
    rooms: [{ id: 'k', area: 'kitchen', points: sq(0, 4) }, { id: 'w', area: 'living', points: sq(5, 9) }, { id: 'e', points: sq(10, 12) }] }],
    energy: { rooms: { w: ['sensor.old'] } } };
  const states = { 'sensor.fridge_w': st(80, 'W'), 'sensor.kettle_kwh': st(3, 'kWh'), 'sensor.grid': st(500, 'W'), 'sensor.tv_w': st(90, 'W'),
    'sensor.oven_w': st(0, 'W'), 'sensor.old': st(5, 'W'), 'sensor.lamp_pow': { state: '7', dc: 'power' } };
  const areaOf = { 'sensor.fridge_w': 'kitchen', 'sensor.kettle_kwh': 'kitchen', 'sensor.oven_w': 'kitchen', 'sensor.grid': 'kitchen', 'sensor.old': 'living', 'sensor.lamp_pow': 'living', 'light.a': 'kitchen' };
  assert.deepEqual(E.suggestRooms(layout, states, areaOf, inPoly), { k: ['sensor.fridge_w', 'sensor.oven_w'], w: ['sensor.lamp_pow', 'sensor.tv_w'] });
});

/* ---- the pill ---- */
test('pill: arrows up / down for charging / discharging, none at rest; a text sensor gives the arrow without watts', () => {
  const txt = (battery) => E.energyText({ prod: null, grid: null, load: null, battery }, t);
  assert.equal(txt({ v: 82, flow: 600 }).text, '🔋 82 % ↑ 600 W');
  assert.equal(txt({ v: 82, flow: -450 }).text, '🔋 82 % ↓ 450 W');
  assert.equal(txt({ v: 82, flow: 5 }).text, '🔋 82 %');
  assert.equal(txt({ v: 82, flow: null }).text, '🔋 82 %');
  assert.equal(txt({ v: 82, flow: null, dir: 1 }).text, '🔋 82 % ↑');
  assert.ok(txt({ v: null, flow: null, dir: -1 }).title.includes('power.sum.discharging'));
  assert.equal(E.energyText({ prod: null, grid: null, load: null, battery: null }, t), null);
  const full = E.energyText({ prod: 3200, grid: -1000, load: 2200, battery: null }, t);
  assert.equal(full.text, '☀ 3,20 kW · ⚡ 1,00 kW · ⌂ 2,20 kW');
  assert.ok(full.title.includes('power.sum.feedIn') && full.title.includes('power.sum.load:'));
});
test('pill: a measured consumption says so; the rooms and the rest are in the tooltip, the biggest first', () => {
  const e = { prod: null, grid: 500, load: 800, measured: 800, battery: null, rooms: [{ name: 'Bad', watts: 20 }, { name: 'Küche', watts: 450 }, { name: 'Flur', watts: null }], rest: 330 };
  const r = E.energyText(e, t);
  assert.equal(r.text, '⚡ 500 W · ⌂ 800 W');
  assert.ok(r.title.includes('power.sum.loadMeasured: 800 W'));
  assert.ok(r.title.includes('power.sum.rooms: Küche 450 W, Bad 20 W'));
  assert.ok(r.title.includes('power.sum.rest: 330 W'));
});

/* ---- the calculation in the tab ---- */
test('balanceRows: production, grid, battery and the sum, signs as in the calculation; rooms and rest; a sum below 0 is marked', () => {
  const devs = [dev('inverter', { entity: 'i' }), dev('powermeter', { entity: 'm' }), dev('battery', { entity: 'w' })];
  const rooms = [{ id: 'k', name: 'Küche', points: [] }];
  const r = bal({ i: st(3000, 'W'), m: st(-1000, 'W'), w: st(500, 'W'), p: st(400, 'W') }, devs, { rooms: { k: ['p'] } }, rooms);
  assert.deepEqual(E.balanceRows(r, t).map((x) => `${x.sign}|${x.label}|${x.value}|${x.cls}`), [
    '|energy.r.prod|3,00 kW|', '−|energy.r.feedIn|1,00 kW|', '−|energy.r.charge|500 W|', '=|energy.r.calc|1,50 kW|sum',
    '|↳ Küche|400 W|room', '|energy.r.rest|1,10 kW|room', '|energy.r.self|2,00 kW|extra', '|energy.r.autarky|100 %|extra']);
  const off = bal({ i: st(0, 'W'), m: st(-300, 'W'), w: st(-200, 'W') }, devs, { battery: { balance: false } });
  const lines = E.balanceRows(off, t).map((x) => `${x.sign}|${x.label}|${x.value}|${x.cls}`);
  assert.ok(lines.includes('|energy.r.batOff|−200 W|'), lines);
  assert.ok(lines.includes('=|energy.r.calc|−300 W|bad'), lines);
  assert.equal(E.fmtSigned(-1500), '−1,50 kW');
});
