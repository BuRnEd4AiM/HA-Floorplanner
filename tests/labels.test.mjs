// Unit tests for labels.js: how sharp the text of a label is drawn (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const L = await import(`${dir}/labels.js`);

test('a tablet in low-power mode draws the labels at half the sharpness: a quarter of the graphics memory (#394)', () => {
  assert.equal(L.labelRes(false), 4);                            // desktop: sharp when zooming in
  assert.equal(L.labelRes(true), 2);
  const mb = (res) => (256 * res * 64 * res * 4) / 2 ** 20;      // one label, RGBA
  assert.equal(mb(L.labelRes(false)), 1);
  assert.equal(mb(L.labelRes(true)), 0.25);
});
