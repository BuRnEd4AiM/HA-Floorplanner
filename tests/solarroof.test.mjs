// Unit tests for solarroof.js (solar panels on the roof, #176; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const S = await import(`${dir}/solarroof.js`);

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const bb = { x0: 0, x1: 10, z0: 0, z1: 6 };                                // house 10 x 6 m: ridge along x
const gable = { type: 'gable', pitch: 45, overhang: 0 };

test('gable roof: eaves at 0, ridge at half the width (45 degrees), slopes face away from the ridge', () => {
  near(S.roofSurfaceAt(bb, gable, 5, 0).y, 0);
  near(S.roofSurfaceAt(bb, gable, 5, 3).y, 3);
  const s = S.roofSurfaceAt(bb, gable, 2, 4.5);
  near(s.y, 1.5); near(s.slope, Math.PI / 4);
  assert.deepEqual(s.down, [0, 1]);
  near(s.n[0], 0); near(s.n[1], Math.SQRT1_2); near(s.n[2], Math.SQRT1_2);
  assert.deepEqual(S.roofSurfaceAt(bb, gable, 2, 1).down, [0, -1]);
});
test('outside the roof (overhang included) there is no surface', () => {
  assert.equal(S.roofSurfaceAt(bb, gable, 11, 3), null);
  assert.ok(S.roofSurfaceAt(bb, { ...gable, overhang: 0.4 }, 10.3, 3));
  assert.equal(S.roofSurfaceAt(null, gable, 1, 1), null);
});
test('ridge across: with ridge "z" the slopes run along x', () => {
  const s = S.roofSurfaceAt(bb, { ...gable, ridge: 'z' }, 9, 3);
  near(s.y, 1); assert.deepEqual(s.down, [1, 0]);
});
test('hip roof: the ends slope too, the lower plane counts', () => {
  const hip = { type: 'hip', pitch: 45, overhang: 0 };
  const end = S.roofSurfaceAt(bb, hip, 0.5, 3);                          // near the west end: the hip plane is lower than the side plane
  near(end.y, 0.5); assert.deepEqual(end.down, [-1, 0]);
  near(S.roofSurfaceAt(bb, hip, 5, 3).y, 3);                             // on the ridge
  assert.deepEqual(S.roofSurfaceAt(bb, hip, 5, 5).down, [0, 1]);
});
test('flat roof: the top plate, no slope', () => {
  const s = S.roofSurfaceAt(bb, { type: 'flat', overhang: 0 }, 4, 4);
  near(s.y, 0.1); assert.equal(s.slope, 0); assert.deepEqual(s.n, [0, 1, 0]);
});
test('several roofs: the highest wins and its lift counts', () => {
  const roofs = [{ bb, spec: gable, y0: 0 }, { bb: { x0: 0, x1: 4, z0: 0, z1: 6 }, spec: { type: 'flat', overhang: 0 }, y0: 5 }];
  near(S.roofSpot(roofs, 2, 3).y, 5.1);
  near(S.roofSpot(roofs, 8, 3).y, 3);
  assert.equal(S.roofSpot(roofs, 20, 3), null);
  assert.equal(S.roofSpot([], 1, 1), null);
});

// the panel normal after Euler YXZ (yaw, tilt, roll), the way three.js turns the device
function normalAfter(rotDeg, tiltX, tiltZ) {
  const t = (rotDeg * Math.PI) / 180;
  let v = [-Math.sin(tiltZ), Math.cos(tiltZ), 0];                        // roll around z
  v = [v[0], v[1] * Math.cos(tiltX) - v[2] * Math.sin(tiltX), v[1] * Math.sin(tiltX) + v[2] * Math.cos(tiltX)];   // tilt around x
  return [v[0] * Math.cos(t) + v[2] * Math.sin(t), v[1], -v[0] * Math.sin(t) + v[2] * Math.cos(t)];                // yaw around y
}
test('panel tilt: whatever the turn, the panel lies on the roof', () => {
  for (const [x, z] of [[2, 4.5], [2, 1]]) {
    const s = S.roofSurfaceAt(bb, gable, x, z);
    for (const rot of [0, 30, 90, 180, -135]) {
      const { tiltX, tiltZ } = S.panelTilt(s.n, rot), n = normalAfter(rot, tiltX, tiltZ);
      n.forEach((c, k) => near(c, s.n[k], 1e-9));
    }
  }
  const flat = S.panelTilt([0, 1, 0], 45);
  near(flat.tiltX, 0); near(flat.tiltZ, 0);
});
test('mount: flat on a slope, on a rack on a flat roof or the ground, unless chosen', () => {
  const slope = S.roofSurfaceAt(bb, gable, 2, 4.5), flat = S.roofSurfaceAt(bb, { type: 'flat' }, 2, 2);
  assert.equal(S.mountOf({}, slope), 'flat');
  assert.equal(S.mountOf({}, flat), 'stand');
  assert.equal(S.mountOf({}, null), 'stand');
  assert.equal(S.mountOf({ mount: 'stand' }, slope), 'stand');
  assert.equal(S.mountOf({ mount: 'flat' }, flat), 'flat');
});
test('pose: lifted onto the roof and tilted only when lying on a slope', () => {
  const roofs = [{ bb, spec: gable, y0: 0 }];
  const p = S.solarPose({ x: 2, z: 4.5, rot: 0 }, roofs);
  near(p.y, 1.5); assert.equal(p.mount, 'flat'); near(p.tilt.tiltX, Math.PI / 4);
  assert.equal(S.solarPose({ x: 2, z: 4.5, mount: 'stand' }, roofs).tilt, null);
  assert.deepEqual(S.solarPose({ x: 40, z: 4 }, roofs), { mount: 'stand', y: 0, tilt: null });
});
test('field: columns along x, rows along z, centred; counts are clamped', () => {
  const f = S.solarField({ cols: 3, rows: 2 });
  assert.equal(f.cells.length, 6);
  near(f.w, 3 * S.PANEL.w + 2 * S.PANEL.gap); near(f.d, 2 * S.PANEL.d + S.PANEL.gap);
  near(f.cells[0].x, -f.w / 2 + S.PANEL.w / 2); near(f.cells[5].z, f.d / 2 - S.PANEL.d / 2);
  near(f.cells.reduce((a, c) => a + c.x, 0), 0); near(f.cells.reduce((a, c) => a + c.z, 0), 0);
  assert.equal(S.solarField({}).cells.length, 1);
  assert.equal(S.solarField({ cols: 99, rows: -3 }).cols, S.MAX_FIELD);
  assert.equal(S.solarField({ cols: 99, rows: -3 }).rows, 1);
});
test('rack (#208): posts end just under the panel, on flat ground the pivot stays at 0.55 m', () => {
  const st = S.standParts({ x: 0, z: 0 });
  near(st.lift, S.STAND.pivot);
  assert.equal(st.posts.length, 4);
  const s = Math.sin(S.STAND.tilt);
  for (const q of st.posts) { near(q.y0, 0); near(q.y1, st.lift + s * Math.sign(q.z) * S.STAND.postZ); assert.ok(q.y1 > q.y0); }
  assert.ok(st.lift - s * S.PANEL.d / 2 >= S.STAND.clear - 1e-9);               // the low edge is clear of the ground
});
test('rack on a slope (#208): every post reaches the ground under it, the panel is lifted clear of the highest point', () => {
  const ground = (x, z) => -0.5 * z;                                           // falls towards +z
  const st = S.standParts({ x: 0, z: 0 }, ground);
  for (const q of st.posts) near(q.y0, ground(q.x, q.z));
  const high = Math.max(...[-1, 1].map((k) => ground(0, k * Math.cos(S.STAND.tilt) * S.PANEL.d / 2)));
  assert.ok(st.lift - Math.sin(S.STAND.tilt) * S.PANEL.d / 2 >= high + S.STAND.clear - 1e-9);
});
test('ground under a turned device: the roof height relative to the model origin, 0 off the roof', () => {
  const roofs = [{ bb, spec: gable, y0: 0 }];
  const g = S.groundFn({ x: 2, z: 4.5, rot: 90 }, roofs, 1.5);                  // origin on the slope at height 1.5
  near(g(0, 0), 0);
  near(g(1, 0), 1);                                                              // turned 90 degrees local +x is world -z: 1 m towards the ridge, 1 m higher
  assert.equal(g(0, 40), 0);
});
