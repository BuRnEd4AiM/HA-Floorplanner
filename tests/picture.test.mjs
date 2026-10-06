// Unit tests for picture.js (a picture on the wall, split step 20 part 3 of #137; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const P = await import(`${process.env.STATIC_DIR || '/tmp/static'}/picture.js`);

test('picture size: 0.6 m wide and 3:4 by default, else as set', () => {
  assert.deepEqual(P.pictureSize({}), { w: 0.6, h: 0.6 * 0.75 });
  assert.deepEqual(P.pictureSize({ w: 1.2, ar: 0.5 }), { w: 1.2, h: 0.6 });
});
