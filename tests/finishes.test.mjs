// Unit tests for finishes.js (finishes of floors, walls and the facade, #448; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const F = await import(`${dir}/finishes.js`);
const P = await import(`${dir}/patterns.js`);

const HEX = /^#[0-9a-f]{6}$/;
test('every pattern: offered somewhere, under a heading of that place, drawn by a known kind, with colours, a size and its colour palette', () => {
  for (const [k, p] of Object.entries(F.PATTERNS)) {
    assert.ok(p.on.length && p.on.every((o) => ['floor', 'wall', 'facade'].includes(o)), k);
    p.on.forEach((o) => assert.ok(F.GROUPS[o].includes(p.group), `${k} has no heading on ${o}`));
    assert.ok(p.kind in P.KINDS, `${k}: unknown kind ${p.kind}`);
    assert.match(p.color, HEX, k);
    if (p.color2 !== undefined) assert.match(p.color2, HEX, k);
    assert.equal(!!p.color2, !!p.c2, `${k}: a second colour says what it is (c2)`);
    assert.ok(p.size >= F.SIZE.min && p.size <= F.SIZE.max, k);
    assert.ok(F.PALETTES[p.pal]?.every((c) => HEX.test(c)), k);
    assert.ok(p.rough >= 0 && p.rough <= 1 && p.bump >= 0, k);
  }
});

test('the old floor coverings are still there (saved plans keep their floors), and many more', () => {
  for (const k of ['parquet', 'parquetLight', 'parquetDark', 'tiles', 'tilesSmall', 'tilesDark', 'concrete']) assert.ok(F.PATTERNS[k].on.includes('floor'), k);
  const n = (w) => F.choices(w).reduce((a, [, l]) => a + l.length, 0);
  assert.ok(n('floor') >= 25 && n('wall') >= 25 && n('facade') >= 10, `${n('floor')} floors, ${n('wall')} walls, ${n('facade')} facades`);
  for (const k of ['woodchip', 'plaster', 'wpStripes', 'wpDamask', 'wTiles', 'wMetro', 'brick']) assert.ok(F.PATTERNS[k].on.includes('wall'), k);
  assert.deepEqual(F.choices('wall').map(([g]) => g), ['paint', 'paper', 'tiles', 'stone', 'wood'], 'the walls: paint & plaster, wallpaper, tiles, stone, wood');
});

test('cleaning what is stored: colours, a size in its limits, an angle in 0..360, only patterns for that place', () => {
  assert.deepEqual(F.cleanLook({ color: '#AABBCC', color2: 'red', size: 9, angle: -45, x: 1 }), { color: '#aabbcc', size: 5, angle: 315 });
  assert.equal(F.cleanLook({}), undefined);
  assert.equal(F.cleanLook('x'), undefined);
  assert.deepEqual(F.cleanFinish({ pattern: 'woodchip', color: '#ffffff', size: 0.001 }, 'wall'), { pattern: 'woodchip', color: '#ffffff', size: 0.01 });
  assert.equal(F.cleanFinish({ pattern: 'woodchip' }, 'floor'), undefined, 'no woodchip on a floor');
  assert.equal(F.cleanFinish({ pattern: 'parquet' }, 'wall'), undefined);
  assert.equal(F.cleanFinish({ pattern: 'toString' }, 'wall'), undefined);
  assert.equal(F.cleanFinish({ pattern: 'woodCladding' }, 'wall'), undefined, 'wood cladding is for the facade');
  assert.ok(F.cleanFinish({ pattern: 'woodCladding' }, 'side'), 'a side of a wall takes facade patterns too (it may face outside)');
  assert.deepEqual(F.cleanBelow({ pattern: 'wTiles' }), { pattern: 'wTiles', height: 1.2 }, 'tiles up to 1.20 m to start with');
  assert.equal(F.cleanBelow({ pattern: 'wTiles', height: 9 }).height, 3);
  assert.deepEqual(F.cleanFaces({ left: { pattern: 'wpDamask' }, right: { pattern: 'nope' } }), { left: { pattern: 'wpDamask' } });
  assert.equal(F.cleanFaces({ right: { pattern: 'nope' } }), undefined);
});

test('a finish filled in from its pattern: colours, size, angle, the colour from afar, how far one picture reaches', () => {
  const t = F.resolve({ pattern: 'tiles' });
  assert.equal(t.kind, 'grid');
  assert.deepEqual(t.rep, [1.2, 1.2], 'four 30 cm tiles per picture');
  assert.equal(t.angle, 0);
  assert.match(t.mean, HEX);
  const u = F.resolve({ pattern: 'tiles', color: '#000000', size: 0.6, angle: 45 });
  assert.equal(u.color, '#000000'); assert.equal(u.color2, '#bdb5a8'); assert.deepEqual(u.rep, [2.4, 2.4]); assert.equal(u.angle, 45);
  assert.equal(F.resolve({ pattern: 'woodPanel' }).angle, 90, 'wood panels stand upright');
  assert.equal(F.resolve({ pattern: 'woodchip' }).color2, null);
  assert.equal(F.resolve({ pattern: 'nope' }), null);
  assert.equal(F.resolve(null), null);
  assert.equal(F.texKey(t), F.texKey(F.resolve({ pattern: 'tiles', size: 1, angle: 30 })), 'size and angle do not need another picture');
  assert.notEqual(F.texKey(t), F.texKey(u));
  assert.equal(F.mixHex('#000000', '#ffffff', 0.5), '#808080');
});

test('one picture of every kind covers whole elements, so it repeats without a seam', () => {
  assert.deepEqual(F.repeatOf('bond', { ar: 2 }, 0.15), [0.3, 4 * 0.075], 'metro: two tiles across, four rows');
  assert.equal(F.bondRows(3), 6);
  const hb = F.repeatOf('herringbone', { n: 5 }, 0.1);
  assert.ok(Math.abs(hb[0] - 2 * 5 * Math.SQRT2 * 0.1) < 1e-9 && hb[0] === hb[1]);
  for (const k of Object.keys(P.KINDS)) { const r = F.repeatOf(k, {}, 0.5); assert.ok(r[0] > 0 && r[1] > 0, k); }
});

test('texture coordinates: the floor from the corner of the room, turned by the angle; the wall from the floor up, not mirrored behind', () => {
  const fin = F.resolve({ pattern: 'tiles' });                         // 1.2 m per picture
  const o = F.floorOrigin([[2, 3], [6, 3], [6, 7], [2, 7]]);
  assert.deepEqual(o, [2, 3]);
  const near = (a, b) => a.every((x, i) => Math.abs(x - b[i]) < 1e-9);
  assert.ok(near(F.floorUV(fin, 3.2, 3, o), [1, 0]));
  const turned = { ...fin, angle: 90 };
  const [u, v] = F.floorUV(turned, 3.2, 3, o);
  assert.ok(Math.abs(u) < 1e-9 && Math.abs(v + 1) < 1e-9, 'turned by 90°');
  assert.ok(near(F.wallUV(fin, 1, 1.2, 0), [1, 0]));
  assert.ok(near(F.wallUV(fin, -1, 1.2, 1.2), [-1, 1]), 'the other side runs the other way (seen from there it is the same)');
});

// two rooms side by side drawn on the middle of the walls, a wall between them and an outer wall along both
const A = { id: 'A', points: [[0, 0], [4, 0], [4, 3], [0, 3]], wallLook: { pattern: 'woodchip' } };
const B = { id: 'B', points: [[4, 0], [7, 0], [7, 3], [4, 3]], wallLook: { pattern: 'wpStripes', color: '#112233' }, wallBelow: { pattern: 'wTiles', height: 1.2 } };
const inner = { id: 'w1', a: [4, 0], b: [4, 3], thickness: 0.2 };
const outer = { id: 'w2', a: [0, 0], b: [7, 0], thickness: 0.3 };

test('which room is on which side of a wall: the inner wall has a room on each side, the outer wall two rooms inside and nothing outside', () => {
  const l = F.sideSpans(inner, [A, B], -1), r = F.sideSpans(inner, [A, B], 1);
  assert.deepEqual(l.map((s) => s.room?.id ?? null), [null, 'B', null], 'left of a→b (going +z): +x is B; the ends reach into the next walls');
  assert.deepEqual(r.map((s) => s.room?.id ?? null), [null, 'A', null]);
  assert.ok(Math.abs(r[0].from + 0.1) < 1e-9 && Math.abs(r[2].to - 3.1) < 1e-9, 'over the whole wall and half the thickness into the corners');
  assert.ok(Math.abs(r[1].from) < 1e-9 && Math.abs(r[1].to - 3) < 1e-9, 'the room from corner to corner');
  const inside = F.sideSpans(outer, [A, B], 1).filter((s) => s.room);
  assert.deepEqual(inside.map((s) => s.room.id), ['A', 'B']);
  assert.ok(Math.abs(inside[0].from) < 1e-9, 'A starts at the corner');
  assert.ok(Math.abs(inside[0].to - 4) < 1e-9, 'A ends at the middle of the inner wall');
  assert.deepEqual(F.sideSpans(outer, [A, B], -1).map((s) => s.room), [null]);
  assert.deepEqual(F.sideSpans({ a: [1, 1], b: [1, 1] }, [A], 1), []);
});

test('what the sides get: the room finishes (the lower part with its height), the facade only outside the house, an accent wall wins', () => {
  const sk = F.wallSkins(inner, [A, B]);
  assert.equal(sk[1][0].upper.key, 'woodchip');
  assert.equal(sk[-1][0].upper.key, 'wpStripes'); assert.equal(sk[-1][0].upper.color, '#112233');
  assert.equal(sk[-1][0].below.key, 'wTiles'); assert.equal(sk[-1][0].height, 1.2);
  const out = F.wallSkins(outer, [A, B], { facade: { pattern: 'brick' }, outline: [[[-0.2, -0.2], [7.2, -0.2], [7.2, 3.2], [-0.2, 3.2]]] });
  assert.equal(out[-1].length, 0, 'the outline says: this side is inside the house');
  const out2 = F.wallSkins(outer, [A, B], { facade: { pattern: 'brick' }, outline: [[[0, 0], [7, 0], [7, 3], [0, 3]]] });
  assert.equal(out2[-1][0].upper.key, 'brick', 'outside: the facade');
  assert.equal(F.wallSkins(outer, [A, B])[-1].length, 0, 'without a facade the outside keeps the wall colour');
  const accent = F.wallSkins({ ...inner, faces: { left: { pattern: 'wpDamask' } } }, [A, B]);
  assert.equal(accent[-1][0].upper.key, 'wpDamask'); assert.equal(accent[-1][0].below, null, 'an accent wall covers the whole height');
  assert.equal(accent[1][0].upper.key, 'woodchip');
  assert.equal(F.wallSkins(inner, [{ ...A, wallLook: undefined }, { ...B, wallLook: undefined, wallBelow: undefined }])[1].length, 0);
  assert.ok(F.hasSkins({ rooms: [A], walls: [] }) && !F.hasSkins({ rooms: [{}], walls: [{}] }) && F.hasSkins({ rooms: [], walls: [] }, { pattern: 'brick' }));
});

test('the pieces that get a finish: the solid parts of the wall (not the window), split at the height of the lower part', () => {
  const pieces = [{ x0: -1.6, x1: -0.5, y0: 0, y1: 2.6 }, { x0: -0.5, x1: 0.5, y0: 0, y1: 0.9 }, { x0: -0.5, x1: 0.5, y0: 2.1, y1: 2.6 }, { x0: 0.5, x1: 1.6, y0: 0, y1: 2.6 }];
  const sk = F.wallSkins(inner, [A, B]);
  const q = F.skinQuads(pieces, sk, 3);
  const a = q.filter((x) => x.side === 1), b = q.filter((x) => x.side === -1);
  assert.equal(a.length, 4, 'room A: one per piece');
  assert.ok(a.every((x) => x.fin.key === 'woodchip'));
  assert.equal(b.filter((x) => x.fin.key === 'wTiles').length, 3, 'under the window and both sides: tiles (the lintel is above 1.20 m)');
  assert.equal(b.filter((x) => x.fin.key === 'wpStripes').length, 3, 'above 1.20 m: the wallpaper (not under the window)');
  const low = b.find((x) => x.fin.key === 'wTiles' && x.x0 === -1.5);
  assert.equal(low.y1, 1.2, 'the tiles end at 1.20 m'); assert.equal(low.x0, -1.5, 'and at the corner of the room');
});
