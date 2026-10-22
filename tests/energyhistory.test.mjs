// Unit tests for energyhistory.js (the page ⚡ Energie of the tab bar, #479; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const E = await import(`${process.env.STATIC_DIR || '/tmp/static'}/energyhistory.js`);
const now = new Date(2026, 9, 21, 14, 30);               // Wednesday, 21 October 2026, 14:30 (local time)

test('periods: today by hours, the week from Monday, the month by days, the year by months; offset goes back', () => {
  const d = E.periodRange('day', 0, now);
  assert.equal(+d.start, +new Date(2026, 9, 21)); assert.equal(+d.end, +new Date(2026, 9, 22));
  assert.equal(d.period, 'hour'); assert.equal(d.buckets.length, 24); assert.equal(d.buckets[14].getHours(), 14);
  assert.equal(+E.periodRange('day', -1, now).start, +new Date(2026, 9, 20));
  const w = E.periodRange('week', 0, now);
  assert.equal(+w.start, +new Date(2026, 9, 19)); assert.equal(w.buckets.length, 7); assert.equal(w.period, 'day');   // Monday 19 October
  assert.equal(+E.periodRange('week', -1, now).start, +new Date(2026, 9, 12));
  const m = E.periodRange('month', 0, now);
  assert.equal(m.buckets.length, 31); assert.equal(+m.end, +new Date(2026, 10, 1));
  assert.equal(E.periodRange('month', -8, now).buckets.length, 28);          // February 2026
  const y = E.periodRange('year', 0, now);
  assert.equal(y.period, 'month'); assert.equal(y.buckets.length, 12); assert.equal(+y.end, +new Date(2027, 0, 1));
  assert.equal(E.periodRange('nonsense', 0, now).kind, 'day');
});
test('a date for Home Assistant carries the browser offset', () => {
  const s = E.isoLocal(new Date(2026, 9, 21));
  assert.match(s, /^2026-10-21T00:00:00[+-]\d{2}:\d{2}$/);
  assert.equal(+new Date(s), +new Date(2026, 9, 21));
});
test('meters: the own ones of a house win, else the energy dashboard; together every meter once', () => {
  const ha = { from: ['sensor.bezug'], to: ['sensor.einspeisung'], solar: ['sensor.pv'], gas: ['bad id'] };
  assert.deepEqual(E.houseMeters({}, ha), { meters: { from: ['sensor.bezug'], to: ['sensor.einspeisung'], solar: ['sensor.pv'], batIn: [], batOut: [], gas: [], water: [] }, own: false });
  const own = E.houseMeters({ meters: { from: ['sensor.ferien_bezug', 'sensor.ferien_bezug'] } }, ha);
  assert.equal(own.own, true); assert.deepEqual(own.meters.from, ['sensor.ferien_bezug']); assert.deepEqual(own.meters.solar, []);
  const both = E.mergeMeters([E.houseMeters({}, ha).meters, own.meters, E.houseMeters({}, ha).meters]);
  assert.deepEqual(both.from, ['sensor.bezug', 'sensor.ferien_bezug']);
  assert.deepEqual(E.meterIds(both, [{ id: 'sensor.wm' }, { id: 'sensor.pv' }]), ['sensor.bezug', 'sensor.ferien_bezug', 'sensor.einspeisung', 'sensor.pv', 'sensor.wm']);
  assert.equal(E.hasMeters(E.cleanMeters(null)), false);
});
test('bars: changes go into their hour, the use is grid + sun + battery out − fed in − battery in, the own part what did not come from the grid', () => {
  const d = E.periodRange('day', 0, now), h = (n) => +d.buckets[n];
  const stats = { 'sensor.bezug': [[h(0), 0.4], [h(13), 0.1], [h(13) + 1800000, null], [+d.end, 9]], 'sensor.pv': [[h(13), 1.5]], 'sensor.einspeisung': [[h(13), 0.6]],
    'sensor.bat_in': [[h(13), 0.2]], 'sensor.bat_out': [[h(0), 0.1]] };
  const meters = E.cleanMeters({ from: ['sensor.bezug'], to: ['sensor.einspeisung'], solar: ['sensor.pv'], batIn: ['sensor.bat_in'], batOut: ['sensor.bat_out'] });
  const rows = E.bars(stats, meters, d.buckets, d.end);
  assert.equal(rows.length, 24);
  assert.ok(Math.abs(rows[0].use - 0.5) < 1e-9 && Math.abs(rows[0].own - 0.1) < 1e-9);       // night: grid 0.4 + battery 0.1
  assert.ok(Math.abs(rows[13].use - 0.8) < 1e-9 && Math.abs(rows[13].own - 0.7) < 1e-9);     // day: 0.1 + 1.5 − 0.6 − 0.2
  assert.equal(rows[23].from, 0);                                                            // the row after the end is left out
  const t = E.totals(rows);
  assert.ok(Math.abs(t.use - 1.3) < 1e-9); assert.equal(t.autarky, 62); assert.equal(t.selfUse, 60);
  assert.ok(Math.abs(E.totals(rows, 1).use - 0.5) < 1e-9);                                  // only the first hour: "so far"
  assert.equal(E.totals([]).autarky, null);
});
test('cost, price and the biggest devices', () => {
  assert.deepEqual(E.cost({ from: 10, to: 5 }, { buy: 0.3, sell: 0.08 }), { buy: 3, sell: 0.4, net: 2.6 });
  assert.equal(E.cost({ from: 10, to: 5 }, null), null);
  assert.deepEqual(E.priceOf({ price: { buy: '0.35' } }, { buy: 0.3, sell: 0.08 }), { buy: 0.35, sell: 0 });
  assert.deepEqual(E.priceOf({}, { buy: 0.3, sell: 0.08 }), { buy: 0.3, sell: 0.08 });
  assert.equal(E.priceOf({}, {}), null);
  const d = E.periodRange('day', 0, now);
  const top = E.topDevices({ 'sensor.wm': [[+d.start, 0.7]], 'sensor.tv': [[+d.start, 1.2], [+d.end, 5]], 'sensor.off': [[+d.start, 0]] },
    [{ id: 'sensor.wm', name: 'Waschmaschine' }, { id: 'sensor.tv', name: 'TV' }, { id: 'sensor.off', name: 'Aus' }], d.start, d.end);
  assert.deepEqual(top.map((x) => [x.name, x.kwh]), [['TV', 1.2], ['Waschmaschine', 0.7]]);
});
test('so far, the scale and numbers', () => {
  const d = E.periodRange('day', 0, now);
  assert.equal(E.elapsed(d.buckets, now), 15);                                   // 0:00 … 14:00 have begun
  assert.equal(E.elapsed(E.periodRange('day', -1, now).buckets, now), 24);
  assert.equal(E.barMax([]), 0.1);
  assert.equal(E.fmtAmount(6.789, 'en'), '6.79'); assert.equal(E.fmtAmount(14.24, 'en'), '14.2'); assert.equal(E.fmtAmount(123.4, 'en'), '123');
  assert.equal(E.fmtAmount(null), '–');
  const both = E.withPrevious('week', 0, now);
  assert.equal(+both.prev.end, +both.cur.start);
});

test('⚖ Vergleichen (#495): each house with its own meters, the energy dashboard only once, one scale', () => {
  const ha = { from: ['sensor.ha_from'] };
  const list = E.compareMeters([
    { id: 'a', name: 'Haus A', energy: {} },                                         // no own meters: Home Assistant's
    { id: 'b', name: 'Haus B', energy: { meters: { from: ['sensor.b_from'] }, price: { buy: 0.4 } } },
    { id: 'c', name: 'Haus C', energy: {} },                                         // none: the dashboard's are taken already
  ], ha, { buy: 0.3 });
  assert.deepEqual(list.map((h) => h.meters.from), [['sensor.ha_from'], ['sensor.b_from'], []]);
  assert.deepEqual(list.map((h) => h.color), E.HOUSE_COLORS.slice(0, 3));
  assert.deepEqual(list.map((h) => h.price?.buy ?? null), [0.3, 0.4, 0.3]);
  const p = E.periodRange('day', 0, now), at = (h) => +p.buckets[h];
  const stats = { 'sensor.ha_from': [[at(8), 1.5], [at(9), 0.5]], 'sensor.b_from': [[at(8), 0.25]] };
  const c = E.compareHouses(list, stats, p.buckets, p.end);
  assert.deepEqual(c.map((h) => Math.round(h.total.use * 100) / 100), [2, 0.25, 0]);
  assert.equal(c[0].rows[8].use, 1.5); assert.equal(c[2].empty, true); assert.equal(c[1].empty, false);
  assert.equal(Math.round(c[1].cost.net * 100) / 100, 0.1);
  assert.equal(E.compareMax(c), 1.5); assert.equal(E.compareMax([]), 0.1);
});
