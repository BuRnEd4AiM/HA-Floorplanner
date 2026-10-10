// Unit tests for shutters.js (roller shutters on windows, also dormer windows, #331; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const S = await import(`${dir}/shutters.js`);
const W = await import(`${dir}/dormerwin.js`);
const { roofY0 } = await import(`${dir}/attic.js`);
const { roomOpenings, roomShutters } = await import(`${dir}/roompanel.js`);
const { openItems, isOpenState } = await import(`${dir}/openings.js`);
const { openingBallAt, wantsBall, ballIcon, BALL } = await import(`${dir}/tapballs.js`);
const { skipInLive, chooseHit } = await import(`${dir}/pickrules.js`);
const G = await import(`${dir}/rooms.js`);
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('only windows have a roller shutter, its entity only while the tick is set', () => {
  assert.ok(S.hasShutter({ type: 'window', shutter: true }));
  assert.ok(!S.hasShutter({ type: 'window' }));
  assert.ok(!S.hasShutter({ type: 'door', shutter: true }));
  assert.ok(!S.hasShutter(null));
  assert.equal(S.shutterEntity({ type: 'window', shutter: true, shutterEntity: 'cover.a' }), 'cover.a');
  assert.equal(S.shutterEntity({ type: 'window', shutterEntity: 'cover.a' }), '', 'no tick: no shutter');
  assert.equal(S.shutterEntity({ type: 'window', shutter: true }), '');
});

test('the tick: on gives a window a shutter, off takes it away with its entity; doors never get one', () => {
  const o = { type: 'window' };
  S.setShutter(o, true);
  assert.equal(o.shutter, true);
  S.setShutterEntity(o, 'cover.kueche');
  assert.equal(o.shutterEntity, 'cover.kueche');
  S.setShutterEntity(o, '');
  assert.ok(!('shutterEntity' in o));
  S.setShutterEntity(o, 'cover.kueche');
  S.setShutter(o, false);
  assert.deepEqual(o, { type: 'window' });
  const d = S.setShutter({ type: 'door' }, true);
  assert.ok(!('shutter' in d));
});

test('linked entities: contacts and the shutter, each once; the shutter is no contact (an open shutter is no open window)', () => {
  const o = { type: 'window', entity: 'binary_sensor.f', paneEntities: ['binary_sensor.f', 'binary_sensor.g'], shutter: true, shutterEntity: 'cover.r' };
  assert.deepEqual(S.linkedEntities(o), ['binary_sensor.f', 'binary_sensor.g', 'cover.r']);
  assert.deepEqual(S.linkedEntities({ type: 'window', shutter: true, shutterEntity: 'cover.r' }), ['cover.r']);
  assert.deepEqual(S.linkedEntities({ type: 'window' }), []);
  // a window with only an open shutter is not in the list "n open"
  const on = new Set(['on', 'open']), states = { 'cover.r': { state: 'open' } };
  const floors = [{ rooms: [], walls: [{ a: [0, 0], b: [4, 0], openings: [{ id: 'w', type: 'window', pos: 2, shutter: true, shutterEntity: 'cover.r' }] }] }];
  const list = openItems(floors, { isOpen: (e) => isOpenState(states[e], on), t: (k) => k, pointInPoly: G.pointInPoly, distToPoly: G.distToPoly });
  assert.deepEqual(list, []);
});

test('the picker offers the covers, every entity when there is none', () => {
  const ents = [{ entity_id: 'cover.a', domain: 'cover' }, { entity_id: 'light.b', domain: 'light' }, { entity_id: 'cover.c' }];
  assert.deepEqual(S.shutterChoices(ents).map((e) => e.entity_id), ['cover.a', 'cover.c']);
  const none = [{ entity_id: 'light.b', domain: 'light' }];
  assert.equal(S.shutterChoices(none), none);
});

test('how far the shutter is down: from the position (100 = open), else open / closed, unknown stays null', () => {
  assert.equal(S.shutterClosed({ state: 'open', position: 100 }), 0);
  assert.equal(S.shutterClosed({ state: 'closed', position: 0 }), 1);
  near(S.shutterClosed({ state: 'open', position: 60 }), 0.4);
  assert.equal(S.shutterClosed({ state: 'open', position: 140 }), 0, 'kept in 0..1');
  assert.equal(S.shutterClosed({ state: 'closed' }), 1);
  assert.equal(S.shutterClosed({ state: 'closing' }), 1);
  assert.equal(S.shutterClosed({ state: 'open' }), 0);
  assert.equal(S.shutterClosed({ state: 'opening', position: null }), 0);
  assert.equal(S.shutterClosed({ state: 'unavailable' }), null);
  assert.equal(S.shutterClosed(undefined), null);
});

test('the state in words: open, closed, how far open, on its way, unavailable', () => {
  const t = (k, p) => (p ? `${k}:${p.n}` : k);
  assert.equal(S.shutterText({ state: 'open', position: 100 }, t), 'state.open');
  assert.equal(S.shutterText({ state: 'closed', position: 0 }, t), 'state.closed');
  assert.equal(S.shutterText({ state: 'open', position: 60 }, t), 'shutter.partly:60');
  assert.equal(S.shutterText({ state: 'open' }, t), 'state.open');
  assert.equal(S.shutterText({ state: 'closed', position: null }, t), 'state.closed');
  assert.equal(S.shutterText({ state: 'opening', position: 30 }, t), 'shutter.opening');
  assert.equal(S.shutterText({ state: 'closing' }, t), 'shutter.closing');
  assert.equal(S.shutterText({ state: 'unavailable' }, t), 'off.unavailable');
  assert.equal(S.shutterText(undefined, t), '—');
});

test('the curtain moves at an even speed, all the way in about 3 s, and stops at its target', () => {
  near(S.curtainStep(1, 0.05, 0.5), 1 - 0.5 * S.SHUTTER_SPEED);
  near(S.curtainStep(0.05, 1, 0.5), 0.05 + 0.5 * S.SHUTTER_SPEED);
  assert.equal(S.curtainStep(0.1, 0.05, 1), 0.05, 'never past the target');
  assert.equal(S.curtainStep(0.5, 0.5, 0.1), 0.5);
  assert.equal(S.curtainStep(0.5, 1, -1), 0.5, 'no step back in time');
  let h = S.SHUTTER_UP, t = 0;
  while (h < 1 && t < 10) { h = S.curtainStep(h, 1, 1 / 60); t += 1 / 60; }
  assert.ok(t > 2.5 && t < 3.5, `all the way down in ${t.toFixed(2)} s`);
});

test('the label: how far it is open, over the ball on top of the window (#335)', () => {
  const t = (k, p) => (p ? `${k}:${p.n}` : k);
  assert.equal(S.shutterLabel({ state: 'open', position: 60 }, t), '↕ shutter.partly:60');
  assert.equal(S.shutterLabel({ state: 'closed' }, t), '↕ state.closed');
  near(S.shutterBallY({ sill: 0.9, height: 1.2 }), 2.1 + S.SHUTTER_BALL_LIFT);
  near(S.shutterLabelY({ sill: 0.9, height: 1.2 }), 2.1 + S.SHUTTER_BALL_LIFT + 0.55);
  near(S.shutterLabelY({ sill: 2.2, height: 0.8 }), 3 + S.SHUTTER_BALL_LIFT + 0.55, 1e-9);   // a dormer window high over its floor
  const o = { sill: 0.9, height: 1.2 }, labelHalf = 0.375 / 2;   // the label is 0.375 m high (floorbuild.js)
  assert.ok(S.shutterBallY(o) - BALL.r > 2.1, 'the ball is over the window, not in front of the curtain');
  assert.ok(S.shutterLabelY(o) - labelHalf > S.shutterBallY(o) + BALL.r, 'the label is over the ball, not behind it');
});

test('the card (#335): the slider shows the curtain from the top, the finger sets the position', () => {
  assert.equal(S.sliderPosition(100, 100, 200), 100, 'at the top: open');
  assert.equal(S.sliderPosition(300, 100, 200), 0, 'at the bottom: closed');
  assert.equal(S.sliderPosition(220, 100, 200), 40, '60 % down: 40 % open');
  assert.equal(S.sliderPosition(50, 100, 200), 100, 'above it: open');
  assert.equal(S.sliderPosition(400, 100, 200), 0, 'below it: closed');
  assert.equal(S.sliderPosition(120, 100, 200, 20), 100, 'the rolled-up rest at the top counts as open');
  assert.equal(S.sliderPosition(210, 100, 200, 20), 50);
  assert.equal(S.sliderPosition(10, 0, 0), 100, 'no height: no division by zero');
  assert.equal(S.sliderPosition(297, 100, 200), 0, 'just above the bottom: closed, not 1 % open');
  assert.equal(S.sliderPosition(103, 100, 200), 100, 'just under the top: open');
  assert.equal(S.sliderPosition(294, 100, 200), 3, 'a little higher: a small gap');
  assert.deepEqual(S.SHUTTER_PRESETS, [0, 25, 50, 75, 100]);
});

test('the card (#335): a chosen position shows at once, until the cover is there or does not answer', () => {
  const p = { pos: 25, at: 1000 };
  assert.equal(S.shownPosition({ state: 'open', position: 40 }, null, 1000), 40, 'nothing chosen: the cover\'s own');
  assert.equal(S.shownPosition({ state: 'open', position: 40.4 }, null, 1000), 40, 'whole percent');
  assert.equal(S.shownPosition({ state: 'open', position: 40 }, p, 1500), 25, 'just chosen: there at once');
  assert.equal(S.shownPosition({ state: 'open', position: 40 }, p, 1000 + S.PENDING_MS + 1), 40, 'no answer: back to its own');
  assert.equal(S.shownPosition({ state: 'closing', position: 35 }, p, 1000 + 20000), 25, 'on its way there');
  assert.equal(S.shownPosition({ state: 'closing', position: 35 }, p, 1000 + S.PENDING_MOVING_MS + 1), 35, 'not forever');
  assert.equal(S.shownPosition({ state: 'open', position: 25 }, p, 1500), 25, 'there');
  assert.equal(S.shownPosition({ state: 'open' }, p, 1500), null, 'a cover without a position has no slider');
  assert.equal(S.shownPosition(undefined, null, 0), null);
});

test('the card (#335): the big line says how far it is open, and that it moves', () => {
  const t = (k, p) => (p ? `${k}:${p.n}` : k);
  assert.equal(S.shutterCardText({ state: 'open', position: 40 }, 40, t), 'shutter.partly:40');
  assert.equal(S.shutterCardText({ state: 'open', position: 40 }, 25, t), 'shutter.partly:25', 'the position shown, also one just chosen');
  assert.equal(S.shutterCardText(null, 0, t), 'state.closed', 'dragged to the bottom');
  assert.equal(S.shutterCardText(null, 100, t), 'state.open');
  assert.equal(S.shutterCardText({ state: 'closing', position: 35 }, 25, t), 'shutter.closing · 25 %');
  assert.equal(S.shutterCardText({ state: 'open' }, null, t), 'state.open', 'no position: open / closed');
  assert.equal(S.shutterCardText({ state: 'unavailable', position: 40 }, 40, t), 'off.unavailable');
});

test('the curtain: rolled up a small rest, all of it when closed; unknown rolled up; slats of about 7 cm', () => {
  near(S.curtainScale(0), S.SHUTTER_UP);
  near(S.curtainScale(1), 1);
  near(S.curtainScale(0.5), S.SHUTTER_UP + (1 - S.SHUTTER_UP) / 2);
  near(S.curtainScale(null), S.SHUTTER_UP);
  near(S.curtainScale(3), 1);
  const s = S.shutterSlats(1.1);
  assert.equal(s.n, 16);
  near(s.n * s.sh, 1.1);
  assert.equal(S.shutterSlats(0.1).n, 3, 'at least 3 slats');
});

test('the curtain hangs inside the wall, between the glass and its face', () => {
  near(S.curtainDepth(0.24), 0.06);
  near(S.curtainDepth(0.1), 0.035);                 // the thin front wall of a dormer
  assert.ok(S.curtainDepth(0.02) >= 0.015);
  for (const t of [0.1, 0.12, 0.24, 0.36]) assert.ok(S.curtainDepth(t) < t / 2);
});

test('the shutter hangs outside: on the side of the wall without a room, whichever way the wall was drawn', () => {
  const rooms = [{ points: [[0, 0], [6, 0], [6, 4], [0, 4]] }];
  const o = { pos: 2 };
  // wall along +x at z = 0: its normal (-dz, dx) = (0, 1) points into the room, so the outside is -1
  assert.equal(S.shutterSide({ a: [0, 0], b: [6, 0], thickness: 0.24 }, o, rooms), -1);
  assert.equal(S.shutterSide({ a: [6, 0], b: [0, 0], thickness: 0.24 }, o, rooms), 1, 'drawn the other way round');
  assert.equal(S.shutterSide({ a: [0, 4], b: [6, 4], thickness: 0.24 }, o, rooms), 1);
  assert.equal(S.shutterSide({ a: [3, 0], b: [3, 4], thickness: 0.12 }, o, rooms), 1, 'an inner wall: rooms on both sides, the default');
  assert.equal(S.shutterSide({ a: [0, 0], b: [6, 0] }, o, []), 1, 'no rooms: the default');
  assert.equal(S.shutterSide({ a: [0, 0], b: [6, 0], outside: -1 }, o, []), -1, 'a dormer wall knows its outside');
});

test('the shutters of a floor, also of a window in a dormer; a dormer window keeps its shutter when it is synced again', () => {
  const sq = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  const elev = (i) => i * 2.8, bb = { x0: 0, x1: 10, z0: 0, z1: 6 };
  let n = 0;
  const uid = () => `id${++n}`;
  const floors = [
    { kind: 'floor', walls: [{ id: 'w0', a: [0, 6], b: [10, 6], thickness: 0.24, openings: [{ id: 'f1', type: 'window', pos: 3, width: 1.2, height: 1.2, sill: 0.9, shutter: true, shutterEntity: 'cover.unten' }] }],
      rooms: [{ id: 'r0', name: 'Unten', points: sq(0, 0, 10, 6) }], devices: [] },
    { kind: 'floor', walls: [], rooms: [{ id: 'r1', name: 'Studio', points: sq(0, 0, 10, 6) }], devices: [] },
    { kind: 'roof', walls: [], rooms: [], roof: { type: 'gable', pitch: 35, overhang: 0.4, knee: 1.0, dormers: [{ id: 'd1', side: 0, pos: 0.5, w: 1.6, hw: 1.2 }] } },
  ];
  const roofs = (ri) => [{ bb, spec: floors[ri].roof, y0: roofY0(floors, ri, elev) }];
  W.syncDormerWindows(floors, roofs, elev, uid);
  const win = floors[2].roof.dormers[0].window;
  S.setShutter(win, true); S.setShutterEntity(win, 'cover.gaube');
  W.syncDormerWindows(floors, roofs, elev, uid);
  assert.equal(floors[2].roof.dormers[0].window.shutterEntity, 'cover.gaube', 'stored on the dormer');
  assert.deepEqual(S.floorShutters(floors[0]), ['cover.unten']);
  // the dormer's front wall knows its outside: away from the ridge (side 0: the front faces -z, so the outside is the -z side)
  const dw = floors[1].dormerWalls[0], L = Math.hypot(dw.b[0] - dw.a[0], dw.b[1] - dw.a[1]);
  const nz = (dw.b[0] - dw.a[0]) / L;                            // z part of the normal (-dz, dx) of the front wall
  assert.equal(Math.sign(dw.outside * nz), -1, `outside ${dw.outside}, normal z ${nz}`);
  assert.equal(S.shutterSide(dw, win, floors[1].rooms), dw.outside);
  assert.deepEqual(S.floorShutters(floors[1]), ['cover.gaube'], 'the dormer window belongs to the storey under the slopes');
  assert.ok(JSON.stringify(floors[2]).includes('"shutterEntity":"cover.gaube"'), 'saved with the house');
  // the room panel lists it under covers, with the name of the cover from Home Assistant, each entity once
  const room = floors[1].rooms[0];
  assert.equal(roomOpenings(room, floors[1]).length, 1);
  const seen = new Set();
  assert.deepEqual(roomShutters(room, floors[1], seen, (id) => (id === 'cover.gaube' ? 'Rollladen Gaube' : undefined), 'Rollladen'), [{ entity: 'cover.gaube', name: 'Rollladen Gaube' }]);
  assert.deepEqual(roomShutters(room, floors[1], seen, () => undefined, 'Rollladen'), [], 'already listed');
  win.name = 'Gaube Süd';
  assert.equal(roomShutters(room, floors[1], new Set(), () => 'HA', 'Rollladen')[0].name, 'Gaube Süd', 'the window\'s own name first');
});

test('the ball of a shutter: at the middle of the window, always on top of it, where the shutter rolls up (#335)', () => {
  const w = { a: [0, 0], b: [4, 0] };
  const p = openingBallAt(w, { pos: 1, sill: 0.9, height: 1.2 });
  near(p.x, 1); near(p.z, 0);
  near(p.y, S.shutterBallY({ sill: 0.9, height: 1.2 }));
  assert.ok(p.y > 2.1, 'over the window, also where that is close to the ceiling');
  assert.ok(openingBallAt(w, { pos: 1, sill: 0.4, height: 0.8 }).y > 1.2, 'a low window: over it too');
  const q = openingBallAt({ a: [2, 2], b: [2, 6] }, { pos: 3, sill: 1, height: 1 });
  near(q.x, 2); near(q.z, 5);
  assert.ok(wantsBall({ id: 'w', entity: 'cover.r' }));
  assert.equal(ballIcon({ entity: 'cover.r' }), '🪟');
});

test('live mode: a window takes no tap, the ball of its shutter does, and it counts as linked', () => {
  assert.ok(skipInLive({ kind: 'opening', id: 'w' }));
  assert.ok(!skipInLive({ kind: 'opening', id: 'w', tapBall: true }));
  const ball = { data: { kind: 'opening', id: 'w', tapBall: true }, distance: 3 };
  const linked = (id) => S.linkedEntities({ type: 'window', shutter: true, shutterEntity: id === 'w' ? 'cover.r' : '' }).length > 0;
  assert.equal(chooseHit([ball, { data: { kind: 'room', id: 'r' }, distance: 4 }], true, linked)?.data.id, 'w');
  assert.equal(chooseHit([{ data: { kind: 'opening', id: 'x', tapBall: true }, distance: 3 }, { data: { kind: 'room', id: 'r' }, distance: 4 }], true, linked)?.data.kind, 'room');
});
