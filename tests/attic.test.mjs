// Unit tests for attic.js (a lived-in attic with a knee wall, #260; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const A = await import(`${process.env.STATIC_DIR || '/tmp/static'}/attic.js`);
const S = await import(`${process.env.STATIC_DIR || '/tmp/static'}/solarroof.js`);
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const bb = { x0: 0, x1: 10, z0: 0, z1: 8 };

test('knee wall: only a number counts, never below 0', () => {
  assert.equal(A.kneeOf({}), null);
  assert.equal(A.kneeOf({ knee: '' }), null);
  assert.equal(A.kneeOf({ knee: 'x' }), null);
  assert.equal(A.kneeOf({ knee: 1 }), 1);
  assert.equal(A.kneeOf({ knee: 5 }, 3), 3);
  assert.equal(A.kneeOf({ knee: -1 }), 0);
});

const elev = (i) => i * 3;
test('where the roof starts: on the storey right below, or on a chosen one further down (#265); without a knee wall on top as before', () => {
  const fl = [{ id: 'eg', kind: 'floor' }, { id: 'og', kind: 'floor' }, { id: 'dg', kind: 'floor' }, { id: 'd', kind: 'roof', roof: { knee: 1 } }];
  assert.equal(A.roofBaseIdx(fl, 3), 2);
  assert.equal(A.roofY0(fl, 3, elev), -2);                       // 1 m above the floor of the Dachgeschoss
  fl[3].roof.base = 'og';
  assert.equal(A.roofBaseIdx(fl, 3), 1);
  assert.equal(A.roofY0(fl, 3, elev), -5);                       // two storeys under the slopes
  fl[3].roof.base = 'nope';
  assert.equal(A.roofBaseIdx(fl, 3), 2);                          // an unknown floor: the one right below
  delete fl[3].roof.knee;
  assert.equal(A.roofY0(fl, 3, elev), 0);
});

test('which roof floor cuts the walls: the roof floor itself, and the storeys from where its roof starts', () => {
  const fl = [{ id: 'eg', kind: 'floor' }, { id: 'og', kind: 'floor' }, { id: 'dg', kind: 'floor' }, { id: 'd', kind: 'roof', roof: { knee: 1 } }];
  assert.deepEqual([0, 1, 2, 3].map((i) => A.clipRoofFloor(fl, i)), [-1, -1, 3, 3]);
  fl[3].roof.base = 'og';
  assert.deepEqual([0, 1, 2, 3].map((i) => A.clipRoofFloor(fl, i)), [-1, 3, 3, 3]);
  fl[3].roof = {};
  assert.deepEqual([0, 1, 2, 3].map((i) => A.clipRoofFloor(fl, i)), [-1, -1, -1, 3]);
});

test('gable roof planes: under the slopes is kept, above is cut, a little under the surface; flat roofs cut nothing', () => {
  for (const ridge of ['x', 'z']) {
    const spec = { type: 'gable', pitch: 35, overhang: 0.4, ridge };
    const P = A.roofPlanes(bb, spec, -2);
    assert.equal(P.length, 2);
    for (const [x, z] of [[1, 1], [5, 4], [9, 7], [2, 6]]) {
      const top = S.roofSurfaceAt(bb, spec, x, z).y - 2;           // the roof surface over this point, lifted by y0
      assert.ok(A.underRoof(P, x, top - 0.05, z), `under at ${ridge} ${x},${z}`);
      assert.ok(!A.underRoof(P, x, top + 0.01, z), `above at ${ridge} ${x},${z}`);
      assert.ok(!A.underRoof(P, x, top - 0.01, z), 'the wall ends a few cm under the roof');
    }
  }
  assert.deepEqual(A.roofPlanes(bb, { type: 'flat' }, 0), []);
  assert.deepEqual(A.roofPlanes(null, { type: 'gable' }, 0), []);
});

test('hip roof: the ends slope too', () => {
  const spec = { type: 'hip', pitch: 40, overhang: 0.3 };
  const P = A.roofPlanes(bb, spec, 0);
  assert.equal(P.length, 4);
  for (const [x, z] of [[0.2, 4], [9.8, 4], [5, 0.5], [5, 4]]) {
    const top = S.roofSurfaceAt(bb, spec, x, z).y;
    assert.ok(A.underRoof(P, x, top - 0.05, z) && !A.underRoof(P, x, top + 0.01, z), `${x},${z}`);
  }
  P.forEach(([a, b, c]) => near(Math.hypot(a, b, c), 1));        // unit normals (three.js clipping planes)
});

test('dormers (#265): inside a dormer the wall is kept up to its ceiling, beside it the slope cuts', () => {
  const spec = { type: 'gable', pitch: 35, overhang: 0.4, ridge: 'x', dormers: [{ side: 0, pos: 0.5, w: 2, hw: 1.4, eave: 1, type: 'flat' }] };
  const P = A.roofPlanes(bb, spec, 0), R = A.dormerRooms(bb, spec, 0);
  assert.equal(R.length, 1);
  const q = R[0], x = (q.x0 + q.x1) / 2, z = q.z0 + 0.3;          // inside the dormer, a little behind its front wall
  const slope = S.roofSurfaceAt(bb, spec, x, z).y;
  assert.ok(q.top > slope + 0.5, 'the dormer ceiling is well above the slope there');
  assert.ok(A.keptAt(P, R, x, slope + 0.4, z), 'kept inside the dormer');
  assert.ok(!A.keptAt(P, R, x, q.top + 0.1, z), 'cut above the dormer ceiling');
  assert.ok(!A.keptAt(P, R, q.x1 + 0.3, slope + 0.4, z), 'cut beside the dormer');
  assert.ok(!A.underRoof(P, x, slope + 0.4, z), 'without the dormer it would be cut');
  const g = A.dormerRooms(bb, { ...spec, dormers: [{ ...spec.dormers[0], type: 'gable' }] }, 0)[0];
  assert.ok(g.gh > 0 && A.keptAt(P, [g], g.at, g.top + g.gh * 0.9, z) && !A.keptAt(P, [g], g.x0 + 0.05, g.top + g.gh * 0.9, z), 'a gable dormer is higher in its middle');
  assert.deepEqual(A.dormerRooms(bb, { type: 'flat', dormers: spec.dormers }, 0), []);
});

test('a wall reaches up into a dormer only where its middle line runs into the dormer room (#654)', () => {
  // the demo's case: a knee wall 0.24 m thick on the outer wall line (z = 0), the dormer front 0.3 m behind it (overhang 0.5, eave 0.8):
  // its room starts 25 cm in front of the front (z = 0.05), so the inner side of the knee wall lay in it and hid the dormer's window
  const spec = { type: 'gable', pitch: 35, overhang: 0.5, knee: 1, ridge: 'x', dormers: [{ side: 0, pos: 0.2, eave: 0.8 }] };
  const [q] = A.dormerRooms(bb, spec, 0);
  near(q.z0, 0.05);
  assert.deepEqual(A.roomsOfWall([q], [0, 0], [10, 0]), [], 'the knee wall in front of it: cut at the slope everywhere');
  assert.deepEqual(A.roomsOfWall([q], [0, 0.3], [10, 0.3]), [q], 'a wall right under its front reaches into it');
  assert.deepEqual(A.roomsOfWall([q], [0, 0.05], [10, 0.05]), [q], 'touching counts (a wall up to 25 cm in front takes its window, dormerwin.js)');
  assert.deepEqual(A.roomsOfWall([q], [q.at, 0], [q.at, 8]), [q], 'a wall across it, from the outer wall back');
  assert.deepEqual(A.roomsOfWall([q], [q.x1 + 0.5, 0], [q.x1 + 0.5, 8]), [], 'a wall beside it');
  assert.deepEqual(A.roomsOfWall([q], [q.at, 1], [q.at, 1]), [q], 'a point inside');
  assert.deepEqual(A.roomsOfWall(null, [0, 0], [1, 0]), []);
});

test('shed dormer (#339): the wall under it reaches up to its sloping roof, on either side of the roof', () => {
  for (const side of [0, 1]) {
    const spec = { type: 'gable', pitch: 35, overhang: 0.4, ridge: 'x', dormers: [{ side, pos: 0.5, w: 6, hw: 1.8, eave: 0.4, type: 'shed', sp: 10 }] };
    const P = A.roofPlanes(bb, spec, 0), [q] = A.dormerRooms(bb, spec, 0);
    near(q.rise, Math.tan((10 * Math.PI) / 180));
    assert.equal(q.dir, side === 0 ? 1 : -1);
    const x = (q.x0 + q.x1) / 2, front = side === 0 ? 0 : 8, z = (k) => front + q.dir * k;   // k metres behind the outer wall
    assert.ok(A.keptAt(P, [q], x, q.top - 0.05, z(0.1)), 'up to the front wall height at the front');
    assert.ok(A.keptAt(P, [q], x, q.top + 0.25, z(2)), 'higher further back: the roof climbs');
    assert.ok(!A.keptAt(P, [q], x, q.top + q.rise * 2 + 0.05, z(2)), 'but not above the sloping roof');
    assert.ok(!A.keptAt(P, [q], q.x1 + 0.3, q.top - 0.05, z(0.1)), 'beside the dormer the slope cuts');
  }
  const flat = A.dormerRooms(bb, { type: 'gable', pitch: 35, ridge: 'x', dormers: [{ type: 'flat' }] }, 0)[0];
  assert.equal(flat.rise, 0, 'other dormers have a level ceiling');
});

test('ridge height: set by the pitch, and the pitch for a typed height', () => {
  const spec = { type: 'gable', pitch: 35, overhang: 0.4, ridge: 'x' };   // 8 m deep: 4 m from the wall line to the ridge
  near(A.ridgeHeight(bb, spec), 4 * Math.tan((35 * Math.PI) / 180));
  near(A.pitchFor(bb, spec, 4), 45, 0.06);
  assert.equal(A.pitchFor(bb, spec, 100), 70);
  assert.equal(A.pitchFor(bb, spec, 0), 5);
  assert.equal(A.ridgeHeight(bb, { type: 'flat' }), 0);
});

test('the roof over a floor: the one that cuts its walls, else a roof floor right above; none under another storey', () => {
  const fl = [{ id: 'eg', kind: 'floor' }, { id: 'og', kind: 'floor' }, { id: 'dg', kind: 'floor' }, { id: 'd', kind: 'roof', roof: { knee: 1, base: 'og' } }];
  assert.deepEqual([0, 1, 2, 3].map((i) => A.coverRoofFloor(fl, i)), [-1, 3, 3, 3]);
  fl[3].roof = {};
  assert.deepEqual([0, 1, 2, 3].map((i) => A.coverRoofFloor(fl, i)), [-1, -1, 3, 3]);
  assert.equal(A.coverRoofFloor([{ kind: 'floor' }], 0), -1);
});

test('room view (#306): the roof is drawn over a room only when it cuts the floor or a dormer lies over the room', () => {
  const room = [[1, 1], [4, 1], [4, 3], [1, 3]];
  assert.equal(A.roofOverRoom({ cuts: false, dormers: [], pts: room }), false);              // the roof just sits on top: not over the room
  assert.equal(A.roofOverRoom({ cuts: true, dormers: [], pts: room }), true);                // a knee wall: the slope cuts the room
  assert.equal(A.roofOverRoom({ cuts: false, dormers: [{ x0: 3, x1: 5, z0: 0, z1: 2 }], pts: room }), true);   // a dormer over the room
  assert.equal(A.roofOverRoom({ cuts: false, dormers: [{ x0: 6, x1: 8, z0: 0, z1: 2 }], pts: room }), false);  // a dormer elsewhere
});

test('roof with steps (#342): every slope piece cuts only along its own stretch', () => {
  const spec = { type: 'gable', pitch: 45, overhang: 0, ridge: 'x', steps: [{ side: 0, at: 5, out: 1 }] };   // 10 x 8 m, side A 1 m out from x 5
  const P = A.roofPlanes(bb, spec, 0);
  assert.equal(P.length, 3, 'side B, and two pieces of side A');
  assert.ok(P.filter((p) => p.length === 7).length === 2 && P.some((p) => p.length === 4), 'the pieces carry their stretch');
  // at z = 0.5 (0.5 m inside the narrow part's eave): narrow slope y = 0.5, wide slope y = 4 * 1.5 / 5 = 1.2
  assert.ok(A.underRoof(P, 2, 0.4, 0.5) && !A.underRoof(P, 2, 0.6, 0.5), 'the narrow part: its own 45° slope');
  assert.ok(A.underRoof(P, 8, 1.1, 0.5) && !A.underRoof(P, 8, 1.3, 0.5), 'the wide part: the flatter slope');
  assert.ok(A.underRoof(P, 8, 0.1, -0.5), 'the wide part reaches out beyond the box');
  const plain = A.roofPlanes(bb, { ...spec, steps: [] }, 0), before = A.roofPlanes(bb, { type: 'gable', pitch: 45, overhang: 0, ridge: 'x' }, 0);
  assert.deepEqual(plain, before, 'without steps the planes are the same as before');
});

test('a further roof (#621): like the main roof (on its knee wall too), on top of a storey, or on top of the house', () => {
  const fl = [{ id: 'eg', kind: 'floor' }, { id: 'dg', kind: 'floor' }, { id: 'd', kind: 'roof', roof: { knee: 1 } }];
  assert.equal(A.partY0(fl, 2, { level: 'main' }, elev), -2, 'the same height as the main roof: 1 m above the floor of the Dachgeschoss');
  assert.equal(A.partY0(fl, 2, { level: 'main' }, elev), A.roofY0(fl, 2, elev));
  assert.equal(A.partY0(fl, 2, {}, elev), 0, 'on top of the house, as before');
  assert.equal(A.partY0(fl, 2, { level: 'eg' }, elev), -3, 'on top of the Erdgeschoss (an annex), as before');
  assert.equal(A.partY0(fl, 2, { level: 'd' }, elev), 0, 'a roof floor is no storey to sit on');
  assert.equal(A.partY0(fl, 2, { level: 'gone' }, elev), 0);
  delete fl[2].roof.knee;
  assert.equal(A.partY0(fl, 2, { level: 'main' }, elev), 0, 'without a knee wall the main roof sits on top of the house');
});

test('an L-shaped house (#621): the walls are cut at the roof over them, the main roof or the wing, not at the main roof everywhere', () => {
  // wing A 0..12 x 0..8 (ridge along x), wing B 0..7 x 4..15 (ridge along z), both 45°, no overhang, on the same knee wall (y 0)
  const main = { type: 'gable', pitch: 45, overhang: 0, ridge: 'x' }, wing = { type: 'gable', pitch: 45, overhang: 0, ridge: 'z' };
  const bA = { x0: 0, x1: 12, z0: 0, z1: 8 }, bB = { x0: 0, x1: 7, z0: 4, z1: 15 };
  const clip = A.joinCuts([{ planes: A.roofPlanes(bA, main), rooms: [], box: null }, { planes: A.roofPlanes(bB, wing), rooms: [], box: A.roofReach(bB, wing) }]);
  assert.deepEqual(clip.groups.map((g) => g.n), [2, 2]);
  const kept = (x, y, z) => A.keptAt(clip.planes, clip.rooms, x, y, z, clip.groups);
  assert.ok(kept(3.5, 3.4, 12) && !kept(3.5, 3.6, 12), 'in wing B: up to its ridge (3.5 m over the knee wall)');
  assert.ok(!A.keptAt(A.roofPlanes(bA, main), [], 3.5, 0.5, 12), 'before: the main roof alone cut wing B down to nothing');
  assert.ok(kept(0.1, 0.05, 12) && !kept(0.1, 0.2, 12), 'its eave side: only the knee wall');
  assert.ok(kept(10, 3.9, 4) && !kept(10, 4.1, 4), 'in wing A: up to the main ridge (4 m)');
  assert.ok(kept(10, 0.3, 7.6) && !kept(10, 0.5, 7.6), 'the eave of wing A away from wing B (walls end 3 cm under the roof)');
  assert.ok(kept(0, 3.9, 4), 'the gable wall of wing A where wing B joins: the higher of the two roofs');
  assert.ok(!kept(20, 0.5, 12), 'outside both roofs: cut (as with one roof)');
  assert.equal(A.keptAt(clip.planes, [], 3.5, 3.4, 12), false, 'without the groups: every plane counts, as before');
  const P = A.planesAt(clip, 3.5, 12);
  assert.deepEqual(P, A.roofPlanes(bB, wing), 'a cabinet in wing B fits under the slopes of wing B');
  assert.deepEqual(A.planesAt(clip, 10, 4), A.roofPlanes(bA, main), 'one in wing A under the main roof');
  assert.deepEqual(A.planesAt({ planes: A.roofPlanes(bA, main), rooms: [] }, 10, 4), A.roofPlanes(bA, main), 'one roof, no groups: its planes');
  assert.equal(A.planesAt(null, 1, 1), null);
});

test('joining cuts: nothing is cut when a roof without slopes counts everywhere (a flat main roof), as before', () => {
  const gable = A.roofPlanes(bb, { type: 'gable', pitch: 45, overhang: 0 });
  assert.equal(A.joinCuts([]), null);
  assert.equal(A.joinCuts([{ planes: [], rooms: [], box: null }, { planes: gable, rooms: [], box: bb }]), null);
  assert.equal(A.joinCuts([{ planes: [], rooms: [], box: bb }]), null);
  const one = A.joinCuts([{ planes: gable, rooms: [], box: null }]);
  assert.deepEqual(one.planes, gable);
  assert.deepEqual(one.groups, [{ n: gable.length, box: null }]);
  const flatWing = A.joinCuts([{ planes: gable, rooms: [], box: null }, { planes: [], rooms: [], box: { x0: 20, x1: 30, z0: 0, z1: 8 } }]);
  assert.ok(A.keptAt(flatWing.planes, [], 25, 9, 4, flatWing.groups), 'under a flat further roof nothing is cut');
  assert.deepEqual(A.roofReach(bb, { overhang: 0.5 }), { x0: -0.5, x1: 10.5, z0: -0.5, z1: 8.5 });
});
