// Unit tests for entitystate.js (what the app keeps of an entity, #137 step 23; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const E = await import(`${process.env.STATIC_DIR || '/tmp/static'}/entitystate.js`);

test('effect colour: the colour the user gave the effect wins, else a colour word in its name, none for "off"', () => {
  assert.deepEqual(E.fxRgb('Nordlicht', { Nordlicht: '#00ff80' }), [0, 255, 128]);
  assert.deepEqual(E.fxRgb('Sunset Glow'), [255, 130, 20]);
  assert.deepEqual(E.fxRgb('Wald'), [40, 220, 90]);
  assert.equal(E.fxRgb('Aus'), null);
  assert.equal(E.fxRgb('Mystery'), null);
  assert.equal(E.fxRgb(''), null);
  assert.deepEqual(E.fxRgb('Ocean', { Ocean: 'blue' }), [35, 224, 255]);       // a colour that is not #rrggbb is ignored
});
test('state of an entity: the effect colour shows, the own colour stays as rgbRaw, the rest is copied', () => {
  const s = E.toState({ state: 'on', rgb: [255, 255, 255], fxc: 'Gaming', brightness: 60, unit: null, members: ['light.a'] });
  assert.deepEqual(s.rgb, [170, 80, 255]); assert.deepEqual(s.rgbRaw, [255, 255, 255]);
  assert.equal(s.state, 'on'); assert.equal(s.brightness, 60); assert.deepEqual(s.members, ['light.a']);
  assert.deepEqual(E.toState({ state: 'on', rgb: [1, 2, 3] }).rgb, [1, 2, 3]);   // no effect: its own colour
});
