// Unit tests for trains.js (the card "Zug", #550; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const T = await import(`${process.env.STATIC_DIR || '/tmp/static'}/trains.js`);
const t = (k, p = {}) => k + (Object.keys(p).length ? JSON.stringify(p) : '');
const rows = [
  { at: '07:05', delay: 0, platform: '2', planned: '2', train: 'RB 15' },
  { at: '07:12', delay: 5, platform: '4', planned: '3', train: 'RE 4711' },
  { at: '07:20', delay: null, cancelled: true, train: 'ICE 1576' },
  { at: '07:31', delay: 8, train: 'RB 17' },
  { at: '07:44', delay: null, train: 'RE 50' },
];

test('on time, late, cancelled, when it really leaves', () => {
  assert.deepEqual(T.statusOf(rows[0]), { kind: 'ok', delay: 0, real: '07:05' });
  assert.deepEqual(T.statusOf(rows[1]), { kind: 'late', delay: 5, real: '07:17' });
  assert.deepEqual(T.statusOf(rows[2]), { kind: 'gone', delay: null, real: '07:20' });
  assert.equal(T.statusOf(rows[3]).kind, 'bad');
  assert.equal(T.statusOf(rows[4]).kind, 'unknown');
  assert.equal(T.statusOf({ at: '23:58', delay: 5 }).real, '00:03');
  assert.ok(T.platformChanged(rows[1]) && !T.platformChanged(rows[0]) && !T.platformChanged(rows[3]));
});

test('"mein Zug", the minutes until it leaves and the rows to list', () => {
  const now = new Date(2026, 9, 27, 7, 6);
  assert.equal(T.mineOf(rows, '07:12'), rows[1]);
  assert.equal(T.mineOf(rows, '07:10'), rows[1]);                       // up to 10 minutes later
  assert.equal(T.mineOf(rows, '06:40'), null);
  assert.equal(T.mineOf(rows, ''), null);
  assert.equal(T.minutesTo(rows[1], now), 11);
  assert.equal(T.minutesTo(rows[0], now), -1);
  assert.equal(T.minutesTo({ at: '00:10', delay: 0 }, new Date(2026, 9, 27, 23, 55)), 15);
  assert.deepEqual(T.nextRows(rows, now, 3, rows[1]).map((r) => r.train), ['RB 15', 'ICE 1576', 'RB 17']);
  assert.equal(T.inWords(11, t), 'tr.inMin{"n":11}');
  assert.equal(T.inWords(70, t), 'tr.inHour{"h":1,"m":10}');
  assert.equal(T.inWords(0, t), 'tr.now');
});

test('"mein Zug" hours away: later today or tomorrow, from when the railway lists it', () => {
  assert.deepEqual(T.aheadOf('06:05', new Date(2026, 9, 26, 21, 34)), { min: 511, tomorrow: true });     // the owner's evening: 8 h 31 min
  assert.deepEqual(T.aheadOf('17:30', new Date(2026, 9, 27, 13, 0)), { min: 270, tomorrow: false });
  assert.deepEqual(T.aheadOf('07:12', new Date(2026, 9, 27, 7, 12)), { min: 1440, tomorrow: true });     // leaving now and not listed: tomorrow's
  assert.equal(T.aheadOf('', new Date()), null);
  assert.ok(T.aheadOf('06:05', new Date(2026, 9, 26, 21, 34)).min > T.FAR && T.FAR < 180);
  assert.equal(T.liveFrom('06:05'), '03:05');
  assert.equal(T.liveFrom('01:30'), '22:30');
  assert.equal(T.liveFrom('x'), '');
  assert.equal(T.inWords(511, t), 'tr.inHour{"h":8,"m":31}');
});
