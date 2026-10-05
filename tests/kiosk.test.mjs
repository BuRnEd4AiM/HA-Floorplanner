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
