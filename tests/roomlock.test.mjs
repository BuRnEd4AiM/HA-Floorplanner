// Unit tests for roomlock.js (locking rooms and the whole plan, 5.1.0; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const L = await import(`${process.env.STATIC_DIR || '/tmp/static'}/roomlock.js`);

// two rooms side by side (living room 0..6, kitchen 6..10), a wall along each edge, the middle wall shared
const floor = () => {
  const P = (x, z) => [x, z];
  const rooms = [
    { id: 'wz', name: 'Wohnzimmer', points: [P(0, 0), P(6, 0), P(6, 4), P(0, 4)] },
    { id: 'k', name: 'Küche', points: [P(6, 0), P(10, 0), P(10, 4), P(6, 4)] },
  ];
  const W = (id, a, b, op) => ({ id, a, b, thickness: 0.24, openings: op || [] });
  const walls = [
    W('top', P(0, 0), P(10, 0), [{ id: 'win', type: 'window', pos: 0.2 }]),   // along both rooms
    W('mid', P(6, 0), P(6, 4), [{ id: 'door', type: 'door', pos: 0.5 }]),     // shared
    W('left', P(0, 0), P(0, 4)), W('right', P(10, 0), P(10, 4)),
    W('bot1', P(0, 4), P(6, 4)), W('bot2', P(6, 4), P(10, 4)),
    W('far', P(20, 0), P(25, 0)),                                              // somewhere else
  ];
  const devices = [{ id: 'lamp', x: 3, z: 2 }, { id: 'fridge', x: 8, z: 2 }, { id: 'tv', x: 1, z: 1, locked: true }];
  return { id: 'eg', rooms, walls, devices, stairs: [{ id: 'st', x: 12, z: 1 }], blocks: [{ id: 'b', points: [P(12, 3), P(13, 3), P(13, 4)] }] };
};

test('a room lock keeps its walls and corners always; openings by default, devices and settings only when chosen', () => {
  const r = { id: 'x' };
  assert.equal(L.lockOf(r), null);
  L.setRoomLock(r, true);
  assert.deepEqual(L.lockOf(r), { openings: true, devices: false, settings: false });
  assert.equal(r.lockOpts, undefined);                                    // the defaults are not stored
  L.setRoomLock(r, true, { devices: true, openings: false });
  assert.deepEqual(r.lockOpts, { openings: false, devices: true });
  assert.deepEqual(L.lockOf(r), { openings: false, devices: true, settings: false });
  L.setRoomLock(r, true, { settings: true });                              // what is not given stays as it was
  assert.deepEqual(L.lockOf(r), { openings: false, devices: true, settings: true });
  L.setRoomLock(r, false);
  assert.deepEqual(r, { id: 'x' });
});

test('a locked room: its walls (the shared one too) and their ends, its doors and windows; the neighbour itself stays free', () => {
  const f = floor();
  L.setRoomLock(f.rooms[0], true);
  const info = L.lockInfo({}, f);
  assert.deepEqual(L.lockedWhy(info, 'room', 'wz'), { room: 'Wohnzimmer' });
  assert.equal(L.lockedWhy(info, 'room', 'k'), null);
  for (const w of ['top', 'mid', 'left', 'bot1']) assert.ok(L.lockedWhy(info, 'wall', w), w);
  for (const w of ['right', 'bot2', 'far']) assert.equal(L.lockedWhy(info, 'wall', w), null, w);
  assert.ok(L.lockedWhy(info, 'opening', 'win'));
  assert.ok(L.lockedWhy(info, 'opening', 'door'));
  assert.equal(L.lockedWhy(info, 'device', 'lamp'), null);                // devices stay free by default
  assert.deepEqual(L.lockedWhy(info, 'device', 'tv'), { own: true });     // ... unless locked by themselves
  // the kitchen's own corners may move, the ends of the shared wall not (they would change the living room)
  const k = f.rooms[1];
  assert.equal(L.pointsLockedWhy(info, f, [k.points[1]]), null);
  assert.deepEqual(L.pointsLockedWhy(info, f, [f.walls[1].b]), { room: 'Wohnzimmer' });
  assert.deepEqual(L.pointsLockedWhy(info, f, [f.rooms[0].points[2], k.points[3]]), { room: 'Wohnzimmer' });
});

test('what a room keeps fixed: openings can stay free, devices in it and its settings can be fixed', () => {
  const f = floor();
  L.setRoomLock(f.rooms[1], true, { openings: false, devices: true, settings: true });
  const info = L.lockInfo({}, f);
  assert.equal(L.lockedWhy(info, 'opening', 'door'), null);
  assert.ok(L.lockedWhy(info, 'wall', 'mid'));
  assert.deepEqual(L.lockedWhy(info, 'device', 'fridge'), { room: 'Küche' });
  assert.equal(L.lockedWhy(info, 'device', 'lamp'), null);
  assert.deepEqual(L.lockedWhy(info, 'settings', 'k'), { room: 'Küche' });
});

test('a wall only near a room or across it is not along it', () => {
  const e = [[0, 0], [6, 0]];
  assert.ok(L.wallAlong({ a: [-2, 0.1], b: [8, 0.1], thickness: 0.24 }, ...e));   // longer, on the edge within its half thickness
  assert.ok(!L.wallAlong({ a: [0, 0.5], b: [6, 0.5], thickness: 0.24 }, ...e));   // parallel but 50 cm away
  assert.ok(!L.wallAlong({ a: [3, -2], b: [3, 2], thickness: 0.24 }, ...e));      // across
  assert.ok(!L.wallAlong({ a: [6, 0], b: [9, 0], thickness: 0.24 }, ...e));       // only touching its end
});

test('„Grundriss fertig“: everything of the plan is locked, devices stay free; only an admin may switch it off when it says so', () => {
  const f = floor(), lay = { floors: [f] };
  assert.equal(L.planLockOf(lay).on, false);
  L.setPlanLock(lay, true, true);
  assert.deepEqual(lay.planLock, { on: true, admin: true });
  const info = L.lockInfo(lay, f);
  for (const [k, id] of [['wall', 'far'], ['room', 'k'], ['opening', 'win'], ['stair', 'st'], ['block', 'b']]) assert.deepEqual(L.lockedWhy(info, k, id), { plan: true }, id);
  assert.equal(L.lockedWhy(info, 'device', 'lamp'), null);
  assert.deepEqual(L.pointsLockedWhy(info, f, [f.blocks[0].points[0]]), { plan: true });
  assert.equal(L.mayUnlockPlan(lay, false), false);
  assert.equal(L.mayUnlockPlan(lay, true), true);
  L.setPlanLock(lay, true, false);
  assert.equal(L.mayUnlockPlan(lay, false), true);
  L.setPlanLock(lay, false, true);                                         // off, the choice „only admins“ stays for the next time
  assert.deepEqual(lay.planLock, { admin: true });
  assert.equal(L.planLockOf(lay).on, false);
  assert.equal(L.lockInfo(lay, f).plan, false);
  L.setPlanLock(lay, false);
  assert.equal(lay.planLock, undefined);
  assert.equal(L.mayUnlockPlan(lay, false), true);
});

test('the lock of a whole floor: all, some or none of its rooms', () => {
  const f = floor();
  assert.equal(L.floorLockState(f), 'none');
  L.setRoomLock(f.rooms[0], true);
  assert.equal(L.floorLockState(f), 'some');
  L.setFloorLock(f, true, { devices: true });
  assert.equal(L.floorLockState(f), 'all');
  assert.deepEqual(f.rooms[1].lockOpts, { devices: true });
  L.setFloorLock(f, false);
  assert.equal(L.floorLockState(f), 'none');
  assert.equal(L.floorLockState({ rooms: [] }), 'none');
});
