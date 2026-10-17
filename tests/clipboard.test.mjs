// Unit tests for clipboard.js (copy, paste, duplicate, #405; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const C = await import(`${process.env.STATIC_DIR || '/tmp/static'}/clipboard.js`);

const floor = (id = 'f1') => ({
  id,
  walls: [{ id: 'w1', a: [0, 0], b: [6, 0], thickness: 0.2, openings: [{ id: 'o1', type: 'window', pos: 1.5, width: 1, height: 1.2, sill: 0.9 }] }],
  rooms: [{ id: 'r1', name: 'Küche', points: [[0, 0], [6, 0], [6, 4], [0, 4]] }],
  devices: [
    { id: 'd1', type: 'spot', name: 'Spot', entity: 'light.kueche', x: 1, z: 1, locked: true },
    { id: 'd2', type: 'ledring', room: 'r1', x: 3, z: 2, pts: [[-1, -1], [1, -1], [1, 1], [-1, 1]] },
  ],
});
const ids = () => { let n = 0; return () => `n${++n}`; };

test('a copied lamp lands half a metre aside on its floor, each paste one step more; new id, entity kept, not locked', () => {
  const f = floor();
  const clip = C.copyOf(f, [{ kind: 'device', id: 'd1' }]);
  assert.equal(C.copyCount(clip), 1);
  const uid = ids();
  let r = C.pasteInto(f, clip, uid);
  assert.deepEqual(r, { items: [{ kind: 'device', id: 'n1' }], skipped: 0 });
  const p1 = f.devices.find((d) => d.id === 'n1');
  assert.deepEqual([p1.x, p1.z, p1.entity, p1.name, p1.locked], [1.5, 1.5, 'light.kueche', 'Spot', undefined]);
  r = C.pasteInto(f, clip, uid);
  const p2 = f.devices.find((d) => d.id === r.items[0].id);
  assert.deepEqual([p2.x, p2.z], [2, 2]);
  assert.equal(f.devices.find((d) => d.id === 'd1').locked, true);    // the original stays as it was
  assert.equal(f.devices.length, 4);
});
test('on another floor the copy lands at the same place first (the same lamp one storey higher)', () => {
  const f = floor(), up = { id: 'f2', walls: [], rooms: [], devices: [] };
  const clip = C.copyOf(f, [{ kind: 'device', id: 'd1' }]);
  C.pasteInto(up, clip, ids());
  assert.deepEqual([up.devices[0].x, up.devices[0].z], [1, 1]);
  C.pasteInto(up, clip, ids());
  assert.deepEqual([up.devices[1].x, up.devices[1].z], [1.5, 1.5]);
  assert.equal(up.blocks, undefined);                                  // lists that were not needed are not made
});
test('several things together: walls with their windows, the room, the LED ring follows the copied room', () => {
  const f = floor();
  const clip = C.copyOf(f, [{ kind: 'wall', id: 'w1' }, { kind: 'opening', id: 'o1' }, { kind: 'room', id: 'r1' }, { kind: 'device', id: 'd2' }, { kind: 'cable', id: 'c1' }]);
  assert.equal(C.copyCount(clip), 3);                                  // the window goes with its wall, the cable is left out
  const r = C.pasteInto(f, clip, ids());
  assert.equal(r.items.length, 3);
  const w = f.walls[1], room = f.rooms[1], ring = f.devices[2];
  assert.deepEqual([w.a, w.b], [[0.5, 0.5], [6.5, 0.5]]);
  assert.notEqual(w.openings[0].id, 'o1');
  assert.equal(w.openings[0].pos, 1.5);                                // along the wall: unchanged
  assert.deepEqual(room.points[2], [6.5, 4.5]);
  assert.equal(ring.room, room.id);
  assert.deepEqual(ring.pts, f.devices[1].pts);                        // the ring's own points are relative: unchanged
  assert.equal(new Set([...f.walls, ...f.rooms, ...f.devices, ...f.walls.flatMap((x) => x.openings)].map((x) => x.id)).size, 9);   // every id once
});
test('a window copied alone goes into the same wall at the next free place, until the wall is full', () => {
  const f = floor();
  const clip = C.copyOf(f, [{ kind: 'opening', id: 'o1' }]);
  assert.equal(C.copyCount(clip), 1);
  const uid = ids();
  C.pasteInto(f, clip, uid);
  assert.deepEqual(f.walls[0].openings.map((o) => o.pos), [1.5, 2.6]);
  C.pasteInto(f, clip, uid);
  assert.deepEqual(f.walls[0].openings.map((o) => o.pos), [1.5, 2.6, 3.7]);
  C.pasteInto(f, clip, uid);
  assert.deepEqual(f.walls[0].openings.map((o) => o.pos), [1.5, 2.6, 3.7, 4.8]);
  assert.equal(C.pastable(f, clip), false);                            // 6 m wall: no more room (not even left of the first one)
  assert.deepEqual(C.pasteInto(f, clip, uid), { items: [], skipped: 1 });
  assert.equal(C.pastable({ id: 'f2', walls: [], devices: [] }, clip), false);   // another floor has no such wall
  assert.equal(C.pastable(f, C.copyOf(f, [{ kind: 'device', id: 'd1' }])), true);
});
test('nothing that can be copied: null', () => {
  const f = floor();
  assert.equal(C.copyOf(f, []), null);
  assert.equal(C.copyOf(f, [{ kind: 'cable', id: 'x' }, { kind: 'device', id: 'gone' }]), null);
  assert.equal(C.copyOf(null, [{ kind: 'device', id: 'd1' }]), null);
  assert.equal(C.copyCount(null), 0);
});
test('freeSpot: right first, then left; null when the window does not fit at all', () => {
  const w = { a: [0, 0], b: [4, 0], thickness: 0.2, openings: [{ id: 'a', pos: 3.2, width: 1 }] };
  assert.equal(C.freeSpot(w, { width: 1 }, 3.2), 2.1);                 // right of it is the wall's end: one step to the left
  assert.equal(C.freeSpot({ a: [0, 0], b: [0.8, 0], thickness: 0.2, openings: [] }, { width: 1 }, 0.4), null);
});

test('initClipboard: copy, paste and duplicate change the open floor in one undo step and select the new things', () => {
  const f = floor();
  const log = [];
  let sel = [{ kind: 'device', id: 'd1' }];
  const cb = C.initClipboard({ t: (k, v) => `${k}${v ? JSON.stringify(v) : ''}`, floor: () => f, items: () => sel, select: (it) => { sel = it; log.push('select'); },
    snapshot: () => log.push('snapshot'), changed: () => log.push('changed'), setStatus: (x) => log.push(x), uid: ids() });
  assert.equal(cb.has(), false);
  assert.equal(cb.paste(), false);                                     // nothing copied yet: Ctrl+V stays the browser's
  assert.equal(cb.copy(), true);
  assert.equal(cb.has(), true);
  assert.deepEqual(log.splice(0), ['clip.copied{"n":1}']);
  assert.equal(cb.paste(), true);
  assert.deepEqual(log.splice(0), ['snapshot', 'changed', 'select', 'clip.pasted{"n":1}']);
  assert.deepEqual(sel, [{ kind: 'device', id: 'n1' }]);
  sel = [{ kind: 'device', id: 'n1' }, { kind: 'room', id: 'r1' }];
  assert.equal(cb.duplicate(), true);
  assert.equal(sel.length, 2);
  assert.equal(f.devices.length, 4);
  cb.paste();                                                          // Ctrl+V still holds the lamp of Ctrl+C
  assert.equal(f.devices.length, 5);
  sel = [];
  log.splice(0);
  assert.equal(cb.copy(), false);
  assert.deepEqual(log, ['clip.nothing']);
});
