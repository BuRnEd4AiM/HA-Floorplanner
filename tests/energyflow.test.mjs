// Unit tests for energyflow.js (energy flow as a picture, #420; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const F = await import(`${dir}/energyflow.js`);
const t = (k, p = {}) => k + (Object.keys(p).length ? JSON.stringify(p) : '');
const bal = (o) => ({ prod: null, grid: null, imp: null, exp: null, load: null, battery: null, ...o });
const lines = (fl) => Object.fromEntries(fl.lines.map((l) => [`${l.from}>${l.to}`, l.w]));

test('the demo: sun 3.2 kW, 450 W from the grid, battery charging 600 W, house 3.05 kW', () => {
  const fl = F.energyFlows(bal({ prod: 3200, grid: 450, imp: 450, exp: 0, load: 3050, battery: { v: 82, flow: 600, dir: 1 } }));
  assert.deepEqual(Object.keys(fl.nodes).sort(), ['battery', 'grid', 'home', 'solar']);
  assert.deepEqual(lines(fl), { 'solar>home': 2600, 'solar>battery': 600, 'solar>grid': 0, 'grid>home': 450, 'grid>battery': 0, 'battery>home': 0, 'battery>grid': 0 });
  const into = (to) => fl.lines.filter((l) => l.to === to).reduce((s, l) => s + l.w, 0);
  assert.equal(into('home'), 3050, 'what reaches the house is what it uses');
  assert.deepEqual(fl.lines.filter((l) => l.on).map((l) => `${l.from}>${l.to}`), ['solar>home', 'solar>battery', 'grid>home']);
});

test('feeding in: the sun covers the house, charges the battery and the rest goes into the grid', () => {
  const fl = F.energyFlows(bal({ prod: 5000, grid: -1800, imp: 0, exp: 1800, load: 2200, battery: { v: 50, flow: 1000, dir: 1 } }));
  assert.equal(lines(fl)['solar>grid'], 1800);
  assert.equal(lines(fl)['solar>battery'], 1000);
  assert.equal(lines(fl)['solar>home'], 2200);
  assert.equal(lines(fl)['grid>home'], 0);
});

test('at night: the battery gives to the house, the grid the rest; the battery charged from the grid', () => {
  const night = F.energyFlows(bal({ prod: 0, grid: 300, imp: 300, exp: 0, load: 1100, battery: { v: 40, flow: -800, dir: -1 } }));
  assert.equal(lines(night)['battery>home'], 800);
  assert.equal(lines(night)['grid>home'], 300);
  const cheap = F.energyFlows(bal({ prod: 0, grid: 2500, imp: 2500, exp: 0, load: 500, battery: { v: 20, flow: 2000, dir: 1 } }));
  assert.equal(lines(cheap)['grid>battery'], 2000);
  assert.equal(lines(cheap)['grid>home'], 500);
  const sell = F.energyFlows(bal({ prod: 0, grid: -1000, imp: 0, exp: 1000, load: 400, battery: { v: 90, flow: -1400, dir: -1 } }));
  assert.equal(lines(sell)['battery>grid'], 1000);
  assert.equal(lines(sell)['battery>home'], 400);
});

test('only the circles there are: no sun without production, no battery without one; nothing without production and grid', () => {
  const fl = F.energyFlows(bal({ grid: 700, imp: 700, exp: 0, load: 700 }));
  assert.deepEqual(Object.keys(fl.nodes).sort(), ['grid', 'home']);
  assert.deepEqual(fl.lines.map((l) => `${l.from}>${l.to}`), ['grid>home']);
  assert.equal(F.energyFlows(bal({})), null);
  assert.equal(F.energyFlows(null), null);
  const solarOnly = F.energyFlows(bal({ prod: 400, load: 400 }));
  assert.deepEqual(Object.keys(solarOnly.nodes).sort(), ['grid', 'home', 'solar']);
  assert.equal(lines(solarOnly)['solar>home'], 400);
});

test('dots run faster with more power', () => {
  assert.ok(F.dotSeconds(100) > F.dotSeconds(1000));
  assert.ok(F.dotSeconds(1000) > F.dotSeconds(5000));
  assert.ok(F.dotSeconds(1e9) >= 0.5 && F.dotSeconds(0) <= 3);
});

test('the texts of the circles', () => {
  const fl = F.energyFlows(bal({ prod: 3200, grid: 450, imp: 450, exp: 0, load: 3050, battery: { v: 82, flow: 600, dir: 1 } }));
  const tx = F.flowTexts(fl, t);
  assert.deepEqual(tx.solar, { value: '3.20 kW', sub: 'flow.solar' });
  assert.deepEqual(tx.grid, { value: '450 W', sub: 'flow.fromGrid' });
  assert.deepEqual(tx.home, { value: '3.05 kW', sub: 'flow.home' });
  assert.deepEqual(tx.battery, { value: '82 %', sub: 'flow.charging{"w":"600 W"}' });
  const out = F.flowTexts(F.energyFlows(bal({ prod: 2000, grid: -900, imp: 0, exp: 900, load: 1100, battery: { v: null, flow: -50, dir: -1 } })), t);
  assert.equal(out.grid.sub, 'flow.toGrid');
  assert.equal(out.battery.value, '50 W');
  assert.equal(out.battery.sub, 'flow.discharging{"w":"50 W"}');
  const idle = F.flowTexts(F.energyFlows(bal({ grid: 5, imp: 5, exp: 0, load: null, battery: { v: 100, flow: 0, dir: 0 } })), t);
  assert.equal(idle.grid.sub, 'flow.grid');
  assert.equal(idle.home.value, '–');
  assert.equal(idle.battery.sub, 'flow.battery');
});
