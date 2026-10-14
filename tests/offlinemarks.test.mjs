// Unit tests for offlinemarks.js (a crossed-out lightning bolt over everything that is offline or linked to nothing, #375; run like
// offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const M = await import(`${dir}/offlinemarks.js`);
const THREE = await import(`${dir}/vendor/three.module.min.js`);
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

/** a canvas stand-in that records what is drawn */
function fakeCanvas() {
  const calls = [];
  const g = new Proxy({ calls }, { get: (o, k) => (k in o ? o[k] : (...a) => calls.push([k, ...a])), set: (o, k, v) => { calls.push([`=${String(k)}`, v]); return true; } });
  return { width: 0, height: 0, getContext: () => g, g };
}
globalThis.document = { createElement: () => fakeCanvas() };

test('one mark per thing; offline wins over linked to nothing', () => {
  const m = M.offlineMarks([
    { kind: 'device', id: 'lamp', reason: 'unlinked' },
    { kind: 'device', id: 'tv', reason: 'unavailable' },
    { kind: 'device', id: 'tv', reason: 'missing' },
    { kind: 'opening', id: 'door', reason: 'unknown' },
    { kind: 'device', id: 'ring', reason: 'unlinked' },
    { kind: 'device', id: 'ring', reason: 'unavailable' },
    { kind: 'device', id: 'ring2', reason: 'unavailable' },
    { kind: 'device', id: 'ring2', reason: 'unlinked' },
    { kind: 'device', id: '', reason: 'unavailable' },
  ]);
  assert.deepEqual([...m.keys()], ['lamp', 'tv', 'door', 'ring', 'ring2']);
  assert.deepEqual(m.get('lamp'), { kind: 'device', reason: 'unlinked' });
  assert.deepEqual(m.get('tv'), { kind: 'device', reason: 'offline' });
  assert.deepEqual(m.get('door'), { kind: 'opening', reason: 'offline' });
  assert.equal(m.get('ring').reason, 'offline');
  assert.equal(m.get('ring2').reason, 'offline');
  assert.equal(M.offlineMarks(null).size, 0);
});

test('the mark sits just above what it is on: the top of a model, a value pill', () => {
  near(M.markCenterY(0), 0.5 - (M.MARK.r + M.MARK.gap) / (2 * M.MARK.r));      // bottom of the mark a gap over the top
  assert.ok(M.markCenterY(0) < 0);
  assert.ok(M.markCenterY(M.PILL_HALF) < M.markCenterY(0));                       // over a pill: higher up
  near((0.5 - M.markCenterY(M.PILL_HALF)) * 2 * M.MARK.r, M.PILL_HALF + M.MARK.r + M.MARK.gap);
});

test('the sign: a lightning bolt crossed out, red when offline, amber when linked to nothing', () => {
  const red = fakeCanvas(), amber = fakeCanvas();
  M.drawOffline(red.g, 128, 'offline'); M.drawOffline(amber.g, 128, 'unlinked');
  assert.ok(red.g.calls.some((c) => c[0] === 'fillText' && c[1] === '⚡'));
  assert.ok(red.g.calls.some((c) => c[0] === '=strokeStyle' && c[1] === M.MARK_COLOR.offline));
  assert.ok(amber.g.calls.some((c) => c[0] === '=strokeStyle' && c[1] === M.MARK_COLOR.unlinked));
  assert.ok(red.g.calls.filter((c) => c[0] === 'stroke').length >= 2);          // the rim and the slash
});

/** a floor group with a device (a 1 m cube standing on the floor at x 2) and a wall with a door 2 m high in its middle */
function scene() {
  const floor = new THREE.Group(); floor.position.y = 3;
  const dev = new THREE.Group(); dev.position.set(2, 0, 1);
  const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)); cube.position.y = 0.5; dev.add(cube);
  const proxy = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3)); proxy.userData.proxy = true; dev.add(proxy);   // the big pick box does not count
  floor.add(dev);
  const wall = new THREE.Group(); wall.position.set(5, 0, 0); floor.add(wall);
  const door = new THREE.Group(); door.position.x = 1; wall.add(door);
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2, 0.1)); leaf.position.y = 1; door.add(leaf);
  const registry = new Map([['d1', dev], ['o1', door]]);
  return { floor, dev, wall, door, registry };
}

test('marks over a device and in the middle of a door, in their floor; hidden where the ball carries the sign', () => {
  const { floor, registry } = scene(), balls = new Set();
  const marks = M.initOfflineMarks({ registry, labelSprites: new Map(), ballShown: (id) => balls.has(id), floorShown: (fi) => fi === 0 });
  const want = M.offlineMarks([{ kind: 'device', id: 'd1', reason: 'unavailable' }, { kind: 'opening', id: 'o1', reason: 'unknown' }, { kind: 'device', id: 'gone', reason: 'missing' }]);
  marks.update(want, new Map([['d1', 0], ['o1', 0]]));
  const sd = marks.sprite('d1'), so = marks.sprite('o1');
  assert.equal(sd.parent, floor); assert.equal(so.parent, floor);
  near(sd.position.x, 2); near(sd.position.y, 1); near(sd.position.z, 1);          // on top of the cube, not of the pick box
  near(sd.center.y, M.markCenterY(0));
  near(so.position.x, 6); near(so.position.y, 1); near(so.center.y, 0.5);        // the middle of the door
  assert.ok(marks.shown('d1') && marks.shown('o1'));
  assert.equal(marks.reason('d1'), 'offline');
  assert.equal(marks.sprite('gone'), null);                                         // not built (another floor): no mark
  balls.add('d1');
  marks.update(want, new Map([['d1', 0], ['o1', 0]]));
  assert.ok(!marks.shown('d1'), 'its tap ball shows the sign');
  marks.update(want, new Map([['d1', 1], ['o1', 0]]));
  assert.ok(!marks.shown('d1'));
  balls.clear();
  marks.update(want, new Map([['d1', 1], ['o1', 0]]));
  assert.ok(!marks.shown('d1'), 'a floor dimmed below');
});

test('a mark sits on the value pill when there is one; it goes when the thing is fine again or the scene is built anew', () => {
  const { floor, registry, dev } = scene();
  const pill = new THREE.Sprite(); pill.position.set(2, 0.9, 1); floor.add(pill);
  const labels = new Map([['d1', pill]]);
  const marks = M.initOfflineMarks({ registry, labelSprites: labels });
  marks.update(M.offlineMarks([{ kind: 'device', id: 'd1', reason: 'unlinked' }]));
  const s1 = marks.sprite('d1');
  near(s1.position.y, 0.9); near(s1.center.y, M.markCenterY(M.PILL_HALF));
  assert.equal(marks.reason('d1'), 'unlinked');
  pill.visible = false;
  marks.update(M.offlineMarks([{ kind: 'device', id: 'd1', reason: 'unavailable' }]));
  const s2 = marks.sprite('d1');
  assert.notEqual(s2, s1, 'another reason: drawn anew');
  assert.equal(s1.parent, null);
  near(s2.position.y, 1); assert.equal(marks.reason('d1'), 'offline');
  dev.visible = false;
  marks.update(M.offlineMarks([{ kind: 'device', id: 'd1', reason: 'unavailable' }]));
  assert.ok(!marks.shown('d1'), 'a hidden model has no mark');
  marks.update(new Map());
  assert.equal(marks.sprite('d1'), null); assert.equal(s2.parent, null);
  marks.update(M.offlineMarks([{ kind: 'device', id: 'd1', reason: 'unavailable' }]));
  const s3 = marks.sprite('d1');
  marks.clear();
  assert.equal(marks.sprite('d1'), null); assert.equal(s3.parent, null);
});

test('a moved device takes its mark along', () => {
  const { registry, dev } = scene();
  const marks = M.initOfflineMarks({ registry, labelSprites: new Map() });
  marks.update(M.offlineMarks([{ kind: 'device', id: 'd1', reason: 'unavailable' }]));
  dev.position.x = 4;
  marks.refresh();
  near(marks.sprite('d1').position.x, 4);
});
