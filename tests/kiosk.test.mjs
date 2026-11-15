// Unit tests for kiosk.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const K = await import(`${process.env.STATIC_DIR || '/tmp/static'}/kiosk.js`);
const min = 60000;

test('after the idle time the start view comes back, once', () => {
  assert.equal(K.kioskDecision({ live: true, idleReturn: 5, idleMs: 6 * min, home: false, night: false }).goHome, true);
  assert.equal(K.kioskDecision({ live: true, idleReturn: 5, idleMs: 6 * min, home: true, night: false }).goHome, false);   // already at home
  assert.equal(K.kioskDecision({ live: true, idleReturn: 5, idleMs: 4 * min, home: false, night: false }).goHome, false);  // not long enough
});
test('idleReturn 0 means never, and the edit mode is never sent home', () => {
  assert.equal(K.kioskDecision({ live: true, idleReturn: 0, idleMs: 999 * min, home: false, night: false }).goHome, false);
  assert.equal(K.kioskDecision({ live: false, idleReturn: 5, idleMs: 999 * min, home: false, night: false }).goHome, false);
});
test('at night the screen is dimmed after a minute without a touch, not before and not in the edit mode', () => {
  assert.equal(K.kioskDecision({ live: true, idleReturn: 0, idleMs: 61000, home: true, night: true }).dimShown, true);
  assert.equal(K.kioskDecision({ live: true, idleReturn: 0, idleMs: 30000, home: true, night: true }).dimShown, false);
  assert.equal(K.kioskDecision({ live: true, idleReturn: 0, idleMs: 61000, home: true, night: false }).dimShown, false);
  assert.equal(K.kioskDecision({ live: false, idleReturn: 0, idleMs: 61000, home: true, night: true }).dimShown, false);
});

/* ---- 5.12.0: more settings for the wall tablet ---- */
const S = await import(`${process.env.STATIC_DIR || '/tmp/static'}/kioskscreen.js`);
const base = { live: true, idleReturn: 0, home: true, night: false };
test('the screen saver starts on its own: without "back to the start view" and when nobody touched the page yet', () => {
  assert.equal(K.kioskDecision({ ...base, idleMs: 6 * min, saver: 'orbit', saverAfter: 5 }).saverStart, true);   // idleReturn 0, home: before 5.12.0 never
  assert.equal(K.kioskDecision({ ...base, idleMs: 4 * min, saver: 'clock', saverAfter: 5 }).saverStart, false);  // not long enough
  assert.equal(K.kioskDecision({ ...base, idleMs: 6 * min, saver: 'black', saverAfter: 5, saverOn: true }).saverStart, false);   // runs already
  assert.equal(K.kioskDecision({ ...base, idleMs: 99 * min, saver: 'off' }).saverStart, false);
  assert.equal(K.kioskDecision({ ...base, idleMs: 99 * min, saver: 'junk' }).saverStart, false);
  assert.equal(K.kioskDecision({ ...base, live: false, idleMs: 99 * min, saver: 'orbit' }).saverStart, false);   // never in the edit mode
  assert.equal(K.kioskDecision({ ...base, idleMs: 70000, saver: 'orbit', saverAfter: 0 }).saverStart, true);    // at least a minute
  assert.equal(K.kioskDecision({ ...base, idleMs: 50000, saver: 'orbit', saverAfter: 0 }).saverStart, false);
});
test('the screen dims after the minutes set, not before', () => {
  assert.equal(K.kioskDecision({ ...base, night: true, idleMs: 4 * min, dimAfter: 5 }).dimShown, false);
  assert.equal(K.kioskDecision({ ...base, night: true, idleMs: 6 * min, dimAfter: 5 }).dimShown, true);
});
test('dimNow: always, at night by the clock or the sun, never when off', () => {
  const noon = new Date(2026, 10, 15, 12, 0), late = new Date(2026, 10, 15, 23, 0);
  assert.equal(K.dimNow('always', '22:00', '06:00', noon, 'above_horizon'), true);
  assert.equal(K.dimNow('time', '22:00', '06:00', noon, 'below_horizon'), false);
  assert.equal(K.dimNow('time', '22:00', '06:00', late, 'above_horizon'), true);
  assert.equal(K.dimNow('sun', '22:00', '06:00', noon, 'below_horizon'), true);
  assert.equal(K.dimNow('off', '22:00', '06:00', late, 'below_horizon'), false);
});
test('reloadDue: once after the time, only when nobody touches the screen', () => {
  const at = (h, m) => new Date(2026, 10, 15, h, m).getTime();
  assert.equal(K.reloadDue('04:00', at(3, 0), at(4, 5), 5 * min), true);
  assert.equal(K.reloadDue('04:00', at(3, 0), at(4, 5), 30000), false);       // somebody uses it: wait
  assert.equal(K.reloadDue('04:00', at(4, 3), at(4, 30), 5 * min), false);    // loaded after 4:00 already (the reload itself)
  assert.equal(K.reloadDue('04:00', at(5, 0), at(3, 30) + 24 * 3600000, 5 * min), false);  // the next morning before 4:00
  assert.equal(K.reloadDue('04:00', at(5, 0), at(4, 1) + 24 * 3600000, 5 * min), true);    // ... and after
  assert.equal(K.reloadDue('', at(3, 0), at(4, 5), 5 * min), false);
  assert.equal(K.reloadDue('25:00', at(3, 0), at(4, 5), 5 * min), false);
});
test('wakeState: a motion sensor that sees somebody', () => {
  ['on', 'open', 'detected', 'home', 'playing', 'ON'].forEach((s) => assert.equal(K.wakeState(s), true, s));
  ['off', 'closed', 'not_home', 'unavailable', '', undefined].forEach((s) => assert.equal(K.wakeState(s), false, s));
});
test('the house turns at three speeds, normal as it always did', () => {
  assert.equal(K.SAVER_SPEED.normal, 0.6);
  assert.ok(K.SAVER_SPEED.slow < K.SAVER_SPEED.normal && K.SAVER_SPEED.normal < K.SAVER_SPEED.fast);
});
test('the clock: time and day in the language, a new place every minute within a few percent', () => {
  const l = S.clockLines(new Date(2026, 10, 15, 21, 5), 'de');
  assert.equal(l.time, '21:05');
  assert.match(l.day, /Sonntag/);
  assert.match(l.day, /November/);
  const spots = new Set();
  for (let n = 0; n < 60; n++) {
    const s = S.clockShift(29000000 + n);
    assert.ok(Math.abs(s.x) <= 6 && Math.abs(s.y) <= 5, JSON.stringify(s));
    spots.add(`${s.x},${s.y}`);
  }
  assert.ok(spots.size > 20);
  assert.notDeepEqual(S.clockShift(5), S.clockShift(6));
});
test('how dark: the setting, kept between 20 and 95 %', () => {
  assert.equal(S.dimAlpha(0.7), 0.7);
  assert.equal(S.dimAlpha(0.05), 0.2);
  assert.equal(S.dimAlpha(3), 0.95);
  assert.equal(S.dimAlpha(undefined), 0.7);
});
