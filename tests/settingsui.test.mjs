// Unit tests for settingsui.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const S = await import(`${process.env.STATIC_DIR || '/tmp/static'}/settingsui.js`);

test('rooms by house: top floor first, no roofs, no unnamed rooms', () => {
  const lay = { floors: [{ name: 'EG', rooms: [{ name: 'Küche' }, { name: '' }, {}] }, { name: 'OG', rooms: [{ name: 'Bad' }] }, { name: 'Dach', kind: 'roof', rooms: [{ name: 'Spitzboden' }] }] };
  assert.deepEqual(S.roomsByHouse(lay, 'Haus'), { house: 'Haus', rooms: [{ name: 'Bad', floor: 'OG' }, { name: 'Küche', floor: 'EG' }] });
  assert.deepEqual(S.roomsByHouse({}, 'X'), { house: 'X', rooms: [] });
});
test('tablet entries: every user with a room or a view once, view defaults to 3d', () => {
  const e = S.tabletEntries({ userRooms: { anna: 'Küche', ben: 'Bad' }, userViews: { ben: 'split', cleo: '2d' } });
  assert.deepEqual(e, [{ user: 'anna', room: 'Küche', view: '3d', preset: {} }, { user: 'ben', room: 'Bad', view: 'split', preset: {} }, { user: 'cleo', room: '', view: '2d', preset: {} }]);
  assert.deepEqual(S.tabletEntries({}), []);
});
test('collecting tablets: users are trimmed, empty users dropped, whole house has no room', () => {
  const r = S.collectTablets([{ user: ' anna ', room: 'Küche', view: '3d' }, { user: '', room: 'Bad', view: '2d' }, { user: 'ben', room: '', view: 'all' }]);
  assert.deepEqual(r, { rooms: { anna: 'Küche' }, views: { anna: '3d', ben: 'all' }, presets: {} });
});
test('tablet entries and collecting are the inverse of each other', () => {
  const s = { userRooms: { anna: 'Küche' }, userViews: { anna: 'split', ben: '2d' }, userPresets: { ben: { seeThrough: true, belowLabels: false } } };
  const r = S.collectTablets(S.tabletEntries(s));
  assert.deepEqual(r, { rooms: s.userRooms, views: s.userViews, presets: s.userPresets });
});
test('colour stops: numbers parsed, sorted, junk rows dropped', () => {
  const r = S.normalizeStops([{ v: '30', c: '#f00' }, { v: 'x', c: '#000' }, { v: '10', c: '#00f' }, { v: '20.5', c: '#0f0' }], []);
  assert.deepEqual(r, [{ v: 10, c: '#00f' }, { v: 20.5, c: '#0f0' }, { v: 30, c: '#f00' }]);
});
test('colour stops: fewer than two usable rows keep the old scale', () => {
  const fb = [{ v: 1, c: '#111' }, { v: 2, c: '#222' }];
  assert.equal(S.normalizeStops([{ v: '5', c: '#fff' }], fb), fb);
  assert.equal(S.normalizeStops([], fb), fb);
});
test('presets (#250): a user with only a preset is listed; the dropdowns read back as yes / no and words, "Default" left out', () => {
  assert.deepEqual(S.tabletEntries({ userPresets: { tab: { labelMode: 'none', junk: 1 } } }), [{ user: 'tab', room: '', view: '3d', preset: { labelMode: 'none' } }]);
  assert.deepEqual(S.readPreset([{ key: 'seeThrough', value: 'true' }, { key: 'cutaway', value: '' }, { key: 'belowLabels', value: 'false' }, { key: 'belowMode', value: 'stacked' }]),
    { seeThrough: true, belowLabels: false, belowMode: 'stacked' });
  assert.deepEqual(S.readPreset([{ key: 'labelMode', value: 'bogus' }]), {});
  for (const [key, opts] of S.PRESET_UI) for (const [v] of opts) assert.deepEqual(S.readPreset([{ key, value: String(v) }]), { [key]: v });   // every option survives the round trip
});
