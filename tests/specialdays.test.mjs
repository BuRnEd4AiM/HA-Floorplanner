// Unit tests for specialdays.js (📅 Besondere Tage for the routines, the owner 2026-11-01: "an Halloween, an Heiligabend soll zum
// Beispiel der Rollladen nicht ganz hochfahren"; run like offline.test.mjs). tests/test_specialdays.py checks that the add-on agrees.
import test from 'node:test';
import assert from 'node:assert/strict';

const S = await import(`${process.env.STATIC_DIR || '/tmp/static'}/specialdays.js`);
const t = (k, p = {}) => `${k}${Object.keys(p).length ? JSON.stringify(p) : ''}`;
const D = (y, m, d) => new Date(y, m - 1, d);

test('days are checked: every kind with what it needs', () => {
  assert.deepEqual(S.cleanDay({ id: 'd_xmas', kind: 'date', name: ' Heiligabend ', icon: '🎄', md: '12-24' }), { id: 'd_xmas', kind: 'date', name: 'Heiligabend', icon: '🎄', md: '12-24' });
  assert.equal(S.cleanDay({ id: 'd_x', kind: 'date', md: '02-30' }), null);
  assert.equal(S.cleanDay({ id: 'd_x', kind: 'date', md: '02-29', to: '03-01' }).to, '03-01');
  assert.equal(S.cleanDay({ id: 'd_x', kind: 'once', from: '2026-12-21', to: '2026-12-01' }).to, '2026-12-21');
  assert.equal(S.cleanDay({ id: 'd_x', kind: 'once', from: '2026-01-01', to: '2027-01-01' }).to, '2027-01-01', 'a year is fine');
  assert.equal(S.cleanDay({ id: 'd_x', kind: 'once', from: '2026-01-01', to: '2027-01-03' }).to, '2026-01-01', 'longer is not');
  assert.equal(S.cleanDay({ id: 'd_x', kind: 'easter', off: 1.5 }).off, 0);
  assert.equal(S.cleanDay({ id: 'd_x', kind: 'holidays', region: 'BW' }).region, 'BW');
  assert.equal(S.cleanDay({ id: 'd_x', kind: 'calendar', ent: 'sensor.x' }), null);
  assert.equal(S.cleanDay({ id: 'x', kind: 'date', md: '01-01' }), null);
  assert.equal(S.cleanDays([{ id: 'd_a', kind: 'date', md: '01-01' }, { id: 'd_a', kind: 'date', md: '01-02' }]).length, 1);
  assert.deepEqual(S.cleanIds(['d_a', 'd_a', 'x', 3]), ['d_a']);
  assert.match(S.newDayId(['d_000000'], () => 0.5), /^d_[a-z0-9]{6}$/);
});

test('Easter, the holidays of Baden-Württemberg and of the other states', () => {
  assert.equal(S.ymd(S.easter(2026)), '2026-04-05'); assert.equal(S.ymd(S.easter(2027)), '2027-03-28');
  assert.deepEqual(S.holidays('BW', 2026).map((h) => h.date.slice(5)), ['01-01', '01-06', '04-03', '04-06', '05-01', '05-14', '05-25', '06-04', '10-03', '11-01', '12-25', '12-26']);
  assert.deepEqual(S.holidays('SN', 2026).find((h) => h.key === 'repentance'), { date: '2026-11-18', key: 'repentance' });
  assert.equal(S.holidays('DE', 2026).length, 9);
  for (const r of S.REGIONS) assert.ok(r === 'DE' || S.REGION_NAMES[r], r);
});

test('which special day a date is (also over the new year, a calendar while it is on)', () => {
  const days = S.cleanDays([{ id: 'd_xmas', kind: 'date', md: '12-24' }, { id: 'd_wn', kind: 'date', md: '12-27', to: '01-06' },
    { id: 'd_ros', kind: 'easter', off: -48 }, { id: 'd_ft', kind: 'holidays', region: 'BW' }, { id: 'd_cal', kind: 'calendar', ent: 'calendar.urlaub' }]);
  assert.deepEqual(S.which(days, D(2026, 12, 24)), ['d_xmas']);
  assert.deepEqual(S.which(days, D(2027, 1, 6)), ['d_wn', 'd_ft']);
  assert.deepEqual(S.which(days, D(2026, 2, 16)), ['d_ros']);
  assert.deepEqual(S.which(days, D(2026, 8, 3), { 'calendar.urlaub': { state: 'on' } }), ['d_cal']);
  assert.equal(S.isSpecial(days, ['d_ft'], D(2026, 12, 24)), false);
  assert.equal(S.isSpecial(days, [], D(2026, 12, 24)), true);
});

test('when a day comes next', () => {
  const today = D(2026, 11, 1);
  assert.equal(S.ymd(S.nextOf({ kind: 'date', md: '12-24' }, today).date), '2026-12-24');
  assert.equal(S.ymd(S.nextOf({ kind: 'date', md: '10-31' }, today).date), '2027-10-31');
  assert.deepEqual([S.ymd(S.nextOf({ kind: 'holidays', region: 'BW' }, today).date), S.nextOf({ kind: 'holidays', region: 'BW' }, today).key], ['2026-11-01', 'allsaints']);
  assert.equal(S.ymd(S.nextOf({ kind: 'holidays', region: 'DE' }, today).date), '2026-12-25');
  assert.equal(S.nextOf({ kind: 'once', from: '2026-10-01', to: '2026-10-03' }, today), null);
  assert.equal(S.ymd(S.nextOf({ kind: 'once', from: '2026-10-30', to: '2026-11-03' }, today).date), '2026-11-01');
  assert.equal(S.nextOf({ kind: 'calendar', ent: 'calendar.x' }, today), null);
  assert.equal(S.ymd(S.nextOf({ kind: 'easter', off: -48 }, today).date), '2027-02-08');
});

test('in words', () => {
  assert.equal(S.kindText({ kind: 'holidays', region: 'BW' }, t, 'de'), 'sd.holidaysOf{"region":"Baden-Württemberg"}');
  assert.equal(S.kindText({ kind: 'easter', off: -48 }, t, 'de'), 'sd.beforeEaster{"n":48}');
  assert.match(S.kindText({ kind: 'date', md: '12-24', to: '12-26' }, t, 'de'), /24\. Dez\.? – 26\. Dez\.? · sd\.everyYear/);
  assert.equal(S.dayName({ kind: 'calendar', ent: 'calendar.urlaub', name: '' }, t, 'de', () => 'Urlaub'), 'sd.calendarOf{"name":"Urlaub"}');
  assert.equal(S.dayIcon({ kind: 'easter' }), '🐣');
  const days = [{ id: 'd_a', name: 'Heiligabend', kind: 'date', md: '12-24' }, { id: 'd_b', name: 'Halloween', kind: 'date', md: '10-31' }, { id: 'd_c', name: 'Silvester', kind: 'date', md: '12-31' }];
  assert.equal(S.idsText(days, [], t, 'de'), 'sd.anyDay');
  assert.equal(S.idsText(days, ['d_a', 'd_b'], t, 'de'), 'Heiligabend, Halloween');
  assert.equal(S.idsText(days, ['d_a', 'd_b', 'd_c'], t, 'de'), 'Heiligabend, Halloween +1');
  assert.equal(S.idsText(days, ['d_gone'], t, 'de'), 'sd.gone');
});

test('ready days: each one a valid day once it has an id (the calendar after one is picked)', () => {
  const p = S.presets(D(2026, 11, 1));
  assert.ok(p.length >= 8);
  for (const x of p) {
    const day = S.cleanDay({ id: 'd_test', ...x.day, ...(x.day.kind === 'calendar' ? { ent: 'calendar.x' } : {}) });
    assert.ok(day, x.key);
  }
  assert.deepEqual(p.find((x) => x.key === 'tomorrow').day, { kind: 'once', from: '2026-11-02', to: '2026-11-02' });
});

test('"An besonderen Tagen anders": a lane becomes two, the copy on the special days', () => {
  const lanes = [{ id: 'l1', blocks: [{ k: 'time', at: '07:00', days: [] }, { k: 'cover', ents: ['cover.wz'], same: false, do: 'open' }] }];
  const out = S.splitLane(lanes, 0, ['d_xmas'], 'l2');
  assert.deepEqual(out.map((l) => l.id), ['l1', 'l2']);
  assert.deepEqual(out[0].blocks.map((b) => b.k), ['time', 'if_special', 'cover']);
  assert.deepEqual(out[0].blocks[1], { k: 'if_special', is: 'no', days: ['d_xmas'] });
  assert.deepEqual(out[1].blocks[1], { k: 'if_special', is: 'yes', days: ['d_xmas'] });
  out[1].blocks[2].do = 'pos';
  assert.equal(out[0].blocks[2].do, 'open', 'the copy is a copy');
  assert.equal(lanes[0].blocks.length, 2, 'the old lanes stay as they were');
  assert.equal(S.splitLane([1, 2, 3, 4].map((n) => ({ id: `l${n}`, blocks: [{ k: 'button' }] })), 0, [], 'l5'), null, 'four lanes: no room');
  assert.equal(S.splitLane([{ id: 'l1', blocks: Array.from({ length: 12 }, () => ({ k: 'button' })) }], 0, [], 'l2'), null, 'a full lane');
});

test('a ready day already in the list is not offered twice; a calendar not chosen yet says so', () => {
  const p = S.presets(D(2026, 11, 1)), xmas = p.find((x) => x.key === 'xmasEve'), hol = p.find((x) => x.key === 'holidays'), own = p.find((x) => x.key === 'own');
  const days = [{ id: 'd_a', kind: 'date', name: 'Heiligabend', md: '12-24' }, { id: 'd_b', kind: 'holidays', region: 'BW' }];
  assert.equal(S.hasPreset(days, xmas), true);
  assert.equal(S.hasPreset(days, p.find((x) => x.key === 'xmas')), false, '24. – 26. Dez. is another day');
  assert.equal(S.hasPreset(days, hol), false, 'the holidays of another state');
  assert.equal(S.hasPreset([{ id: 'd_c', kind: 'date', md: own.day.md }], own), false, 'an own day: always');
  assert.equal(S.kindText({ kind: 'calendar', ent: '' }, t, 'de'), 'sd.calendar');
});
