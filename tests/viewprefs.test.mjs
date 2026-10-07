// Unit tests for viewprefs.js (view presets per user #250, labels of the floors below #249; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const V = await import(`${process.env.STATIC_DIR || '/tmp/static'}/viewprefs.js`);

test('a preset keeps only known fields with allowed values', () => {
  assert.deepEqual(V.cleanPreset({ seeThrough: true, labelMode: 'none', belowMode: 'weird', theme: 'dark', lowWalls: 'yes', belowLabels: false }),
    { seeThrough: true, labelMode: 'none', belowLabels: false });
  assert.deepEqual(V.cleanPreset(null), {}); assert.deepEqual(V.cleanPreset([1]), {}); assert.deepEqual(V.cleanPreset('x'), {});
});
test('starting a preset: the settings get the preset, the values of everybody are remembered', () => {
  const s = { seeThrough: false, cutaway: true, labelMode: 'important', theme: 'dark' };
  const st = V.startPreset(s, { seeThrough: true, labelMode: 'all', junk: 1 });
  assert.deepEqual(st.settings, { seeThrough: true, cutaway: true, labelMode: 'all', theme: 'dark' });
  assert.deepEqual(st.base, { seeThrough: false, labelMode: 'important' });
  assert.equal(V.startPreset(s, {}), null); assert.equal(V.startPreset(s, undefined), null);
});
test('saving: an untouched preset field is saved as everybody\'s value, a field changed on purpose as changed', () => {
  const st = V.startPreset({ seeThrough: false, labelMode: 'important', theme: 'dark' }, { seeThrough: true, labelMode: 'all' });
  let r = V.forSaving({ ...st.settings, theme: 'light' }, st);
  assert.deepEqual(r.body, { seeThrough: false, labelMode: 'important', theme: 'light' });   // the preset never leaks to everybody
  r = V.forSaving({ ...st.settings, labelMode: 'none' }, st);
  assert.deepEqual(r.body, { seeThrough: false, labelMode: 'none', theme: 'dark' });        // the user switched the labels off: that counts
  assert.equal(r.state.base.labelMode, 'none'); assert.equal(r.state.start.labelMode, 'none');
  assert.deepEqual(V.forSaving({ a: 1 }, null), { body: { a: 1 }, state: null });          // no preset: saved as it is
});
test('after a save the preset fields stay as this browser has them', () => {
  const st = V.startPreset({ seeThrough: false, cutaway: true }, { seeThrough: true });
  assert.deepEqual(V.keepSession({ seeThrough: true, cutaway: false }, st), { seeThrough: true });
  assert.deepEqual(V.keepSession({ seeThrough: true }, null), {});
});
test('labels of the floors below (#249): left out only when switched off, looking at one floor', () => {
  assert.equal(V.floorLabels({ belowLabels: false }, 0, 1, false), false);
  assert.equal(V.floorLabels({ belowLabels: false }, 1, 1, false), true);      // the open floor
  assert.equal(V.floorLabels({ belowLabels: false }, 0, 1, true), true);       // whole house
  assert.equal(V.floorLabels({ belowLabels: true }, 0, 1, false), true);
  assert.equal(V.floorLabels({}, 0, 1, false), true);                         // older settings: shown as before
});
test('presets from the users dialog: trimmed users, empty presets and rows without a user dropped', () => {
  assert.deepEqual(V.collectPresets([{ user: ' tab ', preset: { seeThrough: true, x: 1 } }, { user: 'b', preset: {} }, { user: '', preset: { cutaway: false } }]),
    { tab: { seeThrough: true } });
});
