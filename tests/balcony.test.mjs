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

test('#703: a terrace on the garage that reaches out beyond it hangs free only where it reaches out', () => {
  // the basement: the hobby room and the garage; the slope falls in front (z > 6.25); the terrace lies on the garage and reaches 2 m out,
  // also in front of the living room (over the hobby room's window)
  const KG = { id: 'KG', kind: 'basement', walls: ring('k', 14.5, 6.25), rooms: [{ id: 'hobby', points: sq(0, 0, 8, 6.25) }, { id: 'garage', raise: -0.5, points: sq(8, 0, 14.5, 6.25) }] };
  const ter = { id: 'ter', terrace: true, points: [[8, 0], [14.5, 0], [14.5, 8.25], [3.75, 8.25], [3.75, 6.25], [8, 6.25]] };
  const EG = { id: 'EG', walls: ring('e', 8, 6.25), rooms: [{ id: 'wohnen', points: sq(0, 0, 8, 6.25) }, ter] };
  const hill = (x, z) => (z <= 6.4 ? 0 : -3.15);                                   // the ground in front of the garage door 3.15 m lower
  const parts = B.freeParts([KG, EG], 1, 1, hill);
  assert.deepEqual([...parts.keys()], ['ter']);
  const p = parts.get('ter');
  assert.equal(p.whole, false);                                                    // the rest lies on the garage
  assert.equal(p.rings.length, 1);
  const xs = p.rings[0].map((q) => q[0]), zs = p.rings[0].map((q) => q[1]);
  near(Math.min(...xs), 3.75); near(Math.max(...xs), 14.5); near(Math.max(...zs), 8.25);
  near(Math.min(...zs), 6.25 + 0.15 + B.BALCONY.gap);                              // from the outer face of the basement wall (and a little off it)
  assert.deepEqual([...B.freeBalconies([KG, EG], 1, 1, hill)], ['ter']);
  assert.equal(B.freeParts([KG, EG], 1, 1, null).size, 0);                         // level: a terrace on the ground
  assert.equal(B.freeParts([KG, EG], 1, 1, () => -0.1).size, 0);                   // the ground only a little lower: it stands on it
  // the ground floor's outline without the free part: the plinth and the hole in the earth end at the basement (earth.js)
  const foot = B.withoutParts([[[-0.2, -0.2], [14.7, -0.2], [14.7, 6.45], [14.5, 6.45], [14.5, 8.25], [3.75, 8.25], [3.75, 6.45], [-0.2, 6.45]]], parts);
  assert.equal(foot.length, 1);
  assert.ok(Math.max(...foot[0].map((q) => q[1])) < 6.5, JSON.stringify(foot));
});

test('#703: a small seam beyond the storey below is no balcony, a whole balcony is "whole"', () => {
  const floors = [{ id: 'KG', kind: 'basement', walls: ring('k', 10, 7), rooms: [{ id: 'k0', points: sq(0, 0, 10, 7) }] },
    { id: 'EG', walls: ring('e', 10, 7), rooms: [{ id: 'e0', points: sq(0, 0, 10, 7) }, { id: 'seam', terrace: true, points: sq(0, 0.5, 4, 7.25) }, balcony()] }];
  const parts = B.freeParts(floors, 1, 1, slope);
  assert.deepEqual([...parts.keys()], ['bal']);                                    // 10 cm beyond the wall face: left out
  assert.equal(parts.get('bal').whole, true);
});

test('without parts: nothing to cut, the rings as they are', () => {
  const rings = [sq(0, 0, 4, 4)];
  assert.equal(B.withoutParts(rings, new Map()), rings);
  assert.equal(B.withoutParts(rings, undefined), rings);
  const cut = B.withoutParts(rings, new Map([['a', { rings: [sq(0, 3, 4, 5)] }]]));
  assert.equal(cut.length, 1);
  near(Math.max(...cut[0].map((q) => q[1])), 3);
});

test('ring width: a strip its width, a square half its side, nothing 0', () => {
  near(B.ringWidth(sq(0, 0, 100, 0.02)), 0.02, 1e-3);
  near(B.ringWidth(sq(0, 0, 2, 2)), 1);
  assert.equal(B.ringWidth([[0, 0], [1, 1]]), 0);
  assert.equal(B.ringWidth(undefined), 0);
});

test('on the outline: inside, near the edge, away from it', () => {
  const polys = B.storeyOutline([{ walls: [], rooms: [{ points: sq(0, 0, 10, 7) }] }]);
  assert.ok(B.onOutline(polys, 5, 3));
  assert.ok(B.onOutline(polys, 5, 7.2));
  assert.ok(!B.onOutline(polys, 5, 7.5));
  assert.ok(!B.onOutline([], 5, 3));
});

test('#703: a terrace drawn as two rooms: no railing where they join', () => {
  const a = { id: 'a', terrace: true, points: sq(0, 0, 6, 6) }, b = { id: 'b', terrace: true, points: sq(0, 6, 6, 8) };
  const runs = B.railRuns(a.points, (x, z) => B.atRoom([b], x, z));
  assert.equal(runs.length, 3);
  assert.ok(runs.every((r) => !(Math.abs(r.a[1] - 6) < 1e-6 && Math.abs(r.b[1] - 6) < 1e-6)), JSON.stringify(runs));
  assert.ok(!B.atRoom([b], 3, 5.5));
  assert.ok(B.atRoom([b], 3, 7));
  assert.ok(!B.atRoom([{ id: 'x', points: [[0, 0]] }], 0, 0));                      // a room without an area
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
