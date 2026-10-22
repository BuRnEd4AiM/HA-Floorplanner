// Unit tests for sections.js (sections on the pages of the tab bar, #495; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const S = await import(`${process.env.STATIC_DIR || '/tmp/static'}/sections.js`);
const L = await import(`${process.env.STATIC_DIR || '/tmp/static'}/pagelayout.js`);

test('sections made safe: ids once, a card in one section only, titles trimmed, at most twelve', () => {
  const l = S.cleanSections([{ id: 's_abc', title: '  Wohnzimmer\u0007 ', icon: '🛋', keys: ['clock', 'c_x1', 'clock', 'BAD KEY'] },
    { id: 's_abc', title: 'again' }, { id: 'bad' }, { id: 's_def', title: 'x'.repeat(99), wide: 'yes', keys: ['clock', 'weather'] }, null]);
  assert.deepEqual(l.map((s) => s.id), ['s_abc', 's_def']);
  assert.equal(l[0].title, 'Wohnzimmer'); assert.deepEqual(l[0].keys, ['clock', 'c_x1']);
  assert.deepEqual(l[1].keys, ['weather']); assert.equal(l[1].title.length, S.MAX_TITLE); assert.equal(l[1].wide, false);
  assert.equal(S.cleanSections(Array.from({ length: 20 }, (_, i) => ({ id: `s_${String(i).padStart(3, '0')}` }))).length, S.MAX_SECTIONS);
  assert.deepEqual(S.cleanWidths({ clock: 2, weather: 7, 'BAD KEY': 1, top: 1.5 }), { clock: 2 });
});

test('cards grouped: those in no section first, a section in the order of its keys, hidden ones as the page says', () => {
  const entries = ['clock', 'weather', 'agenda', 'c_own'].map((key) => ({ key, own: null, hidden: false }));
  const g = S.groupEntries(entries, [{ id: 's_one', title: 'Eins', keys: ['agenda', 'clock', 'gone'] }, { id: 's_two', keys: [] }]);
  assert.deepEqual(g.free.map((e) => e.key), ['weather', 'c_own']);
  assert.deepEqual(g.sections.map((s) => s.entries.map((e) => e.key)), [['agenda', 'clock'], []]);
});

test('adding, changing, moving, taking away a section; cards dragged between sections', () => {
  let l = S.addSection([], 's_aaa', 'Strom', '⚡');
  l = S.addSection(l, 's_bbb', 'Sicherheit');
  assert.deepEqual(l.map((s) => s.title), ['Strom', 'Sicherheit']);
  assert.equal(S.addSection(l, 's_aaa').length, 2);                       // the id exists
  l = S.editSection(l, 's_aaa', { title: 'Strom beider Häuser', wide: true });
  assert.equal(l[0].title, 'Strom beider Häuser'); assert.equal(l[0].wide, true); assert.equal(l[0].icon, '⚡');
  assert.deepEqual(S.moveSection(l, 's_bbb', -1).map((s) => s.id), ['s_bbb', 's_aaa']);
  assert.deepEqual(S.moveSection(l, 's_aaa', -1).map((s) => s.id), ['s_aaa', 's_bbb']);   // already first
  l = S.fromScreen(l, { free: ['clock'], sections: { s_aaa: ['power', 'c_graph'], s_bbb: ['cam:flur'] } });
  assert.deepEqual(l.map((s) => s.keys), [['power', 'c_graph'], ['cam:flur']]);
  l = S.fromScreen(l, { free: ['power'], sections: { s_bbb: ['cam:flur', 'c_graph'] } });      // s_aaa not on the screen: keeps what is not elsewhere
  assert.deepEqual(l.map((s) => s.keys), [[], ['cam:flur', 'c_graph']]);
  assert.deepEqual(S.dropSection(l, 's_aaa').map((s) => s.id), ['s_bbb']);
});

test('widths: set, back to the card\'s own, the span under a dragged corner', () => {
  assert.deepEqual(S.withWidth({}, 'clock', 3), { clock: 3 });
  assert.deepEqual(S.withWidth({ clock: 3 }, 'clock', null), {});
  assert.deepEqual(S.withWidth({}, 'clock', 9), {});
  assert.equal(S.spanAt(100, 200, 14), 1); assert.equal(S.spanAt(330, 200, 14), 2); assert.equal(S.spanAt(2000, 200, 14), 4);
  assert.equal(S.spanAt(2000, 200, 14, 2), 2); assert.equal(S.spanAt(-50, 200, 14), 1);
  assert.match(S.newSectionId([]), /^s_[a-z0-9]{6}$/);
});

test('the layout keeps sections and widths; a card taken away leaves its section; "Wie am Anfang" removes them', () => {
  const lay = L.cleanLayout({ sections: [{ id: 's_aaa', title: 'A', keys: ['c_xyz', 'clock'] }], widths: { clock: 2, c_xyz: 1 },
    cards: [{ id: 'c_xyz', type: 'text', text: 'x' }] });
  assert.equal(lay.sections.length, 1); assert.deepEqual(lay.widths, { clock: 2, c_xyz: 1 }); assert.equal(L.emptyLayout(lay), false);
  const d = L.dropCard(lay, 'c_xyz');
  assert.deepEqual(d.sections[0].keys, ['clock']); assert.deepEqual(d.widths, { clock: 2 });
  const r = L.resetLayout(lay);
  assert.deepEqual(r.sections, []); assert.deepEqual(r.widths, {}); assert.equal(r.cards.length, 1);
  assert.equal(L.emptyLayout(L.cleanLayout({ sections: [{ id: 's_aaa' }] })), false);
});
