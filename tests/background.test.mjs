// Unit tests for background.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const B = await import(`${process.env.STATIC_DIR || '/tmp/static'}/background.js`);

test('a first picture starts 12 m wide, half see-through, not turned; the height follows the picture', () => {
  assert.deepEqual(B.newBg(undefined, 'a.png', 2000, 1000), { img: 'a.png', x: 0, z: 0, w: 12, ar: 0.5, op: 0.5, rot: 0 });
  assert.equal(B.newBg(null, 'a.png', 3, 4).ar, 1.33333);
});
test('replacing a picture keeps position, width, opacity and turn', () => {
  const r = B.newBg({ img: 'old.png', x: 3, z: -2, w: 9.5, op: 0.8, rot: 12 }, 'new.png', 100, 50);
  assert.deepEqual(r, { img: 'new.png', x: 3, z: -2, w: 9.5, ar: 0.5, op: 0.8, rot: 12 });
});
test('calibration: a picture that measures 2 m but is really 4 m is scaled by 2 around the first point', () => {
  const bg = { x: 1, z: 1, w: 10 };
  const r = B.calibratedBg(bg, [3, 1], [5, 1], 4);
  assert.deepEqual(r, { w: 20, x: -1, z: 1 });                    // x: 3 + (1 - 3) * 2
});
test('calibration: the first point stays where it is on the picture (corner on the point does not move)', () => {
  const r = B.calibratedBg({ x: 2, z: 3, w: 8 }, [2, 3], [2, 4], 3);
  assert.deepEqual(r, { w: 24, x: 2, z: 3 });
});
test('calibration refuses nonsense: no picture, points on top of each other, impossible real distance', () => {
  const bg = { x: 0, z: 0, w: 10 };
  assert.equal(B.calibratedBg(null, [0, 0], [1, 0], 1), null);
  assert.equal(B.calibratedBg(bg, [1, 1], [1, 1.005], 1), null);
  assert.equal(B.calibratedBg(bg, [0, 0], [1, 0], 0.01), null);
  assert.equal(B.calibratedBg(bg, [0, 0], [1, 0], 500), null);
  assert.equal(B.calibratedBg(bg, [0, 0], [1, 0], NaN), null);
});
test('calibration rounds to 4 decimals', () => {
  const r = B.calibratedBg({ x: 0, z: 0, w: 10 }, [0, 0], [3, 0], 1);
  assert.equal(r.w, 3.3333);
});
