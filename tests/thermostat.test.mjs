// Unit tests for thermostat.js (the thermostat as a circle like Home Assistant's, #495; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const T = await import(`${process.env.STATIC_DIR || '/tmp/static'}/thermostat.js`);
const near = (a, b, d = 0.01) => assert.ok(Math.abs(a - b) < d, `${a} ≈ ${b}`);

test('the limits of a thermostat: its own, else 7 to 30 in steps of 0.5', () => {
  assert.deepEqual(T.limits({}), { lo: 7, hi: 30, step: 0.5 });
  assert.deepEqual(T.limits({ tmin: 16, tmax: 31, tstep: 1 }), { lo: 16, hi: 31, step: 1 });
  assert.deepEqual(T.limits({ tmin: 20, tmax: 10 }), { lo: 20, hi: 30, step: 0.5 });   // a broken maximum
});

test('the circle: lowest value bottom left, highest bottom right, the middle on top', () => {
  assert.equal(T.angleOf(7, 7, 30), T.START);
  assert.equal(T.angleOf(30, 7, 30), T.START + T.SWEEP);
  near(T.angleOf(18.5, 7, 30), 270);                              // straight up
  assert.equal(T.angleOf(2, 7, 30), T.START); assert.equal(T.angleOf(99, 7, 30), T.START + T.SWEEP);
  const [x, y] = T.pointAt(100, 100, 50, 270);
  near(x, 100); near(y, 50);
  assert.match(T.arcPath(100, 100, 50, 135, 405), /^M[\d.]+ [\d.]+ A50 50 0 1 1 [\d.]+ [\d.]+$/);
  assert.match(T.arcPath(100, 100, 50, 135, 200), / 0 0 1 /);      // less than half: the short way
});

test('the value under the finger: on the steps, inside the limits, the gap at the bottom goes to the nearer end', () => {
  const s = { tmin: 7, tmax: 30, tstep: 0.5 };
  assert.equal(T.valueAt(100, 50, 100, 100, s), 18.5);            // on top
  assert.equal(T.valueAt(40, 160, 100, 100, s), 7);                // bottom left, past the start
  assert.equal(T.valueAt(160, 160, 100, 100, s), 30);              // bottom right, past the end
  assert.equal(T.valueAt(95, 180, 100, 100, s), 7);                // in the gap, a little left of the middle
  assert.equal(T.valueAt(105, 180, 100, 100, s), 30);              // ... a little right
  const v = T.valueAt(50, 100, 100, 100, { tstep: 1 });             // left (180°): a sixth of the way
  assert.equal(v, Math.round(7 + (45 / 270) * 23));
});

test('the model: modes in Home Assistant order, the target (a tapped one first), presets and fans, off', () => {
  const s = { state: 'heat', ct: 21.3, tt: 22, hvac: 'heating', modes: ['off', 'auto', 'heat'], ctl: { presets: ['eco', 'comfort'], preset: 'comfort', fans: [] } };
  const m = T.thermoModel(s);
  assert.deepEqual(m.modes.map((x) => x.key), ['heat', 'auto', 'off']);
  assert.deepEqual(m.modes.map((x) => x.on), [true, false, false]);
  assert.equal(m.modes[0].icon, '🔥');
  assert.equal(m.target, 22); assert.equal(m.now, 21.3); assert.equal(m.action, 'heating'); assert.equal(m.tone, 'heat');
  assert.deepEqual(m.presets, { list: ['eco', 'comfort'], value: 'comfort' }); assert.equal(m.fans, null);
  assert.equal(T.thermoModel(s, 23.5).target, 23.5);
  const off = T.thermoModel({ ...s, state: 'off', hvac: 'off' });
  assert.equal(off.target, null); assert.equal(off.off, true); assert.equal(off.tone, 'off');
  assert.equal(T.thermoModel(null), null);
  assert.equal(T.thermoModel({ state: 'cool', tt: 21 }).tone, 'cool');
  assert.equal(T.thermoModel({ state: 'heat_cool', tt: null }).target, null);       // two targets: shown as the temperature now
  assert.equal(T.thermoModel({ state: 'eco', tt: 50 }).target, 50);                 // a water heater
  assert.equal(T.cleanSize('small'), 'small'); assert.equal(T.cleanSize('x'), 'big');
});
