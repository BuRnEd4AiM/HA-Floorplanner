// Unit tests for standby.js (🔌 Stromfresser on the page ⚡ Energie; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const S = await import(`${process.env.STATIC_DIR || '/tmp/static'}/standby.js`);
const now = new Date(2026, 10, 19, 14, 0);                 // 19 November 2026, 14:00 (local time)

test('the span: the last 14 nights, 2–5 o\'clock, the last one is last night (before 5 o\'clock the one before)', () => {
  const s = S.nightSpan(now);
  assert.equal(s.buckets.length, 42);
  assert.equal(+s.buckets[41], +new Date(2026, 10, 19, 4)); assert.equal(+s.buckets[0], +new Date(2026, 10, 6, 2));
  assert.equal(+s.start, +new Date(2026, 10, 6)); assert.equal(+s.end, +new Date(2026, 10, 19, 5));
  const early = S.nightSpan(new Date(2026, 10, 19, 3, 0));
  assert.equal(+early.buckets.at(-1), +new Date(2026, 10, 18, 4));
});

test('night load: the house from its meters (grid + sun − fed in), the devices in W, the rest; always-on devices are marked', () => {
  const { buckets } = S.nightSpan(now, 2);
  const h = (i) => +buckets[i];
  const stats = {
    'sensor.grid': buckets.map((d, i) => [+d, 0.15]),          // 150 W every night hour
    'sensor.out': [[h(0), 0.01]],                               // 10 W fed in for one hour (battery): less use
    'sensor.tv': buckets.map((d) => [+d, 0.018]),
    'sensor.fridge': buckets.map((d) => [+d, 0.03]),
    'sensor.lamp': buckets.map((d) => [+d, 0.0004]),           // 0.4 W: off
    'sensor.day': [[+new Date(2026, 10, 19, 12), 2]],           // a day hour does not count
  };
  const meters = { from: ['sensor.grid'], to: ['sensor.out'], solar: [], batIn: [], batOut: [], gas: [], water: [] };
  const devices = [{ id: 'sensor.tv', name: 'Fernseher' }, { id: 'sensor.fridge', name: 'Kühlschrank' }, { id: 'sensor.lamp', name: 'Lampe' }, { id: 'sensor.day', name: 'x' }];
  const l = S.nightLoad(stats, meters, devices, buckets);
  assert.equal(l.hours, 6); assert.equal(l.nights, 2);
  assert.ok(Math.abs(l.watts - (150 - 10 / 6)) < 1e-6);
  assert.deepEqual(l.devices.map((d) => [d.id, Math.round(d.w), d.always]), [['sensor.fridge', 30, true], ['sensor.tv', 18, false]]);
  assert.ok(Math.abs(l.rest - (l.watts - 48)) < 1e-6);
  const p = S.barParts(l);
  assert.equal(p.standby + p.always + p.rest, 100); assert.equal(p.standby, 12); assert.equal(p.always, 20);
  assert.equal(S.nightLoad({}, meters, devices, buckets).watts, null);
  assert.equal(S.barParts({ watts: null, devices: [] }), null);
});

test('money: a year of a constant draw, what switching off 5 hours a night saves; nothing without a price', () => {
  assert.ok(Math.abs(S.perYear(100, 0.3) - 262.8) < 1e-9);
  assert.ok(Math.abs(S.savedPerYear(100, 0.3) - 54.75) < 1e-9);
  assert.equal(S.perYear(100, 0), null); assert.equal(S.savedPerYear(100, undefined), null);
});

test('switching off: only devices with a switch that are not always on; the routine off at 1:00, on at 6:00 every day', () => {
  const load = { devices: [{ id: 'sensor.tv', w: 18, always: false }, { id: 'sensor.fridge', w: 30, always: true }, { id: 'sensor.pc', w: 9, always: false }] };
  const plugs = { 'sensor.tv': 'switch.tv', 'sensor.fridge': 'switch.fridge' };
  assert.deepEqual(S.switchable(load, plugs).map((d) => d.plug), ['switch.tv']);
  const f = S.nightFlow(['switch.tv', 'switch.tv', ''], 'Nachts aus');
  assert.equal(f.id, null); assert.equal(f.name, 'Nachts aus');
  assert.deepEqual(f.lanes[0].blocks, [{ k: 'time', at: '01:00', days: [] }, { k: 'switch', ents: ['switch.tv'], same: false, do: 'off' }]);
  assert.equal(f.lanes[1].blocks[0].at, '06:00'); assert.equal(f.lanes[1].blocks[1].do, 'on');
  assert.equal(S.nightFlow([], 'x'), null);
  assert.ok(S.alwaysOn({ name: 'FRITZ!Box 7590' })); assert.ok(!S.alwaysOn({ name: 'Fernseher', id: 'sensor.tv_energy' }));
});
