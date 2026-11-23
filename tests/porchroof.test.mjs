// Unit tests for porchroof.js (a canopy over a door, #786; run like offline.test.mjs, see there): size, boxes, where it goes over a door,
// its back edge
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const P = await import(`${dir}/porchroof.js`);
const L = await import(`${dir}/levels.js`);
const near = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) < e, `${a} ≈ ${b}`);
const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

test('size: defaults and limits', () => {
  assert.deepEqual(P.porchSize({}), { w: 2.4, d: 1.2, h: 2.45, pitch: 15, posts: true, cover: 'tiles' });
  assert.deepEqual(P.porchSize({ w: 20, d: 0.1, h: 9, pitch: 60, noPosts: true, cover: 'glass' }), { w: 8, d: 0.6, h: 4, pitch: 35, posts: false, cover: 'glass' });
  assert.equal(P.porchSize({ cover: 'straw' }).cover, 'tiles');
});

test('boxes: a beam on two posts at the front, rafters up to the wall, the cover on them', () => {
  const parts = P.porchParts({ w: 2.4, d: 1.2, h: 2.45 });
  const posts = parts.filter((p) => p.kind === 'post'), beam = parts.find((p) => p.kind === 'beam');
  assert.equal(posts.length, 2);
  assert.ok(posts.every((p) => p.y === 0 && near(p.y + p.h, 2.45 - 0.14) === undefined));   // from the floor up to the beam
  assert.deepEqual(posts.map((p) => Math.sign(p.x)), [-1, 1]);
  near(beam.y + beam.h, 2.45); near(beam.z, 0.5);                            // the beam's top at h, near the front
  const raf = parts.filter((p) => p.kind === 'rafter');
  assert.ok(raf.length >= 3 && raf.every((p) => p.rx > 0));                   // tilted: the front end down
  const cover = parts.find((p) => p.kind === 'cover');
  assert.ok(cover.y > beam.y + beam.h && cover.w > 2.4);
  const plate = parts.find((p) => p.kind === 'plate');
  assert.ok(plate.y > beam.y && near(plate.z, -0.56) === undefined);         // higher at the wall
  const braces = parts.filter((p) => p.kind === 'brace');
  assert.deepEqual(braces.map((p) => Math.sign(p.rz)), [1, -1]);              // both lean inwards
  assert.ok(braces[0].x > posts[0].x && braces[1].x < posts[1].x);
  assert.equal(P.porchParts({ noPosts: true }).filter((p) => p.kind === 'post' || p.kind === 'brace').length, 0);
});

test('over a door that leads outside: turned outwards, its back at the wall, wider than the door, its beam over it', () => {
  const f = { rooms: [{ points: rect(0, 0, 6, 11) }], walls: [
    { a: [0, 0], b: [6, 0], thickness: 0.3, openings: [{ id: 'hd', type: 'door', name: 'Haustür', pos: 2.4, width: 1.2, height: 2.1 }] },
    { a: [0, 4], b: [6, 4], thickness: 0.1, openings: [{ id: 'in', type: 'door', pos: 1, width: 0.9 }] }] };
  const doors = L.outerDoors(f, null);
  const at = P.porchAtDoor(doors, 'hd');
  assert.equal(at.rot, 180); near(at.x, 2.4); near(at.z, -0.15 - 0.6);
  assert.equal(at.w, 2.4); assert.equal(at.h, 2.4);
  assert.equal(P.porchAtDoor(doors, 'in'), null);                             // a door between two rooms
  assert.deepEqual(P.porchBack({ ...at }), [2.4, -0.15]);                     // its back edge is the wall's face
});

test('it goes up with the house at its back edge, also on a plateau whose edge lies under its front (levels.js lifter)', () => {
  const f = { rooms: [{ points: rect(0, 0, 6, 11) }], walls: [] };
  const up = L.lifter(f, [{ points: rect(-0.2, -0.2, 6.2, 11.2), rise: 0.65 }]);
  near(up.device({ type: 'porchroof', x: 2.4, z: -0.75, rot: 180 }), 0.65);   // its middle lies off the plateau, its back on it
  const ter = { at: () => -0.65, stands: () => true };
  near(L.lifter(f, [], ter).device({ type: 'porchroof', x: 2.4, z: -0.75, rot: 180 }), 0);   // never down with the ground
});
