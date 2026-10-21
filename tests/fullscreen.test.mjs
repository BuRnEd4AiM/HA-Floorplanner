// Unit tests for fullscreen.js (a full screen kept on for a user, only the code ends it, #487; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const F = await import(`${process.env.STATIC_DIR || '/tmp/static'}/fullscreen.js`);

test('the state: nothing without the lock or where the browser cannot go full screen; a sheet while not in full screen', () => {
  assert.equal(F.fullState({ locked: false, can: true, full: true, free: false }), 'off');
  assert.equal(F.fullState({ locked: true, can: false, full: false, free: false }), 'off');          // e.g. an iPhone: no sheet that never goes away
  assert.equal(F.fullState({ locked: true, can: true, full: false, free: false }), 'cover');
  assert.equal(F.fullState({ locked: true, can: true, full: true, free: false }), 'on');
  assert.equal(F.fullState({ locked: true, can: true, full: true, free: true }), 'free');
  assert.equal(F.fullState({ locked: true, can: true, full: false, free: true }), 'free');
  assert.equal(F.FULL_LOCK, 'fullscreen');
});
test('⛶ asks for the code while kept, goes back and keeps it again once free, else toggles', () => {
  assert.equal(F.fullButton('on', true), 'ask');
  assert.equal(F.fullButton('free', false), 'keep');
  assert.equal(F.fullButton('free', true), 'toggle');
  assert.equal(F.fullButton('off', true), 'toggle');
  assert.equal(F.fullButton('off', false), 'toggle');
});
test('free again only after the minutes without a touch', () => {
  assert.equal(F.freeOver({ free: true, idleMs: 9 * 60000 }), false);
  assert.equal(F.freeOver({ free: true, idleMs: F.FREE_MIN * 60000 + 1 }), true);
  assert.equal(F.freeOver({ free: false, idleMs: 99 * 60000 }), false);
  assert.equal(F.freeOver({ free: true, idleMs: 61000, minutes: 1 }), true);
});
test('a code is 4 to 8 digits', () => {
  for (const c of ['1234', '00000000', '13579']) assert.equal(F.codeOk(c), true, c);
  for (const c of ['123', '123456789', '12a4', ' 1234', '', null, 1234]) assert.equal(F.codeOk(c), false, String(c));
});
test('the answer of the add-on: right, wrong (tries left), wait, no code yet, anything else', () => {
  assert.deepEqual(F.unlockAnswer(200, { ok: true }), { ok: true });
  assert.deepEqual(F.unlockAnswer(200, {}), { note: 'fs.failed' });
  assert.deepEqual(F.unlockAnswer(403, { error: 'code', left: 3 }), { note: 'fs.wrong', n: 3 });
  assert.deepEqual(F.unlockAnswer(403, null), { note: 'fs.wrong', n: 0 });
  assert.deepEqual(F.unlockAnswer(429, { wait: 240 }), { note: 'fs.wait', n: 240 });
  assert.deepEqual(F.unlockAnswer(409, { error: 'no code' }), { note: 'fs.noCode' });
  assert.deepEqual(F.unlockAnswer(500, 'x'), { note: 'fs.failed' });
});
