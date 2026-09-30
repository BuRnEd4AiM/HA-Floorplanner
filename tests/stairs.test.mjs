// Pure geometry tests for stairs.js (run: cp floorplan3d/rootfs/app/static/stairs.js /tmp/stairs.mjs && STAIRS_MJS=/tmp/stairs.mjs node --test tests/stairs.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const S = await import(process.env.STAIRS_MJS || '/tmp/stairs.mjs');
const H = 3;
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

for (const type of S.STAIR_TYPES) {
  for (const turn of ['left', 'right']) {
    test(`${type}/${turn}: climbs exactly one floor in strictly rising steps`, () => {
      const st = { ...S.stairDefaults(type), turn };
      const { treads } = S.stairLocal(st, H);
      const { n, rise } = S.stairSteps(H);
      assert.equal(treads.length, n - 1);
      treads.forEach((t, i) => { near(t.top, (i + 1) * rise); });
      near(treads.at(-1).top + rise, H);                       // the last riser arrives at the upper floor
    });
  }
}

test('turn side mirrors an L stair across the walking axis', () => {
  const r = S.stairBounds({ ...S.stairDefaults('L'), turn: 'right' }, H);
  const l = S.stairBounds({ ...S.stairDefaults('L'), turn: 'left' }, H);
  near(r.z1, -l.z0); near(r.z0, -l.z1); near(r.x1, l.x1);
});

test('world/local conversion round-trips and rotates like a device', () => {
  const st = { x: 2, z: 3, rot: 90 };
  const [wx, wz] = S.toWorld(st, 1, 0);
  near(wx, 2); near(wz, 2);                                    // rot 90: local +x points to world -z (three.js rotation.y)
  const [lx, lz] = S.toLocal(st, wx, wz);
  near(lx, 1); near(lz, 0);
});

test('stairHit finds treads only', () => {
  const st = { ...S.stairDefaults('straight'), x: 0, z: 0, rot: 0 };
  assert.ok(S.stairHit(st, 1, 0, H));
  assert.ok(!S.stairHit(st, 1, 2, H));
  assert.ok(!S.stairHit(st, -1, 0, H));
});

test('holes: up-stair opens the floor above, down-stair its own floor', () => {
  const up = { ...S.stairDefaults('straight'), x: 0, z: 0, rot: 0, dir: 'up' };
  const dn = { ...S.stairDefaults('L'), x: 5, z: 5, rot: 0, dir: 'down' };
  const floors = [{ stairs: [up] }, { stairs: [dn] }, { stairs: [] }];
  assert.equal(S.holesForFloor(floors, 0, H).length, 0);
  assert.equal(S.holesForFloor(floors, 1, H).length, 2);       // up from floor 0 + own down stair
  assert.equal(S.holesForFloor(floors, 2, H).length, 0);       // a 'down' stair on floor 1 does not open floor 2
});

test('hole starts where headroom is missing, not at the bottom', () => {
  const st = { ...S.stairDefaults('straight'), x: 0, z: 0, rot: 0 };
  const hole = S.stairLocal(st, H).hole;
  const xs = hole.map((p) => p[0]);
  assert.ok(Math.min(...xs) > 1.0, 'no opening over the first steps');
  near(Math.max(...xs), S.stairBounds(st, H).x1);
});

test('size handles sit at the end of the run and at its side', () => {
  const st = { ...S.stairDefaults('straight') };
  const h = S.stairHandles(st, H), L = S.stairLength(st, H);
  near(h.len[0], L); near(h.len[1], 0); near(h.wid[1], st.w / 2);
  const sp = S.stairHandles({ ...S.stairDefaults('spiral') }, H);
  assert.equal(sp.len, null); near(sp.wid[0], 0.9);
  const l = S.stairLength({ ...S.stairDefaults('L'), tread: 0.3 }, H), c = S.stairCounts({}, H);
  near(l, c.n1 * 0.3);
});
