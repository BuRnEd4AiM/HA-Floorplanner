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
test('low-power mode: every other frame of a 60 Hz screen, also when the frames come a little early', () => {
  let last = 0, drawn = 0;
  for (let k = 1; k <= 60; k++) {
    const now = k * 16.667 + (k % 3 ? -1.5 : 1.5);                     // the screen's frames are never exactly the same distance apart
    const d = F.frameDue(now, now, last, true);
    if (d.draw) { assert.ok(now - last < 40, `no frame left out at ${now}`); last = now; drawn++; }
  }
  assert.equal(drawn, 30);
});
test('low-power mode: every frame while the camera is moved by hand, at rest again soon after', () => {
  assert.deepEqual(F.frameDue(10000, 9990, 9984, true, 9990), { draw: true, throttled: false, idle: false });
  assert.equal(F.frameDue(10000, 9990, 9984, true, 10000 - F.MOVING).draw, false);
});
test('shadows (#253): drawn again after a change, else at most once a second', () => {
  assert.equal(F.shadowDue(true, 1000, 999), true);
  assert.equal(F.shadowDue(false, 1500, 1000), false);                 // only the camera turned
  assert.equal(F.shadowDue(false, 1000 + F.SHADOW_REFRESH, 1000), true);   // the safety refresh
});
test('shadows: the safety refresh waits while the camera is moved (a slow frame in the middle jerked)', () => {
  assert.equal(F.shadowDue(false, 3000, 1000, { lastMove: 2950 }), false);
  assert.equal(F.shadowDue(false, 1000 + F.SHADOW_REFRESH_MOVING, 1000, { lastMove: 5950 }), true);
  assert.equal(F.shadowDue(false, 3000, 1000, { lastMove: 3000 - F.MOVING }), true);   // the camera stands again
});
test('shadows: walls sinking get new shadows now and then and once when they stand', () => {
  assert.equal(F.shadowDue(false, 1100, 1000, { sinking: true, sank: true }), false);
  assert.equal(F.shadowDue(false, 1000 + F.SHADOW_SINKING, 1000, { sinking: true, sank: true }), true);
  assert.equal(F.shadowDue(false, 1050, 1000, { sinking: false, sank: true }), true);
});
test('the camera glides the same per second at any frame rate', () => {
  assert.ok(Math.abs(F.dampingFor(1000 / 60) - F.DAMPING) < 1e-9);    // 60 frames: as three.js does it
  const rest = (fps, s) => (1 - F.dampingFor(1000 / fps)) ** (fps * s);  // what is left of a move after s seconds
  assert.ok(Math.abs(rest(30, 1) - rest(60, 1)) < 1e-9);
  assert.ok(Math.abs(rest(144, 1) - rest(60, 1)) < 1e-9);
  assert.equal(F.dampingFor(5000), F.dampingFor(F.MAX_STEP));         // a frame after a long pause makes no jump
  assert.ok(F.dampingFor(0) > 0);
});
