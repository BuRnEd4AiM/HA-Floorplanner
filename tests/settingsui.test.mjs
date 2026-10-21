// Unit tests for settingsui.js (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const S = await import(`${process.env.STATIC_DIR || '/tmp/static'}/settingsui.js`);

test('rooms by house: top floor first, no roofs, no unnamed rooms', () => {
  const lay = { floors: [{ name: 'EG', rooms: [{ name: 'Küche' }, { name: '' }, {}] }, { name: 'OG', rooms: [{ name: 'Bad' }] }, { name: 'Dach', kind: 'roof', rooms: [{ name: 'Spitzboden' }] }] };
  assert.deepEqual(S.roomsByHouse(lay, 'Haus'), { house: 'Haus', rooms: [{ name: 'Bad', floor: 'OG' }, { name: 'Küche', floor: 'EG' }], buildings: [] });
  assert.deepEqual(S.roomsByHouse({}, 'X'), { house: 'X', rooms: [], buildings: [] });
});
test('tablet entries: every user with a room or a view once, view defaults to 3d', () => {
  const e = S.tabletEntries({ userRooms: { anna: 'Küche', ben: 'Bad' }, userViews: { ben: 'split', cleo: '2d' } });
  assert.deepEqual(e, [{ user: 'anna', room: 'Küche', view: '3d', preset: {}, locks: [], start: null, building: '', tabs: { hide: [] } }, { user: 'ben', room: 'Bad', view: 'split', preset: {}, locks: [], start: null, building: '', tabs: { hide: [] } }, { user: 'cleo', room: '', view: '2d', preset: {}, locks: [], start: null, building: '', tabs: { hide: [] } }]);
  assert.deepEqual(S.tabletEntries({}), []);
});
test('collecting tablets: users are trimmed, empty users dropped, whole house has no room', () => {
  const r = S.collectTablets([{ user: ' anna ', room: 'Küche', view: '3d' }, { user: '', room: 'Bad', view: '2d' }, { user: 'ben', room: '', view: 'all' }]);
  assert.deepEqual(r, { rooms: { anna: 'Küche' }, views: { anna: '3d', ben: 'all' }, presets: {}, locks: {}, starts: {}, buildings: {}, tabs: {} });
});
test('tablet entries and collecting are the inverse of each other', () => {
  const s = { userRooms: { anna: 'Küche' }, userViews: { anna: 'split', ben: '2d', kid: '3d' }, userPresets: { ben: { seeThrough: true, belowLabels: false } },
    userLocks: { kid: ['control', 'settings'] }, userBuildings: { kid: 'b1' }, userTabs: { kid: { hide: ['cameras'] }, ben: { hide: [], start: 'cameras' } },
    startViews: { '*': { house: '', floor: 'f0', idx: 0, whole: false, room: null, cam: [1, 2, 3], target: [0, 0, 0] },
      ben: { house: 'main', floor: '', idx: -1, whole: true, room: null, cam: [4, 5, 6], target: [0, 0, 0] } } };
  const r = S.collectTablets(S.tabletEntries(s));
  assert.deepEqual(r, { rooms: s.userRooms, views: s.userViews, presets: s.userPresets, locks: s.userLocks, starts: { ben: s.startViews.ben }, buildings: s.userBuildings, tabs: s.userTabs });   // "*" is not a user row (#315)
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
  assert.deepEqual(S.tabletEntries({ userPresets: { tab: { labelMode: 'none', junk: 1 } } }), [{ user: 'tab', room: '', view: '3d', preset: { labelMode: 'none' }, locks: [], start: null, building: '', tabs: { hide: [] } }]);
  assert.deepEqual(S.readPreset([{ key: 'seeThrough', value: 'true' }, { key: 'cutaway', value: '' }, { key: 'belowLabels', value: 'false' }, { key: 'belowMode', value: 'stacked' }]),
    { seeThrough: true, belowLabels: false, belowMode: 'stacked' });
  assert.deepEqual(S.readPreset([{ key: 'labelMode', value: 'bogus' }]), {});
  for (const [key, opts] of S.PRESET_UI) for (const [v] of opts) assert.deepEqual(S.readPreset([{ key, value: String(v) }]), { [key]: v });   // every option survives the round trip
});
test('locks: a user with only locks is listed, unknown locks dropped', () => {
  assert.deepEqual(S.tabletEntries({ userLocks: { kid: ['search', 'bogus', 'control'] } }), [{ user: 'kid', room: '', view: '3d', preset: {}, locks: ['control', 'search'], start: null, building: '', tabs: { hide: [] } }]);
});
test('buildings (#409): a plan with two or more lists them for the user rows; a user with only a building is listed; "all" has no entry', () => {
  const lay = { buildings: [{ id: 'b1', name: 'Haupthaus' }, { id: 'b2', name: 'Gartenhaus' }], floors: [] };
  assert.deepEqual(S.roomsByHouse(lay, 'Haus').buildings, [{ id: 'b1', name: 'Haupthaus' }, { id: 'b2', name: 'Gartenhaus' }]);
  assert.deepEqual(S.roomsByHouse({ buildings: [{ id: 'b1', name: 'A' }], floors: [] }, 'Haus').buildings, []);   // one alone: nothing to choose
  assert.deepEqual(S.tabletEntries({ userBuildings: { tab: 'b2' } }), [{ user: 'tab', room: '', view: '3d', preset: {}, locks: [], start: null, building: 'b2', tabs: { hide: [] } }]);
  assert.deepEqual(S.collectTablets([{ user: 'a', view: '3d', building: 'b1' }, { user: 'b', view: '3d', building: '' }]).buildings, { a: 'b1' });
});
test('tabs (#479): a user with only tabs is listed; hidden pages and the start tab come back as they were', () => {
  assert.deepEqual(S.tabletEntries({ userTabs: { flur: { hide: [], start: 'cameras' } } }),
    [{ user: 'flur', room: '', view: '3d', preset: {}, locks: [], start: null, building: '', tabs: { hide: [], start: 'cameras' } }]);
  assert.deepEqual(S.collectTablets([{ user: 'a', view: '3d', tabs: { hide: ['cameras'], start: '' } }, { user: 'b', view: '3d', tabs: { hide: [], start: '' } }]).tabs, { a: { hide: ['cameras'] } });
});
