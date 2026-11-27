/* 🍏 Glas (5.37.0, glasstheme.js): the two glass designs build on dark and light, are only a choice, and the picture behind the pages is
 * small, soft and toned so the cards stay easy to read. */
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';   // run like offline.test.mjs (ci.yml: a copy of static/ with a package.json)
const G = await import(`${dir}/glasstheme.js`);
const V = await import(`${dir}/viewprefs.js`);
const A = await import(`${dir}/appstate.js`);

test('the glass designs build on dark and light; the others stay as they are', () => {
  assert.equal(G.baseTheme('glass'), 'dark');
  assert.equal(G.baseTheme('glasslight'), 'light');
  for (const t of ['holo', 'dark', 'light']) { assert.equal(G.baseTheme(t), t); assert.equal(G.isGlass(t), false); assert.equal(G.glassMode(t), null); }
  assert.equal(G.glassShown('glass', true), 'dark'); assert.equal(G.glassShown('glasslight', false), null); assert.equal(G.glassShown('dark', true), null);   // editing: no glass (5.37.3)
  assert.equal(G.isGlass('glass'), true);
  assert.equal(G.glassMode('glass'), 'dark');
  assert.equal(G.glassMode('glasslight'), 'light');
  assert.equal(G.isGlass('toString'), false);         // nothing of Object counts as a design
  assert.equal(G.baseTheme(undefined), undefined);
});

test('only a choice: the default design is still "Dunkel"', () => {
  assert.equal(A.DEFAULT_SETTINGS.theme, 'dark');
  assert.deepEqual(V.CARD_FIELDS.theme, ['holo', 'dark', 'light', 'glass', 'glasslight']);   // the dashboard card can choose it too
});

test('the picture: dark glass darker, light glass lighter, grey stays grey', () => {
  const [r, g, b] = G.tone([200, 120, 60], 'dark');
  assert.ok(r < 200 && b < 60, 'darker');
  assert.ok(r - b > (200 - 60) * 0.55, 'colours a little stronger');
  const light = G.tone([20, 20, 20], 'light');
  assert.ok(light.every((v) => v > 140), 'a dark spot turns light behind light glass');
  assert.deepEqual(G.tone([100, 100, 100], 'dark'), [55, 55, 55]);
  for (const v of [...G.tone([255, 0, 255], 'dark'), ...G.tone([255, 0, 255], 'light'), ...G.tone([0, 255, 0], 'light')]) assert.ok(v >= 0 && v <= 255);
});

test('the picture is small and keeps the shape of the view', () => {
  assert.deepEqual(G.wallSize(1400, 700), { w: 160, h: 80 });
  assert.deepEqual(G.wallSize(390, 844), { w: 74, h: 160 });
  assert.equal(G.wallSize(0, 700), null);
  assert.equal(G.wallSize(undefined, 700), null);
  assert.equal(G.wallKey('abc'), 'fp.glassWall.abc');
  assert.equal(G.wallKey(''), 'fp.glassWall.default');
});

test('the sky behind the 3D view: the colours of its gradient', () => {
  const fb = ['#111', '#222'];
  assert.deepEqual(G.skyColors('url("data:image/png;base64,AAA") 0 0 / 64px, linear-gradient(rgb(40, 60, 120) 0%, rgb(200, 160, 130) 100%)', fb),
    ['rgb(40, 60, 120)', 'rgb(200, 160, 130)']);
  assert.deepEqual(G.skyColors('linear-gradient(180deg, #123456, #abcdef)', fb), ['#123456', '#abcdef']);
  assert.deepEqual(G.skyColors('none', fb), fb);
  assert.deepEqual(G.skyColors('', fb), fb);
});
