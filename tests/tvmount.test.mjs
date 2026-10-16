// Unit tests for tvmount.js: the wall TV on a swivel arm (its size, swing, distance from the wall and tilt; it never touches the wall)
// (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const M = await import(`${dir}/tvmount.js`);

/** the 8 corners of a part (a cylinder as its box) after its turn, as three.js turns it (order XYZ or YXZ) */
function corners(q) {
  const w = q.s === 'box' ? q.w : 2 * q.r, dd = q.s === 'box' ? q.d : 2 * q.r, cy = q.y + q.h / 2;
  const [cx, sx, cyy, sy, cz, sz] = [Math.cos(q.rx || 0), Math.sin(q.rx || 0), Math.cos(q.ry || 0), Math.sin(q.ry || 0), Math.cos(q.rz || 0), Math.sin(q.rz || 0)];
  const Rx = ([x, y, z]) => [x, y * cx - z * sx, y * sx + z * cx], Ry = ([x, y, z]) => [x * cyy + z * sy, y, -x * sy + z * cyy], Rz = ([x, y, z]) => [x * cz - y * sz, x * sz + y * cz, z];
  const turn = q.ord === 'YXZ' ? (v) => Ry(Rx(Rz(v))) : (v) => Rx(Ry(Rz(v)));
  const out = [];
  for (const i of [-1, 1]) for (const j of [-1, 1]) for (const k of [-1, 1]) {
    const [x, y, z] = turn([(i * w) / 2, (j * q.h) / 2, (k * dd) / 2]);
    out.push([q.x + x, cy + y, q.z + z]);
  }
  return out;
}
const minZ = (parts) => Math.min(...parts.flatMap(corners).map((c) => c[2]));
const ofMat = (parts, m) => parts.filter((q) => q.m === m);
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

test('the pose: defaults, sizes and limits', () => {
  const p = M.armPose({});
  assert.deepEqual([p.size, p.w, p.h, p.swing, p.tilt, p.reach], ['55', 1.23, 0.72, 0, 0, M.ARM.reach]);
  assert.equal(p.out, p.reach);                                              // straight, the TV hangs where it was asked to
  assert.equal(M.armPose({ tvSize: '75' }).w, 1.68);
  assert.equal(M.armPose({ tvSize: 75 }).size, '75');
  assert.equal(M.armPose({ tvSize: '99' }).size, '55');                      // an unknown size: the default
  const q = M.armPose({ armSwing: 200, armTilt: -40, armReach: 5 });
  assert.deepEqual([q.swing, q.tilt, q.reach], [M.ARM.swing, -M.ARM.tilt, M.ARM.maxReach]);
  assert.equal(M.armPose({ armReach: 0 }).reach, M.ARM.minReach);
  assert.equal(M.armPose({ armSwing: 'x', armReach: '' }).swing, 0);
  assert.equal(M.armPose({ armSwing: '30' }).swing, 30);
  assert.ok(Object.keys(M.TV_SIZES).every((k) => M.TV_SIZES[k][0] > M.TV_SIZES[k][1]));   // all wide screens
});
test('straight: the wall plate on the wall, the TV stands off it by the distance asked for, its lower edge at the device height', () => {
  const ps = M.tvArmParts({ armReach: 0.2 });
  const plate = ofMat(ps, 'plate')[0];
  assert.ok(near(plate.z - plate.d / 2, M.WALL_Z));                         // the back of the plate on the wall face
  const body = ofMat(ps, 'tvbody')[0];
  assert.ok(near(minZ([body]) - M.WALL_Z, 0.2));
  assert.ok(near(Math.min(...corners(body).map((c) => c[1])), 0));
  assert.ok(near(Math.max(...corners(body).map((c) => c[0])), 1.23 / 2));
  const screen = ofMat(ps, 'screen')[0];
  assert.ok(Math.max(...corners(screen).map((c) => c[2])) > Math.max(...corners(body).map((c) => c[2])));   // the screen in front of the body
  assert.equal(ofMat(ps, 'led').length, 4);                                 // the backlight frame round the TV
  assert.ok(ofMat(ps, 'arm').length >= 5);                                  // bracket, hinges, two arms, VESA plate
});
test('swung or tilted: the TV turns, the arm pulls it out so that nothing of it touches the wall', () => {
  for (const tvSize of Object.keys(M.TV_SIZES)) for (const armSwing of [-80, -45, -10, 0, 25, 60, 80]) for (const armTilt of [-15, 0, 10, 15]) for (const armReach of [0.08, 0.3]) {
    const d = { tvSize, armSwing, armTilt, armReach }, ps = M.tvArmParts(d);
    const tv = [...ofMat(ps, 'tvbody'), ...ofMat(ps, 'screen'), ...ofMat(ps, 'led')];
    assert.ok(minZ(tv) >= M.WALL_Z + 0.015 + 0.004, `${JSON.stringify(d)}: ${minZ(tv)}`);   // in front of the wall plate
    assert.ok(minZ(ps) >= M.WALL_Z - 1e-9, JSON.stringify(d));             // nothing goes into the wall
  }
  const st = ofMat(M.tvArmParts({ armSwing: 0 }), 'screen')[0], sw = ofMat(M.tvArmParts({ armSwing: 40 }), 'screen')[0];
  assert.ok(near(sw.ry, (40 * Math.PI) / 180) && !st.ry);                   // the screen faces 40 degrees to the side
  const tl = ofMat(M.tvArmParts({ armTilt: 10 }), 'screen')[0];
  assert.ok(near(tl.rx, (10 * Math.PI) / 180));                             // tilted down: its top comes forward
  const top = (ps) => { const c = corners(ofMat(ps, 'tvbody')[0]); const y = Math.max(...c.map((v) => v[1])); return c.filter((v) => near(v[1], y, 1e-3)).map((v) => v[2]); };
  assert.ok(Math.max(...top(M.tvArmParts({ armTilt: 10 }))) > Math.max(...top(M.tvArmParts({}))));
});
test('the distance from the wall the arm needs grows with the swing and the tilt', () => {
  const n = (s, t) => M.neededReach(1.23, 0.72, s, t);
  assert.ok(n(0, 0) < M.ARM.minReach);                                       // straight, any distance will do
  assert.ok(n(30, 0) > n(10, 0) && n(10, 0) > n(0, 0) && n(-30, 0) === n(30, 0));
  assert.ok(n(0, 15) > n(0, 0));
  assert.equal(M.armPose({ armSwing: 45, armReach: 0.1 }).out, n(45, 0));
  assert.equal(M.armPose({ armSwing: 5, armReach: 0.4 }).out, 0.4);         // asked for more than it needs: as asked
});
test('the arm folds out: the elbow on the side that swings away from the wall, both arms reach their ends', () => {
  const elbowX = (d) => ofMat(M.tvArmParts(d), 'arm').find((q) => q.s === 'cyl' && Math.abs(q.x) > 0.01).x;
  assert.ok(elbowX({ armSwing: 30 }) < 0 && elbowX({ armSwing: -30 }) > 0);
  for (const armReach of [0.08, 0.5, 0.8]) {
    const ps = M.tvArmParts({ armReach }), bars = ofMat(ps, 'arm').filter((q) => q.s === 'box' && q.d > 0.1);
    const [hinge, elbow, joint] = ofMat(ps, 'arm').filter((q) => q.s === 'cyl');
    assert.equal(bars.length, 2);
    assert.ok(near(Math.hypot(elbow.x - hinge.x, elbow.z - hinge.z), bars[0].d) && near(Math.hypot(joint.x - elbow.x, joint.z - elbow.z), bars[1].d));
  }
});
