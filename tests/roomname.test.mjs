// Unit tests for roomname.js (the name of a room: own or a Home Assistant area; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const N = await import(`${process.env.STATIC_DIR || '/tmp/static'}/roomname.js`);
const areas = [{ id: 'wz', name: 'Wohnzimmer' }, { id: 'kueche', name: 'Küche' }, { id: 'bad', name: 'Bad' }, { id: 'buero', name: 'Büro' }];
const house = () => ({
  floors: [
    { name: 'Erdgeschoss', rooms: [{ id: 'r1', name: 'Wohnen', area: 'wz' }, { id: 'r2', name: ' küche ' }, { id: 'r3', name: 'Flur' }] },
    { name: 'Obergeschoss', rooms: [{ id: 'r4', name: 'Bad', area: 'bad' }, { id: 'r5', name: 'Bad' }, { id: 'r6', name: 'Büro' }] },
  ],
});

test('names are compared without case and spaces around', () => {
  assert.equal(N.nameKey('  Küche  Ost '), 'küche ost');
  assert.equal(N.areaNamed(areas, ' KÜCHE ')?.id, 'kueche');
  assert.equal(N.areaNamed(areas, 'Garage'), null);
  assert.equal(N.areaNamed(areas, ''), null);
  assert.equal(N.areaNamed(null, 'Bad'), null);
});

test('the choices: free areas first by name, the ones other rooms have after them with those rooms and their floor', () => {
  const c = N.areaChoices(areas, house(), 'r3');
  assert.deepEqual(c.map((a) => a.id), ['buero', 'kueche', 'bad', 'wz']);
  assert.deepEqual(c.find((a) => a.id === 'wz').usedBy, ['Wohnen (Erdgeschoss)']);
  assert.deepEqual(c.find((a) => a.id === 'kueche').usedBy, []);
});

test('the own area of a room does not count as taken; one floor: no floor names', () => {
  const c = N.areaChoices(areas, house(), 'r1');
  assert.deepEqual(c.find((a) => a.id === 'wz').usedBy, []);
  const one = { floors: [{ name: 'EG', rooms: [{ id: 'a', name: 'Wohnen', area: 'wz' }, { id: 'b', name: 'Flur' }] }] };
  assert.deepEqual(N.areaChoices(areas, one, 'b').find((a) => a.id === 'wz').usedBy, ['Wohnen']);
});

test('an area Home Assistant no longer has stays in the list of its room, marked', () => {
  const h = house(); h.floors[0].rooms[2].area = 'keller';
  const c = N.areaChoices(areas, h, 'r3');
  assert.deepEqual(c[0], { id: 'keller', name: 'keller', usedBy: [], missing: true });
  assert.equal(N.areaChoices(areas, h, 'r1').some((a) => a.missing), false);
});

test('choosing an area links the room and gives it the name; "own name" takes the link away and keeps the name', () => {
  const r = { id: 'x', name: 'Raum 1' };
  N.takeArea(r, areas[1]);
  assert.deepEqual(r, { id: 'x', name: 'Küche', area: 'kueche' });
  r.name = 'Kochen';
  N.takeArea(r, null);
  assert.deepEqual(r, { id: 'x', name: 'Kochen' });
});

test('a typed name that is a free area links the room, the name stays as typed', () => {
  const h = house(), r3 = h.floors[0].rooms[2];
  r3.name = 'büro';
  assert.equal(N.linkByName(r3, areas, h)?.id, 'buero');
  assert.equal(r3.area, 'buero');
  assert.equal(r3.name, 'büro');
});

test('no link by name when the room has an area, the area belongs to another room, or no area has the name', () => {
  const h = house();
  const r1 = h.floors[0].rooms[0]; r1.name = 'Küche';
  assert.equal(N.linkByName(r1, areas, h), null); assert.equal(r1.area, 'wz');
  const r5 = h.floors[1].rooms[1];
  assert.equal(N.linkByName(r5, areas, h), null); assert.equal(r5.area, undefined);   // "Bad" is r4's
  const r3 = h.floors[0].rooms[2];
  assert.equal(N.linkByName(r3, areas, h), null); assert.equal(r3.area, undefined);   // no area "Flur"
});

test('the rooms called like a free area, each area once', () => {
  const m = N.nameMatches(areas, house());
  assert.deepEqual(m.map((x) => [x.room.id, x.area.id]), [['r2', 'kueche'], ['r6', 'buero']]);
  const two = { floors: [{ rooms: [{ id: 'a', name: 'Küche' }, { id: 'b', name: 'Küche' }] }] };
  assert.deepEqual(N.nameMatches(areas, two).map((x) => x.room.id), ['a']);
  assert.deepEqual(N.nameMatches([], house()), []);
  assert.deepEqual(N.nameMatches(areas, null), []);
});

test('what the line under the drop-down says', () => {
  assert.equal(N.linkState({ name: 'Flur' }, areas), 'none');
  assert.equal(N.linkState({ name: 'wohnzimmer ', area: 'wz' }, areas), 'same');
  assert.equal(N.linkState({ name: 'Wohnen', area: 'wz' }, areas), 'own');
  assert.equal(N.linkState({ name: 'Keller', area: 'keller' }, areas), 'missing');
  assert.equal(N.linkState(null, areas), 'none');
});
