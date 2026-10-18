// Unit tests for setgroups.js (the settings dialog in groups that fold open, with a search; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const DIR = process.env.STATIC_DIR || '/tmp/static';
const G = await import(`${DIR}/setgroups.js`);
const { BINDINGS } = await import(`${DIR}/settings.js`);

const GROUPS = [
  { id: 'general', title: 'Allgemein Sprache, Design, Einheiten', items: ['Sprache Auto Deutsch', 'Design Hologramm Dunkel Hell'] },
  { id: 'outside', title: 'Haus außen & Umgebung', items: ['Fassade', 'Himmel Der Hintergrund folgt der Sonne', 'Wandhöhe'] },
  { id: 'alarm', title: 'Warnungen & Alarm Rauch, Alarmanlage', items: ['Warnungen zeigen', 'Was ist mit „Alarmanlage“ gemeint?'] },
];

test('fold: lower case without accents', () => {
  assert.equal(G.fold('Küche ÄÖÜ'), 'kuche aou');
  assert.equal(G.fold('Façade Élevée'), 'facade elevee');
  assert.equal(G.fold(null), '');
});
test('search: nothing typed is no search', () => {
  assert.equal(G.searchGroups(GROUPS, ''), null);
  assert.equal(G.searchGroups(GROUPS, '   '), null);
});
test('search: a word in a row marks that row, a word in the title the whole group', () => {
  assert.deepEqual(G.searchGroups(GROUPS, 'himmel'), { outside: { all: false, hits: [1] } });
  assert.deepEqual(G.searchGroups(GROUPS, 'Alarm'), { alarm: { all: true, hits: [1] } });
  assert.deepEqual(G.searchGroups(GROUPS, 'sonne'), { outside: { all: false, hits: [1] } });          // the tooltip text counts too
});
test('search: without accents, every word must be there, no match is an empty result', () => {
  assert.deepEqual(G.searchGroups(GROUPS, 'wandhohe'), { outside: { all: false, hits: [2] } });
  assert.deepEqual(G.searchGroups(GROUPS, 'design dunkel'), { general: { all: false, hits: [1] } });
  assert.deepEqual(G.searchGroups(GROUPS, 'design rauch'), {});
  assert.deepEqual(G.searchGroups(GROUPS, 'zzz'), {});
  assert.deepEqual(G.searchGroups(null, 'x'), {});
});
test('remembered open groups: a list of ids, junk dropped', () => {
  assert.deepEqual(G.readOpen('["general","alarm","general"]'), ['general', 'alarm']);
  assert.deepEqual(G.readOpen('[1, null, "x"]'), ['x']);
  assert.deepEqual(G.readOpen('{"a":1}'), []);
  assert.deepEqual(G.readOpen('not json'), []);
  assert.deepEqual(G.readOpen(null), []);
});

/* index.html: every field of the settings dialog sits in a group, every group has a summary and a body */
const html = fs.readFileSync(`${DIR}/index.html`, 'utf8');
const start = html.indexOf('<dialog id="settingsDialog">'), end = html.indexOf('</dialog>', start);
const dlg = html.slice(start, end);
/** the ids in the dialog and whether each one is inside a <details class="setGroup"> */
function idsByGroup() {
  const out = new Map(), stack = [];
  for (const m of dlg.matchAll(/<(\/?)([a-z0-9]+)([^>]*)>/gi)) {
    const [, close, tag, attrs] = m;
    if (tag.toLowerCase() === 'details') {
      if (close) stack.pop(); else stack.push((/data-group="([^"]+)"/.exec(attrs) || [])[1] || null);
      continue;
    }
    const id = /\sid="([^"]+)"/.exec(attrs)?.[1];
    if (id && !close) out.set(id, stack.at(-1) || null);
  }
  return out;
}
test('settings dialog: every field is in a group (only the search at the top is not)', () => {
  const ids = idsByGroup(), outside = [...ids].filter(([, g]) => !g).map(([id]) => id);
  assert.deepEqual(outside.sort(), ['setSearch', 'sgAll', 'sgNone', 'settingsDialog'].sort());
  const inDialog = Object.values(BINDINGS).map((s) => s.slice(1)).filter((id) => ids.has(id));
  assert.ok(inDialog.length >= 40, inDialog.length);                     // the backup and timeline fields live in their own dialogs
  inDialog.forEach((id) => assert.ok(ids.get(id), id));
  ['alarmNotify', 'alarmPanels', 'tempStops', 'svTake'].forEach((id) => assert.ok(ids.get(id), id));
});
test('settings dialog: each group has an id, a summary with a title and a body', () => {
  const groups = [...dlg.matchAll(/<details class="setGroup" data-group="([a-z]+)">\s*<summary>(.*?)<\/summary>\s*<div class="sgBody">/gs)];
  assert.equal(groups.length, (dlg.match(/<details/g) || []).length);
  assert.ok(groups.length >= 8);
  const ids = groups.map((g) => g[1]);
  assert.equal(new Set(ids).size, ids.length);
  groups.forEach((g) => assert.match(g[2], new RegExp(`data-i18n="sg\\.${g[1]}"`), g[1]));
  assert.equal(idsByGroup().get('alarmNotify'), 'alarm');
});
