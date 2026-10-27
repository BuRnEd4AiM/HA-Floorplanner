// Unit tests for levels.js (a plateau in the ground, a room with a higher floor, #566; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const L = await import(`${dir}/levels.js`);
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

test('stored values: a plateau 1 cm to 5 m, a room -3 to 3 m, else none', () => {
  assert.equal(L.cleanRise(0.9), 0.9); assert.equal(L.cleanRise('0.456'), 0.46); assert.equal(L.cleanRise(9), 5);
  assert.equal(L.cleanRise(0), 0); assert.equal(L.cleanRise(-1), 0); assert.equal(L.cleanRise('x'), 0); assert.equal(L.cleanRise(null), 0);
  assert.equal(L.cleanRaise(-0.45), -0.45); assert.equal(L.cleanRaise(7), 3); assert.equal(L.cleanRaise(-7), -3); assert.equal(L.cleanRaise(0.004), 0);
  assert.deepEqual(L.cleanPlateau({ rise: 0.9 }), { rise: 0.9, edge: 'wall', wall: 'stone' });
  assert.deepEqual(L.cleanPlateau({ rise: 0.6, edge: 'slope', wall: 'brick' }), { rise: 0.6, edge: 'slope', wall: 'brick' });
  assert.deepEqual(L.cleanPlateau({ rise: 0.6, edge: 'x', wall: 'gold' }), { rise: 0.6, edge: 'wall', wall: 'stone' });
  assert.deepEqual(L.cleanPlateau({ surface: 'paving' }), {});
});

test('the ground: the plateau under a point, the last drawn on top, 0 on the lawn', () => {
  const areas = [{ points: rect(0, 0, 10, 10), rise: 0.5 }, { points: rect(5, 5, 8, 8), rise: 1.2 }, { points: rect(20, 0, 30, 10), surface: 'paving' }];
  const pl = L.plateausOf(areas);
  assert.equal(pl.length, 2);
  assert.equal(L.groundAt(pl, 1, 1), 0.5); assert.equal(L.groundAt(pl, 6, 6), 1.2); assert.equal(L.groundAt(pl, 25, 5), 0); assert.equal(L.groundAt(pl, -1, 5), 0);
  assert.equal(L.hasLevels({ plot: { areas } }), true);
  assert.equal(L.hasLevels({ plot: { areas: [areas[2]] }, floors: [{ rooms: [{ points: rect(0, 0, 4, 4) }] }] }), false);
  assert.equal(L.hasLevels({ floors: [{ rooms: [{ points: rect(0, 0, 4, 4), raise: 0.3 }] }] }), true);
});

test('what goes up: the room and its things with the plateau and its floor, what hangs from the ceiling only with the plateau', () => {
  const f = { rooms: [{ id: 'a', points: rect(0, 0, 4, 4), raise: 0.45 }, { id: 'b', points: rect(4, 0, 8, 4) }], walls: [{ a: [4, 0], b: [4, 4] }] };
  const up = L.lifter(f, [{ points: rect(-1, -1, 9, 5), rise: 0.9 }]);
  assert.equal(up.any, true);
  near(up.room(f.rooms[0]), 1.35); near(up.room(f.rooms[1]), 0.9);
  near(up.device({ type: 'sofa', x: 2, z: 2, y: 0 }), 1.35);
  near(up.device({ type: 'light', x: 2, z: 2, y: 2.55 }), 0.9);              // a ceiling lamp: the ceiling stays
  near(up.device({ type: 'tree', x: 8.5, z: 4.5 }), 0.9);                    // on the plateau, in no room
  near(up.device({ type: 'tree', x: 20, z: 4.5 }), 0);
  near(up.device({ type: 'steps', x: 2, z: 2 }), 0);                         // the outdoor steps reach the lawn
  near(up.wall(f.walls[0]), 0.9);                                            // the walls: only the plateau
  const flat = L.lifter({ rooms: [{ points: rect(0, 0, 4, 4) }] }, []);
  assert.equal(flat.any, false); assert.equal(flat.device({ x: 1, z: 1 }), 0);
});

test('doors and windows go up with the higher floor beside them, and still fit under the top of the wall', () => {
  const rooms = [{ points: rect(0, 0, 4, 4), raise: 0.45 }, { points: rect(4, 0, 8, 4) }];
  const w = { a: [4, 0], b: [4, 4], thickness: 0.12, height: 2.6, openings: [{ id: 'd', type: 'door', pos: 2, width: 0.9, height: 2.05, sill: 0 }] };
  assert.equal(L.openingShift(w, w.openings[0], rooms, 2.6), 0.45);
  const tall = { ...w.openings[0], height: 2.4 };
  near(L.openingShift(w, tall, rooms, 2.6), 0.18);
  const moved = L.wallWithShift(w, rooms, 2.6);
  assert.notEqual(moved, w); assert.equal(moved.openings[0].sill, 0.45); assert.equal(w.openings[0].sill, 0);   // the plan stays as it is
  assert.equal(L.wallWithShift(w, [{ points: rect(0, 0, 4, 4), raise: -0.4 }, rooms[1]], 2.6), w);                // a lower room: the door stays up
  const outer = { a: [0, 0], b: [4, 0], thickness: 0.24, openings: [{ id: 'win', type: 'window', pos: 2, width: 1.2, height: 1.2, sill: 0.9 }] };
  assert.equal(L.openingShift(outer, outer.openings[0], rooms, 2.6), 0.45);
});

test('steps at a door between two floors of different height: on the lower side, from the wall face outwards', () => {
  const f = {
    rooms: [{ id: 'hi', points: rect(0, 0, 4, 4), raise: 0.45 }, { id: 'lo', points: rect(4, 0, 8, 4) }],
    walls: [{ a: [4, 0], b: [4, 4], thickness: 0.12, openings: [{ id: 'd', type: 'door', pos: 2, width: 0.9, height: 2.05 }, { id: 'g', type: 'window', pos: 3.5, width: 0.6, height: 0.6, sill: 1 }] }],
  };
  const s = L.doorSteps(f);
  assert.equal(s.length, 2);                                                 // 3 risers of 15 cm: the wall below the door and two treads
  assert.deepEqual(s.map((x) => x.top), [0.3, 0.15]);
  assert.ok(s.every((x) => x.ux === 1 && x.uz === 0 && x.x > 4 && x.bottom === 0 && near(x.z, 2) === undefined));
  near(s[0].x, 4 + 0.06 + 0.14); near(s[1].x, 4 + 0.06 + 0.28 + 0.14); assert.equal(s[0].w, 1);
  assert.deepEqual(L.doorSteps({ ...f, rooms: [{ ...f.rooms[0], steps: false }, f.rooms[1]] }), []);   // "Stufen an den Türen: keine"
  const sunk = L.doorSteps({ ...f, rooms: [{ ...f.rooms[0], raise: -0.36 }, f.rooms[1]] });          // a lower room: the steps go down into it
  assert.deepEqual(sunk.map((x) => [x.ux, x.top, x.bottom]), [[-1, -0.18, -0.36]]);
  assert.deepEqual(L.doorSteps({ ...f, rooms: [{ ...f.rooms[0], raise: 0 }, f.rooms[1]] }), []);
  assert.deepEqual(L.stepCount(0.9), { n: 5, rise: 0.18 }); assert.equal(L.stepCount(0.2).n, 2); assert.equal(L.stepCount(0.05).n, 1);
});

test('the plateau under a building: its outline moved out on every side; several pieces: the rectangle round them', () => {
  assert.deepEqual(L.offsetPoly(rect(0, 0, 8, 7), 0.2), rect(-0.2, -0.2, 8.2, 7.2));
  assert.deepEqual(L.offsetPoly([...rect(0, 0, 8, 7)].reverse(), 0.2), [...rect(-0.2, -0.2, 8.2, 7.2)].reverse());   // the other way round too
  const ell = [[0, 0], [6, 0], [6, 3], [3, 3], [3, 6], [0, 6]];
  assert.deepEqual(L.offsetPoly(ell, 0.5), [[-0.5, -0.5], [6.5, -0.5], [6.5, 3.5], [3.5, 3.5], [3.5, 6.5], [-0.5, 6.5]]);
  assert.deepEqual(L.offsetPoly([[0, 0], [4, 0], [8, 0], [8, 2], [0, 2]], 1), [[-1, -1], [4, -1], [9, -1], [9, 3], [-1, 3]]);   // a corner on a straight side
  assert.deepEqual(L.plateauRing([rect(0, 0, 8, 7)]), rect(-0.2, -0.2, 8.2, 7.2));
  assert.deepEqual(L.plateauRing([rect(0, 0, 2, 2), rect(5, 5, 6, 6)], 0.5), rect(-0.5, -0.5, 6.5, 6.5));
  assert.equal(L.plateauRing([]), null);
  near(L.exitDistance(rect(0, 0, 10, 10), 5, 5, 0, -1), 5); assert.equal(L.exitDistance(rect(0, 0, 10, 10), 20, 5, 1, 0), null);
});

test('the outdoor steps at the front door: where the door meets the edge, turned outwards, as high as the plateau', () => {
  const area = { points: rect(18.8, -0.2, 27.2, 7.2), rise: 0.9 };
  const f = {
    rooms: [{ points: rect(19, 0, 24, 7) }, { points: rect(24, 0, 27, 7) }],
    walls: [
      { id: 'w1', a: [19, 0], b: [27, 0], thickness: 0.24, openings: [{ id: 'win', type: 'window', pos: 1.5 }, { id: 'hd', type: 'door', pos: 5.8, name: 'Haustür', width: 0.9 }] },
      { id: 'w3', a: [27, 7], b: [19, 7], thickness: 0.24, openings: [{ id: 'back', type: 'door', pos: 4, width: 0.9 }] },
      { id: 'i1', a: [24, 0], b: [24, 7], thickness: 0.12, openings: [{ id: 'in', type: 'door', pos: 2 }] },
    ],
  };
  const doors = L.outerDoors(f, area);
  assert.deepEqual(doors.map((d) => [d.op.id, d.ux, d.uz]), [['hd', 0, -1], ['back', 0, 1]]);   // the door between two rooms is none
  const s = L.stepsAtDoor(f, area);
  assert.deepEqual(s, { x: 24.8, z: -1.26, rot: 180, h: 0.9, edge: [24.8, -0.2], door: 'hd' });   // its middle: a landing of 1 m and 4 treads out
  assert.equal(L.stepsAtDoor(f, { ...area, rise: 0 }), null);
  assert.equal(L.stepsAtDoor(f, { points: rect(0, 0, 5, 5), rise: 1 }), null);                    // no door on that plateau
  const raised = { ...f, rooms: [f.rooms[0], { ...f.rooms[1], raise: 0.3 }] };
  assert.equal(L.stepsAtDoor(raised, area).h, 1.2);                                                // up to the raised floor behind the door
});

test('the outdoor steps: a landing on top, steps of at most 18 cm down to the lawn, a hand rail on both sides', () => {
  assert.deepEqual(L.stepsSize({}), { h: 0.54, w: 1.4, land: 1, n: 3, rise: 0.18, tread: 0.28 });
  const sz = L.stepsSize({ h: 0.9, w: 1.5, land: 1.2 });
  assert.equal(sz.n, 5); near(sz.rise, 0.18);
  assert.equal(L.stepsDepth({ h: 0.9, land: 1.2 }), 2.32);
  const mid = L.stepsParts({ h: 0.9, w: 1.5, land: 1.2 });
  assert.equal(mid.find((x) => x.kind === 'land').z0, -1.16);                // the middle of the device in the middle of the steps
  const p = L.stepsLocal({ h: 0.9, w: 1.5, land: 1.2 });
  const land = p.find((x) => x.kind === 'land'), steps = p.filter((x) => x.kind === 'step');
  assert.deepEqual([land.y1, land.z0, land.z1, land.x0, land.x1], [0.9, 0, 1.2, -0.75, 0.75]);
  assert.deepEqual(steps.map((x) => x.y1), [0.72, 0.54, 0.36, 0.18]);
  assert.ok(steps.every((x, i) => near(x.z0, 1.2 + i * 0.28) === undefined && x.y0 === 0));
  assert.equal(p.filter((x) => x.kind === 'post').length, 6); assert.equal(p.filter((x) => x.kind === 'rail').length, 4);
  assert.equal(L.stepsLocal({ h: 0.9, noRail: true }).filter((x) => x.kind === 'post' || x.kind === 'rail').length, 0);
  assert.equal(L.stepsLocal({ h: 0.5, land: 0 }).filter((x) => x.kind === 'land').length, 0);
});
