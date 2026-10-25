// Unit tests for bartip.js (the values of a bar under the finger or the mouse; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const B = await import(`${process.env.STATIC_DIR || '/tmp/static'}/bartip.js`);

test('the box goes right of the pointer in the left half, left of it in the right half', () => {
  assert.equal(B.tipLeft({ x: 100, width: 600, tip: 150 }), 110);
  assert.equal(B.tipLeft({ x: 500, width: 600, tip: 150 }), 340);
});
test('never out of the chart (a phone)', () => {
  assert.equal(B.tipLeft({ x: 290, width: 300, tip: 150 }), 130);
  assert.equal(B.tipLeft({ x: 5, width: 300, tip: 290 }), 10);
  assert.equal(B.tipLeft({ x: 200, width: 300, tip: 290 }), 0);
  assert.equal(B.tipLeft({ x: 100, width: 300, tip: 400 }), 0);   // wider than the chart: from its left edge
});
