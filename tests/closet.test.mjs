// Unit tests for closet.js and closetview.js (the cabinet builder: columns, slopes, cutting the parts, fitting under the roof, the editor's
// drawings; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const DIR = process.env.STATIC_DIR || '/tmp/static';
const C = await import(`${DIR}/closet.js`);
const V = await import(`${DIR}/closetview.js`);
const A = await import(`${DIR}/attic.js`);
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const centroid = (faces) => { const ps = faces.flat(); return [0, 1, 2].map((k) => ps.reduce((s, p) => s + p[k], 0) / ps.length); };
/** a closed convex solid: positive volume, every face facing outwards */
function solid(faces) {
  assert.ok(C.volume(faces) > 0, 'volume');
  const c = centroid(faces);
  faces.forEach((f) => {
    const n = C.faceNormal(f), m = centroid([f]);
    assert.ok(n[0] * (m[0] - c[0]) + n[1] * (m[1] - c[1]) + n[2] * (m[2] - c[2]) > -1e-9, 'face turned inwards');
  });
}

test('cleaning: defaults, limits, unknown values, at most 12 columns and 2 slopes (one per side)', () => {
  const d = C.cleanCloset();
  assert.equal(d.cols.length, 3); near(C.closetW(d), 1.5); assert.equal(d.h, 2.2); assert.equal(d.d, 0.6);
  assert.deepEqual(d.slopes, []); assert.equal(d.doors, 'hinged'); assert.equal(d.handle, 'bar'); assert.equal(d.led, false);
  const c = C.cleanCloset({
    h: 9, d: 0.05, plinth: 2, body: 'red', front: '#ABCDEF', handle: 'gold', led: 'yes',
    cols: [...Array(20)].map(() => ({ w: 5, fill: 'nonsense', n: 99, low: 9, front: 'curtain', hinge: 'x' })),
    slopes: [{ side: 'left', low: 9, deg: 1 }, { side: 'left', low: 1, deg: 30 }, { side: 'up' }, { side: 'back', low: 1.2, deg: 89 }, { side: 'front', low: 1, deg: 30 }],
  });
  assert.equal(c.h, 3.5); assert.equal(c.d, 0.2); assert.ok(c.plinth <= c.h / 3 + 1e-9);
  assert.equal(c.body, C.COLORS.white); assert.equal(c.front, '#abcdef'); assert.equal(c.handle, 'bar'); assert.equal(c.led, false);
  assert.equal(c.cols.length, C.MAX_COLS);
  assert.deepEqual(c.cols[0], { w: 2, fill: 'shelves', n: 12, low: 6, front: 'door' });
  assert.deepEqual(c.slopes, [{ side: 'left', low: 3.5, deg: 5 }, { side: 'back', low: 1.2, deg: 75 }]);
  assert.deepEqual(C.cleanCol({ fill: 'drawers', n: 0, front: 'glass', low: 3 }), { w: 0.5, fill: 'drawers', n: 1 });   // drawers have no door
  assert.equal(C.cleanCol({ hinge: 'r' }).hinge, 'r');
});

test('presets: every one can be built, every part is a closed solid inside the cabinet and under its slopes', () => {
  for (const k of C.PRESET_KEYS) {
    const c = C.closetPreset(k), { faces, W, H, D } = C.closetSolids(c);
    assert.ok(faces.body?.length && faces.back?.length, k);
    Object.values(faces).flat().forEach((f) => f.forEach(([x, y, z]) => {
      assert.ok(x >= -W / 2 - 1e-6 && x <= W / 2 + 1e-6, `${k}: x ${x}`);
      assert.ok(y >= -1e-6 && y <= H + 1e-6, `${k}: y ${y}`);
      assert.ok(z >= -D / 2 - 1e-6 && z <= D / 2 + 0.08, `${k}: z ${z}`);      // fronts, handles, sliding doors in front
      assert.ok(y <= C.topAt(c, x, z) + 1e-6, `${k}: above the slope at ${x}, ${y}, ${z}`);
    }));
  }
});

test('clipping a box: half a cube along its diagonal, nothing cut, nothing left; the new face closes the solid', () => {
  const cube = C.boxFaces([0, 1, 0, 1, 0, 1]);
  solid(cube); near(C.volume(cube), 1);
  const half = C.clipSolid(cube, [1, -1, 0, 0]);                          // keep y <= x
  solid(half); near(C.volume(half), 0.5);
  assert.equal(C.clipSolid(cube, [0, -1, 0, 2]), cube);                    // the plane is above it
  assert.equal(C.clipSolid(cube, [0, -1, 0, -2]), null);                   // the plane is below it
  const corner = C.clipSolid(cube, [-1, -1, -1, 1]);                       // a corner: x + y + z <= 1
  solid(corner); near(C.volume(corner), 1 / 6);
  const two = C.clipSolid(C.clipSolid(cube, [1, -1, 0, 0.5]), [-1, -1, 0, 1.5]);   // a roof shape: two slopes
  solid(two); near(C.volume(two), 1 - 2 * (0.5 * 0.5 * 0.5));
});

test('a slope: the top falls to the low side at the pitch; the top line has its kink where it meets the full height', () => {
  const c = C.cleanCloset({ h: 2.2, d: 0.6, cols: [{ w: 0.6 }, { w: 0.6 }, { w: 0.6 }], slopes: [{ side: 'left', low: 1, deg: 45 }] });
  near(C.topAt(c, -0.9, 0), 1); near(C.topAt(c, -0.4, 0.3), 1.5); near(C.topAt(c, 0.9, 0), 2.2);
  const tl = C.topLine(c, 'x', 0.3, -0.9, 0.9);
  assert.deepEqual(tl.map((p) => p[0]), [-0.9, 0.3, 0.9]); near(tl[1][1], 2.2, 1e-3);
  const back = C.cleanCloset({ h: 1.6, d: 0.6, slopes: [{ side: 'back', low: 1, deg: 40 }] });
  near(C.topAt(back, 0, -0.3), 1); near(C.topAt(back, 0, 0.3), 1 + 0.6 * Math.tan((40 * Math.PI) / 180));
  const front = C.cleanCloset({ h: 2, slopes: [{ side: 'front', low: 1.2, deg: 30 }] }), right = C.cleanCloset({ h: 2, slopes: [{ side: 'right', low: 1.2, deg: 30 }] });
  near(C.topAt(front, 0, 0.3), 1.2); near(C.topAt(right, C.closetW(right) / 2, 0), 1.2);
});

test('layout: drawers, doors, rails and shelves go where there is room; doors open in pairs', () => {
  const L = C.closetLayout(C.closetPreset('wardrobe3'));
  assert.deepEqual(L.cols.map((q) => q.hinge), ['l', 'r', 'l']);
  assert.equal(L.cols[1].drawers.length, 2); assert.equal(L.cols[1].shelves.length, 3); assert.ok(L.cols[1].door.y0 > 0.4);
  assert.equal(L.cols[0].rails.length, 1); assert.equal(L.cols[0].shelves.length, 1);       // the rail under a shelf for hats
  const chest = C.closetLayout(C.closetPreset('chest'));
  chest.cols.forEach((q) => { assert.equal(q.drawers.length, 4); assert.equal(q.door, null); });
  const open = C.closetLayout(C.closetPreset('shelf'));
  assert.ok(open.cols.every((q) => !q.door && q.shelves.length === 4));
  const low = C.closetLayout({ h: 0.45, cols: [{ w: 0.5, fill: 'rail', low: 6 }] }).cols[0];
  assert.equal(low.low, 0); assert.equal(low.rails.length, 0);                              // too low for drawers under a door or for a rail
  const attic = C.closetLayout(C.closetPreset('attic'));
  assert.ok(attic.cols[0].frontLow < 1.01 && attic.cols[2].frontHigh > 2.19);
  attic.cols.forEach((q) => q.rails.forEach((r) => assert.ok(C.innerTop(attic.c, r.x0, 0) >= r.y)));
  const hinged = C.closetLayout({ cols: [{ w: 0.5, hinge: 'r' }, { w: 0.5, hinge: 'r' }] });
  assert.deepEqual(hinged.cols.map((q) => q.hinge), ['r', 'r']);
});

test('the LED light inside: in every column that is not only drawers, also under a slope', () => {
  for (const slopes of [[], [{ side: 'back', low: 1.2, deg: 35 }], [{ side: 'left', low: 1, deg: 40 }], [{ side: 'front', low: 1.4, deg: 30 }]]) {
    const c = C.cleanCloset({ h: 2, led: true, slopes, cols: [{ w: 0.6, fill: 'drawers', n: 3 }, { w: 0.6, fill: 'shelves', n: 2 }, { w: 0.6, fill: 'rail' }] });
    const L = C.closetLayout(c), { faces } = C.closetSolids(c);
    assert.deepEqual(L.cols.map((q) => !!q.led), [false, true, true], JSON.stringify(slopes));
    assert.ok(faces.led?.length >= 8, JSON.stringify(slopes));                              // two strips are left after the cut
  }
  assert.equal(C.closetSolids(C.closetPreset('wardrobe3')).faces.led, undefined);            // no light unless chosen
});

test('a drawer column under a slope: whole drawers up to the lowest front, a filler panel above', () => {
  const L = C.closetLayout({ h: 2, cols: [{ w: 0.6, fill: 'drawers', n: 3 }], slopes: [{ side: 'left', low: 1, deg: 30 }] });
  const q = L.cols[0];
  assert.equal(q.drawers.length, 3); assert.ok(q.drawers[2].y1 <= q.frontLow); assert.ok(q.filler);
});

test('width: the columns grow and shrink together, the sum is the new width; evenly; the plan handle sets width or depth', () => {
  const c = C.setWidth(C.closetPreset('wardrobe3'), 2.1);
  near(C.closetW(c), 2.1); c.cols.forEach((q) => near(q.w, 0.7));
  const odd = C.setWidth({ cols: [{ w: 0.3 }, { w: 0.9 }] }, 1.0);
  near(C.closetW(odd), 1.0); assert.ok(odd.cols.every((q) => q.w >= C.LIM.w[0]));
  const ev = C.evenCols({ cols: [{ w: 0.3 }, { w: 0.9 }, { w: 0.3 }] });
  near(C.closetW(ev), 1.5); ev.cols.forEach((q) => near(q.w, 0.5, 1e-3));
  near(C.closetW(C.resizeTo(C.closetPreset('wardrobe2'), 'x', 1.6)), 1.6);
  assert.equal(C.resizeTo(C.closetPreset('wardrobe2'), 'z', 0.45).d, 0.45);
  assert.deepEqual(C.closetSize(C.closetPreset('wardrobe2')), { x: 1, y: 2.2, z: 0.6 });
});

/** a roof y <= y0 + k*(z - z0) rising towards +z (in the world frame), as roofPlanes gives it */
const rising = (deg, y0, z0) => { const k = Math.tan((deg * Math.PI) / 180), L = Math.hypot(1, k); return [0, -1 / L, k / L, (y0 - k * z0) / L]; };

test('fitting under a roof: the slope towards the low side, its height there and its pitch; turned cabinets; no roof', () => {
  const pl = [rising(40, 1, 0)];
  const a = C.fitToRoof(C.closetPreset('wardrobe2'), { x: 2, z: 0.3, rot: 0 }, pl, 0);       // its back at the knee wall (z = 0)
  assert.equal(a.slopes, 1); assert.equal(a.cab.slopes[0].side, 'back'); near(a.cab.slopes[0].low, 0.99, 0.006); assert.ok(a.cab.slopes[0].deg <= 40 && a.cab.slopes[0].deg > 39.8);
  assert.ok(a.lowered); near(a.cab.h, 1.5, 0.011);                                      // no higher than the roof over its front
  const b = C.fitToRoof(C.closetPreset('wardrobe2'), { x: 2, z: 1, rot: 90 }, pl, 0);         // turned: the roof falls to its right
  assert.equal(b.cab.slopes[0].side, 'right');
  const c = C.fitToRoof(C.closetPreset('wardrobe2'), { x: 2, z: 1, rot: 90, mirror: true }, pl, 0);
  assert.equal(c.cab.slopes[0].side, 'left');
  const far = C.fitToRoof(C.closetPreset('wardrobe2'), { x: 2, z: 5, rot: 0 }, pl, 0);       // far from the eave: the roof is high, nothing to cut
  assert.equal(far.slopes, 0); assert.equal(far.cab.h, 2.2);
  assert.equal(C.fitToRoof(C.closetPreset('wardrobe2'), { x: 2, z: 1, rot: 0 }, [], 0), null);
  assert.deepEqual(C.fitToRoof(C.closetPreset('wardrobe2'), { x: 2, z: 0.1, rot: 0 }, [rising(5, 0.1, 0)], 0), { error: 'low' });
  const lifted = C.fitToRoof(C.closetPreset('wardrobe2'), { x: 2, z: 0.3, rot: 0 }, pl, 0.5);   // its bottom 0.5 m up (another floor)
  near(lifted.cab.slopes[0].low, 0.49, 0.006);
});

test('fitting under a real gable roof (attic.js): every point of the top stays under the roof, also under the ridge', () => {
  const bb = { x0: 0, x1: 8, z0: 0, z1: 6 }, spec = { type: 'gable', pitch: 35, overhang: 0 };
  const planes = A.roofPlanes(bb, spec, 0);
  for (const dev of [{ x: 4, z: 0.6, rot: 0 }, { x: 0.6, z: 3, rot: 270 }, { x: 4, z: 3, rot: 0 }, { x: 3, z: 5.4, rot: 180 }, { x: 2.2, z: 1.5, rot: 30 }]) {
    const r = C.fitToRoof({ ...C.closetPreset('wardrobe3'), d: 0.6 }, dev, planes, -1.2);     // the floor 1.2 m under the eaves (a knee wall)
    assert.ok(r && r.cab, JSON.stringify(dev));
    const c = r.cab, W = C.closetW(c), th = (dev.rot * Math.PI) / 180;
    for (let i = 0; i <= 10; i++) for (let j = 0; j <= 4; j++) {
      const lx = -W / 2 + (W * i) / 10, lz = -c.d / 2 + (c.d * j) / 4, y = C.topAt(c, lx, lz);
      const X = dev.x + lx * Math.cos(th) + lz * Math.sin(th), Z = dev.z - lx * Math.sin(th) + lz * Math.cos(th);
      assert.ok(A.underRoof(planes, X, y - 1.2, Z), `${JSON.stringify(dev)}: ${lx}, ${lz} at ${y} is above the roof`);
    }
  }
  const ridge = C.fitToRoof({ ...C.setWidth(C.closetPreset('wardrobe3'), 3), h: 3.2 }, { x: 4, z: 3, rot: 90 }, planes, -1.2);   // across the ridge: a slope to each side
  assert.deepEqual(ridge.cab.slopes.map((s) => s.side).sort(), ['left', 'right']);
});

test('views: the front has a tap target per column and its own clip path, the doors as outlines to see inside; the side; the plan marks', () => {
  const c = C.closetPreset('attic');
  const a = V.frontView(c, { sel: 1, doors: true }), b = V.frontView(c, { sel: 0, doors: false });
  assert.equal((a.match(/data-col="/g) || []).length, 3);
  const ids = [a, b].map((s) => s.match(/clipPath id="([^"]+)"/)[1]);
  assert.notEqual(ids[0], ids[1]);
  assert.ok(b.includes('stroke-dasharray="4 3"') && !a.includes('stroke-dasharray="4 3"'));
  assert.ok(a.includes('180 cm') && a.includes('220 cm') && a.includes('100 cm · 40°'));
  assert.ok(V.frontView(c, { len: (m) => `${(m / 0.0254).toFixed(0)}″` }).includes('71″'));
  const knee = V.sideView(C.closetPreset('knee'), { sel: 0 });
  assert.ok(knee.includes('<svg') && knee.includes('60 cm') && knee.includes('100 cm · 40°'));
  assert.ok(V.planMarks(c, 40, false, '#fff').includes('rgba(255,170,70'));
  assert.ok(!V.planMarks(C.closetPreset('wardrobe2'), 40, false, '#fff').includes('rgba(255,170,70'));
  assert.equal(V.shade('#808080', 0.5), '#404040'); assert.equal(V.shade('#000000', 2), '#ffffff');
});
