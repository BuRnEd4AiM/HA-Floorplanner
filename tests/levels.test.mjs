// Unit tests for levels.js (a plateau in the ground, a room with a higher floor, #566; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const L = await import(`${dir}/levels.js`);
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const { pointInPoly: pointIn } = await import(`${dir}/rooms.js`);

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
  assert.deepEqual(L.stepsSize({}), { h: 0.54, w: 1.4, land: 1, n: 3, rise: 0.18, tread: 0.28, rail: 'both', look: 'black' });
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

test('the outdoor steps (#786): a number of steps chosen, the hand rail on one side, stainless with bars', () => {
  assert.equal(L.stepsSize({ h: 0.65 }).n, 4);                                // by itself: at most 18 cm
  assert.deepEqual(L.stepsCountRange(0.65), [3, 5]);                          // 12 to 25 cm each
  const three = L.stepsSize({ h: 0.65, count: 3 });
  assert.equal(three.n, 3); near(three.rise, 0.2167);
  assert.equal(L.stepsSize({ h: 0.65, count: 9 }).n, 5);                      // kept to the range
  assert.equal(L.stepsSize({ h: 0.65, count: 1 }).n, 3);
  assert.equal(L.stepsSize({ h: 0.65, count: '' }).n, 4);
  assert.equal(L.stepsLocal({ h: 0.65, count: 3 }).filter((x) => x.kind === 'step').length, 2);   // 2 steps and the landing (Mario: "2 Stufen + das obere Podest")
  assert.equal(L.stepsDepth({ h: 0.65, count: 3, land: 1 }), 1.56);
  const side = (d) => [...new Set(L.stepsLocal({ h: 0.65, ...d }).filter((x) => x.kind === 'post').map((x) => Math.sign(x.x0)))];
  assert.deepEqual(side({}), [-1, 1]);
  assert.deepEqual(side({ rail: 'left' }), [-1]);                             // seen from below, looking up at the door (-z): left is -x
  assert.deepEqual(side({ rail: 'right' }), [1]);
  assert.deepEqual(side({ rail: 'none' }), []);
  assert.deepEqual(side({ noRail: true }), []);                               // the old field
  assert.equal(L.stepsRail({ noRail: true, rail: 'left' }), 'left');          // a choice made later wins
  assert.equal(L.stepsRail({ rail: 'x' }), 'both');
  assert.equal(L.stepsLocal({ h: 0.65, rail: 'left' }).filter((x) => x.kind === 'bar').length, 0);
  const steel = L.stepsParts({ h: 0.65, rail: 'left', railLook: 'steel' }).filter((x) => x.kind === 'bar');
  assert.equal(steel.length, 6);                                              // three bars along the steps, three along the landing
  assert.ok(steel.every((b) => b.from[0] < 0 && b.from[1] > 0.65 && b.from[1] < 0.65 + 0.9));
  assert.equal(L.stepsSize({ railLook: 'gold' }).look, 'black');
});

test('on a slope (#629): a device that stands on the ground goes with it, on a plateau with the plateau, the house stays', () => {
  const f = { rooms: [{ points: rect(0, 0, 10, 7) }], walls: [] };
  const ter = { at: (x, z) => (z < 0 ? -3 : 0), stands: (d) => d.type === 'tree' };
  const up = L.lifter(f, [{ points: rect(20, 20, 24, 24), rise: 0.5 }], ter);
  assert.equal(up.any, true);
  assert.equal(up.device({ type: 'tree', x: 5, z: -4 }), -3);
  assert.equal(up.device({ type: 'tree', x: 22, z: 22 }), 0.5);       // on the plateau
  assert.equal(up.device({ type: 'light', x: 5, z: -4, y: 2 }), 0);   // not standing on the ground: stays
  assert.equal(up.room(f.rooms[0]), 0);
  assert.equal(up.wall({ a: [0, -1], b: [10, -1] }), 0);
});

test('a plateau lifts the ground floor and the floors over it, never a basement (#713)', () => {
  const areas = [{ points: rect(-1, -1, 9, 5), rise: 0.6 }], f = { rooms: [{ id: 'k', points: rect(0, 0, 4, 4) }], walls: [{ a: [0, 0], b: [4, 0] }] };
  assert.equal(L.plateauLifts(0, 1), false); assert.equal(L.plateauLifts(1, 1), true); assert.equal(L.plateauLifts(3, 1), true);
  assert.equal(L.plateauLifts(0, 0), true); assert.equal(L.plateauLifts(0), true);                 // no basement: the lowest floor is the ground floor
  assert.equal(L.plateauLifts(undefined, 1), true);                                                // a caller that does not say: as before
  assert.deepEqual(L.areasFor(areas, 0, 1), []); assert.equal(L.areasFor(areas, 1, 1), areas); assert.deepEqual(L.areasFor(null, 2, 1), []);
  const cellar = L.lifter(f, L.areasFor(areas, 0, 1)), ground = L.lifter(f, L.areasFor(areas, 1, 1));
  assert.equal(cellar.room(f.rooms[0]), 0); assert.equal(cellar.wall(f.walls[0]), 0); assert.equal(cellar.device({ type: 'sofa', x: 2, z: 2 }), 0);
  near(ground.room(f.rooms[0]), 0.6); near(ground.wall(f.walls[0]), 0.6);
  const raised = { rooms: [{ id: 'k', points: rect(0, 0, 4, 4), raise: 0.3 }] };                  // a room of the basement with its own higher floor still goes up
  near(L.lifter(raised, L.areasFor(areas, 0, 1)).room(raised.rooms[0]), 0.3);
});

test('the stair from the basement up to the ground floor on a plateau reaches the raised floor; the ceiling over the basement too (#713)', () => {
  const H = 2.8;
  assert.deepEqual(L.stairLift(0, 1, 1, 0.6, H), { y: 0, scale: (2.8 + 0.6) / 2.8 });            // basement → ground floor: from the basement floor, taller
  assert.deepEqual(L.stairLift(1, 1, 1, 0.6, H), { y: 0.6, scale: 1 });                           // ground floor → 1st floor: up with the plateau
  assert.deepEqual(L.stairLift(1, 1, 0, 0.6, H), { y: 0.6, scale: 1 });                           // no basement
  assert.deepEqual(L.stairLift(0, 1, 1, 0, H), { y: 0, scale: 1 });                               // not on a plateau
  near(L.stairLift(0, 2, 1, 0.6, H).scale, (5.6 + 0.6) / 5.6);                                   // over two floors: from the basement to the 1st floor
  assert.equal(L.slabExtra(1, 1, 0.6), 0.6); assert.equal(L.slabExtra(2, 1, 0.6), 0); assert.equal(L.slabExtra(0, 0, 0.6), 0); assert.equal(L.slabExtra(1, 1, 0), 0);
});

test('upstairs a balcony reaching out beyond the plateau goes up with the house (5.14.0), on the ground floor not', () => {
  const plateau = [{ points: rect(-0.2, -0.2, 10.2, 6.2), rise: 0.6 }];          // under the house (0 … 10, 0 … 6) and 20 cm round it
  const bal = { id: 'bal', terrace: true, points: rect(-2, 1, 0, 5) }, room = { id: 'r', points: rect(0, 0, 10, 6) };
  const f = { rooms: [room, bal], walls: [{ a: [-2, 1], b: [0, 1], thickness: 0.2 }] };
  const up = L.lifter(f, plateau, null, true);
  near(up.room(room), 0.6); near(up.room(bal), 0.6);
  near(up.device({ type: 'lamp', x: -1, z: 3 }), 0.6);                          // what stands on it goes up with it
  near(up.wall(f.walls[0]), 0.6);                                                // a wall along its side too
  near(up.ground(-5, 3), 0);                                                     // the garden beyond it stays
  near(L.lifter(f, plateau).room(bal), 0);                                       // the ground floor: a terrace on the lawn stays there
  const far = { rooms: [{ id: 'gh', points: rect(20, 0, 24, 4) }] };             // a garden house far off the plateau: not lifted
  near(L.lifter(far, plateau, null, true).room(far.rooms[0]), 0);
  near(L.edgeLift(plateau, bal.points), 0.6);
});

test('a garage on the lawn beside the house on a plateau (5.14.0): cut out of the plateau, its floor stays down, and back', () => {
  const W = (a, b) => ({ a, b, thickness: 0.3 });
  const f = { rooms: [{ id: 'h', points: rect(0, 0, 10, 7) }, { id: 'g', points: rect(10, 0, 16, 5) }],
    walls: [W([0, 0], [10, 0]), W([10, 0], [10, 7]), W([10, 7], [0, 7]), W([0, 7], [0, 0]), W([10, 0], [16, 0]), W([16, 0], [16, 5]), W([16, 5], [10, 5])] };
  const plateau = { id: 'p', rise: 0.6, points: rect(-0.35, -0.35, 16.35, 7.35) };   // made as a box round house and garage
  const layout = { floors: [f], plot: { areas: [plateau] } };
  near(L.lifter(f, [plateau]).room(f.rooms[1]), 0.6);
  assert.equal(L.groundCut(layout, 0, f.rooms[1], true), 1);
  assert.equal(f.rooms[1].onGround, true);
  assert.equal(L.groundAt([plateau], 13, 2.5), 0);                                  // no plateau under the garage any more
  assert.equal(L.groundAt([plateau], 13, 6.5), 0);                                  // the strip of the box in front of it goes too
  assert.equal(L.groundAt([plateau], 5, 7.2), 0.6);                                 // the lip in front of the house stays
  assert.equal(L.groundAt([plateau], 5, 3), 0.6);
  assert.equal(L.groundAt([plateau], 10, 2.5), 0.6);                                // the wall between house and garage stays on it
  near(L.lifter(f, [plateau]).room(f.rooms[1]), 0);
  near(L.lifter(f, [plateau]).room(f.rooms[0]), 0.6);
  const before = JSON.stringify(plateau.points);
  near(L.lifter(f, [{ id: 'q', rise: 0.6, points: rect(-1, -1, 20, 9) }]).device({ type: 'car', x: 13, z: 2.5 }), 0);   // what stands in it stays down too
  assert.equal(L.groundCut(layout, 0, f.rooms[1], false), 1);                       // the tick off: the garage goes back on the plateau
  assert.equal(f.rooms[1].onGround, undefined);
  assert.equal(L.groundAt([plateau], 13, 2.5), 0.6);
  assert.notEqual(JSON.stringify(plateau.points), before);
  const mid = { floors: [{ rooms: [{ id: 'm', points: rect(4, 2, 6, 4) }], walls: [] }], plot: { areas: [{ rise: 0.6, points: rect(0, 0, 10, 7) }] } };
  assert.equal(L.groundCut(mid, 0, mid.floors[0].rooms[0], true), -1);              // in the middle of a plateau: no hole cut
  assert.deepEqual(mid.plot.areas[0].points, rect(0, 0, 10, 7));
});

test('slabPieces (5.28.5, #789): the ceiling of a ground floor on a plateau stays down under a garage on the lawn, with its own walls', () => {
  const W = (a, b) => ({ a, b, thickness: 0.3 });
  const f = { rooms: [{ id: 'h', points: rect(0, 0, 10, 7) }, { id: 'g', points: rect(10, 0, 16, 5), onGround: true }],
    walls: [W([0, 0], [10, 0]), W([10, 0], [10, 7]), W([10, 7], [0, 7]), W([0, 7], [0, 0]), W([10, 0], [16, 0]), W([16, 0], [16, 5]), W([16, 5], [10, 5])] };
  const ring = [[-0.15, -0.15], [16.15, -0.15], [16.15, 5.15], [10.15, 5.15], [10.15, 7.15], [-0.15, 7.15]];   // the outline of house and garage
  const pieces = L.slabPieces(f, ring, 0.6);
  const at = (x, z) => pieces.filter((p) => pointIn(x, z, p.ring) && !p.holes.some((h) => pointIn(x, z, h))).map((p) => p.lift);
  assert.deepEqual(at(5, 3), [0.6]);                                              // the house stays up
  assert.deepEqual(at(13, 2.5), [0]);                                             // the garage down
  assert.deepEqual(at(16.05, 2.5), [0]);                                          // its own outer wall down too
  assert.deepEqual(at(10, 2.5), [0.6]);                                           // the wall it shares with the house stays up
  assert.deepEqual(L.slabPieces(f, ring, 0), [{ lift: 0, ring, holes: [] }]);     // not on a plateau: one piece as before
  f.rooms[1].onGround = false;
  assert.deepEqual(L.slabPieces(f, ring, 0.6), [{ lift: 0.6, ring, holes: [] }]); // no garage on the lawn: one piece as before
});

test('a garage on the lawn (5.28.5, #789): its own walls stay down, also on a plateau not cut; a long wall past its corner is split there', () => {
  const W = (id, a, b) => ({ id, a, b, thickness: 0.3, openings: [] });
  const f = { rooms: [{ id: 'h', points: rect(0, 0, 10, 7) }, { id: 'g', points: rect(10, 0, 16, 5) }],
    walls: [W('front', [0, 0], [16, 0]), W('hr', [10, 0], [10, 7]), W('gr', [16, 0], [16, 5]), W('gb', [16, 5], [10, 5]), W('hb', [10, 7], [0, 7]), W('hl', [0, 7], [0, 0])] };
  const plateau = [{ id: 'p', rise: 0.6, points: rect(-1, -1, 17, 8) }];           // a plateau that cannot be cut (the garage in its middle)
  near(L.lifter(f, plateau).wall(f.walls[2]), 0.6);                               // before: the garage's walls on the plateau
  f.rooms[1].onGround = true;
  near(L.lifter(f, plateau).wall(f.walls[2]), 0);                                 // its own walls stay down now
  near(L.lifter(f, plateau).wall(f.walls[3]), 0);
  near(L.lifter(f, plateau).wall(f.walls[1]), 0.6);                               // the wall between house and garage stays up
  near(L.lifter(f, plateau).wall(f.walls[0]), 0.6);                               // the long front wall: its middle is at the house
  let k = 0;
  assert.equal(L.splitAtCorners(f, f.rooms[1], () => `n${++k}`), 2);              // at the corners (10, 0) and (10, 5) of the garage
  const piece = f.walls.find((w) => w.a[0] === 10 && w.a[1] === 0 && w.b[0] === 16);
  assert.deepEqual([f.walls[0].a, f.walls[0].b], [[0, 0], [10, 0]]);
  assert.ok(piece);
  f.walls.filter((w) => w.a[0] === 10 && w.b[0] === 10).forEach((w) => near(L.lifter(f, plateau).wall(w), 0.6));   // the wall to the house: both pieces up
  near(L.lifter(f, plateau).wall(f.walls[0]), 0.6);                               // the house's piece stays up
  near(L.lifter(f, plateau).wall(piece), 0);                                      // the garage's piece goes down
  assert.equal(L.splitAtCorners(f, f.rooms[1], () => 'x'), 0);                    // nothing more to split
  assert.equal(L.splitAtCorners(f, f.rooms[1], null), 0);
});

test('the outdoor steps at the front door on lowered ground (#786): as high as the step down, on the ground under their middle', () => {
  const f = { rooms: [{ points: rect(0, 0, 6, 11) }], walls: [
    { a: [0, 0], b: [6, 0], thickness: 0.3, openings: [{ id: 'hd', type: 'door', name: 'Haustür', pos: 2.4, width: 1.2 }] },
    { a: [6, 11], b: [0, 11], thickness: 0.3, openings: [{ id: 'td', type: 'door', name: 'Terrasse', pos: 3, width: 1 }] }] };
  const flat = L.stepsAtDoorOnGround(f, () => -0.65);
  assert.equal(flat.door, 'hd'); assert.equal(flat.h, 0.65); assert.equal(flat.rot, 180);   // the front door, the steps run out to -z
  assert.deepEqual(flat.edge, [2.4, -0.15]);
  near(flat.z, -0.15 - L.stepsDepth({ h: 0.65 }) / 2);
  assert.equal(L.stepsAtDoorOnGround(f, () => -0.05), null);                  // less than 10 cm: no steps
  const back = L.stepsAtDoorOnGround(f, (x, z) => (z > 5 ? -1 : 0));
  assert.equal(back.door, 'td'); assert.equal(back.h, 1);                   // only the garden door lies over the ground
  assert.equal(L.stepsAtDoorOnGround(f, () => -0.65, [{ points: rect(-1, -1, 7, 5), rise: 0.6 }]).door, 'td');   // the front door is on a plateau
  const ter = { at: () => -0.65, stands: () => false };
  near(L.lifter(f, [], ter).device({ type: 'steps', x: 2.4, z: -1 }), -0.65);   // they stand on the lowered ground
  near(L.lifter(f, [{ points: rect(-1, -2, 7, 5), rise: 0.6 }], ter).device({ type: 'steps', x: 2.4, z: -1 }), 0);   // on a plateau as before
});

