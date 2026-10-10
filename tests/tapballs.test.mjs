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
test('spread (#244): balls that would cover each other move apart, far ones stay, none drifts far from its device', () => {
  const D = 2 * T.BALL.r + T.BALL.gap;
  const pts = [{ x: 0, y: 1, z: 0 }, { x: 0.05, y: 1, z: 0 }, { x: 0, y: 2.2, z: 0.02 }, { x: 5, y: 1, z: 5 }];
  const out = T.spreadBalls(pts);
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.ok(Math.hypot(out[i].x - out[j].x, out[i].z - out[j].z) >= D - 1e-3, `${i}-${j}`);   // also one above another
  assert.deepEqual(out[3], pts[3]);                                             // far away: untouched
  out.forEach((q, i) => { assert.ok(Math.hypot(q.x - pts[i].x, q.z - pts[i].z) <= T.BALL.maxShift + 1e-9); assert.equal(q.y, pts[i].y); });
  const same = T.spreadBalls([{ x: 1, y: 1, z: 1 }, { x: 1, y: 1, z: 1 }]);    // exactly on top of each other
  assert.ok(Math.hypot(same[0].x - same[1].x, same[0].z - same[1].z) >= D - 1e-3);
});
test('spread (#244): a ball keeps clear of a value label, the label stays', () => {
  const out = T.spreadBalls([{ x: 0, y: 1, z: 0 }], undefined, undefined, [{ x: 0.1, y: 1.2, z: 0 }], 0.5);
  assert.ok(Math.hypot(out[0].x - 0.1, out[0].z) >= 0.5 - 1e-3);
});
test('on the screen (#314): balls that land on each other move apart, far ones stay, none moves too far', () => {
  const items = [{ x: 100, y: 100, r: 20 }, { x: 105, y: 100, r: 20 }, { x: 100, y: 100, r: 20 }, { x: 400, y: 400, r: 20 }];
  const o = T.spreadScreen(items, 3, 2.5), p = items.map((q, i) => ({ x: q.x + o[i].dx, y: q.y + o[i].dy, r: q.r }));
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.ok(Math.hypot(p[i].x - p[j].x, p[i].y - p[j].y) >= 43 - 0.01, `${i} ${j} still overlap`);
  near(o[3].dx, 0); near(o[3].dy, 0);                                        // far away: stays
  o.forEach((q, i) => assert.ok(Math.hypot(q.dx, q.dy) <= 2.5 * items[i].r + 1e-6));
  assert.deepEqual(T.spreadScreen(items, 3, 2.5), o);                       // the same every frame: no jitter
});
