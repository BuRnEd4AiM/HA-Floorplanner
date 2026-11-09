// Unit tests for roofedit.js (the new roof editor: the side view and the map from above, 5.1.0; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const S = process.env.STATIC_DIR || '/tmp/static';
const E = await import(`${S}/roofedit.js`);
const { fitDormer, dormerStart } = await import(`${S}/dormer.js`);
const { skylightStart } = await import(`${S}/skylight.js`);

const bb = { x0: 0, x1: 10, z0: 0, z1: 7 };                       // the demo house: 10 x 7 m, the ridge along x
const near = (a, b, e = 0.02) => assert.ok(Math.abs(a - b) <= e, `${a} ≈ ${b}`);

test('the side view: depth, ridge over the knee wall, and where one can stand upright', () => {
  const p = E.profileOf(bb, { type: 'gable', pitch: 35, overhang: 0.5, knee: 1 });
  assert.equal(p.type, 'gable'); assert.equal(p.depth, 7); assert.equal(p.knee, 1);
  near(p.rise, 3.5 * Math.tan(35 * Math.PI / 180));                 // 2.45 m, as the old panel said
  near(p.stand, 7 - 2 * (1 / Math.tan(35 * Math.PI / 180)), 0.03);  // 4.1 m wide over 2 m
  assert.equal(E.profileOf(bb, { type: 'gable', pitch: 35 }).stand, null);   // not lived in
  assert.equal(E.profileOf(bb, { type: 'gable', pitch: 10, knee: 0 }).stand, 0);   // too flat to stand in
  const sh = E.profileOf(bb, { type: 'shed', pitch: 10, high: 'z0', overhang: 0.4, knee: 1.5 });
  assert.equal(sh.type, 'shed'); near(sh.depth, 7);
  assert.equal(E.profileOf(bb, { type: 'flat' }).rise, 0);
  assert.equal(E.profileOf(null, {}), null);
});

test('dragging on the side view: pitch from the angle, knee wall and overhang in 5 cm steps, ridge height to pitch', () => {
  assert.equal(E.pitchAt(1, 1), 45);
  assert.equal(E.pitchAt(1, 0), 5);                                 // never flatter than 5°
  assert.equal(E.pitchAt(0.1, 5), 70);                              // never steeper than 70°
  assert.equal(E.kneeAt(1.23), 1.25); assert.equal(E.kneeAt(-1), 0); assert.equal(E.kneeAt(9), 3);
  assert.equal(E.overAt(0.52), 0.5); assert.equal(E.overAt(5), 2);
  const r = { type: 'gable', pitch: 35, overhang: 0.5 };
  assert.equal(E.pitchForRise(bb, r, 3.5), 45);                     // 3.5 m over a house 7 m deep: 45°
});

test('the map from above: outline with overhangs, the ridge, the dormers and the roof window where they are', () => {
  const r = { type: 'gable', pitch: 35, overhang: 0.5, knee: 1, ridge: 'x',
    dormers: [{ side: 0, pos: 0.2, eave: 1 }, { side: 0, pos: 0.8, eave: 1, w: 2, type: 'flat' }, { side: 1, pos: 0.5, w: 40 }],
    skylights: [{ id: 's', side: 0, pos: 0.5, w: 0.78, h: 1.18, eave: 1.3 }] };
  const m = E.roofMap(bb, r);
  assert.equal(m.alongX, true);
  assert.deepEqual(m.outline, { x0: -0.5, x1: 10.5, z0: -0.5, z1: 7.5 });
  assert.deepEqual(m.ridge, [[-0.5, 3.5], [10.5, 3.5]]);
  assert.deepEqual(m.sides.map((s) => s.side), [0, 1]);
  const [d1, d2, d3] = m.dormers;
  near(d1.rect.x0, dormerStart(bb, r, r.dormers[0]));                // its left side: as far from the gable as the old field said
  near(d2.rect.x1 - d2.rect.x0, 2);
  assert.equal(d2.type, 'flat');
  near(d1.rect.z0, -0.5 + fitDormer(bb, r, r.dormers[0]).eave);     // from the eave of side A into the roof
  assert.ok(d1.rect.z1 < 3.5);                                       // below the ridge
  assert.deepEqual(d3, { i: 2, fit: false });                        // 40 m wide: does not fit
  const s = m.skylights[0];
  near(s.rect.x0, skylightStart(bb, r, r.skylights[0]));
  near(s.rect.z0, -0.5 + 1.3);
  const hip = E.roofMap(bb, { type: 'hip', pitch: 30 });
  assert.ok(hip.ridge[0][0] > 0 && hip.ridge[1][0] < 10);          // a hip roof's ridge is shorter
  assert.equal(E.roofMap(bb, { type: 'flat' }).ridge, null);
  const across = E.roofMap({ x0: 0, x1: 6, z0: 0, z1: 12 }, { type: 'gable' });
  assert.equal(across.alongX, false);
  assert.deepEqual(across.ridge, [[3, -0.4], [3, 12.4]]);
});

test('dragging a dormer or a roof window on the map moves it along the ridge and away from the eave', () => {
  const r = { type: 'gable', pitch: 35, overhang: 0.5, ridge: 'x', dormers: [{ side: 0, pos: 0.2, eave: 1 }], skylights: [{ side: 0, pos: 0.5, eave: 1.3 }] };
  const m = E.roofMap(bb, r), d = r.dormers[0], st = dormerStart(bb, r, d);
  E.dragDormer(bb, r, d, m.dormers[0], 2, 0.3);
  near(dormerStart(bb, r, d), st + 2, 0.06);
  near(d.eave, 1.3);
  const side1 = { side: 1, pos: 0.5, eave: 1 };
  E.dragDormer(bb, { ...r, dormers: [side1] }, side1, { at: 5, eave: 1 }, 0, 0.5);
  near(side1.eave, 0.5);                                              // side B: towards larger z is towards its eave
  const s = r.skylights[0], ss = skylightStart(bb, r, s);
  E.dragSkylight(bb, r, s, m.skylights[0], -1, 0.2);
  near(skylightStart(bb, r, s), ss - 1, 0.06);
  near(s.eave, 1.5);
  assert.deepEqual(E.alongAcross(true, 1, 2), { da: 1, db: 2 });
  assert.deepEqual(E.alongAcross(false, 1, 2), { da: 2, db: 1 });
});

test('solar panels on the roof and the summary of the head', () => {
  const o = { x0: -0.5, x1: 10.5, z0: -0.5, z1: 7.5 };
  const devs = [{ id: 'pv', type: 'solarpanel', x: 3.6, z: 5.3, cols: 6, rows: 3 }, { id: 'far', type: 'solarpanel', x: 30, z: 1 }, { id: 'l', type: 'light', x: 1, z: 1 }];
  const sol = E.solarOn(devs, o);
  assert.deepEqual(sol.map((x) => [x.id, x.n]), [['pv', 18]]);
  const sum = E.roofSummary(bb, { type: 'gable', pitch: 35, knee: 1, dormers: [{}, {}], skylights: [{}] }, devs);
  assert.deepEqual([sum.type, sum.pitch, sum.w, sum.d, sum.dormers, sum.skylights, sum.solar, sum.attic], ['gable', 35, 10, 7, 2, 1, 18, true]);
});
