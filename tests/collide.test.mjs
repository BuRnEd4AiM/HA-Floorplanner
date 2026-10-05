// Unit tests for collide.js (wall stop; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const C = await import(`${dir}/collide.js`);

const wall = { a: [0, 0], b: [10, 0], thickness: 0.2, openings: [] };      // along x, body from z = -0.1 to 0.1
const foot = () => ({ w: 1, d: 0.6 });                                       // 1 m wide, 0.6 m deep
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
const EX = new Set(C.STOP_EXEMPT_BASE);

test('penetration: depth of the footprint in the wall body, turned with the device', () => {
  near(C.penetration({ rot: 0 }, 5, 1, wall, foot()), 0.1 + 0.3 - 1);           // 0.6 m clear
  near(C.penetration({ rot: 0 }, 5, 0.35, wall, foot()), 0.05);                  // 5 cm in the wall
  near(C.penetration({ rot: 90 }, 5, 0.35, wall, foot()), 0.1 + 0.5 - 0.35);     // turned: the 1 m side faces the wall
  near(C.penetration({}, 5, 0.3, wall, { r: 0.25 }), 0.05);                      // round footprint
});
test('penetration: a doorway lets things through', () => {
  const w = { ...wall, openings: [{ type: 'door', pos: 5, width: 1 }, { type: 'window', pos: 8, width: 1 }] };
  assert.equal(C.penetration({}, 5.2, 0, w, foot()), -1);
  assert.ok(C.penetration({}, 8, 0, w, foot()) > 0);                             // a window does not
});
test('stop: a move into the wall stops, a move away or along it is free', () => {
  const m = { type: 'sofa', x: 5, z: 1, rot: 0 };
  assert.deepEqual(C.stopMove([m], 0, -0.4, [wall], foot, EX), [0, -0.4]);              // up to the wall is fine
  assert.deepEqual(C.stopMove([m], 0, -0.7, [wall], foot, EX), [0, 0]);
  assert.deepEqual(C.stopMove([m], 0, 0.5, [wall], foot, EX), [0, 0.5]);
  assert.deepEqual(C.stopMove([m], 2, 0, [wall], foot, EX), [2, 0]);
});
test('stop: a slanted move slides along the wall', () => {
  const [dx, dz] = C.stopMove([{ type: 'sofa', x: 5, z: 0.41, rot: 0 }], 1, -0.5, [wall], foot, EX);
  near(dx, 1); near(dz, 0);
});
test('stop: a fast move cannot jump through the wall', () => {
  assert.deepEqual(C.stopMove([{ type: 'sofa', x: 5, z: 1, rot: 0 }], 0, -3, [wall], foot, EX), [0, 0]);
});
test('stop: wall-hung things, the LED ring, the bridge and the given outdoor types are not stopped', () => {
  for (const type of ['picture', 'ledring', 'bridge', 'tv_wall']) assert.deepEqual(C.stopMove([{ type, x: 5, z: 1 }], 0, -1, [wall], foot, EX), [0, -1], type);
  assert.deepEqual(C.stopMove([{ type: 'tree', x: 5, z: 1 }], 0, -1, [wall], foot, new Set([...EX, 'tree'])), [0, -1]);
  assert.deepEqual(C.stopMove([{ type: 'tree', x: 5, z: 1 }], 0, -1, [wall], foot, EX), [0, 0]);
});
