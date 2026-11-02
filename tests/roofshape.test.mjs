// Unit tests for roofshape.js (#628: the gable walls, the overhang at the gables, the shed roof; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const S = await import(`${dir}/roofshape.js`);
const A = await import(`${dir}/attic.js`);
const SR = await import(`${dir}/solarroof.js`);

const bb = { x0: 0, x1: 10, z0: 0, z1: 6 };                      // ridge along x (the longer side), 6 m across
const gable = { type: 'gable', pitch: 35, overhang: 0.4 };
const tan35 = Math.tan((35 * Math.PI) / 180);
const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

test('frame: without its own overhang at the gables the roof is as before (the overhang all round)', () => {
  const F = S.roofFrame(bb, gable);
  assert.deepEqual([F.x0, F.x1, F.z0, F.z1], [-0.4, 10.4, -0.4, 6.4]);
  assert.ok(F.alongX && near(F.half, 3.4) && near(F.bc, 3) && near(F.h, 3.4 * tan35) && !F.shed);
  for (const r of [{ ...gable, gableOver: '' }, { ...gable, gableOver: null }]) assert.deepEqual(S.roofFrame(bb, r), F);
});
test('frame: the overhang at the gables (Ortgang) only moves the gable ends; a hip or flat roof ignores it', () => {
  const F = S.roofFrame(bb, { ...gable, gableOver: 0.1 });
  assert.deepEqual([F.x0, F.x1, F.z0, F.z1], [-0.1, 10.1, -0.4, 6.4]);
  assert.ok(near(F.h, 3.4 * tan35), 'the ridge stays as high');
  assert.equal(S.gableOverOf({ ...gable, gableOver: 9 }), 3);
  assert.equal(S.gableOverOf({ ...gable, gableOver: -1 }), 0);
  for (const type of ['hip', 'flat']) {
    const H = S.roofFrame(bb, { ...gable, type, gableOver: 0.1 });
    assert.deepEqual([H.x0, H.x1], [-0.4, 10.4], type);
  }
  const Z = S.roofFrame(bb, { ...gable, ridge: 'z', gableOver: 0 });   // the ridge along z: the gables are at z0 and z1
  assert.deepEqual([Z.x0, Z.x1, Z.z0, Z.z1], [-0.4, 10.4, 0, 6]);
});

test('shed roof: one slope from the low eave (with its overhang) up to the high side (none there)', () => {
  const r = { type: 'shed', pitch: 10, overhang: 0.3, high: 'z0' };
  const F = S.roofFrame(bb, r), t10 = Math.tan((10 * Math.PI) / 180);
  assert.ok(F.shed && F.alongX && F.hi === 0);
  assert.deepEqual([F.x0, F.x1, F.z0, F.z1], [-0.3, 10.3, 0, 6.3]);
  assert.ok(near(F.bc, 0) && near(F.half, 6.3) && near(F.h, 6.3 * t10));
  const L = S.roofFrame(bb, { ...r, high: 'x1' });                 // high on the right: the slope runs down to the left
  assert.ok(!L.alongX && L.hi === 1 && near(L.bc, 10) && near(L.b0, -0.3) && near(L.b1, 10));
  assert.equal(S.shedHigh({ type: 'shed', high: 'nonsense' }), 'z0');
  const tris = S.shedSurface(bb, r);
  assert.equal(tris.length, 6);
  const [p, q, u] = tris, n = [(q[1] - p[1]) * (u[2] - p[2]) - (q[2] - p[2]) * (u[1] - p[1]), (q[2] - p[2]) * (u[0] - p[0]) - (q[0] - p[0]) * (u[2] - p[2]), (q[0] - p[0]) * (u[1] - p[1]) - (q[1] - p[1]) * (u[0] - p[0])];
  assert.ok(n[1] > 0, 'it faces up');
  assert.ok(tris.every((v) => (near(v[2], 0) && near(v[1], F.h)) || (near(v[2], 6.3) && near(v[1], 0))), 'high at z 0, low at the eave');
});

test('shed roof: the walls are cut at its one slope, the ridge height field gives its high side, solar panels lie on it', () => {
  const r = { type: 'shed', pitch: 10, overhang: 0.3, high: 'z0' }, F = S.roofFrame(bb, r);
  const planes = A.roofPlanes(bb, r);
  assert.equal(planes.length, 1);
  const y = (z) => F.h * (1 - z / F.half);
  assert.ok(A.underRoof(planes, 5, y(1) - 0.05, 1) && !A.underRoof(planes, 5, y(1) + 0.05, 1));
  assert.ok(A.underRoof(planes, 5, y(5) - 0.05, 5) && !A.underRoof(planes, 5, y(5) + 0.05, 5));
  assert.ok(near(A.ridgeHeight(bb, r), 6 * Math.tan((10 * Math.PI) / 180)), 'over the low wall');
  assert.ok(near(A.pitchFor(bb, r, A.ridgeHeight(bb, r)), 10, 0.05));
  const s = SR.roofSurfaceAt(bb, r, 5, 3);
  assert.ok(near(s.y, y(3)) && near(s.slope, (10 * Math.PI) / 180) && s.down[1] === 1, JSON.stringify(s));
  assert.equal(SR.roofSurfaceAt(bb, r, 5, -0.1), null, 'nothing beyond the high side');
});

const yTop = (w) => Math.max(...w.poly.map((p) => p[1]));
test('gable walls of a gable roof: one on each gable, on the middle of the wall, as wide as the house, up to just under the ridge', () => {
  const ws = S.gableWalls(bb, gable, { t: 0.3 });
  assert.equal(ws.length, 2);
  assert.deepEqual(ws.map((w) => [w.alongX, w.c]), [[false, 0], [false, 10]]);
  const F = S.roofFrame(bb, gable);
  for (const w of ws) {
    const ss = w.poly.map((p) => p[0]);
    assert.ok(near(Math.min(...ss), -0.15) && near(Math.max(...ss), 6.15), 'the house and the wall thickness');
    assert.ok(near(yTop(w), F.h - 0.03), 'just under the ridge');
    assert.ok(near(w.t, 0.29), 'a little thinner than the wall: no flicker with a wall drawn there');
    assert.ok(w.poly.every((p) => p[1] >= -1e-9));
    const lo = w.poly.find((p) => near(p[0], -0.15) && p[1] > 0);  // at its outer corner it meets the slope
    assert.ok(near(lo[1], (0.4 - 0.15) * tan35 - 0.03), `${lo[1]}`);
  }
  assert.deepEqual(S.gableWalls(bb, { ...gable, gableWall: false }), []);
  assert.deepEqual(S.gableWalls(bb, { ...gable, type: 'hip' }), []);
  assert.deepEqual(S.gableWalls(bb, { ...gable, type: 'flat' }), []);
});
test('gable walls: on a knee wall they start at the top of the walls under them, and none where another roof stands', () => {
  const ws = S.gableWalls(bb, gable, { from: 2, t: 0.3 });
  assert.equal(ws.length, 2);
  assert.ok(ws.every((w) => w.poly.every((p) => p[1] >= 2 - 1e-9) && w.poly.some((p) => near(p[1], 2))));
  const width = (w) => Math.max(...w.poly.map((p) => p[0])) - Math.min(...w.poly.map((p) => p[0]));
  assert.ok(width(ws[0]) < 6, 'only the top of the gable is left');
  assert.deepEqual(S.gableWalls(bb, gable, { from: 10 }), [], 'the walls reach over the roof: nothing to fill');
  const one = S.gableWalls(bb, gable, { skip: (x) => x > 5 });
  assert.deepEqual(one.map((w) => w.c), [0]);
});
test('gable walls follow the steps in the eaves (#342) at each end', () => {
  const r = { ...gable, steps: [{ side: 0, at: 5, out: 1 }] };   // side A (z 0) 1 m further out from x 5 on
  const [w0, w1] = S.gableWalls(bb, r, { t: 0.2 });
  assert.ok(near(Math.min(...w0.poly.map((p) => p[0])), -0.1));
  assert.ok(near(Math.min(...w1.poly.map((p) => p[0])), -1.1), 'the wider end');
  assert.ok(near(yTop(w0), yTop(w1)), 'one ridge');
});
test('gable walls of a shed roof: both sides from the high side down, and the high side', () => {
  const r = { type: 'shed', pitch: 10, overhang: 0.5, high: 'z0' }, F = S.roofFrame(bb, r);
  const ws = S.gableWalls(bb, r, { t: 0.3 });
  assert.equal(ws.length, 3);
  const [s0, s1, hiW] = ws;
  assert.deepEqual([s0.alongX, s0.c, s1.c, hiW.alongX, hiW.c], [false, 0, 10, true, 0]);
  assert.ok(near(yTop(s0), F.h - 0.03) && near(yTop(hiW), F.h - 0.03));
  const low = s0.poly.filter((p) => near(p[0], 6.15) && p[1] > 0)[0];
  assert.ok(near(low[1], (0.5 - 0.15) * Math.tan((10 * Math.PI) / 180) - 0.03), 'down to the low eave');
  assert.deepEqual(S.gableWalls(bb, { ...r, gableWall: false }), []);
});
test('a gable wall as triangles: front, back and edges, every one facing out', () => {
  const [w] = S.gableWalls(bb, gable, { t: 0.3 });
  const { pos, uv } = S.wallTris(w);
  assert.equal(pos.length % 3, 0);
  assert.equal(uv.length, pos.length);
  assert.equal(pos.length / 3, 2 * (w.poly.length - 2) + 2 * w.poly.length);
  const mid = [0, 1, 2].map((k) => pos.reduce((s, p) => s + p[k], 0) / pos.length);
  for (let i = 0; i < pos.length; i += 3) {
    const [p, q, u] = [pos[i], pos[i + 1], pos[i + 2]];
    const a = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], b = [u[0] - p[0], u[1] - p[1], u[2] - p[2]];
    const n = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const c = [0, 1, 2].map((k) => (p[k] + q[k] + u[k]) / 3 - mid[k]);
    assert.ok(n[0] * c[0] + n[1] * c[1] + n[2] * c[2] > 0, `triangle ${i / 3} faces in`);
  }
  assert.ok(pos.every((p) => near(Math.abs(p[0]), 0.145)), 'the wall stands on x 0, 0.29 m thick');
});
test('the thickness of the gable walls: the thickest wall of the floor under the roof', () => {
  assert.equal(S.wallThickness({ walls: [{ thickness: 0.12 }, { thickness: 0.36 }, {}] }), 0.36);
  assert.equal(S.wallThickness({ walls: [] }), S.WALL_T);
  assert.equal(S.wallThickness(null), S.WALL_T);
  assert.equal(S.wallThickness({ walls: [{ thickness: 3 }] }), 0.6);
});

test('a shed roof next to the house leans against it: its high side faces the main roof', () => {
  const mb = { x0: 0, x1: 10, z0: 0, z1: 6 };
  assert.equal(S.shedHighToward({ x0: 0, x1: 10, z0: 6, z1: 9 }, mb), 'z0');   // in front (below in the plan)
  assert.equal(S.shedHighToward({ x0: 0, x1: 10, z0: -3, z1: 0 }, mb), 'z1');  // behind
  assert.equal(S.shedHighToward({ x0: 10, x1: 13, z0: 0, z1: 6 }, mb), 'x0');  // right
  assert.equal(S.shedHighToward({ x0: -3, x1: 0, z0: 0, z1: 6 }, mb), 'x1');   // left
  assert.equal(S.shedHighToward({ x0: 2, x1: 4, z0: 2, z1: 4 }, mb), 'z0');    // over it
  assert.equal(S.shedHighToward(null, mb), 'z0');
});
test('a canopy (Vordach): a shed roof in front of the long side of the house, its high side just under the eave', () => {
  const p = S.newCanopy({ x0: 0, x1: 10, z0: 0, z1: 6 }, true, 'rp1');
  assert.deepEqual(p.box, { x0: 0, x1: 10, z0: 6, z1: 8.5 });
  assert.equal(p.type, 'shed'); assert.equal(p.high, 'z0'); assert.equal(p.level, 'main'); assert.equal(p.gableWall, false);
  const h = S.roofFrame(p.box, p).h;
  assert.ok(Math.abs(p.dy + h + 0.05) < 0.006, `${p.dy} ${h}`);
  const q = S.newCanopy({ x0: 0, x1: 6, z0: 0, z1: 10 }, false, 'rp2', 3);   // the ridge along z: in front of the right side
  assert.deepEqual(q.box, { x0: 6, x1: 9, z0: 0, z1: 10 });
  assert.equal(q.high, 'x0');
  assert.equal(S.dyOf(q), q.dy);
  assert.equal(S.dyOf({ dy: 50 }), 10);
  assert.equal(S.dyOf({}), 0);
});
test('a further roof moved up or down (dy) and where the walls under it end (its gable walls start there)', () => {
  const floors = [{ id: 'eg', kind: 'floor' }, { id: 'og', kind: 'floor' }, { id: 'd', kind: 'roof', roof: { knee: 1 } }];
  const elev = (i) => i * 3;
  assert.equal(A.partY0(floors, 2, { level: 'eg', dy: 0.5 }, elev), -3 + 0.5);
  assert.equal(A.partY0(floors, 2, { level: 'main', dy: -0.5 }, elev), A.roofY0(floors, 2, elev) - 0.5);
  assert.equal(A.partY0(floors, 2, { dy: 1 }, elev), 1);
  assert.equal(A.wallTopOf(floors, 2, { level: 'eg' }, elev), -3);
  assert.equal(A.wallTopOf(floors, 2, { level: 'main' }, elev), 0);
  assert.equal(A.wallTopOf(floors, 2, {}, elev), 0);
});
test('how high the walls of a floor are: the highest, the setting for a wall without its own height', () => {
  assert.equal(S.wallHeightOf({ walls: [{ height: 2.4 }, {}] }, 2.6), 2.6);
  assert.equal(S.wallHeightOf({ walls: [{ height: 2.9 }, { height: 2.4 }] }), 2.9);
  assert.equal(S.wallHeightOf({ walls: [] }, 2.5), 2.5);
  assert.equal(S.wallHeightOf(null), 2.6);
});
