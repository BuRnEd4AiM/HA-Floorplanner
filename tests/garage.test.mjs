// Unit tests for garage.js (vehicles, workshop, garage and carport) and the side profiles of shapes.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const G = await import(`${dir}/garage.js`);
const S = await import(`${dir}/scandi.js`);
const SH = await import(`${dir}/shapes.js`);
const { LAMP_TYPES, LIGHT_PROFILE, isLamp } = await import(`${dir}/lamplight.js`);
const { WALL_TYPES, wallDepth } = await import(`${dir}/placement.js`);
const { WALL_HUNG } = await import(`${dir}/collide.js`);
const { DEVICE_TYPES, CATEGORIES, catOf } = await import(`${dir}/models.js`);
const { ballIcon } = await import(`${dir}/tapballs.js`);
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const HEX = /^#[0-9a-f]{6}$/;
const KEYS = Object.keys(G.GARAGE);
const box = (k) => S.bounds(S.partsOf(k));
const size = (k) => { const bb = box(k); return [bb.x1 - bb.x0, bb.y1 - bb.y0, bb.z1 - bb.z0].map((v) => +v.toFixed(2)); };
const mats = (k) => new Set(S.partsOf(k).map((p) => p.m));
const CARS = ['car_small', 'car_sedan', 'car_estate', 'car_suv', 'car_sports', 'pickup'];
const VANS = ['van', 'camper_van', 'motorhome', 'motorhome_alcove'];
/** the area and the length round a closed outline [[z, y], ...] */
const area = (pts) => Math.abs(pts.reduce((a, [z, y], i) => { const [z2, y2] = pts[(i + 1) % pts.length]; return a + z * y2 - z2 * y; }, 0)) / 2;
/** is the point (z, y) inside the outline */
const inside = (pts, z, y) => pts.reduce((c, [z1, y1], i) => { const [z2, y2] = pts[(i + 1) % pts.length]; return (y1 > y) !== (y2 > y) && z < z1 + ((y - y1) * (z2 - z1)) / (y2 - y1) ? !c : c; }, false);
const around = (pts) => pts.reduce((a, [z, y], i) => { const [z2, y2] = pts[(i + 1) % pts.length]; return a + Math.hypot(z2 - z, y2 - y); }, 0);

test('more than 50 pieces, each in one of the three new library groups with a German name, search words and parts', () => {
  assert.ok(KEYS.length >= 50, KEYS.length);
  for (const k of KEYS) {
    const d = G.GARAGE[k];
    assert.ok(G.GARAGE_CATS.includes(d.cat), k);
    assert.ok(d.label && d.search && S.partsOf(k).length > 0, k);
    assert.equal(S.SCANDI[k], d, k);
    assert.equal(DEVICE_TYPES[k].label, d.label);
    assert.equal(DEVICE_TYPES[k].y, d.y || 0);
  }
  for (const c of G.GARAGE_CATS) assert.ok(KEYS.filter((k) => G.GARAGE[k].cat === c).length >= 12, c);
  assert.deepEqual(G.GARAGE_CATS, ['vehicles', 'workshop', 'garage']);
});
test('the library: the new groups come after the climate group and before the lamps, every piece in its own group, the lamps also with the lamps', () => {
  const cats = Object.keys(CATEGORIES);
  for (const c of G.GARAGE_CATS) assert.ok(cats.indexOf(c) > cats.indexOf('climate') && cats.indexOf(c) < cats.indexOf('lighting'), c);
  for (const k of KEYS) assert.equal(catOf(k), G.GARAGE[k].cat, k);
  for (const k of G.GARAGE_LAMPS) assert.ok(CATEGORIES.lighting.includes(k) && CATEGORIES[G.GARAGE[k].cat].includes(k), k);
  assert.equal(catOf('motorhome'), 'vehicles'); assert.equal(catOf('workbench'), 'workshop'); assert.equal(catOf('carport'), 'garage');
});
test('every part has a real size and a known material in every finish of its piece; the finishes exist', () => {
  for (const k of KEYS) {
    const fins = G.GARAGE[k].fin.length ? G.GARAGE[k].fin : [null];
    for (const f of G.GARAGE[k].fin) assert.ok(S.FINISHES[f], `${k}: ${f}`);
    for (const p of S.partsOf(k)) {
      const sizes = p.s === 'box' || p.s === 'ext' ? [p.w, p.h, p.d] : p.s === 'cyl' ? [p.r, p.r2, p.h] : [p.r, p.sx, p.sy, p.sz];
      assert.ok(['box', 'cyl', 'ball', 'ext'].includes(p.s), k);
      assert.ok(sizes.every((v) => Number.isFinite(v) && v > 0), `${k}: ${JSON.stringify(p)}`);
      assert.ok([p.x, p.y, p.z, p.rx || 0, p.ry || 0, p.rz || 0].every(Number.isFinite), `${k}: ${JSON.stringify(p)}`);
      for (const f of fins) assert.match(S.matOf(p.m, f)?.c || '', HEX, `${k}: ${p.m} in ${f}`);
    }
  }
  for (const f of Object.keys(G.GARAGE_FINISHES)) assert.match(f, /^[a-z]{2,20}$/);   // the import format allows only these names
});
test('side profiles: the outline lies in its box, it has an area, and its rounded edges are not thicker than the profile', () => {
  let n = 0;
  for (const k of KEYS) for (const p of S.partsOf(k).filter((q) => q.s === 'ext')) {
    n++;
    assert.ok(p.pts.length >= 3, k);
    for (const [z, y] of p.pts) assert.ok(Math.abs(z) <= p.d / 2 + 1e-9 && Math.abs(y) <= p.h / 2 + 1e-9, `${k}: ${z}, ${y}`);
    const a = area(p.pts), thick = (2 * a) / around(p.pts);       // about the thickness of a band
    assert.ok(a > 1e-4, `${k}: no area`);
    if (p.bev) assert.ok(p.bev <= 0.36 * thick && p.bev < p.w / 2, `${k}: bevel ${p.bev} on a profile ${thick.toFixed(3)} thick`);
  }
  assert.ok(n > 100, n);
});
test('every piece stands on the floor, is centred, and the plan footprint is its real size', () => {
  for (const k of KEYS) {
    const bb = box(k), d = G.GARAGE[k], h = bb.y1;
    assert.ok(bb.y0 > -0.005 && bb.y0 < 0.03, `${k} starts at ${bb.y0}`);
    assert.ok(Math.abs(bb.x0 + bb.x1) < 0.002 && Math.abs(bb.z0 + bb.z1) < 0.002, `${k} is not centred`);
    if (d.cat === 'vehicles') assert.ok(h < 3.3, `${k} is ${h} m high`);
    else if (k.startsWith('carport') || k === 'car_lift') assert.ok(h < 2.8, `${k} is ${h} m high`);   // the lift needs a high workshop
    else assert.ok((d.y || 0) + h < 2.55, `${k} reaches ${(d.y || 0) + h} m (placed at ${d.y})`);
    const f = S.footOf(k);
    if (d.round) near(f.r, Math.max(bb.x1 - bb.x0, bb.z1 - bb.z0) / 2, 0.01);
    else { near(f.w, bb.x1 - bb.x0, 0.006); near(f.d, bb.z1 - bb.z0, 0.006); assert.ok(f.w > 0.1 && f.d > 0.05 && f.w < 8 && f.d < 8, k); }
  }
});
test('real sizes: lengths of the cars and campers, heights of the motorhomes, the carports, a bike', () => {
  const len = { car_small: 4.05, car_sedan: 4.75, car_estate: 4.8, car_suv: 4.7, car_sports: 4.45, pickup: 5.3, van: 4.9, camper_van: 5.99, motorhome: 7.0, motorhome_alcove: 7.2, caravan: 6.6 };
  for (const [k, l] of Object.entries(len)) near(size(k)[2], l, 0.035);
  near(size('car_sedan')[1], 1.45, 0.01); near(size('car_suv')[1], 1.75, 0.03); near(size('camper_van')[1], 2.65, 0.11);
  assert.ok(size('motorhome')[1] <= 3.0 && size('motorhome_alcove')[1] <= 3.25 && size('caravan')[1] <= 2.7);
  assert.deepEqual(size('carport').filter((_, i) => i !== 1), [3.3, 5.4]);
  assert.deepEqual(size('carport_double').filter((_, i) => i !== 1), [6.1, 5.4]);
  const bike = size('bicycle');
  assert.ok(bike[2] > 1.7 && bike[2] < 1.9 && bike[1] > 0.95 && bike[1] < 1.1, String(bike));
  assert.ok(size('car_lift')[1] <= 2.75 && size('workbench')[1] > 0.85);
});
test('the wheels of the cars, vans and campers stand on the ground: four of them, the caravan and the trailer have one axle and a jockey wheel', () => {
  const tyres = (k) => S.partsOf(k).filter((p) => p.m === 'tyre' && p.s === 'cyl' && p.r > 0.25);
  for (const k of [...CARS, ...VANS]) {
    const t = tyres(k);
    assert.equal(t.length, 4, k);
    for (const p of t) near(p.y + p.h / 2 - p.r, 0, 1e-9);        // the middle of the wheel (lying along x) is its radius over the floor
  }
  for (const k of ['caravan', 'trailer']) {
    assert.equal(tyres(k).length, 2, k);
    assert.ok(S.partsOf(k).some((p) => p.m === 'tyre' && p.s === 'cyl' && p.r < 0.12), `${k}: no jockey wheel`);
  }
});
test('the side windows of the cars, vans and campers are on the outside of the body, not in it', () => {
  for (const k of [...CARS, ...VANS, 'caravan']) {
    const ps = S.partsOf(k), body = ps.filter((p) => p.s === 'ext' && p.w > 0.5 && p.m !== 'carglass');
    const windows = ps.filter((p) => p.s === 'ext' && p.w < 0.02 && p.m === 'carglass');
    assert.ok(windows.length >= (k === 'car_sports' ? 2 : 4), `${k}: ${windows.length} windows`);
    for (const w of windows) {
      const cz = w.z, cy = w.y + w.h / 2;
      const under = body.filter((b) => inside(b.pts, cz - b.z, cy - b.y - b.h / 2));
      assert.ok(under.length, `${k}: a window over nothing`);
      for (const b of under) assert.ok(Math.abs(w.x - b.x) + w.w / 2 >= b.w / 2 - 1e-6, `${k}: a window at ${w.x} is inside a body ${b.w} wide at ${b.x}`);
    }
  }
});
test('lights: the vehicles have head and tail lights that light up in their own colour; the workshop lamps light the room', () => {
  for (const k of [...CARS, ...VANS, 'motorbike', 'scooter']) assert.ok(mats(k).has('headlight') && mats(k).has('taillight'), k);
  assert.ok(S.matOf('headlight').glow && S.matOf('taillight').glow);
  assert.equal(S.matOf('taillight').on, '#ff2b22');
  for (const m of Object.keys(G.GARAGE_MATS)) if (G.GARAGE_MATS[m].on) assert.match(G.GARAGE_MATS[m].on, HEX, m);
  assert.deepEqual(G.GARAGE_LAMPS.sort(), ['highbay_lamp', 'work_lamp', 'workbench_peg']);
  for (const k of G.GARAGE_LAMPS) {
    assert.ok(LAMP_TYPES.includes(k) && isLamp({ type: k }), k);
    assert.ok(S.partsOf(k).some((p) => S.matOf(p.m, S.finishOf(k)).glow), `${k} does not glow`);
    assert.deepEqual(LIGHT_PROFILE[k], G.GARAGE[k].light, k);
  }
  for (const k of ['car_sedan', 'motorhome', 'compressor']) assert.ok(!isLamp({ type: k }), k);
  assert.ok(mats('robot_mower').has('display') && mats('welder').has('display'));
});
test('wall and ceiling pieces click onto the wall or hang from the ceiling; what hangs on the wall is flat enough, the wheel stops lie flat', () => {
  assert.deepEqual(G.GARAGE_WALL.sort(), ['bike_wall', 'bin_wall', 'extinguisher', 'garden_tools', 'pegboard']);
  for (const k of G.GARAGE_WALL) {
    assert.ok(WALL_TYPES.has(k) && WALL_HUNG.includes(k), k);
    assert.ok(S.footOf(k).d <= (k === 'bike_wall' ? 0.7 : 0.25), `${k} is ${S.footOf(k).d} m deep`);
    near(wallDepth({ type: k }), S.footOf(k).d);
  }
  for (const k of ['work_lamp', 'highbay_lamp', 'ceiling_rack']) assert.ok(G.GARAGE_HUNG.includes(k) && WALL_HUNG.includes(k) && !WALL_TYPES.has(k), k);
  assert.ok(!WALL_TYPES.has('car_sedan') && !WALL_HUNG.includes('motorhome'));
  assert.deepEqual(G.GARAGE_FLAT, ['wheel_stop']);
  assert.equal(G.GARAGE.work_lamp.y, 2.1);
});
test('finishes: cars in car paint, the default first; a piece without a choice offers none', () => {
  assert.deepEqual(S.finishChoices('car_sedan'), ['silver', 'carwhite', 'carblack', 'cargrey', 'carred', 'carblue', 'cargreen']);
  assert.equal(S.finishOf('car_small', {}), 'carred');
  assert.equal(S.finishOf('car_small', { finish: 'carblue' }), 'carblue');
  assert.equal(S.finishOf('car_small', { finish: 'oak' }), 'carred');               // a finish the piece does not have: its default
  assert.equal(S.finishChoices('bins'), null);
  for (const f of ['carwhite', 'carblack', 'silver', 'cargrey', 'carred', 'carblue', 'cargreen']) assert.ok(S.matOf('f', f).rough < 0.3, f);   // car paint shines
});
test('the ball in the live mode shows what it is: a car, a camper, the robot mower', () => {
  assert.equal(ballIcon({ type: 'car_estate', entity: 'switch.charger' }), '🚗');
  assert.equal(ballIcon({ type: 'motorhome', entity: 'switch.power' }), '🚐');
  assert.equal(ballIcon({ type: 'robot_mower', entity: 'lawn_mower.robbi' }), '🌱');
  assert.equal(ballIcon({ type: 'work_lamp', entity: 'switch.garage_light' }), '💡');    // a lamp on a relay: a light bulb
});
test('shapes: a side profile is a box around its outline, arcs and hoops', () => {
  const p = SH.prof([[1, 0], [1, 1], [-1, 1.5], [-1, 0.5]], 0.4, 0.2, 'f', 0.05);
  assert.equal(p.s, 'ext'); near(p.w, 0.4); near(p.h, 1.5); near(p.d, 2); near(p.x, 0.2); near(p.y, 0); near(p.z, 0); near(p.bev, 0.05);
  assert.deepEqual(p.pts[0], [1, -0.75]);
  const bb = S.bounds([p]);
  near(bb.x0, 0); near(bb.x1, 0.4); near(bb.y1, 1.5); near(bb.z0, -1);
  const t = S.bounds(SH.turnAll([p], Math.PI / 2));                   // turned a quarter: the length lies along x
  near(t.x1 - t.x0, 2); near(t.z1 - t.z0, 0.4);
  assert.equal(SH.prof([[0, 0], [1, 0], [0, 1]], 1).bev, undefined);
  const a = SH.arc(0, 1, 2, 0, Math.PI, 4);
  assert.equal(a.length, 5); near(a[0][0], 2); near(a[0][1], 1); near(a[2][0], 0); near(a[2][1], 3); near(a[4][0], -2);
  const ring = SH.hoop(0.1, 0.5, 0, 0.4, 0.01, 'tyre', 12);
  assert.equal(ring.length, 12);
  const rb = S.bounds(ring);
  near(rb.y0, 0.1, 0.012); near(rb.y1, 0.9, 0.012); near(rb.z1, 0.4, 0.012); near((rb.x0 + rb.x1) / 2, 0.1, 1e-6);
});
