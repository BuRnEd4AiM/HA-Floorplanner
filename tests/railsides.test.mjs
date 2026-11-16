// Unit tests for railsides.js (the railing of a balcony side by side, 5.14.0; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const R = await import(`${dir}/railsides.js`);
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const sq = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const room = (extra = {}) => ({ id: 'b', terrace: true, points: sq(0, 0, 4, 2), ...extra });   // sides: 0 top (4 m), 1 right (2 m), 2 bottom, 3 left
const len = (r) => Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1]);
const wallAtTop = (x, z) => Math.abs(z) < 0.05;                                                // the house wall along side 0

test('as before: a railing on every side that is not covered', () => {
  const { runs, gates } = R.railPlan(room(), wallAtTop);
  assert.deepEqual(runs.map((r) => r.k), [1, 2, 3]);
  assert.equal(gates.length, 0);
  near(len(runs[1]), 4);
});

test('a side switched off gets no railing; switched on again nothing is stored', () => {
  const r = room();
  R.setSide(r, 3, { off: true });
  assert.deepEqual(r.railSides, [null, null, null, { off: true }]);
  assert.deepEqual(R.railPlan(r, wallAtTop).runs.map((x) => x.k), [1, 2]);
  R.setSide(r, 3, { off: false });
  assert.equal(r.railSides, undefined);
});

test('from / to: the railing only goes that far along the side', () => {
  const r = room();
  R.setSide(r, 2, { from: 1, to: 2.5 });                               // the bottom side runs from (4, 2) to (0, 2)
  assert.deepEqual(r.railSides[2], { from: 1, to: 2.5 });
  const run = R.railPlan(r, wallAtTop).runs.find((x) => x.k === 2);
  near(run.a[0], 3); near(run.b[0], 1.5); near(len(run), 1.5);
  R.setSide(r, 2, { from: 0, to: 4 });                                 // the whole side again: nothing stored
  assert.equal(r.railSides, undefined);
});

test('values are clamped to the side', () => {
  const r = room({ railSides: [null, { from: -3, to: 99 }] });
  const s = R.sideOf(r, 1);
  near(s.from, 0); near(s.to, 2); assert.equal(s.own, false);
  const s2 = R.sideOf(room({ railSides: [null, { from: 1.5, to: 0.5 }] }), 1);
  near(s2.from, 1.5); near(s2.to, 1.5);                                // to never before from: no railing there
  assert.equal(R.railPlan(room({ railSides: [null, { from: 1.5, to: 0.5 }] })).runs.filter((x) => x.k === 1).length, 0);
});

test('a gate leaves a gap in the railing and is drawn there', () => {
  const r = room();
  R.setSide(r, 2, { gate: { at: 2, w: 1 } });
  const { runs, gates } = R.railPlan(r, wallAtTop);
  const bottom = runs.filter((x) => x.k === 2);
  assert.equal(bottom.length, 2);
  near(bottom.reduce((s, x) => s + len(x), 0), 3);
  assert.equal(gates.length, 1);
  near(gates[0].a[0], 2.5); near(gates[0].b[0], 1.5);
  const g = R.sideOf(room({ railSides: [null, { gate: { at: 0, w: 5 } }] }), 1).gate;   // wider than the side, at its very end
  near(g.w, 2); near(g.at, 1);
  near(R.sideOf(room({ railSides: [null, { gate: { at: 1, w: 0.1 } }] }), 1).gate.w, R.GATE.min);
});

test('a gate on a covered spot is not drawn', () => {
  const r = room({ railSides: [{ gate: { at: 2, w: 1 } }] });
  assert.equal(R.railPlan(r, wallAtTop).gates.length, 0);
});

test('the listed sides: the uncovered ones and those with a setting, numbered 1, 2, …', () => {
  assert.deepEqual(R.listedSides(room(), wallAtTop).map((s) => [s.k, s.n]), [[1, 1], [2, 2], [3, 3]]);
  const r = room({ railSides: [{ off: true }] });
  assert.deepEqual(R.listedSides(r, wallAtTop).map((s) => [s.k, s.n]), [[0, 1], [1, 2], [2, 3], [3, 4]]);
  const mid = R.listedSides(room(), wallAtTop)[0].mid;
  near(mid[0], 4); near(mid[1], 1);
});

test('a corner added on a side keeps from / to / gate at their place', () => {
  const r = room({ railSides: [null, null, { from: 1, to: 3.5, gate: { at: 3, w: 0.8 } }] });
  r.points.splice(3, 0, [2, 2]);                                         // a corner in the middle of the bottom side (2 m from its start)
  R.splitSide(r, 2, 2);
  assert.deepEqual(r.railSides, [null, null, { from: 1 }, { to: 1.5, gate: { at: 1, w: 0.8 } }]);
  const off = room({ railSides: [null, { off: true }] });
  off.points.splice(2, 0, [4, 1]); R.splitSide(off, 1, 1);
  assert.deepEqual(off.railSides, [null, { off: true }, { off: true }]);
  const part = room({ railSides: [null, { to: 0.5 }] });                 // the railing ends before the new corner: the second half gets none
  part.points.splice(2, 0, [4, 1]); R.splitSide(part, 1, 1);
  assert.deepEqual(part.railSides, [null, { to: 0.5 }, { off: true }]);
  const none = room(); R.splitSide(none, 1, 1);
  assert.equal(none.railSides, undefined);
});

test('a corner taken away: the side before it keeps its setting', () => {
  const r = room({ railSides: [null, { off: true }, { from: 1 }, null] });
  r.points.splice(2, 1);
  R.dropCorner(r, 2);
  assert.deepEqual(r.railSides, [null, { off: true }]);
  const t = room({ railSides: [null, { off: true }] });
  t.points.splice(1, 1); R.dropCorner(t, 1);
  assert.equal(t.railSides, undefined);
});
