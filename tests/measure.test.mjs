// Unit tests for measure.js (the measuring tool: points, distances, angles, setting two walls apart; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const M = await import(`${process.env.STATIC_DIR || '/tmp/static'}/measure.js`);
const near = (a, b, eps = 1e-3) => Math.abs(a - b) < eps;
const nearPt = (p, q, eps = 1e-3) => near(p[0], q[0], eps) && near(p[1], q[1], eps);
/* a 6 x 4 m room: walls 20 cm thick, top (w1), right (w2), bottom (w3), left (w4); the top wall is drawn in two pieces (w1, w1b) */
const room = () => ({
  walls: [
    { id: 'w1', a: [0, 0], b: [3, 0], thickness: 0.2 }, { id: 'w1b', a: [3, 0], b: [6, 0], thickness: 0.2 },
    { id: 'w2', a: [6, 0], b: [6, 4], thickness: 0.2 }, { id: 'w3', a: [6, 4], b: [0, 4], thickness: 0.2 },
    { id: 'w4', a: [0, 4], b: [0, 0], thickness: 0.2 },
  ],
  rooms: [{ id: 'r1', points: [[0, 0], [6, 0], [6, 4], [0, 4]] }], devices: [],
});
const wall = (f, id) => f.walls.find((w) => w.id === id);

test('a click snaps to a wall end, to the inner corner of two wall faces, else to the face of the wall under it', () => {
  const f = room();
  const end = M.measurePoint(f, 6.05, 4.04, { corner: 0.1 });
  assert.ok(end.corner && nearPt([end.x, end.z], [6, 4]));
  const inner = M.measurePoint(f, 5.88, 3.91, { corner: 0.05 });
  assert.ok(inner.corner && nearPt([inner.x, inner.z], [5.9, 3.9]), JSON.stringify(inner));   // inside the room: where the two inner faces meet
  const face = M.measurePoint(f, 2, 3.95, { corner: 0.1, wall: 0.05 });   // on the bottom wall, room side
  assert.equal(face.wall, 'w3'); assert.ok(!face.corner);
  assert.ok(nearPt([face.x, face.z], [2, 3.9]), JSON.stringify(face));
  const outside = M.measurePoint(f, 2, 4.06, { corner: 0.1, wall: 0.05 });
  assert.ok(nearPt([outside.x, outside.z], [2, 4.1]), JSON.stringify(outside));   // the outer face
  assert.deepEqual(M.measurePoint(f, 3, 2, { corner: 0.1, wall: 0.05 }), { x: 3, z: 2 });   // nothing near: the free point
  assert.deepEqual(M.measurePoint(f, 6.01, 4.01, {}, true), { x: 6.01, z: 4.01 });            // Alt: no snapping
});
test('the corners of the faces: inner and outer corner of an L, the two inner corners of a T', () => {
  const L = M.faceCorners({ walls: [{ id: 'a', a: [0, 0], b: [4, 0], thickness: 0.2 }, { id: 'b', a: [0, 0], b: [0, 3], thickness: 0.2 }] });
  assert.ok(L.some((p) => nearPt(p, [0.1, 0.1])) && L.some((p) => nearPt(p, [-0.1, -0.1])));
  assert.ok(!L.some((p) => nearPt(p, [0.1, -0.1]) || nearPt(p, [-0.1, 0.1])));                 // no point in the middle of a face
  const T = M.faceCorners({ walls: [{ id: 'a', a: [-2, 0], b: [2, 0], thickness: 0.2 }, { id: 'b', a: [0, 0], b: [0, 3], thickness: 0.2 }] });
  assert.ok(T.some((p) => nearPt(p, [0.1, 0.1])) && T.some((p) => nearPt(p, [-0.1, 0.1])));
  assert.ok(!T.some((p) => p[1] < 0));                                                         // nothing on the far side of the long wall
});
test('a point on a wall follows the wall', () => {
  const f = room(), p = M.measurePoint(f, 2, 3.95, { corner: 0.1, wall: 0.05 });
  wall(f, 'w3').a[1] = 5; wall(f, 'w3').b[1] = 5;
  assert.ok(nearPt(M.pointXZ(f, p), [2, 4.9]));
  assert.deepEqual(M.pointXZ(f, { x: 1, z: 2 }), [1, 2]);
  assert.deepEqual(M.pointXZ(f, { x: 1, z: 2, wall: 'gone', t: 0.5, off: 0 }), [1, 2]);             // the wall was deleted: where it was
});
test('the length of a line and its parts', () => {
  const l = M.lineInfo([0, 0], [3, -4]);
  assert.equal(l.len, 5); assert.equal(l.dx, 3); assert.equal(l.dz, 4); assert.ok(near(l.deg, 53.13, 0.01));
  assert.equal(M.lineInfo([1, 1], [1, 1]).deg, 0);
});
test('two parallel walls: distance between the middle lines and between the faces', () => {
  const f = room(), pr = M.wallPair(wall(f, 'w4'), wall(f, 'w2'));
  assert.ok(pr.parallel && !pr.inline);
  assert.ok(near(pr.center, 6) && near(pr.clear, 5.8));
  assert.ok(M.wallPair(wall(f, 'w1'), wall(f, 'w1b')).inline);                                 // two pieces of one wall
});
test('two walls that meet: the angle in the corner where the clicks are', () => {
  const f = room();
  const o = M.pairOrient(wall(f, 'w1'), wall(f, 'w4'), [1, 0.1], [0.1, 1]);
  assert.ok(near(M.wallPair(wall(f, 'w1'), wall(f, 'w4'), o).angle, 90));
  const slant = { id: 's', a: [0, 0], b: [3, 3], thickness: 0.2 };
  const o2 = M.pairOrient(wall(f, 'w1'), slant, [2, 0], [2, 2]);
  assert.ok(near(M.wallPair(wall(f, 'w1'), slant, o2).angle, 45));
  const o3 = M.pairOrient(wall(f, 'w1'), slant, [-1, 0], [2, 2]);                               // clicked on the other side of the corner
  assert.ok(near(M.wallPair(wall(f, 'w1'), slant, o3).angle, 135));
  assert.ok(nearPt(M.wallPair(wall(f, 'w1'), slant, o2).crossing, [0, 0]));
});
test('a measurement: first click, second click, two walls make a pair, the third click starts again', () => {
  const f = room();
  const p1 = M.measurePoint(f, 0.05, 2, { corner: 0.1, wall: 0.05 }), p2 = M.measurePoint(f, 5.95, 2, { corner: 0.1, wall: 0.05 });
  let m = M.nextMeasure(null, p1, f, 0);
  assert.ok(m.a && !m.b);
  m = M.nextMeasure(m, p2, f, 0);
  assert.deepEqual(m.pair && [m.pair.stay, m.pair.moves], ['w4', 'w2']);
  const info = M.measureInfo(f, m);
  assert.ok(near(info.line.len, 5.8) && near(info.pair.clear, 5.8));
  assert.deepEqual(M.swapPair(m).pair.stay, 'w2');
  assert.ok(!M.nextMeasure(m, p1, f, 0).b);                                                    // a new measurement
  assert.ok(!M.nextMeasure({ ...m, b: null }, p2, f, 1).b);                                    // another floor: a new one too
  const corner = M.measurePoint(f, 6, 4, { corner: 0.1 });
  assert.equal(M.nextMeasure(M.nextMeasure(null, p1, f, 0), corner, f, 0).pair, null);         // a corner is a point, not a wall
});
test('set the distance: the second wall moves at right angles, the walls joined to it stretch and the room follows', () => {
  const f = room();
  const m = M.nextMeasure(M.nextMeasure(null, M.measurePoint(f, 0.05, 2, { corner: 0.1, wall: 0.05 }), f, 0), M.measurePoint(f, 5.95, 2, { corner: 0.1, wall: 0.05 }), f, 0);
  let snaps = 0;
  assert.equal(M.setDistance(f, m, 4.5, 'clear', () => snaps++), 'ok');
  assert.equal(snaps, 1);
  assert.deepEqual([wall(f, 'w2').a, wall(f, 'w2').b], [[4.7, 0], [4.7, 4]]);
  assert.deepEqual(wall(f, 'w1b').b, [4.7, 0]); assert.deepEqual(wall(f, 'w3').a, [4.7, 4]);
  assert.deepEqual(f.rooms[0].points[1], [4.7, 0]);
  assert.deepEqual(wall(f, 'w4').a, [0, 4]);                                                   // the first wall stays
  assert.ok(near(M.measureInfo(f, m).pair.clear, 4.5));
  assert.equal(M.setDistance(f, m, 5, 'center'), 'ok');
  assert.ok(near(wall(f, 'w2').a[0], 5));
  assert.equal(M.setDistance(f, m, -0.1, 'clear'), 'no');                                     // the walls would overlap
  assert.equal(M.setDistance(f, m, 0.1, 'center'), 'no');
  wall(f, 'w2').locked = true;
  assert.equal(M.setDistance(f, m, 3, 'clear', () => snaps++), 'locked');
  assert.equal(snaps, 1);                                                                      // nothing changed, no undo step
});
test('set the distance of a wall drawn in pieces: the whole straight wall moves, a wall ending in its middle stretches', () => {
  const f = room();
  f.walls.push({ id: 'in', a: [3, 0], b: [3, 4], thickness: 0.1 });                            // an inner wall from the joint of w1 / w1b to w3
  const m = M.nextMeasure(M.nextMeasure(null, M.measurePoint(f, 1, 3.95, { corner: 0.05, wall: 0.05 }), f, 0), M.measurePoint(f, 1, 0.05, { corner: 0.05, wall: 0.05 }), f, 0);
  assert.deepEqual([m.pair.stay, m.pair.moves], ['w3', 'w1']);
  assert.deepEqual(M.wallRun(f, wall(f, 'w1'), wall(f, 'w3')).map((w) => w.id), ['w1', 'w1b']);
  assert.equal(M.setDistance(f, m, 5, 'center'), 'ok');
  assert.deepEqual([wall(f, 'w1').a, wall(f, 'w1').b, wall(f, 'w1b').b], [[0, -1], [3, -1], [6, -1]]);
  assert.deepEqual(wall(f, 'in').a, [3, -1]); assert.deepEqual(wall(f, 'in').b, [3, 4]);
  assert.deepEqual([wall(f, 'w2').a, wall(f, 'w4').b], [[6, -1], [0, -1]]);
});
test('set the angle: the second wall turns round the corner, the wall at its far end stretches', () => {
  const f = room();
  const m = M.nextMeasure(M.nextMeasure(null, M.measurePoint(f, 1, 3.95, { corner: 0.05, wall: 0.05 }), f, 0), M.measurePoint(f, 5.95, 2, { corner: 0.05, wall: 0.05 }), f, 0);
  assert.deepEqual([m.pair.stay, m.pair.moves], ['w3', 'w2']);
  assert.ok(near(M.measureInfo(f, m).pair.angle, 90));
  assert.equal(M.setAngle(f, m, 120), 'ok');
  assert.deepEqual(wall(f, 'w2').b, [6, 4]);                                                   // the corner with the first wall stays
  assert.ok(near(M.measureInfo(f, m).pair.angle, 120, 0.01));
  assert.ok(near(Math.hypot(wall(f, 'w2').a[0] - 6, wall(f, 'w2').a[1] - 4), 4));             // as long as before
  assert.ok(wall(f, 'w2').a[0] > 6);                                                           // leans outwards (120° inside the room)
  assert.deepEqual(wall(f, 'w1b').b, wall(f, 'w2').a);                                         // the top wall follows the moved end
  assert.equal(M.setAngle(f, m, 90), 'ok');
  assert.ok(nearPt(wall(f, 'w2').a, [6, 0]));
  assert.equal(M.setAngle(f, m, 200), 'no');
});
test('set the angle of two parallel walls: the second turns away from the first; 0° makes them parallel again', () => {
  const f = { walls: [{ id: 'a', a: [0, 0], b: [4, 0], thickness: 0.2 }, { id: 'b', a: [0, 2], b: [4, 2], thickness: 0.2 }], rooms: [] };
  const m = M.nextMeasure(M.nextMeasure(null, M.measurePoint(f, 2, 0.05, { wall: 0.05 }), f, 0), M.measurePoint(f, 2, 1.95, { wall: 0.05 }), f, 0);
  assert.ok(near(M.measureInfo(f, m).pair.angle, 0));
  assert.equal(M.setAngle(f, m, 90), 'ok');
  assert.deepEqual(f.walls[1].a, [0, 2]);                                                      // the end nearer to a stays (both are as near: the first)
  assert.ok(nearPt(f.walls[1].b, [0, 6]));                                                     // away from a
  assert.ok(near(M.measureInfo(f, m).pair.angle, 90));
  assert.equal(M.setAngle(f, m, 0), 'ok');
  assert.ok(M.measureInfo(f, m).pair.parallel);
});
test('the plan drawing: line with its length, the two walls, the clear distance and the corner angle', () => {
  const f = room(), view = { sx: (x) => x * 50, sy: (z) => z * 50, s: 50, rot: 0, fmtLen: (v) => `${v.toFixed(2)} m` };
  const m = M.nextMeasure(M.nextMeasure(null, M.measurePoint(f, 0.05, 1, { corner: 0.05, wall: 0.05 }), f, 0), M.measurePoint(f, 5.95, 3, { corner: 0.05, wall: 0.05 }), f, 0);
  const svg = M.measureSvg(f, m, null, view);
  assert.ok(svg.includes('msStay') && svg.includes('msMoves'));
  assert.ok(svg.includes('6.14 m'), svg);                                                      // the clicked line, slanted
  assert.ok(svg.includes('⟂ 5.80 m'));                                                         // and the distance between the faces
  const corner = M.nextMeasure(M.nextMeasure(null, M.measurePoint(f, 1, 3.95, { corner: 0.05, wall: 0.05 }), f, 0), M.measurePoint(f, 5.95, 2, { corner: 0.05, wall: 0.05 }), f, 0);
  assert.ok(M.measureSvg(f, corner, null, view).includes('90.0°'));
  const first = M.nextMeasure(null, M.measurePoint(f, 3, 2), f, 0);
  assert.ok(M.measureSvg(f, first, { x: 4, z: 2 }, view).includes('1.00 m'));                  // while the second point is chosen
  assert.equal(M.measureSvg(f, null, null, view), '');
  assert.ok(!M.measureSvg(f, { floor: 0, a: { x: 0, z: 0 }, b: { x: 1, z: 0 }, pair: null }, null, view).includes('<script'));
});
