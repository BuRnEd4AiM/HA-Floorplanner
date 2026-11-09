// Unit tests for uiv2more.js (5.0.0, „Oberfläche 2“ second part): the tree, moving a floor, the storeys from the side, the search, „⇉ Übernehmen“
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const M = await import(`${dir}/uiv2more.js`);
const sq = (x, s = 4) => [[x, 0], [x + s, 0], [x + s, s], [x, s]];
const layout = {
  floors: [
    { id: 'k', name: 'Keller', kind: 'basement', rooms: [{ id: 'k1', name: 'Technik', points: sq(0, 2) }] },
    { id: 'eg', name: 'Erdgeschoss', kind: 'floor', rooms: [{ id: 'r2', name: 'Küche', points: sq(0, 3) }, { id: 'r1', name: 'Bad', points: sq(4, 2) }] },
    { id: 'd', name: 'Dach', kind: 'roof', rooms: [] },
  ],
};

test('the tree: floors from the top down with their room count; the rooms of open floors by name with their area', () => {
  const rows = M.treeRows(layout, ['eg']);
  assert.deepEqual(rows.map((r) => `${r.type}:${r.name}`), ['floor:Dach', 'floor:Erdgeschoss', 'room:Bad', 'room:Küche', 'floor:Keller']);
  assert.deepEqual(rows[1], { type: 'floor', i: 1, id: 'eg', name: 'Erdgeschoss', kind: 'floor', rooms: 2, open: true });
  assert.equal(rows[2].area, 4);
  assert.equal(rows[2].i, 1, 'a room knows its floor');
  assert.equal(M.treeRows(layout).length, 3, 'closed: only the floors');
  assert.deepEqual(M.treeRows({}), []);
  assert.equal(M.FLOOR_ICON.basement, '⬇');
});

test('moving a floor to another place keeps the others in order', () => {
  const f = ['a', 'b', 'c', 'd'];
  assert.equal(M.moveFloorTo(f, 0, 2), 2);
  assert.deepEqual(f, ['b', 'c', 'a', 'd']);
  assert.equal(M.moveFloorTo(f, 3, 0), 0);
  assert.deepEqual(f, ['d', 'b', 'c', 'a']);
  assert.equal(M.moveFloorTo(f, 1, 99), 3, 'past the end: the top');
  assert.deepEqual(f, ['d', 'c', 'a', 'b']);
  assert.equal(M.moveFloorTo(f, 7, 0), 7, 'no such floor: nothing moves');
});

test('the storeys from the side: the roof on top, the chosen floor marked, the ground above the basement', () => {
  const s = M.storeySvg(layout.floors, 1, '3,00 m');
  assert.match(s, /^<svg class="v2Storeys"/);
  assert.equal((s.match(/<rect x="12"/g) || []).length, 2, 'two storeys under the roof');
  assert.match(s, /fill="rgba\(63,169,245,\.45\)"[^>]*\/><text x="18" y="\d+"[^>]*>Erdgeschoss/);
  assert.match(s, /<path d="M8 30/, 'a roof floor is the roof');
  assert.match(s, /<rect x="0" y="56"/, 'the ground between the ground floor and the basement');
  assert.match(M.storeySvg([{ name: '<b>', kind: 'floor' }], 0, 'x'), /&lt;b&gt;/);
});

test('the search: every word, inside words, without umlauts and capitals', () => {
  assert.ok(M.matches('kipp', 'Kippwinkel (°)'));
  assert.ok(M.matches('brust', 'Brüstung'));
  assert.ok(M.matches('BRÜSTUNG', 'Brüstung'));
  assert.ok(M.matches('fest unten', 'Feste Scheibe unten'));
  assert.ok(!M.matches('fest oben', 'Feste Scheibe unten'));
  assert.ok(M.matches('strasse', 'Straße'));
  assert.ok(!M.matches('', 'anything'));
  assert.ok(!M.matches('   ', 'anything'));
  assert.equal(M.fold('Öl À'), 'ol a');
});

test('„Übernehmen“: the groups of a kind, ticked at first all but the size', () => {
  assert.deepEqual(Object.keys(M.COPY_GROUPS.window), ['size', 'panes', 'fixed', 'shutter']);
  assert.deepEqual(M.copyDefaults('window'), ['panes', 'fixed', 'shutter']);
  assert.deepEqual(M.copyDefaults('device'), ['look', 'tilt']);
  assert.deepEqual(M.copyDefaults('room'), ['floor', 'level', 'walls']);
  assert.deepEqual(M.copyDefaults('stair'), []);
});

test('„Übernehmen“ copies what the source has, removes what it has not, and leaves contacts and names alone', () => {
  const src = { type: 'window', style: 'single', hinge: 'left', openOutward: true, tiltDeg: 20, width: 1.8, shutter: true, shutterStyle: 'split', entity: 'binary_sensor.a' };
  const dst = { type: 'window', style: 'double', paneHinges: ['left', 'right'], width: 1.2, entity: 'binary_sensor.b', name: 'Bad', shutter: true, shutterEntity: 'cover.b' };
  M.copyGroups('window', src, dst, ['panes', 'shutter']);
  assert.deepEqual([dst.style, dst.hinge, dst.openOutward, dst.tiltDeg, 'paneHinges' in dst], ['single', 'left', true, 20, false]);
  assert.equal(dst.width, 1.2, 'size not ticked: kept');
  assert.equal(dst.entity, 'binary_sensor.b');
  assert.equal(dst.name, 'Bad');
  assert.equal(dst.shutterStyle, 'split');
  assert.equal(dst.shutterEntity, 'cover.b', 'its own roller shutter entity stays');
  M.copyGroups('window', { type: 'window', style: 'double' }, dst, ['shutter']);
  assert.equal('shutter' in dst || 'shutterEntity' in dst || 'shutterStyle' in dst, false, 'no shutter: its entity goes too');
  const look = { pattern: 'tiles' };
  const r = M.copyGroups('room', { covering: 'oak', floorLook: { color: '#ffffff' }, raise: -0.2 }, { covering: 'tiles', wallLook: look }, ['floor', 'level']);
  assert.deepEqual(r, { covering: 'oak', floorLook: { color: '#ffffff' }, raise: -0.2, wallLook: look });
  const s = { covering: 'oak', floorLook: { color: '#ffffff' } }, d = {};
  M.copyGroups('room', s, d, ['floor']);
  d.floorLook.color = '#000000';
  assert.equal(s.floorLook.color, '#ffffff', 'a copy, not the same object');
});

test('„Übernehmen“ keeps a window whole: fixed glazing has no contacts per pane, tilt contact or fixed glass; contacts only for its panes', () => {
  const f = M.copyGroups('window', { type: 'window', style: 'fixed' }, { type: 'window', style: 'double', paneEntities: ['a', 'b'], tiltEntity: 'k', fixedBelow: 1 }, ['panes']);
  for (const k of ['paneEntities', 'tiltEntity', 'fixedBelow']) assert.equal(k in f, false, k);
  const p = M.copyGroups('window', { type: 'window', style: 'double', panes: 3 }, { type: 'window', style: 'triple', paneEntities: ['a', 'b', 'c'] }, ['panes']);
  assert.deepEqual(p.paneEntities, ['a', 'b', 'c']);
  const q = M.copyGroups('window', { type: 'window', style: 'single' }, { type: 'window', style: 'triple', paneEntities: ['a', 'b', 'c'] }, ['panes']);
  assert.equal('paneEntities' in q, false, 'one pane: no own contacts');
  const same = { type: 'window', width: 1 };
  assert.equal(M.copyGroups('window', same, same, ['size']), same);
  assert.deepEqual(M.copyGroups('stair', { a: 1 }, { b: 2 }, ['x']), { b: 2 }, 'an unknown kind changes nothing');
});

test('„Übernehmen“ reaches the same kind of thing only', () => {
  assert.ok(M.sameKind('window', { type: 'window' }, { type: 'window' }));
  assert.ok(!M.sameKind('window', { type: 'window' }, { type: 'door' }));
  assert.ok(M.sameKind('device', { type: 'lamp' }, { type: 'lamp' }));
  assert.ok(!M.sameKind('device', { type: 'lamp' }, { type: 'sofa' }));
  assert.ok(M.sameKind('room', { id: 'a' }, { id: 'b' }));
  const a = { type: 'window' };
  assert.ok(!M.sameKind('window', a, a), 'not itself');
});
