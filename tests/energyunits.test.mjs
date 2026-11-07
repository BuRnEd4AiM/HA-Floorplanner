// Unit tests for energyunits.js (⚡ power per building; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const U = await import(`${process.env.STATIC_DIR || '/tmp/static'}/energyunits.js`);
const C = await import(`${process.env.STATIC_DIR || '/tmp/static'}/energycalc.js`);

const sq = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
/** two houses side by side in one plan: the main house (0..8) with its grid meter and solar inverter, the garden house (14..18) with its own
 *  meter, a wallbox on the plot between them */
function plan(withEnergy = true) {
  return {
    version: 1,
    buildings: [{ id: 'main', name: 'Haupthaus' }, { id: 'gh', name: 'Gartenhaus' }],
    energy: withEnergy ? { house: { entity: 'sensor.house' } } : undefined,
    floors: [{ id: 'eg', name: 'EG', walls: [],
      rooms: [{ id: 'wz', name: 'Wohnen', points: sq(0, 0, 8, 6), building: 'main' }, { id: 'gr', name: 'Gartenraum', points: sq(14, 0, 18, 4), building: 'gh' }],
      devices: [{ id: 'm1', type: 'powermeter', x: 1, z: 1, entity: 'sensor.grid_main' }, { id: 'i1', type: 'inverter', x: 2, z: 1, entity: 'sensor.pv' },
        { id: 'm2', type: 'powermeter', x: 15, z: 1, entity: 'sensor.grid_gh' }, { id: 'wb', type: 'wallbox', x: 11, z: 9, entity: 'sensor.wallbox' },
        { id: 'gp', type: 'solarpanel', x: 11, z: 10, entity: 'sensor.garden_pv' }] }],
  };
}
const states = { 'sensor.garden_pv': { state: '400', unit: 'W' }, 'sensor.grid_main': { state: '800', unit: 'W' }, 'sensor.pv': { state: '1500', unit: 'W' }, 'sensor.grid_gh': { state: '300', unit: 'W' },
  'sensor.house': { state: '2300', unit: 'W' } };

test('one calculation for the plan until a building has its own (and always with fewer than two buildings)', () => {
  const l = plan();
  assert.equal(U.perBuilding(l), false);
  const u = U.energyUnits(l, { id: 'h1', name: 'Zuhause' });
  assert.deepEqual(u.map((x) => [x.key, x.bid, x.name]), [['h1', null, 'Zuhause']]);
  assert.equal(u[0].layout, l);
  assert.equal(U.perBuilding({ buildings: [{ id: 'a', energy: {} }] }), false);
  assert.equal(U.perBuilding({ ...plan(), buildings: [{ id: 'main', energy: {} }, { id: 'gh' }] }), true);
});

test('per building: each counts the devices in its own rooms and has its own calculation', () => {
  const l = plan();
  U.splitEnergy(l, 'main');
  assert.equal(U.perBuilding(l), true);
  const u = U.energyUnits(l, { id: 'h1', name: 'Zuhause' });
  assert.deepEqual(u.map((x) => [x.key, x.bid, x.name]), [['h1~main', 'main', 'Haupthaus'], ['h1~gh', 'gh', 'Gartenhaus']]);
  const main = C.energyBalance(states, u[0].layout), gh = C.energyBalance(states, u[1].layout);
  assert.equal(main.grid, 800); assert.equal(main.prod, 1500); assert.equal(main.measured, 2300);   // it took the plan's house sensor
  assert.equal(gh.grid, 300); assert.equal(gh.prod, null); assert.equal(gh.load, 300);
  assert.deepEqual(gh.sources.grid.devices.map((d) => d.id), ['m2']);
  assert.deepEqual(gh.sources.solar.entities, []);                        // the solar panel in the garden counts in neither building
  assert.deepEqual(u[1].layout.floors[0].rooms.map((r) => r.id), ['gr']);
  assert.equal(C.energyBalance(states, l).prod, 1500);                     // the plan as a whole: the inverter (as before)
});

test('the units shown: the building shown, else all of them; with several houses the house name in front', () => {
  const l = plan(); U.splitEnergy(l);
  assert.deepEqual(U.shownUnits(l, 'gh', { id: 'h1' }).map((x) => x.bid), ['gh']);
  assert.deepEqual(U.shownUnits(l, null, { id: 'h1' }).map((x) => x.bid), ['main', 'gh']);
  assert.deepEqual(U.shownUnits(l, 'gone', { id: 'h1' }).map((x) => x.bid), ['main', 'gh']);
  assert.deepEqual(U.energyUnits(l, { id: 'h1', name: 'Zuhause' }, { withHouse: true }).map((x) => x.name), ['Zuhause · Haupthaus', 'Zuhause · Gartenhaus']);
  const one = plan(); assert.deepEqual(U.shownUnits(one, 'gh', { id: 'h1' }).map((x) => x.bid), [null]);   // one calculation: the whole plan whatever is shown
  const noName = plan(); noName.buildings[1].name = ''; U.splitEnergy(noName);
  assert.equal(U.energyUnits(noName, {}, { unnamed: 'Gebäude ohne Namen' })[1].name, 'Gebäude ohne Namen');
});

test('split: the chosen building takes the plan\'s calculation, the others start empty; join: one is the plan\'s again', () => {
  const l = plan();
  assert.equal(U.splitEnergy(l, 'gh'), 'gh');
  assert.equal(l.energy, undefined);
  assert.deepEqual(l.buildings.map((b) => b.energy), [{}, { house: { entity: 'sensor.house' } }]);
  l.buildings[0].energy.grid = { entity: 'sensor.grid_main' };
  const dropped = U.joinEnergy(l, 'main');
  assert.deepEqual(dropped, ['Gartenhaus']);
  assert.deepEqual(l.energy, { grid: { entity: 'sensor.grid_main' } });
  assert.equal(l.buildings.some((b) => 'energy' in b), false);
  assert.equal(U.perBuilding(l), false);
  assert.equal(U.splitEnergy({ buildings: [{ id: 'a' }] }), null);
});

test('join without a choice keeps the first building that has a setting; an empty one leaves the plan as it is', () => {
  const l = plan(false); U.splitEnergy(l);
  l.buildings[1].energy = { solar: { entities: ['sensor.pv'] } };
  U.joinEnergy(l);
  assert.deepEqual(l.energy, { solar: { entities: ['sensor.pv'] } });
  const e = plan(false); U.splitEnergy(e); U.joinEnergy(e);
  assert.equal(e.energy, undefined);
});

test('where the tab writes: the building chosen, nothing without one; the plan otherwise', () => {
  const l = plan(); U.splitEnergy(l, 'main');
  delete l.buildings[1].energy;
  const t = U.energyTarget(l, 'gh');
  assert.deepEqual(t, {}); assert.equal(l.buildings[1].energy, t);
  assert.equal(U.energyTarget(l, null), null);
  const p = plan(false);
  const pt = U.energyTarget(p, 'gh');
  assert.deepEqual(pt, {}); assert.equal(p.energy, pt);
});

test('a plan left with one building that has a calculation: that one is the plan\'s', () => {
  const l = plan(); U.splitEnergy(l, 'main');
  l.buildings[0].energy = { grid: { entity: 'sensor.grid_main' } };
  l.buildings.splice(1, 1);                                    // the garden house deleted
  assert.equal(U.perBuilding(l), false);
  assert.deepEqual(U.energyUnits(l, { id: 'h1' })[0].layout.energy, { grid: { entity: 'sensor.grid_main' } });
  const t = U.energyTarget(l, null);
  assert.deepEqual(l.energy, { grid: { entity: 'sensor.grid_main' } }); assert.equal(t, l.energy);
  assert.equal('energy' in l.buildings[0], false);
});
