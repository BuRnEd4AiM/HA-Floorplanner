// 🖼 Bildkarten fürs Handy (5.33.0): the pure part of the editor (piccards.js): new blocks and cards from the templates, ids, moving and
// dragging a block, the rows (two side by side as piccard.rows_of), a block's line in the list, where a card is used, the card as it is kept.
import test from 'node:test';
import assert from 'node:assert/strict';

const P = await import(`${process.env.STATIC_DIR || '../floorplan3d/rootfs/app/static'}/piccards.js`);
const t = (k, v) => (v ? `${k} ${JSON.stringify(v)}` : k);

test('new blocks have the defaults of the add-on', () => {
  assert.deepEqual(P.newBlock('head'), { k: 'head', text: '{kind}', clock: true });
  assert.deepEqual(P.newBlock('info'), { k: 'info', rows: ['sensor', 'since', 'temp', 'hum'] });
  assert.deepEqual(P.newBlock('line'), { k: 'line' });
  assert.equal(P.KINDS.length, 9);
});

test('six templates, a new card gets an id of its own from its name', () => {
  assert.deepEqual(P.TEMPLATES.map((x) => x.key), ['alarm', 'camera', 'floor', 'clock', 'text', 'empty']);
  assert.equal(P.uniqueId('Test 1'), 'test-1');
  assert.equal(P.uniqueId('Größe Übung!'), 'grosse-ubung');
  assert.equal(P.uniqueId('Test 1', ['test-1', 'test-1-2']), 'test-1-3');
  assert.equal(P.uniqueId(''), 'karte');
  const c = P.fromTemplate('camera', 'Test 4', ['test-4']);
  assert.equal(c.id, 'test-4-2'); assert.equal(c.theme, 'dark'); assert.equal(c.blocks[0].k, 'camera');
  c.blocks[0].ent = 'camera.x';
  assert.equal(P.TEMPLATES[1].blocks[0].ent, '', 'the template itself stays as it was');
  assert.equal(P.fromTemplate('nope', 'X').blocks[0].k, 'head');
});

test('a block moved and dragged', () => {
  const b = ['a', 'b', 'c', 'd'].map((k) => ({ k }));
  assert.deepEqual(P.moveBlock(b, 1, -1).map((x) => x.k), ['b', 'a', 'c', 'd']);
  assert.deepEqual(P.moveBlock(b, 0, -1).map((x) => x.k), ['a', 'b', 'c', 'd']);
  assert.deepEqual(P.moveBlock(b, 3, 1).map((x) => x.k), ['a', 'b', 'c', 'd']);
  assert.deepEqual(P.dragBlock(b, 0, 3).map((x) => x.k), ['b', 'c', 'a', 'd']);
  assert.deepEqual(P.dragBlock(b, 3, 0).map((x) => x.k), ['d', 'a', 'b', 'c']);
  assert.deepEqual(P.dragBlock(b, 2, 2).map((x) => x.k), ['a', 'b', 'c', 'd']);
});

test('rows: a half block shares its row with the next one (never with a heading, a line or the foot)', () => {
  const b = [{ k: 'head' }, { k: 'camera', half: true }, { k: 'info' }, { k: 'plan', half: true }, { k: 'foot' }, { k: 'text', half: true }];
  assert.deepEqual(P.rowsOf(b), [[0], [1, 2], [3], [4], [5]]);
});

test("a block's line in the list", () => {
  assert.equal(P.blockSub({ k: 'head', text: '{kind}', clock: true }, t), '„{kind}“ · pc.o.clock');
  assert.equal(P.blockSub({ k: 'plan', show: 'room', marks: true, half: true }, t), 'pc.o.room · pc.o.marksShort · pc.halfShort');
  assert.equal(P.blockSub({ k: 'plan', show: 'floor', floor: 'og' }, t, {}, [{ id: 'og', name: 'Obergeschoss' }]), 'Obergeschoss · pc.o.floor');   // a chosen floor
  assert.equal(P.blockSub({ k: 'plan', show: 'floor', floor: 'weg' }, t, {}, []), 'pc.o.floorGone · pc.o.floor');
  assert.equal(P.blockSub({ k: 'camera', ent: 'camera.flur' }, t, { 'camera.flur': 'Flur' }), 'Flur');
  assert.equal(P.blockSub({ k: 'info', rows: ['temp', 'who'] }, t), 'pc.r.temp, pc.r.who');
  assert.equal(P.blockSub({ k: 'values', ents: [] }, t), 'pc.o.entsNone');
});

test('where a card is used: the alarms it is chosen for, the routines that send it', () => {
  const flows = [{ name: 'Tür', lanes: [{ blocks: [{ k: 'state' }, { k: 'notify', text: 'x', card: 'test1' }] }] }, { name: 'Andere', lanes: [{ blocks: [{ k: 'notify', text: 'y' }] }] }];
  assert.deepEqual(P.usedBy('test1', { cards: { water: 'test1', smoke: 'x' } }, flows), { kinds: ['water'], flows: ['Tür'] });
  assert.deepEqual(P.usedBy('none', null, null), { kinds: [], flows: [] });
});

test('the card as the page keeps it', () => {
  const c = P.cleanCard({ id: 'Bad Id', name: '  Abend  ', color: '#ABCDEF', theme: 'dark', width: 'wide',
    blocks: [{ k: 'head', half: true }, { k: 'plan', half: false }, { k: 'x' }, { k: 'info', half: true }] });
  assert.equal(c.id, 'abend'); assert.equal(c.name, 'Abend'); assert.equal(c.color, '#abcdef');
  assert.deepEqual(c.blocks, [{ k: 'head' }, { k: 'plan' }, { k: 'info', half: true }]);
  assert.equal(P.cleanCard({}).theme, 'light');
  assert.equal(P.cleanCard({ blocks: Array.from({ length: 20 }, () => ({ k: 'line' })) }).blocks.length, P.MAX_BLOCKS);
});
