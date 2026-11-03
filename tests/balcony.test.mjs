// Unit tests for balcony.js (balconies and roof terraces, #646; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const B = await import(`${dir}/balcony.js`);
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const sq = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const ring = (p, x1, z1) => [[[0, 0], [x1, 0]], [[x1, 0], [x1, z1]], [[x1, z1], [0, z1]], [[0, z1], [0, 0]]].map(([a, b], i) => ({ id: `${p}${i}`, a, b, thickness: 0.3 }));
const balcony = (extra = {}) => ({ id: 'bal', terrace: true, points: sq(3, -1.8, 7, -0.15), ...extra });
const slope = (x, z) => (z >= 7 ? 0 : z <= -0.15 ? -3 : (-3 * (7 - z)) / 7.15);   // 0 at the back of the house, 3 m lower in front

test('rail: metal unless glass or wood', () => {
  assert.equal(B.cleanRail(undefined), 'metal');
  assert.equal(B.cleanRail('glass'), 'glass');
  assert.equal(B.cleanRail('wood'), 'wood');
  assert.equal(B.cleanRail('gold'), 'metal');
});

test('outside share: all, half, nothing', () => {
  const house = B.storeyOutline([{ walls: [], rooms: [{ points: sq(0, 0, 10, 7) }] }]);
  near(B.outsideShare(sq(3, -2, 7, 0), house), 1);
  near(B.outsideShare(sq(3, -1, 7, 1), house), 0.5);
  near(B.outsideShare(sq(3, 2, 7, 4), house), 0);
  near(B.outsideShare(sq(3, 2, 7, 4), []), 1);
});

test('the outline of a storey leaves its open terraces out', () => {
  const polys = B.storeyOutline([{ walls: [], rooms: [{ points: sq(0, 0, 4, 4) }, { terrace: true, points: sq(4, 0, 8, 4) }] }]);
  assert.equal(polys.length, 1);
});

test('ground floor: a balcony over the slope hangs free, not on level ground', () => {
  const floors = [{ id: 'KG', kind: 'basement', walls: ring('k', 10, 7), rooms: [{ id: 'k0', points: sq(0, 0, 10, 7) }] },
    { id: 'EG', walls: ring('e', 10, 7), rooms: [{ id: 'e0', points: sq(0, 0, 10, 7) }, balcony()] }];
  assert.deepEqual([...B.freeBalconies(floors, 1, 1, slope)], ['bal']);
  assert.equal(B.freeBalconies(floors, 1, 1, null).size, 0);                    // level: a terrace on the ground
  assert.equal(B.freeBalconies(floors, 1, 1, () => -0.1).size, 0);              // the ground only a little lower: it stands on it
  assert.equal(B.freeBalconies(floors, 0, 1, slope).size, 0);                   // never in the basement
});

test('ground floor: a terrace over the basement does not hang free', () => {
  const floors = [{ id: 'KG', kind: 'basement', walls: [], rooms: [{ id: 'k0', points: sq(0, -2, 10, 7) }] },
    { id: 'EG', walls: ring('e', 10, 7), rooms: [{ id: 'e0', points: sq(0, 0, 10, 7) }, balcony()] }];
  assert.equal(B.freeBalconies(floors, 1, 1, slope).size, 0);
});

test('upper floor: beyond the storey below it hangs free, over it (a roof terrace on the garage) not', () => {
  const eg = { id: 'EG', walls: ring('e', 10, 7), rooms: [{ id: 'e0', points: sq(0, 0, 10, 7) }, { id: 'g', points: sq(10, 0, 14, 6) }] };
  const og = { id: 'OG', walls: ring('o', 10, 7), rooms: [{ id: 'o0', points: sq(0, 0, 10, 7) }, balcony(), { id: 'roof', terrace: true, points: sq(10, 0, 14, 6) }] };
  assert.deepEqual([...B.freeBalconies([eg, og], 1, 0, null)], ['bal']);
  assert.deepEqual([...B.freeBalconies([eg, { ...og, rooms: og.rooms.filter((r) => r.id !== 'bal') }], 1, 0, null)], []);
});

test('upper floor: over a terrace on the ground it still hangs free', () => {
  const eg = { id: 'EG', walls: ring('e', 10, 7), rooms: [{ id: 'e0', points: sq(0, 0, 10, 7) }, { id: 't', terrace: true, points: sq(3, -2, 7, 0) }] };
  const og = { id: 'OG', walls: ring('o', 10, 7), rooms: [balcony()] };
  assert.deepEqual([...B.freeBalconies([eg, og], 1, 0, null)], ['bal']);
});

test('without rooms: only that floor loses them', () => {
  const floors = [{ rooms: [{ id: 'a' }, { id: 'b' }] }, { rooms: [{ id: 'a' }] }];
  const out = B.withoutRooms(floors, 0, new Set(['a']));
  assert.deepEqual(out[0].rooms, [{ id: 'b' }]);
  assert.equal(out[1], floors[1]);
  assert.equal(B.withoutRooms(floors, 0, new Set())[0], floors[0]);
  assert.equal(B.withoutRooms(floors, 0, undefined)[0], floors[0]);
});

test('railing runs: not along the wall of the house, round the three open sides', () => {
  const walls = ring('e', 10, 7);
  const runs = B.railRuns(sq(3, -1.8, 7, 0), (x, z) => B.atWall(walls, x, z));
  assert.equal(runs.length, 3);
  const len = runs.reduce((s, r) => s + Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1]), 0);
  assert.ok(len > 4 + 1.5 * 2 && len < 4 + 1.8 * 2 + 0.01, String(len));
  assert.equal(B.railRuns(sq(0, 0, 4, 4), () => true).length, 0);
  assert.equal(B.railRuns(sq(0, 0, 4, 4), () => false).length, 4);
});

test('railing parts: metal as before, glass panes between the posts, wooden slats', () => {
  const metal = B.railParts(2.4, undefined);
  assert.equal(metal.filter((p) => p.mat === 'metal' && p.u1 - p.u0 < 0.1).length, 3);     // posts every 1.2 m: at 0, 1.2, 2.4
  assert.equal(metal.filter((p) => p.u1 - p.u0 > 2).length, 2);                            // the top rail and the knee rail
  near(Math.max(...metal.map((p) => p.y1)), 1.025);
  const glass = B.railParts(2.4, 'glass');
  assert.equal(glass.filter((p) => p.mat === 'glass').length, 2);
  assert.ok(glass.filter((p) => p.mat === 'glass').every((p) => p.u1 - p.u0 > 1 && p.th < 0.02));
  const wood = B.railParts(2.4, 'wood');
  assert.ok(wood.every((p) => p.mat === 'wood'));
  assert.ok(wood.filter((p) => p.th === 0.02).length >= 15, 'slats');
  assert.ok(wood.every((p) => p.u0 >= -0.05 && p.u1 <= 2.45));
});

test('supports: the two outer corners of a balcony, inside its edges', () => {
  const walls = ring('e', 10, 7);
  const spots = B.supportSpots(sq(3, -1.8, 7, -0.15), (x, z) => B.atWall(walls, x, z, 0.3));
  assert.equal(spots.length, 2);
  const s = spots.map(([x, z]) => [+x.toFixed(2), +z.toFixed(2)]).sort((a, b) => a[0] - b[0]);
  assert.deepEqual(s, [[3.12, -1.68], [6.88, -1.68]]);
  const rev = B.supportSpots(sq(3, -1.8, 7, -0.15).reverse(), (x, z) => B.atWall(walls, x, z, 0.3));   // the other way round: the same
  assert.equal(rev.length, 2);
});

test('supports: a long free edge gets more in between, an inner corner none', () => {
  const long = B.supportSpots(sq(0, -2, 8, 0), (x, z) => z > -0.5);
  assert.equal(long.length, 3);                                                     // 2 corners + 1 in the middle of the 8 m edge
  assert.ok(long.some(([x, z]) => Math.abs(x - 4) < 1e-6 && Math.abs(z + 1.88) < 1e-6));
  const L = [[0, 0], [4, 0], [4, 2], [2, 2], [2, 4], [0, 4]];                       // an L: the corner at (2, 2) points inwards
  const spots = B.supportSpots(L);
  assert.equal(spots.length, 5);
  assert.ok(!spots.some(([x, z]) => Math.abs(x - 2) < 0.3 && Math.abs(z - 2) < 0.3));
});
