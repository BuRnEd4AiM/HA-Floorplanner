// Unit tests for nowatch.js and its part in offline.js (#780: "🔕 Nicht überwachen")
// run: rm -rf /tmp/static && cp -r floorplan3d/rootfs/app/static /tmp/static && echo '{"type":"module"}' > /tmp/static/package.json && STATIC_DIR=/tmp/static node --test tests/nowatch.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

const N = await import(`${process.env.STATIC_DIR || '/tmp/static'}/nowatch.js`);
const O = await import(`${process.env.STATIC_DIR || '/tmp/static'}/offline.js`);
const t = (k) => k;
const env = (layout, states = {}) => ({ layout, entities: [{ entity_id: 'x' }], states, t, catOf: (ty) => (ty === 'light' ? 'lighting' : 'living'), pointInPoly: () => true });

/** a two-family house: the ground floor is mine, upstairs belongs to someone else; every lamp is linked to nothing or offline */
const house = () => ({ floors: [
  { id: 'eg', name: 'EG', rooms: [], devices: [{ id: 'l1', type: 'light', entity: 'light.gone' }, { id: 'l2', type: 'light', entity: '' }],
    walls: [{ a: [0, 0], b: [4, 0], openings: [{ id: 'w1', type: 'window', entity: 'binary_sensor.w1' }] }] },
  { id: 'og', name: 'OG', rooms: [], devices: [{ id: 'o1', type: 'light', entity: '' }, { id: 'o2', type: 'light', entity: '' }, { id: 'o3', type: 'light', entity: 'light.og' }],
    walls: [{ a: [0, 0], b: [4, 0], openings: [{ id: 'w2', type: 'window', entity: 'binary_sensor.w2' }] }] },
] });

test('unwatched: the thing\'s own tick or its floor\'s', () => {
  assert.equal(N.unwatched({}, {}), false);
  assert.equal(N.unwatched({ noWatch: true }, {}), true);
  assert.equal(N.unwatched({}, { noWatch: true }), true);
  assert.equal(N.unwatched({ noWatch: true }), true);
  assert.equal(N.unwatched(null, null), false);
});
test('setNoWatch stores only "yes": off leaves nothing behind', () => {
  const d = {};
  assert.equal(N.setNoWatch(d, true).noWatch, true);
  assert.equal('noWatch' in N.setNoWatch(d, false), false);
  assert.equal(N.setNoWatch(null, true), null);
});
test('thingOf finds a device or a door / window of a floor, also a dormer window', () => {
  const f = { devices: [{ id: 'd' }], walls: [{ openings: [{ id: 'o' }] }], dormerWalls: [{ openings: [{ id: 'dw' }] }] };
  assert.equal(N.thingOf(f, 'device', 'd').id, 'd');
  assert.equal(N.thingOf(f, 'opening', 'o').id, 'o');
  assert.equal(N.thingOf(f, 'opening', 'dw').id, 'dw');
  assert.equal(N.thingOf(f, 'device', 'o'), null);
  assert.equal(N.thingOf(null, 'device', 'd'), null);
});
test('offline: a floor left out lists nothing of it, a device or window left out is not listed either', () => {
  const l = house();
  const all = O.offlineDevices(env(l));
  assert.deepEqual(all.map((x) => x.id).sort(), ['l1', 'l2', 'o1', 'o2', 'o3', 'w1', 'w2']);
  l.floors[1].noWatch = true;                                       // upstairs belongs to someone else
  assert.deepEqual(O.offlineDevices(env(l)).map((x) => x.id).sort(), ['l1', 'l2', 'w1']);
  l.floors[0].devices[1].noWatch = true;                            // a lamp that will never be smart
  l.floors[0].walls[0].openings[0].noWatch = true;                  // a window without a contact any more
  assert.deepEqual(O.offlineDevices(env(l)).map((x) => x.id), ['l1']);
});
test('leaveOut: a row leaves its device or window out, { floor } the whole floor; nothing found: false', () => {
  const l = house();
  assert.equal(N.leaveOut(l, { floor: 0, kind: 'device', id: 'l2' }), true);
  assert.equal(l.floors[0].devices[1].noWatch, true);
  assert.equal(N.leaveOut(l, { floor: 1, kind: 'opening', id: 'w2' }), true);
  assert.equal(l.floors[1].walls[0].openings[0].noWatch, true);
  assert.equal(N.leaveOut(l, { floor: 1 }), true);
  assert.equal(l.floors[1].noWatch, true);
  assert.equal(N.leaveOut(l, { floor: 5 }), false);
  assert.equal(N.leaveOut(l, { floor: 0, kind: 'device', id: 'nope' }), false);
});
test('leaveOut through a building\'s view: the floor is a copy, the tick goes onto the real floor of the plan', () => {
  const l = house(), view = { ...l, floors: l.floors.map((f) => ({ ...f })) };
  N.leaveOut(l, { floor: 1 });                                      // app.js passes the plan itself, with the index of the view
  assert.equal(l.floors[1].noWatch, true);
  assert.equal(view.floors[1].noWatch, undefined);
});
test('floorsToLeaveOut: a button for every floor with two or more entries, in the order of the floors', () => {
  const l = house(), list = O.offlineDevices(env(l));
  assert.deepEqual(N.floorsToLeaveOut(list, l), [{ floor: 0, name: 'EG', n: 3 }, { floor: 1, name: 'OG', n: 4 }]);
  assert.deepEqual(N.floorsToLeaveOut(list.filter((x) => x.id !== 'l2' && x.id !== 'w1'), l), [{ floor: 1, name: 'OG', n: 4 }]);
  assert.deepEqual(N.floorsToLeaveOut([], l), []);
});
test('unwatchedSummary: the floors left out by name, the things left out on the other floors', () => {
  const l = house();
  assert.deepEqual(N.unwatchedSummary(l), { floors: [], things: 0 });
  l.floors[1].noWatch = true; l.floors[1].devices[0].noWatch = true;   // (counted with its floor, not twice)
  l.floors[0].devices[0].noWatch = true; l.floors[0].walls[0].openings[0].noWatch = true;
  assert.deepEqual(N.unwatchedSummary(l), { floors: ['OG'], things: 2 });
});
test('markedNoWatch: the editor\'s 🔕 sign for a thing with its own tick, not for every thing of a floor left out', () => {
  assert.equal(N.markedNoWatch({}, { noWatch: true }), true);
  assert.equal(N.markedNoWatch({}, {}), false);
  assert.equal(N.markedNoWatch({ noWatch: true }, { noWatch: true }), false);   // the floor button says it
  assert.equal(N.markedNoWatch({ noWatch: true }, {}), false);
  assert.equal(N.markedNoWatch(null, { noWatch: true }), true);
});
test('noWatchMarks: a 🔕 sign for every device and door / window left out on its own, with its floor; none on a floor left out', () => {
  const l = house();
  assert.equal(N.noWatchMarks(l).size, 0);
  l.floors[0].devices[1].noWatch = true; l.floors[0].walls[0].openings[0].noWatch = true;
  l.floors[1].devices[0].noWatch = true;
  l.floors[1].dormerWalls = [{ openings: [{ id: 'dw', noWatch: true }] }];   // a dormer window too
  assert.deepEqual([...N.noWatchMarks(l)], [
    ['l2', { kind: 'device', reason: 'nowatch', floor: 0 }], ['w1', { kind: 'opening', reason: 'nowatch', floor: 0 }],
    ['o1', { kind: 'device', reason: 'nowatch', floor: 1 }], ['dw', { kind: 'opening', reason: 'nowatch', floor: 1 }]]);
  l.floors[1].noWatch = true;                                       // upstairs as a whole: its floor button has 🔕, no sign on each thing
  assert.deepEqual([...N.noWatchMarks(l).keys()], ['l2', 'w1']);
  assert.equal(N.noWatchMarks(null).size, 0);
});
test('floorButtonName: 🔕 before a floor left out, only in the editor', () => {
  assert.equal(N.floorButtonName({ name: 'OG', noWatch: true }, true), '🔕 OG');
  assert.equal(N.floorButtonName({ name: 'OG', noWatch: true }, false), 'OG');
  assert.equal(N.floorButtonName({ name: 'EG' }, true), 'EG');
  assert.equal(N.floorButtonName(null, true), '');
});
