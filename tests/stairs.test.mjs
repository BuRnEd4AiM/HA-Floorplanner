// Pure geometry tests for stairs.js (run like offline.test.mjs: copy the static folder to /tmp/static, then STATIC_DIR=/tmp/static node --test tests/stairs.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const S = await import(`${process.env.STATIC_DIR || '/tmp/static'}/stairs.js`);
const H = 3;
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

for (const type of S.STAIR_TYPES.filter((q) => q !== 'wall')) {      // the wall stair needs a path and has its own tests below
  for (const turn of ['left', 'right']) {
    test(`${type}/${turn}: climbs exactly one floor in strictly rising steps`, () => {
      const st = { ...S.stairDefaults(type), turn };
      const treads = S.stairLocal(st, H).treads.filter((t) => !t.exit);   // without the landing at the top of a spiral (#233)
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

test('the opening covers the whole stair, not only its upper part', () => {
  for (const type of ['straight', 'L', 'U']) {
    const st = { ...S.stairDefaults(type), x: 0, z: 0, rot: 0 };
    const hole = S.stairLocal(st, H).hole, b = S.stairBounds(st, H);
    const xs = hole.map((p) => p[0]), zs = hole.map((p) => p[1]);
    near(Math.min(...xs), b.x0); near(Math.max(...xs), b.x1); near(Math.min(...zs), b.z0); near(Math.max(...zs), b.z1);
  }
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

/* ---- several floors ---- */
test('spiral over 2 floors (#236): a turn per floor, a landing at floor level on each, rising steps in between', () => {
  const st = { ...S.stairDefaults('spiral'), floors: 2 };
  const all = S.stairLocal(st, H).treads, treads = all.filter((t) => !t.exit), exits = all.filter((t) => t.exit);
  const { n, rise } = S.stairSteps(H);
  assert.equal(treads.length, 2 * (n - 1));
  assert.deepEqual(exits.map((t) => +t.top.toFixed(6)), [H, 2 * H]);       // you step off on the floor in between and at the top
  near(treads[n - 2].top, H - rise); near(treads[n - 1].top, H + rise); near(treads.at(-1).top, 2 * H - rise);
  for (let i = 1; i < all.length; i++) assert.ok(all[i].top > all[i - 1].top);
  assert.ok(all.filter((t) => t.storey === 1).length === n);                // the second turn and its landing are storey 1
});
for (const type of ['straight', 'L', 'U']) {
  test(`${type} over 2 floors (#229): the same stair again one floor higher, so it arrives on the floor in between`, () => {
    const one = S.stairLocal({ ...S.stairDefaults(type) }, H).treads, two = S.stairLocal({ ...S.stairDefaults(type), floors: 2 }, H).treads;
    const steps = two.filter((t) => t.storey !== 1 || t.thin > S.SLAB);         // without the plate that closes a gap on the floor in between
    assert.equal(steps.length, 2 * one.length);
    const { rise } = S.stairSteps(H);
    near(one[one.length - 1].top, H - rise);                                   // the first storey ends one step below the floor in between ...
    near(steps[one.length].top, H + rise);                                     // ... and the second starts one step above it, at the same spot
    assert.deepEqual(steps[one.length].poly, one[0].poly);
    near(steps[steps.length - 1].top, 2 * H - rise);
    for (let i = 1; i < two.length; i++) assert.ok(two[i].top > two[i - 1].top);
    assert.ok(two.filter((t) => t.storey === 1).every((t) => t.thin > 0 && t.thin <= rise + S.SLAB + 1e-9));   // upper storey: a slab, not solid down to the floor
    assert.deepEqual(S.stairLocal({ ...S.stairDefaults(type), floors: 2 }, H).hole, S.stairLocal({ ...S.stairDefaults(type) }, H).hole);
    const c1 = S.stairCounts({ type }, H), c2 = S.stairCounts({ type, floors: 2 }, H);
    assert.deepEqual(c1, c2);                                                   // counts and length are those of one storey
  });
}
test('U over 2 floors (#229): where flight 2 ends behind the start, a plate at floor level closes the gap', () => {
  const st = { ...S.stairDefaults('U'), floors: 2 };
  const { n1, n2 } = S.stairCounts(st, H);
  const plates = S.stairLocal(st, H).treads.filter((t) => t.thin === S.SLAB);
  if (n2 > n1) { assert.equal(plates.length, 1); near(plates[0].top, H); } else assert.equal(plates.length, 0);
});
test('landing at the turn (#229): L and U get a deeper landing, flight 2 moves on by as much', () => {
  for (const type of ['L', 'U']) {
    const a = S.stairLocal({ ...S.stairDefaults(type) }, H), b = S.stairLocal({ ...S.stairDefaults(type), landing: 0.8 }, H);
    const { n1 } = S.stairCounts({ type }, H);
    const size = (t) => { const xs = t.poly.map((p) => p[0]), zs = t.poly.map((p) => p[1]); return [Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)]; };
    const la = size(a.treads[n1]), lb = size(b.treads[n1]);
    near(lb[0] * lb[1] - la[0] * la[1], 0.8 * (type === 'L' ? la[0] : la[1]));
    assert.equal(a.treads.length, b.treads.length);
  }
  const l0 = S.stairLocal({ ...S.stairDefaults('L') }, H).treads.at(-1).poly, l1 = S.stairLocal({ ...S.stairDefaults('L'), landing: 0.8 }, H).treads.at(-1).poly;
  near(l1[0][1] - l0[0][1], 0.8);
  near(S.stairLocal({ ...S.stairDefaults('straight'), landing: 2 }, H).hole[1][0], S.stairLocal({ ...S.stairDefaults('straight') }, H).hole[1][0]);   // a straight stair has no turn
});
test('floors is limited to 1..6 and defaults to 1', () => {
  assert.equal(S.stairFloors({}), 1);
  assert.equal(S.stairFloors({ floors: 0 }), 1);
  assert.equal(S.stairFloors({ floors: 3 }), 3);
  assert.equal(S.stairFloors({ floors: 99 }), S.MAX_FLOORS);
});
test('a spiral over 2 floors makes two turns (one per floor, each its own storey), a spiral over 1 floor makes one', () => {
  const ang = (st) => { const t = S.stairLocal(st, H).treads; const p = t[t.length - 1].poly[2]; return Math.atan2(p[1], p[0]); };
  const steps = (st, k = 0) => S.stairLocal(st, H).treads.filter((t) => !t.exit && (t.storey || 0) === k);
  const one = steps({ ...S.stairDefaults('spiral') }), two = steps({ ...S.stairDefaults('spiral'), floors: 2 }), two2 = steps({ ...S.stairDefaults('spiral'), floors: 2 }, 1);
  assert.equal(two2.length, one.length);                                        // each storey turns once on its own
  const turn = (t, k) => Math.atan2(t[k].poly[1][1], t[k].poly[1][0]);
  const per = (t) => { let tot = 0; for (let k = 1; k < t.length; k++) { let d = turn(t, k) - turn(t, k - 1); while (d < -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI; tot += Math.abs(d); } return tot; };
  assert.ok(Math.abs(per(one) / (2 * Math.PI) - 1) < 0.1, String(per(one) / (2 * Math.PI)));
  assert.ok(Math.abs(per(two) / (2 * Math.PI) - 1) < 0.1, String(per(two) / (2 * Math.PI)));
  assert.ok(Math.abs(per(two2) / (2 * Math.PI) - 1) < 0.1, String(per(two2) / (2 * Math.PI)));
});
test('holes: an up stair cuts every floor it climbs through, a down stair every floor it descends through', () => {
  const up = { id: 'u', ...S.stairDefaults('straight'), floors: 2, x: 0, z: 0 };
  const floors = [{ stairs: [up] }, { stairs: [] }, { stairs: [] }, { stairs: [] }];
  assert.deepEqual([0, 1, 2, 3].map((i) => S.holesForFloor(floors, i, H).length), [0, 1, 1, 0]);
  const down = { id: 'd', ...S.stairDefaults('straight'), floors: 2, dir: 'down', x: 0, z: 0 };
  const f2 = [{ stairs: [] }, { stairs: [] }, { stairs: [down] }, { stairs: [] }];
  assert.deepEqual([0, 1, 2, 3].map((i) => S.holesForFloor(f2, i, H).length), [0, 1, 1, 0]);
});
test('a stair over one floor still cuts only the floor above (as before)', () => {
  const up = { id: 'u', ...S.stairDefaults('U'), x: 0, z: 0 };
  assert.deepEqual([0, 1, 2].map((i) => S.holesForFloor([{ stairs: [up] }, { stairs: [] }, { stairs: [] }], i, H).length), [0, 1, 0]);
});
test('arriving stairs: the stairs from lower floors that reach this floor', () => {
  const a = { id: 'a', ...S.stairDefaults('straight'), floors: 2 }, b = { id: 'b', ...S.stairDefaults('straight') }, c = { id: 'c', ...S.stairDefaults('straight'), dir: 'down' };
  const floors = [{ stairs: [a, c] }, { stairs: [b] }, { stairs: [] }];
  assert.deepEqual(S.arrivingStairs(floors, 1).map((q) => q.st.id), ['a']);
  assert.deepEqual(S.arrivingStairs(floors, 2).map((q) => q.st.id).sort(), ['a', 'b']);
  assert.deepEqual(S.arrivingStairs(floors, 0), []);
});

/* ---- wall stair ---- */
const wallSt = (path, extra = {}) => ({ ...S.stairDefaults('wall'), path, ...extra });
test('wall stair, one straight stretch: steps are thin plates hanging on the path, rising by one riser each', () => {
  const st = wallSt([[0, 0], [4.5, 0]]);
  const { treads } = S.stairLocal(st, H);
  const { n, rise } = S.stairSteps(H);
  assert.equal(treads.length, n - 1);
  treads.forEach((t, i) => { near(t.top, (i + 1) * rise); assert.equal(t.thin, S.THIN); });
  const xs = treads.flatMap((t) => t.poly.map((p) => p[0])), zs = treads.flatMap((t) => t.poly.map((p) => p[1]));
  near(Math.min(...xs), 0); near(Math.max(...xs), 4.5);
  near(Math.min(...zs), 0); near(Math.max(...zs), st.w);          // turn 'right' = the steps stick out to +z (right of the walking direction)
});
test('wall stair: turn left puts the steps on the other side of the path', () => {
  const zs = S.stairLocal(wallSt([[0, 0], [4.5, 0]], { turn: 'left' }), H).treads.flatMap((t) => t.poly.map((p) => p[1]));
  near(Math.max(...zs), 0); near(Math.min(...zs), -0.9);
});
test('wall stair with one bend: a landing in the corner, steps shared by length, heights keep rising', () => {
  const st = wallSt([[0, 0], [3, 0], [3, 3]]);                // turns to +z = towards the step side (right): inner corner
  const plan = S.wallStairPlan(st, S.stairSteps(H).n - 1);
  assert.equal(plan.landings.length, 1); assert.equal(plan.landings[0].kind, 'in');
  assert.equal(plan.flights.length, 2);
  near(plan.flights[0].len, 3 - 0.9); near(plan.flights[1].len, 3 - 0.9);                   // the landing takes one width from both flights
  assert.equal(plan.flights[0].k + plan.flights[1].k + 1, S.stairSteps(H).n - 1);
  const { treads } = S.stairLocal(st, H);
  assert.equal(treads.length, S.stairSteps(H).n - 1);
  for (let i = 1; i < treads.length; i++) assert.ok(treads[i].top > treads[i - 1].top);
});
test('wall stair: a longer stretch gets more steps', () => {
  const plan = S.wallStairPlan(wallSt([[0, 0], [4, 0], [4, 1.5]], { w: 0.5 }), 15);
  assert.ok(plan.flights[0].k > plan.flights[1].k, JSON.stringify(plan.flights.map((f) => f.k)));
  assert.equal(plan.flights.reduce((a, f) => a + f.k, 0), 14);
});
test('wall stair, outer bend: the landing lies beyond the corner on the step side and the next flight starts at the corner', () => {
  const plan = S.wallStairPlan(wallSt([[0, 0], [3, 0], [3, -3]]), 15);       // turns away from the step side (right)
  assert.equal(plan.landings[0].kind, 'away');
  near(plan.flights[0].len, 3); near(plan.flights[1].len, 3);
  const { treads } = S.stairLocal(wallSt([[0, 0], [3, 0], [3, -3]]), H);
  const land = treads.find((t) => t.poly.some((p) => Math.abs(p[0] - 3) < 1e-9 && Math.abs(p[1]) < 1e-9) && t.poly.some((p) => p[0] > 3.5));
  assert.ok(land, 'landing quad beyond the corner');
});
test('wall stair with two landings (a stair with a landing in between that continues)', () => {
  const st = wallSt([[0, 0], [3, 0], [3, 3], [0, 3]]);
  const plan = S.wallStairPlan(st, S.stairSteps(H).n - 1);
  assert.equal(plan.landings.length, 2); assert.equal(plan.flights.length, 3);
  assert.equal(plan.flights.reduce((a, f) => a + f.k, 0) + 2, S.stairSteps(H).n - 1);
});
test('wall stair over 2 floors (#236): the same stair again one floor higher, arriving on the floor in between; one hole around it', () => {
  const st = wallSt([[0, 0], [5, 0], [5, 4], [0, 4]], { floors: 2 });
  const g = S.stairLocal(st, H), one = S.stairLocal({ ...st, floors: 1 }, H);
  assert.equal(g.treads.length, 2 * one.treads.length);
  const up = g.treads.filter((t) => t.storey === 1);
  assert.deepEqual(up[0].poly, one.treads[0].poly); near(up[0].top, H + one.treads[0].top);
  assert.ok(up.every((t) => t.thin === S.THIN));                              // still light plates
  near(Math.max(...one.treads.map((t) => t.top)), H - S.stairSteps(H).rise);  // the first storey arrives one step below the floor in between
  assert.ok(g.hole.length >= 4);
  const xs = g.hole.map((p) => p[0]); assert.ok(Math.min(...xs) <= 0.01 && Math.max(...xs) >= 4.99);
});
test('wall stair: bounds, hit test and handles work like for the other stairs', () => {
  const st = { ...wallSt([[0, 0], [4.5, 0]]), x: 10, z: 5 };
  const b = S.stairBounds(st, H);
  near(b.x1 - b.x0, 4.5); near(b.z1 - b.z0, 0.9);
  assert.ok(S.stairHit(st, 12, 5.4, H));
  assert.ok(!S.stairHit(st, 12, 4.6, H));
  const h = S.stairHandles(st, H);
  assert.equal(h.len, null); near(h.wid[0], 2.25); near(h.wid[1], 0.9);
});
test('wall stair: dragging the width handle gives the distance from the path', () => {
  const st = wallSt([[0, 0], [4, 0]]);
  near(S.wallStairWidthAt(st, 2, 1.2), 1.2);
  near(S.wallStairWidthAt({ ...st, turn: 'left' }, 2, -0.7), 0.7);
});
test('wall stair without a usable path has no steps and does not crash', () => {
  assert.equal(S.stairLocal(wallSt([]), H).treads.length, 0);
  assert.equal(S.stairLocal(wallSt([[0, 0]]), H).treads.length, 0);
  assert.equal(S.stairLocal({ ...S.stairDefaults('wall') }, H).treads.length, 0);
});
const room = [{ a: [0, 0], b: [10, 0], thickness: 0.2 }, { a: [10, 0], b: [10, 6], thickness: 0.2 }, { a: [10, 6], b: [0, 6], thickness: 0.2 }, { a: [0, 6], b: [0, 0], thickness: 0.2 }];
test('path from clicks: a stretch along a wall moves onto the wall face on the step side', () => {
  // walking +x along the top wall (z = 0) with the steps to the right (+z): the face looking into the room is at z = +0.1
  const p = S.wallPathFromClicks([[1, 0.3], [4, 0.2]], room, 'right');
  near(p[0][1], 0.1); near(p[1][1], 0.1); near(p[0][0], 1); near(p[1][0], 4);
});
test('path from clicks: steps to the left use the other face of the wall', () => {
  const p = S.wallPathFromClicks([[1, -0.2], [4, -0.3]], room, 'left');
  near(p[0][1], -0.1); near(p[1][1], -0.1);
});
test('path from clicks: a bend between two walls lands exactly in the inner corner of the room', () => {
  // along the top wall to the right, then down the right wall; steps to the right = into the room
  const p = S.wallPathFromClicks([[2, 0.3], [9.7, 0.3], [9.7, 3]], room, 'right');
  near(p[1][0], 9.9); near(p[1][1], 0.1);                          // inner corner: x = 10 - 0.1, z = 0 + 0.1
  near(p[2][0], 9.9); near(p[2][1], 3);
  near(p[0][1], 0.1);
});
test('path from clicks: a stretch far from every wall stays, and one click gives one point', () => {
  assert.deepEqual(S.wallPathFromClicks([[3, 3], [5, 3]], room, 'right'), [[3, 3], [5, 3]]);
  assert.deepEqual(S.wallPathFromClicks([[3, 3]], room, 'right'), [[3, 3]]);
});
test('path from clicks: a wall that is not parallel to the stretch is ignored', () => {
  assert.deepEqual(S.wallPathFromClicks([[5, 1], [5, 3]], [{ a: [0, 0], b: [10, 0], thickness: 0.2 }], 'right', 5), [[5, 1], [5, 3]]);
});
test('wall stair: the arrow runs through the middle of the steps and turns exactly at the bend', () => {
  const g = S.stairLocal(wallSt([[0, 0], [3, 0], [3, 3]]), H);
  assert.equal(g.arrow.length, 3);
  near(g.arrow[0][1], 0.45); near(g.arrow[1][0], 2.55); near(g.arrow[1][1], 0.45); near(g.arrow[2][0], 2.55); near(g.arrow[2][1], 3);
});
test('spiral (#209): thin steps on a middle pole, nothing below them, a hand rail along the outside', () => {
  const st = { ...S.stairDefaults('spiral'), floors: 2 }, L = S.stairLocal(st, H);
  assert.ok(L.treads.every((t) => t.thin === S.THIN));
  L.treads = L.treads.filter((t) => !t.exit);
  for (const t of L.treads) {
    near(Math.hypot(...t.poly[0]), S.POLE_R); near(Math.hypot(...t.poly[t.poly.length - 1]), S.POLE_R);   // the step starts at the pole
    near(Math.hypot(...t.poly[1]), st.w);                                                                  // and reaches the outer radius
  }
  const top = L.treads[L.treads.length - 1].top;
  near(L.pole.r, S.POLE_R); near(L.pole.h, top + S.RAIL_H);
  assert.equal(L.rail.length, L.treads.length);
  L.rail.forEach(([x, y, z], k) => { near(y, L.treads[k].top + S.RAIL_H); near(Math.hypot(x, z), st.w - S.RAIL_IN); });
  assert.equal(S.stairLocal({ ...S.stairDefaults('straight') }, H).pole, undefined);
});
/* ---- landings of a wall stair (#210) ---- */
test('wall stair (#210): "landing after a bend" keeps the stair flat that long after the corner, at the corner height', () => {
  const st = wallSt([[0, 0], [3, 0], [3, 4]], { landing: 1 }), T = S.stairSteps(H).n - 1;
  const plan = S.wallStairPlan(st, T);
  near(plan.landings[0].flat.len, 1);
  near(plan.flights[1].from[1], st.w + 1);                                 // the next flight starts one width plus 1 m after the corner
  const { treads } = S.stairLocal(st, H);
  assert.equal(new Set(treads.map((t) => t.top)).size, T);                // the corner and the flat stretch share one height
  const corner = treads.filter((t) => Math.abs(t.top - treads[plan.flights[0].k].top) < 1e-9);
  assert.equal(corner.length, 2);
  for (let i = 1; i < treads.length; i++) assert.ok(treads[i].top >= treads[i - 1].top);
});
test('wall stair (#210): a point in the middle of a straight stretch is a landing of its own', () => {
  const st = wallSt([[0, 0], [2.5, 0], [5, 0]]), T = S.stairSteps(H).n - 1;
  const plan = S.wallStairPlan(st, T);
  assert.equal(plan.landings[0].kind, 'straight');
  near(plan.landings[0].flat.len, st.w);                                 // one width long without a setting
  near(plan.flights[1].from[0], 2.5 + st.w);
  const { treads } = S.stairLocal(st, H);
  assert.equal(treads.length, T);
  const flat = treads[plan.flights[0].k];
  assert.ok(flat.poly.every(([x]) => x >= 2.5 - 1e-9 && x <= 2.5 + st.w + 1e-9));
  near(S.wallStairPlan(wallSt([[0, 0], [2.5, 0], [5, 0]], { landing: 1.5 }), T).landings[0].flat.len, 1.5);
});
test('wall stair (#210): the landing length is limited to 0..3 m, 0 is only the corner as before', () => {
  assert.equal(S.landingLength({}), 0); assert.equal(S.landingLength({ landing: 9 }), S.MAX_LANDING); assert.equal(S.landingLength({ landing: -1 }), 0);
  const plan = S.wallStairPlan(wallSt([[0, 0], [3, 0], [3, 3]]), 15);
  assert.equal(plan.landings[0].flat, null);
});
test('storeys shown (#229): on its own floor only the first storey, one floor up two, all in the whole-house view or coming down', () => {
  const st = { ...S.stairDefaults('U'), floors: 3 };
  assert.equal(S.storeysShown(st, 1, 1, false), 0);
  assert.equal(S.storeysShown(st, 1, 2, false), 1);
  assert.equal(S.storeysShown(st, 1, 1, true), Infinity);
  assert.equal(S.storeysShown({ ...st, dir: 'down' }, 1, 1, false), Infinity);
});
test('wall stair (#232): two landings with no step between them lie at one height, the stair arrives all the same', () => {
  for (const path of [[[0, 0], [5, 0], [5, 0.5], [5, 3.5]], [[0, 0], [5, 0], [5.3, 0.2], [5.3, 3.5]]]) {
    const st = { type: 'wall', x: 0, z: 0, w: 0.9, turn: 'right', floors: 1, landing: 1, path };
    const plan = S.wallStairPlan(st, S.stairSteps(H).n - 1);
    assert.equal(plan.flights[1].k, 0); assert.ok(plan.landings[1].merged && !plan.landings[0].merged);
    const tr = S.stairLocal(st, H).treads, { n, rise } = S.stairSteps(H);
    const tops = [...new Set(tr.map((t) => t.top.toFixed(6)))];
    near(Math.max(...tr.map((t) => t.top)), (n - 1) * rise);                    // still arrives one step below the floor above
    assert.equal(tops.length, n - 1);                                           // every height from one rise up to the top, none skipped
    const flat = tr.filter((t) => Math.abs(t.top - tr[plan.flights[0].k].top) < 1e-9);
    assert.ok(flat.length >= 2, String(flat.length));                           // the corner and the second landing: one level
  }
});
test('spiral (#233): a quarter landing at floor level after the last step, out to the edge of the opening', () => {
  for (const floors of [1, 2]) {
    const st = { ...S.stairDefaults('spiral'), floors }, tr = S.stairLocal(st, H).treads, ex = tr.filter((t) => t.exit);
    assert.equal(ex.length, floors); assert.equal(tr.at(-1), ex.at(-1)); ex.reverse();
    near(ex[0].top, floors * H);                                                // at the height of the floor above
    const r = ex[0].poly.map((p) => Math.hypot(...p));
    near(Math.max(...r), st.w + 0.05); near(Math.min(...r), S.POLE_R);          // from the pole to the edge of the round opening
    const last = tr.at(-2).poly, a1 = Math.atan2(last[last.length - 2][1], last[last.length - 2][0]), e0 = Math.atan2(ex[0].poly[0][1], ex[0].poly[0][0]);
    near(Math.cos(a1 - e0), 1, 1e-6);                                           // it starts where the last step ends
  }
});
test('split at a storey (#246): the live mode leaves out the storeys above the open floor, the editor draws them see-through', () => {
  const sp = { ...S.stairDefaults('spiral'), floors: 3 }, L = S.stairLocal(sp, H);
  const p = S.splitStoreys(L, 0, H);
  assert.ok(p.below.treads.length && p.below.treads.every((t) => (t.storey || 0) === 0));
  assert.equal(p.below.treads.length + p.above.treads.length, L.treads.length);
  assert.ok(p.below.treads.some((t) => t.exit && Math.abs(t.top - H) < 1e-6));             // the landing on the floor in between stays
  assert.ok(p.below.rail.length > 1 && p.below.rail.every(([, y]) => y <= H + S.RAIL_H + 1e-6));   // the hand rail ends there ...
  assert.deepEqual(p.above.rail[0], p.below.rail.at(-1));                                    // ... and the rest runs on from that point
  assert.equal(p.below.rail.length + p.above.rail.length - 1, L.rail.length);
  near(p.below.poleH + p.above.poleH, L.pole.h); near(p.below.poleH, H + S.RAIL_H);
  const whole = S.splitStoreys(L, Infinity, H);                                               // the whole-house view: nothing above
  assert.equal(whole.above, null); assert.equal(whole.below.treads.length, L.treads.length); near(whole.below.poleH, L.pole.h);
  const u = S.stairLocal({ ...S.stairDefaults('U'), floors: 2 }, H), pu = S.splitStoreys(u, 0, H);   // no rail, no pole
  assert.ok(pu.above.treads.length && pu.above.treads.every((t) => t.storey === 1));
  assert.deepEqual(pu.below.rail, []); assert.equal(pu.below.poleH, 0);
  assert.equal(S.splitStoreys(S.stairLocal(S.stairDefaults('straight'), H), 0, H).above, null);   // one floor: nothing to split
});
