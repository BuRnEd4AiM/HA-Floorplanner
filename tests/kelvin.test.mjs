// Unit tests for kelvin.js (the white tone in Kelvin, #564; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const K = await import(`${process.env.STATIC_DIR || '/tmp/static'}/kelvin.js`);
const t = (k) => ({ 'kel.warm': 'Warmweiß', 'kel.neutral': 'Neutralweiß', 'kel.cold': 'Kaltweiß' }[k] || k);

test('the white tones of a light, of several lights, now', () => {
  assert.deepEqual(K.lightRange({ kmin: 2202, kmax: 6535 }), [2200, 6500]);
  assert.deepEqual(K.lightRange({}), [K.K_LOW, K.K_HIGH]);                         // it does not say: the usual ones
  assert.deepEqual(K.lightRange({ kmin: 5000, kmax: 3000 }), [2000, 6500]);
  assert.equal(K.kelvinRange([{}, { kmin: null }]), null);                          // none can do white tones: no slider
  assert.deepEqual(K.kelvinRange([{ kmin: 2200, kmax: 6500 }, { kmin: 2700, kmax: 5000 }, {}]), [2700, 5000]);   // what all of them can do
  assert.deepEqual(K.kelvinRange([{ kmin: 2000, kmax: 3000 }, { kmin: 4000, kmax: 6500 }]), [2000, 6500]);       // nothing in common: all of it
  assert.equal(K.kelvinNow({ kel: 2702.4 }), 2702);
  assert.equal(K.kelvinNow({ kel: null }), null);
  assert.equal(K.kelvinNow(undefined), null);
});

test('in words, as a colour, on the slider', () => {
  assert.equal(K.kelvinText(2700, t), '2700 K · Warmweiß');
  assert.equal(K.kelvinText(4000, t), '4000 K · Neutralweiß');
  assert.equal(K.kelvinText(6500, t), '6500 K · Kaltweiß');
  assert.equal(K.kelvinWord(3299), 'warm');
  assert.equal(K.kelvinWord(5300), 'cold');
  assert.deepEqual(K.kelvinRgb(2000), [255, 170, 80]);
  assert.deepEqual(K.kelvinRgb(9000), [255, 245, 255]);
  assert.equal(K.kelvinGradient(2000, 6500), 'linear-gradient(90deg, rgb(255, 170, 80), rgb(255, 208, 168), rgb(255, 245, 255))');
  assert.equal(K.clampKelvin(2712, [2200, 6500]), 2700);
  assert.equal(K.clampKelvin(1500, [2200, 6500]), 2200);
  assert.equal(K.clampKelvin(9000, [2200, 6500]), 6500);
});
