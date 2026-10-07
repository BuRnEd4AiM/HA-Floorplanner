// Unit tests for frameloop.js (how often the picture is drawn; split step 22 of #137; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const F = await import(`${process.env.STATIC_DIR || '/tmp/static'}/frameloop.js`);

test('busy on a normal screen: every frame', () => {
  assert.deepEqual(F.frameDue(10000, 9000, 9990, false), { draw: true, throttled: false, idle: false });
});
test('idle after 15 s: four frames a second', () => {
  assert.equal(F.frameDue(20000, 1000, 19900, false).draw, false);
  assert.deepEqual(F.frameDue(20000, 1000, 19700, false), { draw: true, throttled: true, idle: true });
});
test('low-power mode: about 30 frames a second while busy, two after 4 s idle', () => {
  assert.equal(F.frameDue(10000, 9990, 9980, true).draw, false);
  assert.equal(F.frameDue(10000, 9990, 9960, true).draw, true);
  assert.equal(F.frameDue(10000, 5000, 9600, true).draw, false);
  assert.deepEqual(F.frameDue(10000, 5000, 9400, true), { draw: true, throttled: true, idle: true });
});
