// Unit tests for pagevariants.js (a page of the tab bar in own versions per user, #507; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const V = await import(`${process.env.STATIC_DIR || '/tmp/static'}/pagevariants.js`);
const EMPTY = { order: [], hidden: [], sizes: {}, sections: [], widths: {}, cards: [] };
const kids = { id: 'v_kids01', name: 'Kinder', icon: '🧒', layout: { hidden: ['room:r2'] } };
const base = () => ({ pageLayouts: { climate: { hidden: ['tip'] } }, pageVariants: { climate: [kids] }, userTabs: { Lena: { hide: [], variants: { climate: 'v_kids01' } } } });

test('a version made safe: id, name, icon, layout', () => {
  assert.deepEqual(V.cleanVariant(kids), { id: 'v_kids01', name: 'Kinder', icon: '🧒', layout: { ...EMPTY, hidden: ['room:r2'] } });
  assert.equal(V.cleanVariant({ id: 'x_kids01' }), null);
  for (const junk of [null, 'v_kids01', ['v_kids01'], { id: 5 }]) assert.equal(V.cleanVariant(junk), null);
  const odd = V.cleanVariant({ id: 'v_abc', name: ` ${'ä'.repeat(40)}\u0007 `, icon: 'too long an icon' });
  assert.equal(odd.name, 'ä'.repeat(30)); assert.equal(odd.icon, '🗂');
  assert.equal(V.cleanVariant({ id: 'v_abc', name: '  ' }).name, '?');
});
test('every page\'s versions: known pages only, never the house, ids once, at most six', () => {
  const many = Array.from({ length: 9 }, (_, i) => ({ id: `v_abc${i}`, name: `n${i}` }));
  const out = V.cleanVariants({ climate: [kids, kids], house: [kids], nope: [kids], today: many, energy: [], p_garden: [kids] }, ['climate', 'today', 'energy', 'house', 'p_garden']);
  assert.deepEqual(Object.keys(out), ['climate', 'today', 'p_garden']);
  assert.equal(out.climate.length, 1); assert.equal(out.today.length, V.MAX_VARIANTS);
  assert.deepEqual(V.cleanVariants(null, ['climate']), {}); assert.deepEqual(V.cleanVariants([kids], ['climate']), {});
});
test('the version somebody sees: his own while it exists, else "Für alle"; the name without case', () => {
  const s = base();
  assert.equal(V.pickedVariant(s, V.entryOf(s.userTabs, ' lena '), 'climate'), 'v_kids01');
  assert.equal(V.pickedVariant(s, V.entryOf(s.userTabs, 'tim'), 'climate'), V.ALL);
  assert.equal(V.pickedVariant(s, { hide: [], variants: { climate: 'v_gone01' } }, 'climate'), V.ALL);   // a version that was deleted
  assert.equal(V.pickedVariant(s, null, 'climate'), V.ALL);
  assert.equal(V.cellOf(s, { hide: ['climate'], variants: { climate: 'v_kids01' } }, 'climate'), V.OFF);
});
test('the layout of a version, and a change of it written to the right place', () => {
  const s = base();
  assert.deepEqual(V.layoutIn(s, 'climate', 'v_kids01').hidden, ['room:r2']);
  assert.deepEqual(V.layoutIn(s, 'climate', V.ALL).hidden, ['tip']);
  assert.deepEqual(V.layoutIn(s, 'climate', 'v_gone01').hidden, ['tip']);
  assert.deepEqual(V.layoutIn({}, 'today', V.ALL), EMPTY);
  const a = V.withLayoutIn(s, 'climate', 'v_kids01', { hidden: ['room:r3'] });
  assert.deepEqual(Object.keys(a), ['pageVariants']); assert.deepEqual(a.pageVariants.climate[0].layout.hidden, ['room:r3']);
  assert.deepEqual(s.pageVariants.climate[0].layout.hidden, ['room:r2']);                      // the settings themselves stay as they are
  const b = V.withLayoutIn(s, 'climate', V.ALL, { hidden: ['x'] });
  assert.deepEqual(Object.keys(b), ['pageLayouts']); assert.deepEqual(b.pageLayouts.climate.hidden, ['x']);
  assert.deepEqual(V.withLayoutIn(s, 'climate', V.ALL, {}).pageLayouts, {});                   // an empty layout is left out, like before
});
test('a new version: a copy of a layout, at most six, a taken id refused; renamed; deleted with its users', () => {
  const s = base();
  const add = V.addVariant(s, 'climate', { id: 'v_flur01', name: 'Tablet Flur', icon: '📟' }, V.layoutIn(s, 'climate', V.ALL));
  assert.deepEqual(add.pageVariants.climate.map((x) => x.id), ['v_kids01', 'v_flur01']);
  assert.deepEqual(add.pageVariants.climate[1].layout.hidden, ['tip']);
  add.pageVariants.climate[1].layout.hidden.push('y');
  assert.deepEqual(s.pageLayouts.climate.hidden, ['tip']);                                     // a copy, not the same object
  assert.equal(V.addVariant(s, 'climate', { id: 'v_kids01', name: 'x' }, {}), null);
  assert.equal(V.addVariant(s, 'house', { id: 'v_abc', name: 'x' }, {}), null);
  const full = { pageVariants: { today: Array.from({ length: 6 }, (_, i) => ({ id: `v_abc${i}` })) } };
  assert.equal(V.addVariant(full, 'today', { id: 'v_new01', name: 'x' }, {}), null);
  assert.deepEqual(V.emptyStart(['room:r1', 'tip']).hidden, ['room:r1', 'tip']);
  const ren = V.renameVariant(s, 'climate', 'v_kids01', { name: 'Lena & Tim', icon: '⭐' }).pageVariants.climate[0];
  assert.equal(ren.name, 'Lena & Tim'); assert.equal(ren.icon, '⭐'); assert.deepEqual(ren.layout.hidden, ['room:r2']);
  const drop = V.dropVariant(s, 'climate', 'v_kids01');
  assert.deepEqual(drop.pageVariants, {}); assert.deepEqual(drop.userTabs, {});                // Lena had only that: her entry is gone
  const ids = new Set(Array.from({ length: 20 }, (_, i) => V.newVariantId(['v_000000'], () => (i + 1) / 21)));
  ids.forEach((id) => assert.match(id, V.VARIANT_ID));
});
test('who gets what: a version, "Für alle" or "aus"; the user keeps his place and his start tab', () => {
  let tabs = { anna: { hide: ['energy'] }, Lena: { hide: ['climate'], start: 'today' } };
  tabs = V.setPick(tabs, 'lena', 'climate', 'v_kids01');                                       // a version shows the tab again
  assert.deepEqual(tabs, { anna: { hide: ['energy'] }, Lena: { hide: [], start: 'today', variants: { climate: 'v_kids01' } } });
  tabs = V.setPick(tabs, 'Lena', 'today', V.OFF);                                              // the start tab hidden: no start any more
  assert.deepEqual(tabs.Lena, { hide: ['today'], variants: { climate: 'v_kids01' } });
  tabs = V.setPick(tabs, 'Lena', 'climate', V.ALL);
  tabs = V.setPick(tabs, 'Lena', 'today', V.ALL);
  assert.deepEqual(Object.keys(tabs), ['anna']);                                               // nothing left: no entry
  tabs = V.setPick(tabs, 'tim', 'p_garden', 'v_abc123');
  assert.deepEqual(Object.keys(tabs), ['anna', 'tim']);
  assert.deepEqual(V.setPick(tabs, 'tim', 'house', V.OFF), tabs);                              // the house is always there
  assert.deepEqual(V.setPick(tabs, '', 'climate', V.OFF), tabs);
  assert.deepEqual(V.setPick(tabs, 'tim', 'climate', 'nonsense'), tabs);
});
test('the window of a version: the ticked users get it, the others go back to "Für alle", a hidden tab stays hidden', () => {
  const s = { ...base(), userTabs: { Lena: { hide: [], variants: { climate: 'v_kids01' } }, ben: { hide: ['climate'], variants: { climate: 'v_kids01' } }, tim: { hide: ['climate'] } } };
  const tabs = V.withUsers(s, ['lena', 'ben', 'tim', 'papa'], 'climate', 'v_kids01', ['TIM']);
  assert.deepEqual(tabs, { ben: { hide: ['climate'] }, tim: { hide: [], variants: { climate: 'v_kids01' } } });
  assert.deepEqual(V.usersOf({ ...s, userTabs: tabs }, ['lena', 'ben', 'tim', 'papa'], 'climate', 'v_kids01'), ['tim']);
  assert.deepEqual(V.usersOf({ ...s, userTabs: tabs }, ['lena', 'ben', 'tim', 'papa'], 'climate', V.ALL), ['lena', 'papa']);
});
test('the known users: Home Assistant\'s first, then every name in the settings, each once without case', () => {
  const s = { userTabs: { Lena: { hide: ['energy'] } }, userRooms: { tablet_flur: 'Flur' }, startViews: { '*': {}, mama: {} }, userLocks: { ADMIN: ['alarm'] } };
  assert.deepEqual(V.knownUsers([{ username: 'admin' }, 'lena', null], s), ['admin', 'lena', 'tablet_flur', 'mama']);
  assert.deepEqual(V.knownUsers(null, null), []);
});
