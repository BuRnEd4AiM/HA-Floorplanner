// Unit tests for settings.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const S = await import(`${process.env.STATIC_DIR || '/tmp/static'}/settings.js`);
const ft = (v) => v / 3.28084, toFt = (m) => +(m * 3.28084).toFixed(3);

test('every setting has its own form field', () => {
  const ids = Object.values(S.BINDINGS);
  assert.equal(new Set(ids).size, ids.length);
  for (const k of S.DISP_KEYS) assert.ok(S.BINDINGS[k], k);
});
test('form values: checkboxes, numbers (lengths converted, empty or 0 keeps the old value), ranges, grid, text', () => {
  assert.equal(S.formValue('shadows', { type: 'checkbox', checked: true }, ft), true);
  assert.ok(Math.abs(S.formValue('wallHeight', { type: 'number', value: '8.53' }, ft) - 2.6) < 0.001);
  assert.equal(S.formValue('autosaveSeconds', { type: 'number', value: '3' }, ft), 3);
  assert.equal(S.formValue('autosaveSeconds', { type: 'number', value: '' }, ft), undefined);
  assert.equal(S.formValue('autosaveSeconds', { type: 'number', value: '0' }, ft), undefined);
  assert.equal(S.formValue('wallOpacity', { type: 'range', value: '0.4' }, ft), 0.4);
  assert.equal(S.formValue('wallOpacity', { type: 'range', value: '' }, ft), 0);
  assert.equal(S.formValue('grid', { type: 'select-one', value: '0.25' }, ft), 0.25);
  assert.equal(S.formValue('theme', { type: 'select-one', value: 'holo' }, ft), 'holo');
});
test('idle return: 0 means off and stays 0, negative becomes 0', () => {
  assert.equal(S.formValue('idleReturn', { type: 'number', value: '0' }, ft), 0);
  assert.equal(S.formValue('idleReturn', { type: 'number', value: '-3' }, ft), 0);
  assert.equal(S.formValue('idleReturn', { type: 'number', value: '5' }, ft), 5);
});
test('field values: lengths in the current unit, the rest as text', () => {
  assert.equal(S.fieldValue('wallHeight', 2.6, toFt), 8.53);
  assert.equal(S.fieldValue('grid', 0.25, toFt), '0.25');
});
test('Auto and See-through exclude each other: the one switched on last wins', () => {
  assert.deepEqual(S.resolveWallView({ cutaway: true, seeThrough: false }, { cutaway: true, seeThrough: true }), { cutaway: false, seeThrough: true });
  assert.deepEqual(S.resolveWallView({ cutaway: false, seeThrough: true }, { cutaway: true, seeThrough: true }), { cutaway: true, seeThrough: false });
  const same = { cutaway: true, seeThrough: false };
  assert.equal(S.resolveWallView({}, same), same);
});
test('tablet users: every user with a room or a view counts once', () => {
  assert.equal(S.tabletUsers({ userRooms: { a: 'K', b: 'B' }, userViews: { b: '2d', c: '3d' } }), 3);
  assert.equal(S.tabletUsers({}), 0);
});
test('saving (#333): one save at a time, changes made meanwhile go in ONE more save right after it', async () => {
  const runs = [];
  let open = 0, most = 0, release = [];
  const save = S.oneAtATime(async (newer) => {
    open++; most = Math.max(most, open);
    await new Promise((r) => release.push(r));
    runs.push(newer()); open--;
  });
  const a = save(), b = save(), c = save();             // two quick changes while the first save is on its way
  assert.equal(b, a); assert.equal(c, a);
  release.shift()(); await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(runs, [true]);                        // the first save knew it was out of date (its answer is not applied)
  release.shift()(); await a;
  assert.deepEqual(runs, [true, false]);                 // exactly one more save, with the newest settings
  assert.equal(most, 1);
  const d = save(); assert.notEqual(d, a);              // later changes start a new save
  release.shift()(); await d;
  assert.deepEqual(runs, [true, false, false]);
});
test('saving (#333): a save that fails does not block the next one', async () => {
  let n = 0;
  const save = S.oneAtATime(async () => { n++; if (n === 1) throw new Error('offline'); });
  await assert.rejects(save());
  await save();
  assert.equal(n, 2);
});
