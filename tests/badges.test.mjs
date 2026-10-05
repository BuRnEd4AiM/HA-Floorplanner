// Unit tests for badges.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const B = await import(`${process.env.STATIC_DIR || '/tmp/static'}/badges.js`);
const box = (x, y, w = 60, h = 20) => ({ x, y, w, h });

test('badges far apart stay where they are', () => {
  const r = B.placeBadges([box(0, 0), box(200, 0), box(0, 100)]);
  assert.deepEqual(r.map((i) => i.shift), [0, 0, 0]);
});
test('two badges on top of each other: the second one moves down by a full badge height', () => {
  const r = B.placeBadges([box(100, 100), box(100, 100)]);
  assert.equal(r[0].shift, 0);
  assert.ok(r[1].shift >= 20, String(r[1].shift));
});
test('three on one spot end up stacked without covering each other', () => {
  const r = B.placeBadges([box(50, 50), box(50, 50), box(50, 50)]);
  const ys = r.map((i) => i.y + i.shift).sort((a, b) => a - b);
  assert.ok(ys[1] - ys[0] >= 20 && ys[2] - ys[1] >= 20, ys.join());
});
test('side by side badges that do not overlap horizontally are not moved', () => {
  const r = B.placeBadges([box(0, 10), box(70, 10)]);
  assert.deepEqual(r.map((i) => i.shift), [0, 0]);
});
