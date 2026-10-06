// Unit tests for powerlogic.js (run: cp floorplan3d/rootfs/app/static/powerlogic.js /tmp/powerlogic.mjs && POWER_MJS=/tmp/powerlogic.mjs node --test tests/powerlogic.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const P = await import(process.env.POWER_MJS || '/tmp/powerlogic.mjs');
const st = (state, unit = '') => ({ state: String(state), unit });
const dev = (type, extra = {}) => ({ id: type + (extra.entity || ''), type, ...extra });

test('watts: kW and MW are converted, text and charge levels are no power', () => {
  assert.equal(P.powerWatts({ a: st(1500, 'W') }, { entity: 'a' }), 1500);
  assert.equal(P.powerWatts({ a: st(3.2, 'kW') }, { entity: 'a' }), 3200);
  assert.equal(P.powerWatts({ a: st(1.5, 'MW') }, { entity: 'a' }), 1.5e6);
  assert.equal(P.powerWatts({ a: st(82, '%') }, { entity: 'a' }), null);
  assert.equal(P.powerWatts({ a: st('unavailable') }, { entity: 'a' }), null);
  assert.equal(P.powerWatts({}, { entity: 'a' }), null);
  assert.equal(P.powerWatts({ a: st(10, 'W'), b: st(20, 'W') }, { entity: 'a' }, { entity: 'b' }), 20);      // a cable's own sensor wins
});
test('fmtWatts shows W below 1000 and kW above, always without the sign', () => {
  assert.equal(P.fmtWatts(450), '450 W');
  assert.equal(P.fmtWatts(-450), '450 W');
  assert.equal(P.fmtWatts(3200), '3.20 kW');
});
test('cable kind defaults follow the device type and can be set per cable', () => {
  assert.equal(P.cableKind({ type: 'solarpanel' }, {}), 'solar');
  assert.equal(P.cableKind({ type: 'houseentry' }, {}), 'grid');
  assert.equal(P.cableKind({ type: 'battery' }, {}), 'battery');
  assert.equal(P.cableKind({ type: 'fusebox' }, {}), 'load');
  assert.equal(P.cableKind({ type: 'light' }, {}), 'load');
  assert.equal(P.cableKind({ type: 'solarpanel' }, { kind: 'grid' }), 'grid');
  assert.equal(P.cableKind({ type: 'solarpanel' }, { kind: 'bogus' }), 'solar');
  assert.equal(P.cableColor({ type: 'solarpanel' }, {}), P.CABLE_KINDS.solar);
});
test('cablesOf reads the old single feeds as an air cable; ownCables makes it a real list', () => {
  const d = { id: 'a', feeds: 'b' };
  assert.deepEqual(P.cablesOf(d), [{ id: 'a-f', to: 'b', route: 'air' }]);
  assert.deepEqual(P.cablesOf({ id: 'x' }), []);
  const own = P.ownCables(d);
  assert.deepEqual(own, [{ id: 'a-f', to: 'b', route: 'air' }]);
  assert.equal(d.feeds, undefined);
  assert.equal(P.ownCables(d), own);
});
test('cable routes: air hangs, floor goes along the floor of the first, through goes down the first position', () => {
  const a = [0, 1, 0], b = [4, 2, 3];
  const air = P.cablePoints('air', a, b, 0, 0);
  assert.equal(air.length, 3); assert.ok(air[1][1] > 1.5);
  const fl = P.cablePoints('floor', a, b, 0, 0);
  assert.deepEqual(fl[1], [0, 0.05, 0]); assert.deepEqual(fl[2], [4, 0.05, 0]); assert.deepEqual(fl[3], [4, 0.05, 3]);
  const th = P.cablePoints('through', a, [4, 4, 3], 0, 3);          // the second end is on a floor 3 m above
  assert.deepEqual(th[1], [0, 0.05, 0]); assert.deepEqual(th[2], [0, 3.05, 0]); assert.deepEqual(th[4], [4, 3.05, 3]);
});
test('overview: production from inverters, not counted twice with the panels; panels when there is no inverter', () => {
  const both = P.energySummary({ i: st(3, 'kW'), p: st(1000, 'W') }, [dev('inverter', { entity: 'i' }), dev('solarpanel', { entity: 'p' })]);
  assert.equal(both.prod, 3000);
  assert.equal(P.energySummary({ p: st(1000, 'W'), q: st(500, 'W') }, [dev('solarpanel', { entity: 'p' }), dev('solarpanel', { entity: 'q' })]).prod, 1500);
  assert.equal(P.energySummary({ i: st(-300, 'W') }, [dev('inverter', { entity: 'i' })]).prod, 0);                // never negative
});
test('overview: grid plus draws, minus feeds in; consumption = production + grid', () => {
  const dr = P.energySummary({ i: st(0, 'W'), m: st(450, 'W') }, [dev('inverter', { entity: 'i' }), dev('powermeter', { entity: 'm' })]);
  assert.equal(dr.grid, 450); assert.equal(dr.load, 450);
  const fi = P.energySummary({ i: st(3000, 'W'), m: st(-1000, 'W') }, [dev('inverter', { entity: 'i' }), dev('powermeter', { entity: 'm' })]);
  assert.equal(fi.grid, -1000); assert.equal(fi.load, 2000);
  assert.equal(P.energySummary({ m: st(200, 'W') }, [dev('houseentry', { entity: 'm' })]).grid, 200);            // the house connection when there is no meter
  const none = P.energySummary({}, [dev('inverter', { entity: 'x' })]);
  assert.equal(none.prod, null); assert.equal(none.load, null); assert.equal(none.battery, null);
});
test('battery: level in %, charging / discharging from its own power sensor, sign can be turned', () => {
  const b = (extra) => dev('battery', { entity: 'lvl', ...extra });
  const s = { lvl: st(82, '%'), w: st(600, 'W') };
  assert.deepEqual(P.energySummary(s, [b({ batPower: 'w' })]).battery, { v: 82, flow: 600 });
  assert.deepEqual(P.energySummary(s, [b({ batPower: 'w', batInvert: true })]).battery, { v: 82, flow: -600 });
  assert.deepEqual(P.energySummary({ lvl: st(82, '%') }, [b({})]).battery, { v: 82, flow: null });
  assert.deepEqual(P.energySummary({ lvl: st(82, '%'), w: st('discharging') }, [b({ batPower: 'w' })]).battery, { v: 82, flow: -1 });
  assert.deepEqual(P.energySummary({ w: st(2, 'kW') }, [dev('battery', { entity: 'w' })]).battery, { v: null, flow: 2000 });        // the battery's own sensor reports watts
});
test('overview text: arrows up / down for charging / discharging, none at rest', () => {
  const t = (k) => k;
  const txt = (flow) => P.energyText({ prod: null, grid: null, load: null, battery: { v: 82, flow } }, t);
  assert.equal(txt(600).text, '🔋 82 % ↑ 600 W');
  assert.equal(txt(-450).text, '🔋 82 % ↓ 450 W');
  assert.equal(txt(5).text, '🔋 82 %');
  assert.equal(txt(null).text, '🔋 82 %');
  assert.equal(P.energyText({ prod: null, grid: null, load: null, battery: null }, t), null);
  const full = P.energyText({ prod: 3200, grid: -1000, load: 2200, battery: null }, t);
  assert.equal(full.text, '☀ 3.20 kW · ⚡ 1.00 kW · ⌂ 2.20 kW');
  assert.ok(full.title.includes('power.sum.feedIn'));
});
test('the power editor shows power devices and the meters of water, gas and heat (#207), nothing else', () => {
  for (const t of ['solarpanel', 'fusebox', 'watermeter', 'gasmeter', 'heatmeter']) assert.ok(P.showsInPowerEditor(t), t);
  for (const t of ['bridge', 'light', 'sofa']) assert.ok(!P.showsInPowerEditor(t), t);
  assert.ok(!P.POWER_TYPES.has('gasmeter'));                                   // meters have no cables
});
