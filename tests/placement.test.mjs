// Unit tests for placement.js (snapping and placing; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const P = await import(`${dir}/placement.js`);

const sq = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const inPoly = (x, z, p) => x >= p[0][0] && x <= p[2][0] && z >= p[0][1] && z <= p[2][1];
const walls = [{ a: [0, 0], b: [4, 0], thickness: 0.2 }, { a: [4, 0], b: [4, 3], thickness: 0.2 }];

test('snap: a wall end within 30 cm wins, else the grid', () => {
  assert.deepEqual(P.snapPoint([3.85, 0.1], walls, 0.5), [4, 0]);
  assert.deepEqual(P.snapPoint([1.3, 1.6], walls, 0.5), [1.5, 1.5]);
  assert.deepEqual(P.snapPoint([1.33, 1.61], walls, 0.05).map((v) => +v.toFixed(2)), [1.35, 1.6]);
});
test('wall snap: flat on the face inside the room, facing into it', () => {
  const d = { x: 2, z: 0.5, rot: 0 };
  assert.equal(P.snapToWall(d, walls, [{ points: sq(0, 0, 4, 3) }], inPoly, 2), true);
  assert.deepEqual([d.x, d.z, d.rot], [2, 0.12, 0]);
  const e = { x: 3.4, z: 1.5, rot: 0 };
  P.snapToWall(e, walls, [{ points: sq(0, 0, 4, 3) }], inPoly, 2);
  assert.deepEqual([e.x, e.z, e.rot], [3.88, 1.5, 270]);
});
test('wall snap: without rooms the side the device is on; nothing near: unchanged', () => {
  const d = { x: 2, z: -0.6, rot: 0 };
  P.snapToWall(d, walls, [], inPoly, 2);
  assert.deepEqual([d.x, d.z, d.rot], [2, -0.12, 180]);
  const far = { x: 20, z: 20, rot: 45 };
  assert.equal(P.snapToWall(far, walls, [], inPoly, 2), false);
  assert.deepEqual(far, { x: 20, z: 20, rot: 45 });
});
test('wall types and LED-like lights', () => {
  for (const t of ['picture', 'tv_wall', 'gasmeter', 'heatmeter', 'powermeter']) assert.ok(P.WALL_TYPES.has(t), t);
  assert.ok(!P.WALL_TYPES.has('watermeter') && !P.WALL_TYPES.has('sofa'));
  assert.ok('strip' in P.LED_LIKE && !('lamp' in P.LED_LIKE));
});
test('LED ring: all around the room, just under the ceiling; a 2 x 2 m square outside rooms', () => {
  const r = P.ringAround({ id: 'r1', points: sq(0, 0, 4, 3) }, 1, 1, 0.1, 2.6);
  assert.equal(r.room, 'r1'); assert.equal(r.y, 2.5); assert.equal(r.inset, 0.1); assert.equal(r.rot, 0); assert.ok(r.pts.length >= 4);
  const o = P.ringAround(null, 7, 8, 0.1, 2.6);
  assert.deepEqual([o.x, o.z, o.pts.length, o.closed, o.room], [7, 8, 4, true, undefined]);
});
