// Unit tests for dormer.js (run: cp floorplan3d/rootfs/app/static/dormer.js /tmp/dormer.mjs && DORMER_MJS=/tmp/dormer.mjs node --test tests/dormer.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const D = await import(process.env.DORMER_MJS || '/tmp/dormer.mjs');
const bb = { x0: 0, x1: 10, z0: 0, z1: 6 };                       // ridge along x (the longer side), 6 m across
const roof = { type: 'gable', pitch: 35, overhang: 0.4 };
const flat = (tris) => tris.flat();
const maxY = (tris) => Math.max(...tris.map((p) => p[1]));

test('a dormer on a gable roof gives wall, roof and window', () => {
  const p = D.dormerParts(bb, roof, { side: 0, pos: 0.5 });
  assert.ok(p.wall.length > 0 && p.roof.length > 0 && p.glass.length > 0);
  assert.equal(p.wall.length % 3, 0);
  assert.equal(p.roof.length % 3, 0);
});

test('the dormer stays below the ridge of the main roof', () => {
  const ridge = (3 + 0.4) * Math.tan((35 * Math.PI) / 180);
  const p = D.dormerParts(bb, roof, { side: 1, pos: 0.2, hw: 99, eave: 0.2 });          // far too high: gets clamped
  assert.ok(maxY([...p.wall, ...p.roof]) < ridge, `${maxY([...p.wall, ...p.roof])} < ${ridge}`);
});

test('side 0 lies on the low-z slope, side 1 on the high-z slope', () => {
  const a = D.dormerParts(bb, roof, { side: 0 }).fit, b = D.dormerParts(bb, roof, { side: 1 }).fit;
  const za = D.dormerParts(bb, roof, { side: 0 }).wall.map((p) => p[2]), zb = D.dormerParts(bb, roof, { side: 1 }).wall.map((p) => p[2]);
  assert.ok(Math.max(...za) < 3, 'side 0 stays on the near half');
  assert.ok(Math.min(...zb) > 3, 'side 1 stays on the far half');
  assert.equal(a.side, 0); assert.equal(b.side, 1);
});

test('position moves the dormer along the ridge and stays on the roof', () => {
  const xs = (pos) => D.dormerParts(bb, roof, { pos }).wall.map((p) => p[0]);
  assert.ok(Math.min(...xs(0)) >= -0.4 && Math.max(...xs(1)) <= 10.4, 'inside the roof ends');
  assert.ok(Math.max(...xs(0)) < Math.min(...xs(1)), 'left is left of right');
});

test('a flat roof and a roof that is too small have no dormers', () => {
  assert.equal(D.dormerParts(bb, { ...roof, type: 'flat' }, {}), null);
  assert.equal(D.dormerParts({ x0: 0, x1: 1, z0: 0, z1: 1 }, roof, { w: 3 }), null);
  assert.equal(D.dormerParts(null, roof, {}), null);
});

test('flat dormer roof is horizontal, gable roof has a ridge', () => {
  const f = D.dormerParts(bb, roof, { type: 'flat', win: false });
  assert.equal(f.glass.length, 0);
  assert.equal(new Set(f.roof.map((p) => +p[1].toFixed(6))).size, 1, 'one height');
  const g = D.dormerParts(bb, roof, { type: 'gable' });
  assert.ok(new Set(g.roof.map((p) => +p[1].toFixed(6))).size > 1);
});

test('values are clamped and defaults filled in', () => {
  const n = D.fitDormer(bb, roof, { w: 0, hw: 0, eave: -5, pos: 7, type: 'nonsense', side: 5 });
  assert.ok(n.w >= 0.6 && n.hw >= 0.4 && n.eave >= 0.2 && n.pos === 1 && n.type === 'gable' && n.side === 0);
});

test('works with the ridge along z too', () => {
  const p = D.dormerParts({ x0: 0, x1: 6, z0: 0, z1: 10 }, roof, { side: 0 });
  assert.ok(p && Math.max(...p.wall.map((q) => q[0])) < 3 && flat(p.wall).every(Number.isFinite));
});
