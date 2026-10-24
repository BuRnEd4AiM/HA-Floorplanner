// Unit tests for batterylevels.js (the card "🔋 Ladestand" of the page ⚡ Energie, #515; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const B = await import(`${process.env.STATIC_DIR || '/tmp/static'}/batterylevels.js`);
const { HOUSE_COLORS } = await import(`${process.env.STATIC_DIR || '/tmp/static'}/energyhistory.js`);
const states = { 'sensor.soc': { state: '82', unit: '%', name: 'Hausbatterie SoC' }, 'sensor.garage': { state: '40', unit: '%', name: 'Garage' },
  'sensor.power': { state: '600', unit: 'W' }, 'sensor.ha_soc': { state: '55', unit: '%', name: 'Speicher' } };
const lay = (devices, energy) => ({ floors: [{ devices }], energy });
const bat = (id, entity, name) => ({ id, type: 'battery', entity, name });

test('the batteries of a house: the charge of ⚡ Rechnung, every battery of the plan with a charge in %, the energy dashboard', () => {
  const l = lay([bat('a', 'sensor.soc', 'Hausbatterie'), bat('b', 'sensor.power', 'Wechselrichter'), bat('c', 'sensor.garage', ''), { id: 'x', type: 'light', entity: 'sensor.soc' }]);
  assert.deepEqual(B.houseBatteries(l, states), [{ id: 'sensor.soc', name: 'Hausbatterie' }, { id: 'sensor.garage', name: 'Garage' }]);   // a power sensor is no charge
  const set = lay([bat('a', 'sensor.soc', 'Hausbatterie')], { battery: { level: 'sensor.ha_soc' } });
  assert.deepEqual(B.houseBatteries(set, states).map((b) => b.id), ['sensor.ha_soc', 'sensor.soc']);                       // ⚡ Rechnung first
  assert.deepEqual(B.houseBatteries(lay([]), states, ['sensor.ha_soc', 'sensor.ha_soc', 'bad id']), [{ id: 'sensor.ha_soc', name: 'Speicher' }]);
  assert.deepEqual(B.houseBatteries(null, {}), []);
  const many = lay(Array.from({ length: 20 }, (_, i) => bat(`b${i}`, `sensor.s${i}`, `B${i}`)));
  const st = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`sensor.s${i}`, { state: '1', unit: '%' }]));
  assert.equal(B.houseBatteries(many, st).length, B.MAX_BATTERIES);
});

test('the card: one house with a colour per battery; several houses in the colour of the house, the second battery dashed', () => {
  const main = lay([bat('a', 'sensor.soc', 'Hausbatterie'), bat('c', 'sensor.garage', 'Garage')]);
  const one = B.cardBatteries([{ id: 'main', name: 'Demo-Haus', layout: main }], states);
  assert.deepEqual(one.map((b) => [b.name, b.color, b.dash]), [['Hausbatterie', HOUSE_COLORS[0], ''], ['Garage', HOUSE_COLORS[1], '']]);
  const two = B.cardBatteries([{ id: 'main', name: 'Demo-Haus', layout: main, ha: true }, { id: 'nb', name: 'Nachbar', layout: lay([]), ha: true }], states, ['sensor.ha_soc']);
  assert.deepEqual(two.map((b) => [b.id, b.house, b.name, b.color, !!b.dash]), [
    ['sensor.soc', 'main', 'Demo-Haus · Hausbatterie', HOUSE_COLORS[0], false], ['sensor.garage', 'main', 'Demo-Haus · Garage', HOUSE_COLORS[0], true],
    ['sensor.ha_soc', 'main', 'Demo-Haus · Speicher', HOUSE_COLORS[0], true]]);                // the dashboard's battery: only the first house that counts with it
  const shared = B.cardBatteries([{ id: 'a', name: 'A', layout: main }, { id: 'b', name: 'B', layout: main }], states);
  assert.deepEqual(shared.map((b) => b.house), ['a', 'a']);                                  // the same sensor in two houses: once
  const own = B.cardBatteries([{ id: 'a', name: 'A', layout: lay([]) }, { id: 'b', name: 'B', layout: lay([]), ha: true }], states, ['sensor.ha_soc']);
  assert.deepEqual(own.map((b) => [b.house, b.color]), [['b', HOUSE_COLORS[1]]]);
});

test('how fine: a day in 5 minutes (an old day by hours), a week and a month by hours, a year by days', () => {
  const now = new Date(2026, 9, 21, 14, 30), day = (n) => new Date(2026, 9, 21 - n);
  assert.equal(B.levelPeriod('day', day(0), now), '5minute');
  assert.equal(B.levelPeriod('day', day(8), now), '5minute');
  assert.equal(B.levelPeriod('day', day(12), now), 'hour');
  assert.equal(B.levelPeriod('week', day(2), now), 'hour');
  assert.equal(B.levelPeriod('month', day(20), now), 'hour');
  assert.equal(B.levelPeriod('year', day(200), now), 'day');
  assert.equal(B.periodMs('5minute'), 300000); assert.equal(B.periodMs('day'), 86400000); assert.equal(B.periodMs('hour'), 3600000);
});

test('the line from the statistics: a point in the middle of each row, cut to 0…100, only in the period and before now', () => {
  const a = new Date(2026, 9, 21), e = new Date(2026, 9, 22), now = new Date(2026, 9, 21, 1, 0), m5 = 300000;
  const data = { stats: { 'sensor.soc': [[+a - m5, 50, 50, 50], [+a, 40, 38, 42], [+a + m5, 120, 99, 130], [+a + 2 * m5, 'x', 1, 1], [+now, 30, 30, 30]] } };
  const pts = B.levelPoints(data, 'sensor.soc', a, e, '5minute', now);
  assert.deepEqual(pts, [{ t: +a + m5 / 2, v: 40, lo: 38, hi: 42 }, { t: +a + 1.5 * m5, v: 100, lo: 99, hi: 100 }, { t: +now, v: 30, lo: 30, hi: 30 }]);   // the row at now: until now
  assert.deepEqual(B.levelPoints({ stats: { 'sensor.soc': [[+a, 40]] } }, 'sensor.soc', a, e, 'hour', now), [{ t: +a + 1800000, v: 40, lo: 40, hi: 40 }]);   // without min, max
  assert.deepEqual(B.levelPoints(null, 'sensor.soc', a, e, 'hour', now), []);
});

test('the line from the history (a sensor without statistics): the value at the start, each change, the last one until now', () => {
  const a = new Date(2026, 9, 21), e = new Date(2026, 9, 22), now = new Date(2026, 9, 21, 12), h = 3600000;
  const data = { stats: {}, hist: { 'sensor.soc': [[+a + 3 * h, 60], [+a - 2 * h, 90], [+a - h, 80], [+a + 20 * h, 10]] } };
  assert.deepEqual(B.levelPoints(data, 'sensor.soc', a, e, '5minute', now).map((p) => [p.t, p.v]), [[+a, 80], [+a + 3 * h, 60], [+now, 60]]);
  assert.deepEqual(B.levelPoints({ hist: { 'sensor.soc': [[+a - h, 70]] } }, 'sensor.soc', a, e, 'hour', now).map((p) => [p.t, p.v]), [[+a, 70], [+now, 70]]);
});

test('the charge now as the last point, only in the period and after the last row', () => {
  const a = new Date(2026, 9, 21), e = new Date(2026, 9, 22), now = new Date(2026, 9, 21, 12);
  const pts = [{ t: +a, v: 50, lo: 50, hi: 50 }];
  assert.deepEqual(B.withLive(pts, 82, now, a, e).at(-1), { t: +now, v: 82, lo: 82, hi: 82 });
  assert.equal(B.withLive(pts, null, now, a, e), pts);
  assert.equal(B.withLive(pts, 82, new Date(2026, 9, 23), a, e), pts);                       // a past day
  assert.equal(B.withLive([{ t: +now, v: 1 }], 82, now, a, e).length, 1);
  assert.equal(B.withLive([], 140, now, a, e)[0].v, 100);
});

test('gaps break the line; the lowest and highest charge with their time', () => {
  const pts = [{ t: 0, v: 50, lo: 45, hi: 50 }, { t: 10, v: 20, lo: 15, hi: 25 }, { t: 100, v: 90, lo: 90, hi: 95 }];
  assert.deepEqual(B.splitGaps(pts, 30).map((s) => s.length), [2, 1]);
  assert.deepEqual(B.splitGaps([], 30), []);
  assert.deepEqual(B.levelSummary(pts), { min: 15, minAt: 10, max: 95, maxAt: 100, last: 90 });
  assert.equal(B.levelSummary([]), null);
});

test('the choice of the device: together or one chart each, batteries left out and shown again', () => {
  assert.deepEqual(B.cleanPrefs(null), { mode: 'together', hidden: [] });
  assert.deepEqual(B.cleanPrefs({ mode: 'single', hidden: ['sensor.a', 'sensor.a', 'bad id', 3] }), { mode: 'single', hidden: ['sensor.a'] });
  assert.equal(B.cleanPrefs({ mode: 'pie' }).mode, 'together');
  let p = B.toggleBattery({ mode: 'single' }, 'sensor.a');
  assert.deepEqual(p, { mode: 'single', hidden: ['sensor.a'] });
  const list = [{ id: 'sensor.a' }, { id: 'sensor.b' }];
  assert.deepEqual(B.shownBatteries(list, p), [{ id: 'sensor.b' }]);
  p = B.toggleBattery(p, 'sensor.a');
  assert.deepEqual(B.shownBatteries(list, p), list);
});
