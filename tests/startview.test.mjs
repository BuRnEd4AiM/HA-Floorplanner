// Unit tests for startview.js (a saved start view, #315; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const S = await import(`${process.env.STATIC_DIR || '/tmp/static'}/startview.js`);
const view = { house: 'main', floor: 'f1', idx: 1, whole: false, room: 'r1', cam: [1, 2, 3], target: [0, 0, 0] };
const floors = [{ id: 'f0', rooms: [] }, { id: 'f1', rooms: [{ id: 'r1' }] }];

test('a start view keeps only what belongs in it, junk is dropped', () => {
  assert.deepEqual(S.cleanStartView({ ...view, extra: 1, cam: [1.23456, 2, 3] }), { ...view, cam: [1.235, 2, 3] });
  assert.equal(S.cleanStartView({ ...view, cam: [1, 2] }), null);
  assert.equal(S.cleanStartView({ ...view, target: [0, NaN, 0] }), null);
  assert.equal(S.cleanStartView(null), null);
  assert.equal(S.cleanStartView({ ...view, room: 5 }).room, null);
  assert.deepEqual(Object.keys(S.cleanStartViews({ '*': view, bob: { cam: 1 }, '': view })), ['*']);
});
test('in the open house: floor and room found; another house or a floor that is gone -> automatic start', () => {
  assert.deepEqual(S.resolveStart(view, 'main', floors), { floorIdx: 1, whole: false, room: 'r1', cam: [1, 2, 3], target: [0, 0, 0] });
  assert.equal(S.resolveStart(view, 'other', floors), null);
  assert.equal(S.resolveStart({ ...view, floor: 'gone' }, 'main', floors), null);
  assert.equal(S.resolveStart({ ...view, room: 'gone' }, 'main', floors).room, null);          // the room was deleted: the floor still counts
  assert.equal(S.resolveStart({ ...view, floor: 'gone', whole: true }, 'main', floors).whole, true);   // the whole house needs no floor
  assert.equal(S.resolveStart({ ...view, house: '' }, 'main', floors).floorIdx, 1);           // saved without houses: any house
  assert.equal(S.resolveStart({ ...view, floor: '', idx: 0 }, 'main', floors).floorIdx, 0);   // an old plan without floor ids: by its place
  assert.equal(S.resolveStart({ ...view, floor: '', idx: 5 }, 'main', floors), null);
});
test('the text of a start view: floor and room, the whole house, nothing for another house', () => {
  const fl = [{ id: 'f0', name: 'EG', rooms: [{ id: 'r1', name: 'Wohnzimmer' }] }];
  const v = { house: 'main', floor: 'f0', cam: [1, 2, 3], target: [0, 0, 0] };
  assert.equal(S.describeStart({ ...v, room: 'r1' }, 'main', fl, { whole: 'Ganzes Haus' }), 'EG · Wohnzimmer');
  assert.equal(S.describeStart(v, 'main', fl, { whole: 'Ganzes Haus' }), 'EG');
  assert.equal(S.describeStart({ ...v, whole: true }, 'main', fl, { whole: 'Ganzes Haus' }), 'Ganzes Haus');
  assert.equal(S.describeStart(v, 'other', fl, { whole: 'Ganzes Haus' }), '');
});
