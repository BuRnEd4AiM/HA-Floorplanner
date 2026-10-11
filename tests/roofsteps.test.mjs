// Unit tests for roofsteps.js (steps in the eaves of a roof, #342; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const S = await import(`${dir}/roofsteps.js`);
const bb = { x0: 0, x1: 12, z0: 0, z1: 9 };                        // ridge along x (the longer side): side A at z 0, side B at z 9
const gable = (steps) => ({ type: 'gable', pitch: 40, overhang: 0.4, ...(steps ? { steps } : {}) });

test('without steps every eave is one piece on the base box', () => {
  assert.deepEqual(S.sectionsOf(bb, gable(), 0), [{ a0: 0, a1: 12, out: 0 }]);
  assert.equal(S.hasSteps(bb, gable()), false);
  assert.deepEqual(S.outline(bb, gable()), [[0, 0], [12, 0], [12, 9], [0, 9]]);
  assert.deepEqual(S.stepHandles(bb, gable()), []);
});

test('a step moves the eave of one side from a point on; a step at 0 moves the first piece', () => {
  const r = gable([{ side: 0, at: 0, out: -0.5 }, { side: 0, at: 6, out: 0 }, { side: 'b', at: 8, out: 1 }]);
  assert.deepEqual(S.sectionsOf(bb, r, 0), [{ a0: 0, a1: 6, out: -0.5 }, { a0: 6, a1: 12, out: 0 }]);
  assert.deepEqual(S.sectionsOf(bb, r, 1), [{ a0: 0, a1: 8, out: 0 }, { a0: 8, a1: 12, out: 1 }]);
  assert.equal(S.outAt(bb, r, 0, 2), -0.5);
  assert.equal(S.outAt(bb, r, 0, 6), 0, 'the next piece starts at the step');
  assert.equal(S.outAt(bb, r, 1, 20), 1, 'beyond the box: the last piece');
  assert.equal(S.outAt(bb, r, 0, -1), -0.5, 'before the box: the first piece');
  assert.ok(S.hasSteps(bb, r));
  assert.deepEqual(S.intervals(bb, r, -0.4, 12.4).map((q) => [q.a0, q.a1, q.out0, q.out1]), [[-0.4, 6, -0.5, 0], [6, 8, 0, 0], [8, 12.4, 0, 1]]);
});

test('the outline goes round the house with its steps', () => {
  const r = gable([{ side: 0, at: 0, out: -0.5 }, { side: 0, at: 6, out: 0 }]);
  assert.deepEqual(S.outline(bb, r), [[0, 0.5], [6, 0.5], [6, 0], [12, 0], [12, 9], [0, 9]]);
  const zr = gable([{ side: 1, at: 4, out: 0.6 }]);                 // ridge along z: side B is the high x edge
  assert.deepEqual(S.outline({ x0: 0, x1: 6, z0: 0, z1: 10 }, zr), [[0, 0], [0, 10], [6.6, 10], [6.6, 4], [6, 4], [6, 0]]);
});

test('values are kept sensible: steps too close, eaves past the ridge, a hip roof', () => {
  const r = gable([{ side: 0, at: 5, out: 1 }, { side: 0, at: 5.1, out: 2 }, { side: 0, at: 11.9, out: 3 }, { side: 0, at: 7, out: -99 }]);
  const s = S.sectionsOf(bb, r, 0);
  assert.deepEqual(s.map((q) => q.a0), [0, 5, 7], 'too near the step before or the end: ignored');
  assert.equal(s[2].out, -(4.5 - 0.3), 'never past the ridge');
  assert.deepEqual(S.sectionsOf(bb, { ...r, type: 'hip' }, 0), [{ a0: 0, a1: 12, out: 0 }], 'a hip roof keeps its rectangle');
  assert.deepEqual(S.cleanSteps([{ side: 'b', at: -2, out: 50 }, { at: 'x' }, null]), [{ side: 1, at: 0, out: 20 }]);
});

test('the 2D plan: handles in the middle of each piece, a double click on an eave adds a step, dragging moves it, removing it', () => {
  const r = gable();
  assert.equal(S.addStepAt(bb, r, 6, 3, 0.2), null, 'not on an eave');
  assert.equal(S.addStepAt(bb, r, 6, 0.1, 0.2), 0, 'on side A');
  assert.deepEqual(r.steps, [{ side: 0, at: 6, out: 0 }], 'the piece after it keeps the eave for now');
  assert.equal(S.addStepAt(bb, r, 6.1, 0, 0.2), null, 'too near the step');
  assert.deepEqual(S.stepHandles(bb, r), [{ side: 0, i: 0, x: 3, z: 0 }, { side: 0, i: 1, x: 9, z: 0 }]);
  assert.equal(S.moveSection(bb, r, 0, 1, 9, -0.83, 0.05), true, 'dragged 0.83 m out, on 5 cm');
  assert.equal(r.steps[0].out, 0.85);
  assert.equal(S.moveSection(bb, r, 0, 0, 3, 0.52, 0.05), true, 'the first piece gets a step at 0');
  assert.deepEqual(S.sectionsOf(bb, r, 0).map((q) => q.out), [-0.5, 0.85]);
  assert.equal(S.moveSection(bb, r, 0, 0, 3, 0.5, 0.05), false, 'no change');
  assert.equal(S.removeStep(bb, r, 0, 1), true);
  assert.deepEqual(S.sectionsOf(bb, r, 0), [{ a0: 0, a1: 12, out: -0.5 }]);
  assert.equal(S.removeStep(bb, r, 0, 0), true);
  assert.equal(r.steps, undefined, 'no steps left');
  assert.equal(S.addStepAt(bb, { ...r, type: 'hip' }, 6, 0, 0.2), null, 'not on a hip roof');
  assert.equal(S.addStepAt(bb, r, 0.1, 0, 0.2), null, 'not at the very end');
  assert.equal(S.addStepAt(bb, r, 6, 9.1, 0.2), 1, 'on side B');
});

test('the frame of a slope piece: the eave moves out, the ridge stays', () => {
  const F = { b0: -0.4, b1: 9.4, half: 4.9, tan: 0.8, h: 3.92 };
  const G = S.sectionFrame(F, 0, 1);
  assert.deepEqual([G.b0, G.b1, G.half, G.bc], [-1.4, 9.4, 5.9, 4.5]);
  assert.ok(Math.abs(G.tan * G.half - F.h) < 1e-12, 'the same ridge height');
  const H = S.sectionFrame(F, 1, -0.5);
  assert.deepEqual([H.b0, H.b1, H.half], [-0.4, 8.9, 4.4]);
  assert.equal(S.sectionFrame(F, 0, 0).half, 4.9);
});

test('corners of the steps (#345): two per step (one where the eave does not jump); dragging one moves the step and its piece', () => {
  const r = gable([{ side: 0, at: 0, out: -0.5 }, { side: 0, at: 6, out: 0 }, { side: 1, at: 8, out: 0 }]);
  const c = S.cornerHandles(bb, r);
  assert.deepEqual(c, [{ side: 0, k: 1, piece: 0, x: 6, z: 0.5 }, { side: 0, k: 1, piece: 1, x: 6, z: 0 }, { side: 1, k: 1, piece: 0, x: 8, z: 9 }]);
  assert.equal(S.moveCorner(bb, r, 0, 1, 0, 5.02, 0.81, 0.05), true, 'the corner of the front piece: step to 5 m, its eave 80 cm in');
  assert.deepEqual(S.sectionsOf(bb, r, 0).map((q) => [q.a0, q.out]), [[0, -0.8], [5, 0]]);
  assert.equal(S.moveCorner(bb, r, 0, 1, 1, 0.1, -1.2, 0.05), true, 'the other corner, far along: stops 30 cm after the piece before');
  assert.deepEqual(S.sectionsOf(bb, r, 0).map((q) => [q.a0, q.out]), [[0, -0.8], [0.3, 1.2]]);
  assert.equal(S.moveCorner(bb, r, 0, 1, 1, 0.3, -1.2, 0.05), false, 'no change');
  assert.equal(S.moveCorner(bb, r, 0, 0, 0, 1, 1, 0.05), false, 'there is no step before the first piece');
  assert.equal(S.moveCorner(bb, { ...r, type: 'hip' }, 0, 1, 0, 1, 1, 0.05), false);
});
