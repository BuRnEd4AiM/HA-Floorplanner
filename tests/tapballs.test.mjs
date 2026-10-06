// Unit tests for tapballs.js (a ball over everything that can be tapped in the live mode, #238; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const T = await import(`${process.env.STATIC_DIR || '/tmp/static'}/tapballs.js`);
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('which devices get a ball: linked to something and tappable in the live mode', () => {
  assert.ok(T.wantsBall({ type: 'light', entity: 'light.a' }));
  assert.ok(T.wantsBall({ type: 'camera', entity: 'camera.a' }));
  assert.ok(T.wantsBall({ type: 'tv_wall', entity: '', ledEntity: 'light.tv' }));
  assert.ok(T.wantsBall({ type: 'ledring', entity: '', segs: [{}, { entity: 'light.s' }] }));
  assert.ok(!T.wantsBall({ type: 'plant', entity: '' }));                       // linked to nothing
  assert.ok(!T.wantsBall({ type: 'presence', entity: 'person.a' }));            // no tap in the live mode (#234)
  assert.ok(!T.wantsBall({ type: 'sensor', entity: 'sensor.t' }));              // nor a sensor (#236)
  assert.ok(!T.wantsBall({ type: 'strip', entity: 'light.s', hideModel: true }));   // an invisible light cannot be tapped
  assert.ok(!T.wantsBall(null));
});
test('the ball floats above the device, under a ceiling lamp it hangs below it', () => {
  near(T.ballY(0, 0.9, 2.6), 0.9 + T.BALL.lift);                              // a floor lamp
  near(T.ballY(2.4, 2.58, 2.6), 2.4 - T.BALL.lift);                            // a ceiling lamp: below it
  assert.ok(T.ballY(0, 0.05, 0.2) >= T.BALL.r);                                // never below the floor
});
test('colour: the light colour while on, warm white without a colour, grey-blue while off', () => {
  assert.deepEqual(T.ballLook(true, [255, 0, 128]), { color: 0xff0080, opacity: 0.95 });
  assert.equal(T.ballLook(true, null).color, T.BALL.on);
  assert.equal(T.ballLook(false, [255, 0, 0]).color, T.BALL.off);
});
