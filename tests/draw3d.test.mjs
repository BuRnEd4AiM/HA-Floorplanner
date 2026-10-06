// Unit tests for draw3d.js (drawing and dragging in 3D, split step 20 part 4 of #137; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const D = await import(`${process.env.STATIC_DIR || '/tmp/static'}/draw3d.js`);
const wall = (openings = []) => ({ a: [0, 0], b: [4, 0], thickness: 0.2, openings });

test('two clicks within 1 cm are the same point (the drawing ends there)', () => {
  assert.ok(D.samePoint([1, 1], [1.005, 1]));
  assert.ok(!D.samePoint([1, 1], [1.02, 1]));
  assert.ok(!D.samePoint([1, 1], undefined));
});
test('a door goes on the wall in 5 cm steps, kept on the wall, invalid where it overlaps another', () => {
  const s = D.openingSpot(wall(), [1.33, 0.4], 0.9);
  assert.ok(Math.abs(s.pos - 1.35) < 1e-9 && s.width === 0.9 && s.valid);
  const end = D.openingSpot(wall(), [3.99, 0], 0.9);
  assert.ok(end.pos + end.width / 2 <= 4 + 1e-9);                           // pushed back onto the wall
  const busy = D.openingSpot(wall([{ id: 'o1', pos: 1.4, width: 0.9 }]), [1.33, 0], 0.9);
  assert.equal(busy.valid, false);
  assert.equal(D.openingSpot(wall([{ id: 'o1', pos: 1.4, width: 0.9 }]), [1.33, 0], 0.9, 'o1').valid, true);   // moving that one itself
});
