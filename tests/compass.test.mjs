// Unit tests for compass.js (run: cp floorplan3d/rootfs/app/static/compass.js /tmp/compass.mjs && COMPASS_MJS=/tmp/compass.mjs node --test tests/compass.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const C = await import(process.env.COMPASS_MJS || '/tmp/compass.mjs');

test('unwrap takes the short way across the jump from 179 to -179', () => {
  assert.ok(Math.abs(C.unwrap(179, -179) - 181) < 1e-9);
  assert.ok(Math.abs(C.unwrap(-179, 179) - -181) < 1e-9);
  assert.equal(C.unwrap(10, 20), 20);
  assert.equal(C.unwrap(0, 0), 0);
});
test('a full turn counts on past 360 and never jumps back (the bug: the needle spun all the way back)', () => {
  let angle = 0, prev = 0;
  for (let a = 0; a <= 1080; a += 7) {                       // three turns in steps of 7 degrees
    const heading = ((((a + 180) % 360) + 360) % 360) - 180;    // what atan2 reports: always in -180..180
    angle = C.unwrap(angle, heading);
    assert.ok(Math.abs(angle - prev) <= 7.0001, `jump of ${angle - prev} at ${a}`);
    prev = angle;
  }
  assert.ok(Math.abs(prev - 1078) < 1e-6, String(prev));        // it really kept counting: 1078 degrees, not 358
});
test('turning the other way counts down in the same way', () => {
  let angle = 0;
  for (let a = 0; a >= -720; a -= 10) angle = C.unwrap(angle, ((((a + 180) % 360) + 360) % 360) - 180);
  assert.ok(angle < -650);
});
test('heading: camera south of the target looks north (0), east of it looks west (-90 or 270 equivalent)', () => {
  assert.ok(Math.abs(C.headingOf(0, 10)) < 1e-9);               // camera at +z (south) looks to the north
  assert.ok(Math.abs(C.headingOf(10, 0) - -90) < 1e-9);         // camera at +x (east) looks to the west
  assert.ok(Math.abs(Math.abs(C.headingOf(0, -10)) - 180) < 1e-9);
});
test('side of the house we look from: S, E, N, W and the diagonals', () => {
  assert.equal(C.sideIndex(0, 10), 4);                           // from the south
  assert.equal(C.sideIndex(10, 0), 2);                           // from the east
  assert.equal(C.sideIndex(0, -10), 0);                          // from the north
  assert.equal(C.sideIndex(-10, 0), 6);                          // from the west
  assert.equal(C.sideIndex(10, 10), 3);                          // south-east
});
