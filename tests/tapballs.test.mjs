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
  assert.deepEqual(T.ballLook(true, [255, 0, 128]), { color: 0xff0080, opacity: 1 });
  assert.equal(T.ballLook(true, null).color, T.BALL.on);
  assert.equal(T.ballLook(false, [255, 0, 0]).color, T.BALL.off);
});
test('icon (#240): what the ball controls, by the kind of its entity; some device types have their own', () => {
  assert.equal(T.ballIcon({ type: 'light', entity: 'light.a' }), '💡');
  assert.equal(T.ballIcon({ type: 'strip', entity: 'light.led' }), '💡');                   // an LED strip: a lamp too
  assert.equal(T.ballIcon({ type: 'switch', entity: 'cover.rollladen' }), '🪟');            // shutters
  assert.equal(T.ballIcon({ type: 'switch', entity: 'switch.steckdose' }), '🔌');
  assert.equal(T.ballIcon({ type: 'camera', entity: 'camera.flur' }), '📷');
  assert.equal(T.ballIcon({ type: 'tv_wall', entity: 'media_player.tv' }), '📺');
  assert.equal(T.ballIcon({ type: 'tv_wall', entity: '', ledEntity: 'light.tv_led' }), '💡');
  assert.equal(T.ballIcon({ type: 'thermostat', entity: 'climate.wz' }), '🌡');
  assert.equal(T.ballIcon({ type: 'thing', entity: 'weird.x' }), '●');
  assert.equal(T.ballIcon({ type: 'solarpanel', entity: 'sensor.pv' }), '☀');
  assert.equal(T.ballIcon({ type: 'gasmeter', entity: 'sensor.gas' }), '🔥');
  assert.equal(T.ballIcon({ type: 'thing', entity: 'sensor.x' }), 'ℹ');
});
