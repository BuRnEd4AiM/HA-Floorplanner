// Unit tests for earth.js and roomlight.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const E = await import(`${dir}/earth.js`);
const L = await import(`${dir}/roomlight.js`);

const sq = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const bbox = (ring) => [Math.min(...ring.map((p) => p[0])), Math.max(...ring.map((p) => p[0])), Math.min(...ring.map((p) => p[1])), Math.max(...ring.map((p) => p[1]))];

test('house footprint: two touching rooms become one outline', () => {
  const floors = [{ kind: 'floor', walls: [], rooms: [{ points: sq(0, 0, 4, 3) }, { points: sq(4, 0, 8, 3) }] }];
  const f = E.houseFootprint(floors, 0);
  assert.equal(f.length, 1);
  assert.deepEqual(bbox(f[0]), [0, 8, 0, 3]);
});
test('house footprint: walls add their thickness (plus 1 cm), blocks count as house', () => {
  const floors = [{ kind: 'floor', walls: [{ a: [0, 0], b: [4, 0], thickness: 0.2 }], rooms: [], blocks: [{ points: sq(10, 0, 12, 2) }] }];
  const f = E.houseFootprint(floors, 0);
  assert.equal(f.length, 2);
  const w = f.map(bbox).find((b) => b[0] < 1);
  assert.ok(Math.abs(w[0] + 0.11) < 1e-9 && Math.abs(w[1] - 4.11) < 1e-9 && Math.abs(w[2] + 0.11) < 1e-9 && Math.abs(w[3] - 0.11) < 1e-9, String(w));
});
test('house footprint: only floors up to the ground floor; basements only on request', () => {
  const floors = [
    { kind: 'basement', walls: [], rooms: [{ points: sq(0, 0, 4, 4) }] },
    { kind: 'floor', walls: [], rooms: [{ points: sq(0, 0, 10, 4) }] },
    { kind: 'floor', walls: [], rooms: [{ points: sq(0, 0, 20, 4) }] }];
  assert.deepEqual(bbox(E.houseFootprint(floors, 1)[0]), [0, 10, 0, 4]);
  assert.deepEqual(bbox(E.houseFootprint(floors, 1, true)[0]), [0, 4, 0, 4]);
  assert.deepEqual(E.houseFootprint([{ kind: 'floor', walls: [], rooms: [] }], 0), []);
});
test('cut line: the stretches through the earth between the ground outline and the house', () => {
  const rings = [sq(-5, -5, 15, 15), sq(0, 0, 10, 10)];                 // ground with the house cut out
  const ts = E.cutCrossings(-10, 5, 1, 0, rings);                         // a horizontal line at z = 5
  assert.deepEqual(ts, [5, 10, 20, 25]);                                  // earth from x = -5 to 0 and from 10 to 15
});
test('cut plane: on the facade facing the camera, just inside the outer wall; none straight from above', () => {
  const info = { cx: 5, cz: 5, corners: sq(0, 0, 10, 10) };
  const c = E.cutPlane({ x: 30, z: 6 }, info);
  assert.equal(c.dx, 1); assert.equal(c.dz, 0);
  assert.ok(Math.abs(c.px - 9.92) < 1e-9 && c.pz === 5);
  assert.equal(E.cutPlane({ x: 5, z: -40 }, info).dz, -1);
  assert.equal(E.cutPlane({ x: 5, z: 5 }, info), null);
});
test('colour scale: ends outside, mixed in between, exact at a stop', () => {
  const stops = [{ v: 18, c: '#0000ff' }, { v: 22, c: '#00ff00' }, { v: 26, c: '#ff0000' }];
  assert.equal(L.colorFromStops(stops, 10), 0x0000ff);
  assert.equal(L.colorFromStops(stops, 30), 0xff0000);
  assert.equal(L.colorFromStops(stops, 22), 0x00ff00);
  assert.equal(L.colorFromStops(stops, 20), 0x008080);
});
test('hex helpers', () => {
  assert.equal(L.cssHex('#ff9500'), 0xff9500);
  const v = L.hexVec(0xff8000);
  assert.deepEqual([v.x, v.y, +v.z.toFixed(3)], [1, 128 / 255, 0]);
});
test('every lamp profile has a reach and a strength', () => {
  for (const [k, p] of Object.entries(L.LIGHT_PROFILE)) assert.ok(p.r > 0 && p.k > 0, k);
  assert.equal(L.MAX_LIGHTS, 8);
});
