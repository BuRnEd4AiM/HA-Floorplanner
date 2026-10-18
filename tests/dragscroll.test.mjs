// Unit tests for dragscroll.js (a finger swipes the room tiles, #438; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const D = await import(`${dir}/dragscroll.js`);

test('how fast the finger was at the end: over its last 100 ms', () => {
  assert.equal(D.flingSpeed([], 100), 0);
  assert.equal(D.flingSpeed([{ x: 100, t: 0 }], 10), 0, 'one sample: no speed');
  assert.equal(D.flingSpeed([{ x: 300, t: 0 }, { x: 200, t: 50 }, { x: 100, t: 100 }], 100), -2, 'to the left: negative');
  assert.equal(D.flingSpeed([{ x: 0, t: 0 }, { x: 500, t: 400 }, { x: 510, t: 450 }, { x: 520, t: 500 }], 500), 0.2, 'only the end counts');
  assert.equal(D.flingSpeed([{ x: 0, t: 0 }, { x: 300, t: 50 }], 400), 0, 'the finger stood still before letting go');
  assert.equal(D.flingSpeed([{ x: 0, t: 10 }, { x: 30, t: 10 }], 20), 0, 'no time passed');
});

test('the glide moves, slows down and stops', () => {
  const g = D.glideStep(2, 16);
  assert.equal(g.dx, 32);
  assert.ok(Math.abs(g.v - 1.9) < 1e-9, 'loses 5 % per 16 ms');
  assert.equal(D.glideStep(-1, 16).dx, -16, 'to the left too');
  assert.deepEqual(D.glideStep(0.02, 16), { dx: 0.32, v: 0 }, 'too slow: stops');
  assert.equal(D.glideStep(1, 500).dx, 64, 'a late frame does not jump');
  assert.equal(D.glideStep(1, -5).dx, 0);
  let v = 3, moved = 0, frames = 0;
  while (v && frames < 1000) { const s = D.glideStep(v, 16); moved += s.dx; v = s.v; frames++; }
  assert.ok(frames < 200 && moved > 500 && moved < 1200, `a quick swipe glides on a little and stops (${frames} frames, ${Math.round(moved)} px)`);
});
