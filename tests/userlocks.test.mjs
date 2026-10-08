// Unit tests for userlocks.js (what a user / tablet may not use; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const L = await import(`${process.env.STATIC_DIR || '/tmp/static'}/userlocks.js`);

test('locks: only known ones, each once, in the order of the list', () => {
  assert.deepEqual(L.cleanLocks(['settings', 'bogus', 'control', 'settings']), ['control', 'settings']);
  assert.deepEqual(L.cleanLocks(null), []); assert.deepEqual(L.cleanLocks('control'), []); assert.deepEqual(L.cleanLocks({}), []);
});
test('collecting locks from the dialog: users trimmed, users without a lock left out', () => {
  assert.deepEqual(L.collectLocks([{ user: ' kid ', locks: ['search', 'control'] }, { user: 'anna', locks: [] }, { user: '', locks: ['control'] }, { user: 'ben' }]),
    { kid: ['control', 'search'] });
});
test('the CSS hides what is locked, nothing when nothing is locked', () => {
  assert.equal(L.lockCss([]), ''); assert.equal(L.lockCss(['junk']), '');
  const css = L.lockCss(['settings', 'search']);
  assert.match(css, /#settingsBtn/); assert.match(css, /#findBtn/); assert.doesNotMatch(css, /#camPill/);
  assert.match(css, /display: none !important/);
  assert.doesNotMatch(L.lockCss(['viewMenu']), /#modeBar[,{ ]/);
  assert.match(L.lockCss(['viewMenu', 'colorModes']), /#modeBar \{/);              // both: the bar is empty, so it goes too
});
test('every lock hides something', () => {
  for (const [k, sel] of L.LOCKS) assert.ok(sel && L.lockCss([k]).length > 0, k);
});
test('locked cameras: no camera images are fetched, the settings object stays the same otherwise', () => {
  const s = { cameraImages: true, theme: 'dark' };
  assert.deepEqual(L.lockedSettings(s, ['cameras']), { cameraImages: false, theme: 'dark' });
  assert.equal(L.lockedSettings(s, ['control']), s);
  assert.equal(s.cameraImages, true);
});
