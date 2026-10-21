// Unit tests for tabs.js (the tab bar at the bottom, #479; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const T = await import(`${process.env.STATIC_DIR || '/tmp/static'}/tabs.js`);

test('a user entry keeps only known tabs, never hides the house, a hidden start tab is dropped', () => {
  assert.deepEqual(T.cleanTabEntry({ hide: ['cameras', 'house', 'bogus', 'cameras'], start: 'cameras' }), { hide: ['cameras'] });
  assert.deepEqual(T.cleanTabEntry({ hide: [], start: 'cameras' }), { hide: [], start: 'cameras' });
  assert.equal(T.cleanTabEntry({ hide: [], start: 'house' }), null);              // the house is the start anyway: nothing to keep
  assert.equal(T.cleanTabEntry({ start: 'nope' }), null);
  for (const junk of [null, 'cameras', ['cameras'], 5]) assert.equal(T.cleanTabEntry(junk), null);
});
test('the entries of all users: names trimmed, empty ones left out, at most 50', () => {
  assert.deepEqual(T.cleanUserTabs({ ' kid ': { hide: ['cameras'] }, anna: { hide: [] }, '': { start: 'cameras' }, ben: 'x' }), { kid: { hide: ['cameras'] } });
  assert.deepEqual(T.cleanUserTabs(null), {}); assert.deepEqual(T.cleanUserTabs([1]), {});
  const many = Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`u${i}`, { start: 'cameras' }]));
  assert.equal(Object.keys(T.cleanUserTabs(many)).length, 50);
});
test('rows of the users dialog become settings.userTabs', () => {
  assert.deepEqual(T.collectUserTabs([{ user: ' flur ', hide: [], start: 'cameras' }, { user: '', hide: ['cameras'] }, { user: 'kid', hide: ['cameras'], start: '' }]),
    { flur: { hide: [], start: 'cameras' }, kid: { hide: ['cameras'] } });
});
test('the shown tabs: the house always, a page only with something on it, not hidden and not locked', () => {
  assert.deepEqual(T.shownTabs({}), ['house']);
  assert.deepEqual(T.shownTabs({ has: { cameras: true } }), ['house', 'cameras']);
  assert.deepEqual(T.shownTabs({ has: { cameras: true }, hide: ['cameras'] }), ['house']);
  assert.deepEqual(T.shownTabs({ has: { cameras: true }, locks: ['cameras'] }), ['house']);   // may not see the cameras: no camera page either
  assert.deepEqual(T.shownTabs({ has: { cameras: true }, locks: ['control'] }), ['house', 'cameras']);
  assert.deepEqual(T.shownTabs({ has: { today: true, energy: true }, locks: ['energy'] }), ['house', 'today']);   // may not see the energy (#479)
});
test('the pages of 4.5 (#483): a user who may not switch has no climate and no routines, the family stays', () => {
  const has = { climate: true, cameras: true, routines: true, family: true };
  assert.deepEqual(T.shownTabs({ has }), ['house', 'climate', 'cameras', 'routines', 'family']);
  assert.deepEqual(T.shownTabs({ has, locks: ['control'] }), ['house', 'cameras', 'family']);
  assert.deepEqual(T.cleanTabEntry({ hide: ['family', 'routines'], start: 'climate' }), { hide: ['routines', 'family'], start: 'climate' });
});
test('the bar: live mode only, never in the dashboard card, not when switched off or with the house alone', () => {
  const two = ['house', 'cameras'];
  assert.equal(T.barShown({ live: true, card: false, on: true, tabs: two }), true);
  assert.equal(T.barShown({ live: true, card: false, on: undefined, tabs: two }), true);    // settings from before the bar: on
  assert.equal(T.barShown({ live: false, card: false, on: true, tabs: two }), false);       // edit mode: the editor as always
  assert.equal(T.barShown({ live: true, card: true, on: true, tabs: two }), false);
  assert.equal(T.barShown({ live: true, card: false, on: false, tabs: two }), false);
  assert.equal(T.barShown({ live: true, card: false, on: true, tabs: ['house'] }), false);
});
test('start tab and the tab kept after a change', () => {
  assert.equal(T.startTab('cameras', ['house', 'cameras']), 'cameras');
  assert.equal(T.startTab('cameras', ['house']), 'house');
  assert.equal(T.startTab(undefined, ['house', 'cameras']), 'house');
  assert.equal(T.keepTab('cameras', ['house', 'cameras'], true), 'cameras');
  assert.equal(T.keepTab('cameras', ['house', 'cameras'], false), 'house');               // no bar (edit mode): back to the house
  assert.equal(T.keepTab('cameras', ['house'], true), 'house');
});
test('every tab has a key and an icon, the house comes first', () => {
  assert.equal(T.TABS[0][0], T.HOME);
  for (const [k, icon] of T.TABS) assert.ok(/^[a-z]+$/.test(k) && icon, k);
});
