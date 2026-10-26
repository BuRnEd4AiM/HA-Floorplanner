// Unit tests for yard.js: the plot (Grundstück) and the areas on it, #538 (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const Y = await import(`${dir}/yard.js`);
const { PATTERNS } = await import(`${dir}/finishes.js`);
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const SQ = [[0, 0], [20, 0], [20, 30], [0, 30]];

test('the surfaces: every one has an icon and a pattern of the floors (or is water), a colour from afar', () => {
  assert.ok(Y.SURFACE_KEYS.length >= 12);
  for (const k of Y.SURFACE_KEYS) {
    const s = Y.SURFACES[k];
    assert.ok(s.icon, k);
    if (s.water) assert.equal(Y.surfaceFinish(k), null);
    else { assert.ok(PATTERNS[s.spec.pattern]?.on.includes('floor'), k); assert.equal(Y.surfaceFinish(k).key, s.spec.pattern); }
    assert.match(Y.surfaceColor(k), /^#[0-9a-f]{6}$/, k);
  }
  assert.equal(Y.surfaceColor('nope'), '#8f8a84');
  assert.ok(Y.SURFACE_KEYS.includes(Y.DEFAULT_SURFACE));
  assert.equal(Y.surfaceFinish('gravel').size, 0.25);                // its own size and colours over the pattern's
});
test('measuring: area, perimeter, the sides with their length and a label direction away from the inside', () => {
  near(Y.polyArea(SQ), 600); near(Y.polyArea([...SQ].reverse()), 600); near(Y.perimeter(SQ), 100);
  near(Y.polyArea([[0, 0], [10, 0], [10, 5], [5, 5], [5, 10], [0, 10]]), 75);   // an L
  const e = Y.edgeList(SQ);
  assert.deepEqual(e.map((q) => q.len), [20, 30, 20, 30]);
  assert.deepEqual(e[0].mid, [10, 0]);
  assert.deepEqual(e[0].out.map((v) => Math.round(v)), [0, -1]);     // the top side: its label above it
  assert.deepEqual(e[1].out.map((v) => Math.round(v)), [1, 0]);      // the right side: to the right
  assert.deepEqual(Y.edgeList([...SQ].reverse())[0].out.map((v) => Math.round(v)), [0, 1]);    // the other way round (its first side is the bottom one): still outside
  assert.equal(Y.polyArea(null), 0);
});
test('a rectangle: found within half a degree, its size, set to a new size keeping its first corner', () => {
  assert.ok(Y.isRect(SQ)); assert.ok(!Y.isRect([[0, 0], [20, 0], [21, 30], [0, 30]])); assert.ok(!Y.isRect(SQ.slice(0, 3)));
  assert.deepEqual(Y.rectSize(SQ), [20, 30]);
  assert.equal(Y.rectSize([[0, 0], [20, 0], [10, 30]]), null);
  assert.deepEqual(Y.setRectSize(SQ, 25, 32), [[0, 0], [25, 0], [25, 32], [0, 32]]);
  assert.equal(Y.setRectSize([[0, 0], [20, 0], [10, 30]], 5, 5).length, 3);   // no rectangle: unchanged
});
test('a side set to a length: its end moves along it, a side at a right angle moves along, the rest stays; the old list stays', () => {
  const out = Y.setEdgeLength(SQ, 0, 24);
  assert.deepEqual(out, [[0, 0], [24, 0], [24, 30], [0, 30]]);
  assert.deepEqual(SQ[1], [20, 0]);
  assert.deepEqual(Y.setEdgeLength(SQ, 3, 10), [[0, 20], [20, 20], [20, 30], [0, 30]]);   // side 3 runs up: the first corner and the top side move down
  const tri = [[0, 0], [10, 0], [5, 8]];
  assert.deepEqual(Y.setEdgeLength(tri, 0, 12), [[0, 0], [12, 0], [5, 8]]);   // a triangle: only its corner
  const slanted = [[0, 0], [10, 0], [14, 9], [0, 9]];
  assert.deepEqual(Y.setEdgeLength(slanted, 0, 12)[2], [14, 9]);             // the next side not at a right angle: it stays
  assert.equal(Y.setEdgeLength(SQ, 0, 0), SQ); assert.equal(Y.setEdgeLength(SQ, 9, 5), SQ); assert.equal(Y.setEdgeLength([[0, 0], [0, 0], [1, 1]], 0, 5).length, 3);
});
test('rectangles: between two clicks, round the house with a margin on whole decimetres', () => {
  assert.deepEqual(Y.rectFrom([5, 4], [1, 1]), [[1, 1], [5, 1], [5, 4], [1, 4]]);
  assert.equal(Y.rectFrom([1, 1], [1.02, 6]), null);
  const box = Y.houseBox([{ walls: [{ a: [0.04, 0], b: [10, 0] }], rooms: [{ points: [[0, 0], [10, 0], [10, 8.27], [0, 8.27]] }], blocks: [{ points: [[-3, 2], [0, 2], [0, 5]] }] }, { walls: [], rooms: [] }]);
  assert.deepEqual(box, { x0: -3, x1: 10, z0: 0, z1: 8.27 });
  assert.deepEqual(Y.rectAround(box, 5), [[-8, -5], [15, -5], [15, 13.3], [-8, 13.3]]);
  assert.equal(Y.houseBox([{ walls: [], rooms: [] }]), null);
  assert.equal(Y.rectAround(null, 5), null);
});
test('picking: the plot by its edge, an area by its inside (the last drawn on top), how much of each surface', () => {
  assert.ok(Y.nearEdge(SQ, 10, 0.3, 0.4)); assert.ok(!Y.nearEdge(SQ, 10, 5, 0.4)); assert.ok(Y.nearEdge(SQ, 20.2, 31, 1.2));
  const inside = (x, z, p) => x >= p[0][0] && x <= p[1][0] && z >= p[0][1] && z <= p[2][1];
  const areas = [{ id: 'a', surface: 'lawn', points: [[0, 0], [10, 0], [10, 10], [0, 10]] }, { id: 'b', surface: 'paving', points: [[2, 2], [4, 2], [4, 4], [2, 4]] },
    { id: 'c', surface: 'lawn', points: [[20, 0], [22, 0], [22, 2], [20, 2]] }];
  assert.equal(Y.areaAt(areas, 3, 3, inside).id, 'b'); assert.equal(Y.areaAt(areas, 8, 8, inside).id, 'a'); assert.equal(Y.areaAt(areas, 15, 8, inside), null);
  assert.deepEqual(Y.surfaceTotals(areas), [{ surface: 'lawn', m2: 104, n: 2 }, { surface: 'paving', m2: 4, n: 1 }]);
});
test('what is stored: usable corners only, a known surface, a name of at most 40 letters, each id once, at most 60 areas', () => {
  assert.deepEqual(Y.cleanPoints([[0, 0], [1.23456, 0], [1, 1]]), [[0, 0], [1.235, 0], [1, 1]]);
  for (const bad of [null, [[0, 0], [1, 1]], [[0, 0], [1, 0], [2, 0]], [[0, 0], [1, 0], ['1', 1]], [[0, 0], [1, 0], [1, 1e6]]]) assert.equal(Y.cleanPoints(bad), null, JSON.stringify(bad));
  const a = Y.cleanArea({ id: 'h1', name: '  Hof  ', surface: 'cobble', points: SQ, extra: 1 });
  assert.deepEqual(a, { id: 'h1', name: 'Hof', surface: 'cobble', points: SQ });
  assert.equal(Y.cleanArea({ points: SQ, surface: 'lava' }, () => 'new').surface, 'paving');
  assert.equal(Y.cleanArea({ points: SQ, id: 'bad id!' }, () => 'new').id, 'new');
  assert.equal(Y.cleanArea({ name: 'x'.repeat(80), points: SQ }).name.length, 40);
  assert.equal(Y.cleanArea({ points: [[0, 0]] }), null);
  let n = 0;
  const many = Array.from({ length: 70 }, () => ({ points: SQ }));
  assert.equal(Y.cleanAreas(many, () => `z${n++}`).length, Y.MAX_AREAS);
  assert.equal(Y.cleanAreas([{ id: 'x', points: SQ }, { id: 'x', points: SQ }]).length, 1);
  assert.deepEqual(Y.cleanAreas('nope'), []);
});
