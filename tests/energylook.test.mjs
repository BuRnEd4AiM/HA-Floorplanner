// Unit tests for energylook.js (the look of the tab "⚡ Rechnung", 5.6.0: the parts with their symbol and colour, what each is read
// from now and its value; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const L = await import(`${dir}/energylook.js`);
const E = await import(`${dir}/energycalc.js`);

const st = (state, unit = 'W') => ({ state: String(state), unit });
const dev = (type, extra = {}) => ({ id: type + (extra.entity || ''), type, x: 0, z: 0, ...extra });
const lay = (devices, energy, rooms = []) => ({ floors: [{ id: 'f', name: 'EG', devices, rooms }], ...(energy ? { energy } : {}) });
const t = (k, p) => (p ? `${k}:${Object.values(p).join(',')}` : k);

test('the parts in the order of the window, grid, solar, battery and house in the colours of the power picture', () => {
  assert.deepEqual(L.PART_KEYS, ['grid', 'solar', 'battery', 'house', 'rooms', 'meters']);
  assert.equal(L.partOf('solar').color, '#ff9800');
  assert.equal(L.partOf('grid').color, '#488fc2');
  assert.equal(L.partOf('nothing'), null);
});

test('a line of the calculation opens the part it comes from; the extras none', () => {
  const bal = E.energyBalance({ g: st(-300), i: st(1000), b: st(200), r: st(50) },
    lay([dev('powermeter', { entity: 'g' }), dev('inverter', { entity: 'i' }), dev('battery', { batPower: 'b' })], { rooms: { r1: ['r'] } }, [{ id: 'r1', name: 'Küche', points: [] }]));
  const rows = E.balanceRows(bal, t).map((r) => [r.key, L.rowPart(r.key)]);
  assert.deepEqual(rows, [['energy.r.prod', 'solar'], ['energy.r.feedIn', 'grid'], ['energy.r.charge', 'battery'], ['energy.r.calc', 'house'],
    ['room', 'rooms'], ['energy.r.rest', 'rooms'], ['energy.r.self', null], ['energy.r.autarky', null]]);
});

test('the state of every part: from the plan, chosen here, missing, none, no value', () => {
  const plan = E.energyBalance({ g: st(620), i: st(2800) }, lay([dev('powermeter', { entity: 'g' }), dev('inverter', { entity: 'i' })]));
  const s = L.partStates(plan, 19, false);
  assert.deepEqual([s.grid.state, s.grid.tone], ['plan', 'plan']);
  assert.deepEqual(s.grid.now, { w: 620, dir: 1 });
  assert.deepEqual([s.solar.state, s.solar.now.w], ['plan', 2800]);
  assert.deepEqual([s.battery.state, s.battery.tone, s.battery.now], ['off', 'off', null]);   // no battery: fine
  assert.deepEqual([s.house.state, s.house.now.w], ['calc', 3420]);
  assert.deepEqual([s.rooms.n, s.rooms.of, s.rooms.tone], [0, 19, 'off']);
  assert.deepEqual([s.meters.state, s.meters.tone], ['metersHa', 'plan']);
  assert.equal(L.partStates(plan, 0, true).meters.state, 'metersOwn');

  const none = L.partStates(E.energyBalance({}, lay([])), 0);
  assert.deepEqual([none.grid.state, none.grid.tone], ['none', 'warn']);                         // the grid is needed
  assert.deepEqual([none.solar.state, none.house.tone], ['off', 'off']);

  const set = L.partStates(E.energyBalance({ n: st(-400), h: st('unavailable') }, lay([], { grid: { entity: 'n' }, house: { entity: 'h' } })), 0);
  assert.deepEqual([set.grid.state, set.grid.tone, set.grid.now.dir], ['set', 'ok', -1]);        // chosen here, feeding in
  assert.deepEqual([set.house.state, set.house.tone], ['noValue', 'warn']);                     // its own sensor gives no number
  const quiet = L.partStates(E.energyBalance({}, lay([], { grid: { entity: 'n' } })), 0);
  assert.deepEqual([quiet.grid.state, quiet.grid.tone], ['noValue', 'warn']);
});

test('the value now as a text: the grid with its direction, the battery with its level', () => {
  assert.equal(L.nowText('grid', { w: 620, dir: 1 }, t), '620 W energy.means.draw');
  assert.equal(L.nowText('grid', { w: -1500, dir: -1 }, t), '1,50 kW energy.means.feedIn');
  assert.equal(L.nowText('grid', { w: 5, dir: 0 }, t), '5 W');
  assert.equal(L.nowText('battery', { w: 600, dir: 1, level: 81.6 }, t), '82 % · energy.means.charge 600 W');
  assert.equal(L.nowText('battery', { w: 0, dir: 0, level: 50 }, t), '50 % · energy.st.idle');
  assert.equal(L.nowText('battery', { w: null, dir: null, level: 40 }, t), '40 %');
  assert.equal(L.nowText('solar', { w: 2800, dir: null }, t), '2,80 kW');
  assert.equal(L.nowText('house', null, t), '');
});
