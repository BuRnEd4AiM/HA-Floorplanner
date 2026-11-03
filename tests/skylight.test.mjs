// Unit tests for skylight.js (roof windows without a dormer, #643) and the roof window section of the roof panel (skylightui.js)
// Run: STATIC_DIR=floorplan3d/rootfs/app/static node --test tests/skylight.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const S = await import(`${dir}/skylight.js`);
const { roofSurface } = await import(`${dir}/dormer.js`);
const { skylightRoofs, moveSkylight, sizeKey } = await import(`${dir}/skylightui.js`);
const { roofRects } = await import(`${dir}/roofmove.js`);
const { setRoofType } = await import(`${dir}/floorpanel.js`);

const bb = { x0: 0, x1: 10, z0: 0, z1: 6 };
const gable = (sky, more = {}) => ({ type: 'gable', pitch: 35, overhang: 0.4, skylights: sky, ...more });
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const cross = (p, q, u) => {
  const a = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], b = [u[0] - p[0], u[1] - p[1], u[2] - p[2]];
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
};
const area = (tris) => { let s = 0; for (let i = 0; i < tris.length; i += 3) { const c = cross(tris[i], tris[i + 1], tris[i + 2]); s += Math.hypot(...c) / 2; } return s; };

test('a roof window lies in its slope: its edges on the roof surface, as high as it is long in the slope', () => {
  const s = { side: 0, pos: 0.5, w: 0.78, h: 1.18, eave: 1.4 };
  const n = S.fitSkylight(bb, gable([s]), s), tan = Math.tan((35 * Math.PI) / 180);
  near(n.at, 5); near(n.a0, 4.61); near(n.a1, 5.39);
  near(n.e0, 1.4); near(n.y0, 1.4 * tan); near(n.y1, n.e1 * tan);
  near(Math.hypot(n.e1 - n.e0, n.y1 - n.y0), 1.18);                    // 1.18 m measured in the slope
  const w = S.skylightWindow(n);
  assert.deepEqual([w.a, w.b].map((p) => p.map((v) => +v.toFixed(3))), [[4.61, 1], [5.39, 1]]);   // the eave at z -0.4, 1.4 m in
  assert.equal(w.outside, -1);                                          // the normal of a→b points to the ridge: outside is the other way
  near(w.tilt, (Math.PI / 2) * (55 / 90));                              // tipped back by 90° - 35°, towards the ridge
  near(w.mid[0], 5); near(w.mid[1], (1 + w.top.a[1]) / 2);
});

test('side B mirrors side A, and the tilt turns the other way', () => {
  const a = S.skylightWindow(S.fitSkylight(bb, gable([]), { side: 0, eave: 1.4 }));
  const b = S.skylightWindow(S.fitSkylight(bb, gable([]), { side: 1, eave: 1.4 }));
  near(b.a[1], 6 - a.a[1]); near(b.top.a[1], 6 - a.top.a[1]);
  assert.equal(b.outside, 1); near(b.tilt, -a.tilt);
});

test('the slope gets a hole as big as the window, the flashing lies round it facing up', () => {
  const s = { side: 0, w: 0.78, h: 1.18, eave: 1.4 };
  const full = area(roofSurface(bb, gable([]))), cut = area(roofSurface(bb, gable([s])));
  near(full - cut, 0.78 * 1.18, 1e-6);
  const p = S.skylightParts(bb, gable([s]), s);
  for (let i = 0; i < p.flashing.length; i += 3) assert.ok(cross(p.flashing[i], p.flashing[i + 1], p.flashing[i + 2])[1] > 0);
  near(area(p.flashing), (0.78 + 2 * S.FLASH) * (1.18 + 2 * S.FLASH) - 0.78 * 1.18, 1e-6);
  near(area(p.glass), 0.78 * 1.18);
  const pb = S.skylightParts(bb, gable([]), { ...s, side: 1 });         // side B: facing up as well
  for (let i = 0; i < pb.flashing.length; i += 3) assert.ok(cross(pb.flashing[i], pb.flashing[i + 1], pb.flashing[i + 2])[1] > 0);
});

test('a shed roof has its one slope (the low side), with a hole too; a flat roof has no roof windows', () => {
  const shed = { type: 'shed', pitch: 10, overhang: 0.3, high: 'z0', skylights: [{ side: 0, pos: 0.5, eave: 2 }] };
  const n = S.fitSkylight(bb, shed, shed.skylights[0]);
  assert.equal(n.side, 1);                                              // high at z0: the slope rises from z1
  const full = area(roofSurface(bb, { ...shed, skylights: [] })), cut = area(roofSurface(bb, shed));
  near(full - cut, 0.78 * 1.18, 1e-6);
  assert.equal(S.fitSkylight(bb, { ...shed, high: 'z1' }, shed.skylights[0]).side, 0);
  assert.equal(S.fitSkylight(bb, { type: 'flat' }, {}), null);
  assert.equal(S.skylightsAllowed({ type: 'flat' }), false);
  assert.equal(S.skylightsAllowed({ type: 'hip' }), true);
});

test('a roof window stays inside the slope: between the gables, inside the hips, under the ridge', () => {
  const g0 = S.fitSkylight(bb, gable([]), { pos: 0, eave: 1.4 }), g1 = S.fitSkylight(bb, gable([]), { pos: 1, eave: 1.4 });
  near(g0.a0, 0.12); near(g1.a1, 9.88);                                 // not over the overhang at the gables
  const hip = { type: 'hip', pitch: 35, overhang: 0.4 };
  const h0 = S.fitSkylight(bb, hip, { pos: 0, eave: 1.4 });
  near(h0.a0, -0.4 + h0.e1 + 0.12);                                     // the hip leans in by e (a square slope)
  const high = S.fitSkylight(bb, gable([]), { eave: 9 });                // too far up: it is moved down until it fits under the ridge
  assert.ok(high.e1 <= 3.4 - 0.12 + 1e-9);
  assert.equal(S.fitSkylight({ x0: 0, x1: 0.8, z0: 0, z1: 6 }, gable([]), { w: 0.78 }), null);   // longer than the roof
  assert.equal(S.fitSkylight(bb, { type: 'gable', pitch: 35, overhang: 0, ridge: 'z' }, { h: 3 }) !== null, true);
  assert.equal(S.fitSkylight({ x0: 0, x1: 10, z0: 0, z1: 1 }, gable([]), { h: 3 }), null);        // higher than the slope
});

test('a roof window stays in one piece of an eave with steps (#342)', () => {
  const r = gable([], { steps: [{ side: 0, at: 5, out: 1 }] });
  const n = S.fitSkylight(bb, r, { side: 0, pos: 0.5, w: 0.78, eave: 1.4 });
  assert.ok(n.a1 <= 5 - 0.12 + 1e-9 || n.a0 >= 5 + 0.12 - 1e-9, `${n.a0}..${n.a1}`);
  const b = S.fitSkylight(bb, r, { side: 0, pos: 1, eave: 1.4 });
  near(b.F.half, 3.4 + 1);                                              // the wider piece: its own eave, further out
});

test('start from the gable and pos go both ways; a new width keeps the start', () => {
  const r = gable([]), s = { side: 0, pos: 0.5, w: 0.78, eave: 1.4 };
  near(S.skylightStart(bb, r, s), 4.61);
  s.pos = S.posForStart(bb, r, s, 2);
  near(S.skylightStart(bb, r, s), 2, 1e-3);
  S.setSkylightWidth(bb, r, s, 1.34);
  near(S.skylightStart(bb, r, s), 2, 1e-3); assert.equal(s.w, 1.34);
});

test('a new roof window: alternating sides, its lower edge 1 m over the floor (a knee wall counts)', () => {
  const r = gable([]), tan = Math.tan((35 * Math.PI) / 180);
  const a = S.newSkylight(bb, r, 0, 'x1'), b = S.newSkylight(bb, r, 1, 'x2');
  assert.deepEqual([a.side, a.pos, b.side, b.pos], [0, 0.5, 1, 0.5]);
  near(a.eave, +(1 / tan).toFixed(3));
  near(S.fitSkylight(bb, r, a).y0, 1, 1e-3);
  assert.equal(S.newSkylight(bb, r, 0, 'x3', 1).eave, 0.7);             // on a 1 m knee wall: just inside the wall (overhang + 30 cm)
  assert.equal(S.newSkylight(bb, { type: 'flat' }, 0, 'x4').eave, undefined);
});

test('the 2D plan sees the roof windows of every roof as outlines (roofRects)', () => {
  const f = { kind: 'roof', roof: gable([{ side: 0, eave: 1.4 }], { box: bb, parts: [{ id: 'rp1', type: 'shed', pitch: 10, high: 'z0', box: { x0: 10, x1: 14, z0: 0, z1: 4 }, skylights: [{ eave: 1 }] }] }) };
  const rects = roofRects(f, null);
  assert.equal(rects[0].skylights.length, 1);
  assert.deepEqual(rects[0].skylights[0], [[4.61, 1], [5.39, 1], [5.39, 1.967], [4.61, 1.967]]);
  assert.equal(rects[1].skylights.length, 1);
});

test('the roof panel: which roofs can have roof windows, moving one, the usual sizes, a flat roof drops them', () => {
  const r = gable([{ id: 'a' }], { parts: [{ id: 'rp1', type: 'flat', box: bb }, { id: 'rp2', name: 'Anbau', type: 'shed', box: bb }] });
  assert.deepEqual(skylightRoofs(r, bb).map((q) => [q.key, q.name]), [['main', 'skylight.mainRoof'], ['rp2', 'Anbau']]);
  const s = r.skylights[0];
  moveSkylight(s, r, r.parts[1]);
  assert.equal(r.skylights, undefined); assert.deepEqual(r.parts[1].skylights, [s]);
  assert.equal(sizeKey({ w: 0.78, h: 1.18 }), '78x118'); assert.equal(sizeKey({}), '78x118'); assert.equal(sizeKey({ w: 0.8, h: 1.2 }), '');
  const flat = gable([{ id: 'b' }]);
  setRoofType(flat, 'flat');
  assert.equal(flat.skylights, undefined);
  const shed = gable([{ id: 'c' }]);
  setRoofType(shed, 'shed');
  assert.equal(shed.skylights.length, 1);                               // a shed roof keeps them (its one slope)
});
