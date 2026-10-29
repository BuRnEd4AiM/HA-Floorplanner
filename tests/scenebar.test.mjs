// Unit tests for scenebar.js (the scene bar over the tab bar, #597; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const B = await import(`${process.env.STATIC_DIR || '/tmp/static'}/scenebar.js`);

test('only scenes and scripts, each once, names and icons cut, colours known', () => {
  assert.equal(B.fitsBar('scene.wz'), true); assert.equal(B.fitsBar('script.film'), true);
  assert.equal(B.fitsBar('light.wz'), false); assert.equal(B.fitsBar('Scene.X'), false); assert.equal(B.fitsBar(5), false);
  assert.deepEqual(B.cleanItem({ e: 'scene.wz', name: ' Wohnzimmer an\u0007 ', icon: '🛋', color: 'purple' }), { e: 'scene.wz', name: 'Wohnzimmer an', icon: '🛋', color: 'purple' });
  assert.deepEqual(B.cleanItem({ e: 'scene.wz', name: 'ä'.repeat(40), icon: 'x'.repeat(20), color: 'pink' }), { e: 'scene.wz', name: 'ä'.repeat(30), icon: 'x'.repeat(8), color: '' });
  assert.equal(B.cleanItem({ e: 'light.a' }), null); assert.equal(B.cleanItem('scene.wz'), null);
  const many = Array.from({ length: 30 }, (_, i) => ({ e: `scene.s${i}` }));
  assert.equal(B.cleanItems(many).length, B.MAX_ITEMS);
  assert.deepEqual(B.cleanItems([{ e: 'scene.a' }, { e: 'scene.a', name: 'again' }, null, { e: 'script.b' }]).map((x) => x.e), ['scene.a', 'script.b']);
});

test('keys of a page and of one version of it', () => {
  assert.equal(B.barKey('today'), 'today'); assert.equal(B.barKey('today', 'v_kids01'), 'today@v_kids01'); assert.equal(B.barKey('house', 'v_kids01'), 'house');
  assert.deepEqual(B.splitKey('today@v_kids01'), { page: 'today', version: 'v_kids01' }); assert.deepEqual(B.splitKey('p_garten'), { page: 'p_garten', version: '' });
  for (const bad of ['house@v_kids01', 'nope', 'today@x', 'today@v_kids01@v_abc', 5]) assert.equal(B.splitKey(bad), null, String(bad));
});

test('the bar made safe: missing fields are empty, bad pages and modes go', () => {
  assert.deepEqual(B.cleanSceneBar(undefined), { on: true, items: [], pages: {} });
  assert.deepEqual(B.cleanSceneBar({ on: false }), { on: false, items: [], pages: {} });
  const b = B.cleanSceneBar({ items: [{ e: 'scene.a' }], pages: { today: { mode: 'own', items: [{ e: 'script.b' }, { e: 'light.x' }] }, energy: { mode: 'off' },
    climate: { mode: 'weird' }, nope: { mode: 'off' }, 'today@v_kids01': { mode: 'off' }, house: { mode: 'own', items: [{ e: 'scene.h' }] }, family: 'x' } });
  assert.deepEqual(Object.keys(b.pages), ['today', 'energy', 'today@v_kids01', 'house']);
  assert.deepEqual(b.pages.today.items.map((x) => x.e), ['script.b']); assert.deepEqual(b.pages.energy.items, []);
  const known = B.cleanSceneBar({ pages: { p_gone: { mode: 'off' }, p_garten: { mode: 'off' }, 'today@v_gone01': { mode: 'off' }, 'today@v_kids01': { mode: 'off' } } },
    { pages: ['house', 'today', 'p_garten'], versions: { today: ['v_kids01'] } });
  assert.deepEqual(Object.keys(known.pages), ['p_garten', 'today@v_kids01']);
});

test('which tiles a page shows: its version, the page, else the list for every page', () => {
  const bar = { items: [{ e: 'scene.all' }], pages: { today: { mode: 'own', items: [{ e: 'scene.today' }] }, energy: { mode: 'off', items: [{ e: 'scene.x' }] },
    'today@v_kids01': { mode: 'own', items: [{ e: 'scene.kids' }] }, 'climate@v_kids01': { mode: 'off' } } };
  const ids = (page, v) => B.itemsFor(bar, page, v).map((x) => x.e);
  assert.deepEqual(ids('house'), ['scene.all']); assert.deepEqual(ids('today'), ['scene.today']); assert.deepEqual(ids('today', 'v_kids01'), ['scene.kids']);
  assert.deepEqual(ids('today', 'v_other1'), ['scene.today']); assert.deepEqual(ids('energy'), []); assert.deepEqual(ids('climate'), ['scene.all']);
  assert.deepEqual(ids('climate', 'v_kids01'), []);
  assert.deepEqual(B.itemsFor({ ...bar, on: false }, 'house'), []);
  assert.equal(B.modeOf(bar, 'today'), 'own'); assert.equal(B.modeOf(bar, 'energy'), 'off'); assert.equal(B.modeOf(bar, 'house'), 'all');
});

test('setting a page to its own list starts with what it showed; the list for every page is changed on its own', () => {
  const bar = { items: [{ e: 'scene.all' }], pages: {} };
  const own = B.withMode(bar, 'today', 'own');
  assert.deepEqual(own.pages.today, { mode: 'own', items: [{ e: 'scene.all', name: '', icon: '', color: '' }] });
  const kids = B.withMode(B.withItems(own, 'today', [{ e: 'scene.t' }]), 'today@v_kids01', 'own');
  assert.deepEqual(kids.pages['today@v_kids01'].items.map((x) => x.e), ['scene.t']);       // a version starts with its page's list
  const off = B.withMode(kids, 'today', 'off');
  assert.equal(off.pages.today.mode, 'off'); assert.deepEqual(off.pages.today.items.map((x) => x.e), ['scene.t']);   // kept for later
  assert.deepEqual(B.withMode(off, 'today', 'all').pages.today, undefined);
  assert.deepEqual(B.withItems(bar, '', [{ e: 'script.x' }, { e: 'light.y' }]).items.map((x) => x.e), ['script.x']);
  assert.deepEqual(B.listOf(kids, 'today').map((x) => x.e), ['scene.t']); assert.deepEqual(B.listOf(kids, ''), [{ e: 'scene.all', name: '', icon: '', color: '' }]);
  assert.deepEqual(B.listOf(kids, 'energy'), []);
  assert.equal(B.withItems(bar, 'energy', [{ e: 'scene.e' }]).pages.energy.mode, 'own');
});

test('the scene or script that ran last', () => {
  const states = { 'scene.a': { state: '2026-10-29T18:00:00+00:00' }, 'scene.b': { state: '2026-10-29T20:00:00.123+00:00' }, 'scene.c': { state: 'unknown' },
    'script.d': { state: 'off', at: Date.parse('2026-10-29T19:00:00Z') / 1000 } };
  assert.equal(B.lastFired([{ e: 'scene.a' }, { e: 'scene.b' }, { e: 'script.d' }], states), 'scene.b');
  assert.equal(B.lastFired([{ e: 'scene.a' }, { e: 'script.d' }], states), 'script.d');
  assert.equal(B.lastFired([{ e: 'scene.c' }, { e: 'scene.gone' }], states), null);
  assert.equal(B.firedAt('scene.c', states['scene.c']), null); assert.equal(B.firedAt('script.x', { state: 'off' }), null);
});

test('a tile: its own name and icon, else Home Assistant\'s name and one picked for it', () => {
  assert.deepEqual(B.tileOf({ e: 'scene.wz_an', name: '', icon: '', color: '' }, { 'scene.wz_an': 'Wohnzimmer an' }, (n) => (n.includes('Wohn') ? '🛋' : '?')),
    { e: 'scene.wz_an', name: 'Wohnzimmer an', icon: '🛋', color: '' });
  assert.deepEqual(B.tileOf({ e: 'script.film_abend', name: 'Kino', icon: '🎬', color: 'red' }), { e: 'script.film_abend', name: 'Kino', icon: '🎬', color: 'red' });
  assert.equal(B.tileOf({ e: 'scene.gute_nacht', name: '', icon: '', color: '' }).name, 'gute nacht');
});
