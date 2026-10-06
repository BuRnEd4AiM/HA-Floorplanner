// Unit tests for planview.js (the 2D plan turning with the 3D view, #212; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const P = await import(`${dir}/planview.js`);
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('looking north (towards -z) the plan stays as it is; other directions turn it', () => {
  near(P.planAngle({ x: 0, z: 10 }, { x: 0, z: 0 }), 0);       // camera south of the target looks towards -z = up in the plan
  near(P.planAngle({ x: 0, z: -10 }, { x: 0, z: 0 }), 180);    // looking south: upside down
  near(P.planAngle({ x: -10, z: 0 }, { x: 0, z: 0 }), -90);    // looking east (+x): the plan turns left
  near(P.planAngle({ x: 10, z: 0 }, { x: 0, z: 0 }), 90);
  near(P.planAngle({ x: 1, z: 1 }, { x: 1, z: 1 }), 0);        // straight from above
});
test('after turning, the view direction points up on the screen', () => {
  for (const [cx, cz] of [[3, 7], [-5, 2], [0.5, -9], [-4, -4]]) {
    const a = P.planAngle({ x: cx, z: cz }, { x: 0, z: 0 });
    const [x, y] = P.rotPoint([-cx, -cz], [0, 0], a);          // the direction camera -> target, in screen units (z down)
    near(x, 0, 1e-9); assert.ok(y < 0);
  }
});
test('rotating a point and back gives the point again', () => {
  const p = P.rotPoint(P.rotPoint([120, 40], [400, 300], 37), [400, 300], -37);
  near(p[0], 120, 1e-9); near(p[1], 40, 1e-9);
  assert.deepEqual(P.rotPoint([5, 5], [5, 5], 90), [5, 5]);
});
test('angles: normalised, and texts never stand on their head', () => {
  near(P.normDeg(190), -170); near(P.normDeg(-180), 180); near(P.normDeg(720), 0);
  near(P.readableAngle(0, 0), 0);
  near(P.readableAngle(0, 180), 180);                          // the plan is upside down: the text turns too
  near(P.readableAngle(30, 120), -150);
  near(P.readableAngle(30, 20), 30);
});
