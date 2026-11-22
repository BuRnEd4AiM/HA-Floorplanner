// Unit tests for lightwell.js (light wells at the basement windows, #786; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const L = await import(`${dir}/lightwell.js`);
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

// a basement 6 × 10 m (floor 0) under a ground floor (floor 1); a window in the front wall (z = 0), one in the inner wall (z = 5)
function house(win = {}, more = {}) {
  const op = { id: 'w1', type: 'window', pos: 2, width: 1, height: 0.6, sill: 1.6, ...win };
  return [
    { id: 'kg', kind: 'basement', rooms: [{ id: 'k1', points: rect(0, 0, 6, 5) }, { id: 'k2', points: rect(0, 5, 6, 10) }],
      walls: [{ id: 'front', a: [0, 0], b: [6, 0], thickness: 0.3, openings: [op] },
        { id: 'inner', a: [0, 5], b: [6, 5], thickness: 0.2, openings: [{ id: 'w2', type: 'window', pos: 3, width: 1, sill: 1.6 }] },
        { id: 'door', a: [6, 0], b: [6, 10], thickness: 0.3, openings: [{ id: 'd1', type: 'door', pos: 2, width: 0.9, sill: 0 }] }], ...more },
    { id: 'eg', rooms: [{ id: 'e1', points: rect(0, 0, 6, 10) }], walls: [] },
  ];
}
const ELEV = -2.75;                       // the basement floor 2.75 m under the ground floor

test('size: the window + 15 cm on each side and 50 cm deep, its own size within the limits', () => {
  assert.deepEqual(L.wellSize({ width: 1 }), { w: 1.3, d: 0.5 });
  assert.deepEqual(L.wellSize({ width: 1, wellW: 2, wellD: 0.8 }), { w: 2, d: 0.8 });
  assert.deepEqual(L.wellSize({ width: 1, wellW: 99, wellD: 0.01 }), { w: L.WELL.wMax, d: L.WELL.dMin });
  assert.deepEqual(L.wellSize({}), { w: 1.3, d: 0.5 });
  const op = { width: 1 };
  L.setWellSize(op, 'wellD', 0.8); assert.equal(op.wellD, 0.8);
  L.setWellSize(op, 'wellD', 3); assert.equal(op.wellD, L.WELL.dMax);
  L.setWellSize(op, 'wellD', 0.5); assert.equal(op.wellD, undefined, 'the default is not stored');
  L.setWellSize(op, 'wellW', 1.8); assert.equal(op.wellW, 1.8);
  L.setWellSize(op, 'wellW', ''); assert.equal(op.wellW, undefined);
});

test('a basement window under the lawn gets a well outside, in front of the wall', () => {
  const ws = L.lightWells(house(), 0, 1, ELEV);
  assert.equal(ws.length, 1, 'only the outer window; not the inner one, not the door');
  const w = ws[0];
  assert.equal(w.op.id, 'w1');
  near(w.nz, -1); near(w.nx, 0);                         // outwards: towards the street (z < 0)
  near(w.x, 2); near(w.z, -0.15);                        // the middle of the outer face at the window
  assert.equal(w.w, 1.3); assert.equal(w.d, 0.5);
  near(w.rim, 0 + L.WELL.rim - ELEV);                    // 10 cm over the lawn
  near(w.bottom, 1.6 - L.WELL.below);
  near(w.deep, 0 - (ELEV + 1.6));
  const zs = w.ring.map((p) => p[1]), xs = w.ring.map((p) => p[0]);
  near(Math.max(...zs), -0.14); near(Math.min(...zs), -0.65);   // from just inside the wall face out 50 cm
  near(Math.min(...xs), 1.35); near(Math.max(...xs), 2.65);
});

test('the other side of the wall: the well goes out there', () => {
  const fl = house();
  fl[0].walls[0] = { ...fl[0].walls[0], a: [6, 0], b: [0, 0], openings: [{ ...fl[0].walls[0].openings[0], pos: 4 }] };
  const [w] = L.lightWells(fl, 0, 1, ELEV);
  near(w.nz, -1); near(w.x, 2);
});

test('no well: switched off, the sill over the ground, a floor not below the ground floor', () => {
  assert.equal(L.lightWells(house({ noWell: true }), 0, 1, ELEV).length, 0);
  assert.equal(L.lightWells(house(), 0, 1, ELEV, () => -2).length, 0, 'the ground 2 m lower: the sill (−1.15) lies over it');
  assert.equal(L.lightWells(house(), 0, 1, ELEV, () => -1.13).length, 0, 'within WELL.free');
  assert.equal(L.lightWells(house(), 0, 1, ELEV, () => -1.0).length, 1);
  assert.equal(L.lightWells(house(), 1, 1, 0).length, 0, 'the ground floor itself');
  assert.equal(L.lightWells(house(), 0, 0, ELEV).length, 0, 'no ground floor above');
  assert.equal(L.lightWells(house({ type: 'door' }), 0, 1, ELEV).length, 0);
});

test('on a slope the top of the well follows the highest ground around it', () => {
  const hf = (x, z) => -0.65 + z * 0.1;                  // higher towards the house
  const [w] = L.lightWells(house(), 0, 1, ELEV, hf);
  near(w.rim, -0.65 + -0.014 + L.WELL.rim - ELEV);       // the corners just inside the wall face (z = −0.14) are the highest
  near(w.deep, (-0.65 + -0.04) - (ELEV + 1.6));          // under its middle
});

test('the ground: a plateau has its own top, else the terrain or 0', () => {
  const g = L.groundFn([{ points: rect(-1, -1, 7, 11), rise: 0.65 }, { points: rect(10, 10, 12, 12) }], (x) => -x);
  near(g(3, 3), 0.65); near(g(-3, -3), 3); near(L.groundFn([], null)(5, 5), 0); near(g.base(3, 3), -3);
});

test('a plateau: the well on it starts at its top; one reaching out beyond it stays down at the lawn', () => {
  const on = L.lightWells(house(), 0, 1, ELEV, L.groundFn([{ points: rect(-2, -2, 8, 12), rise: 0.65 }]));
  near(on[0].rim, 0.65 + L.WELL.rim - ELEV);
  const edge = L.lightWells(house(), 0, 1, ELEV, L.groundFn([{ points: rect(-0.36, -0.36, 6.36, 10.36), rise: 0.65 }]));
  near(edge[0].rim, L.WELL.rim - ELEV, 1e-6);
});

test('the state for the panel', () => {
  const fl = house(), w = fl[0].walls[0], op = w.openings[0];
  assert.equal(L.wellState(fl, 0, 1, ELEV, () => 0, w, op), 'on');
  assert.equal(L.wellState(fl, 0, 1, ELEV, () => -2, w, op), 'free');
  assert.equal(L.wellState(fl, 0, 1, ELEV, () => 0, w, { ...op, noWell: true }), 'off');
  assert.equal(L.wellState(fl, 0, 1, ELEV, () => 0, fl[0].walls[1], fl[0].walls[1].openings[0]), 'inner');
  assert.equal(L.wellState(fl, 1, 1, 0, () => 0, w, op), 'none');
});
