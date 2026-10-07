// Unit tests for sheetview.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const V = await import(`${process.env.STATIC_DIR || '/tmp/static'}/sheetview.js`);
const view = { left: 0, top: 0, right: 390, bottom: 700 };

test('a bottom sheet over the lower half moves the picture up into the free part', () => {
  const s = V.sheetShift(view, { left: 60, top: 324, right: 378, bottom: 688 });
  assert.equal(s, Math.round((700 - 324) / 2));
});
test('closed panel, side panel (tablet, desktop) and a small sheet move nothing', () => {
  assert.equal(V.sheetShift(view, null), 0);
  assert.equal(V.sheetShift({ left: 0, top: 0, right: 1300, bottom: 800 }, { left: 988, top: 58, right: 1288, bottom: 788 }), 0);
  assert.equal(V.sheetShift(view, { left: 12, top: 650, right: 378, bottom: 688 }), 0);
});
test('a very tall sheet keeps at least 30% of the view for the room', () => {
  assert.equal(V.sheetShift(view, { left: 12, top: 60, right: 378, bottom: 700 }), Math.round((700 - 210) / 2));
});
test('the camera stays as far as before on wide screens and goes further back on narrow ones', () => {
  assert.equal(V.roomViewDist(6, 1.6), 6 * 2.4 + 3);
  assert.equal(V.roomViewDist(6, 0), 6 * 2.4 + 3);
  assert.equal(V.roomViewDist(6, 0.5), 2 * (6 * 2.4 + 3));
});
