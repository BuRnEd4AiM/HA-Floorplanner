// Unit tests for livebatch.js: the live mode merges the models of every floor, and a model hidden, shown or moved after the merge is taken
// out again (#138) (run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const dir = process.env.STATIC_DIR || '/tmp/static';
const { initLiveBatch, poseOf } = await import(`${dir}/livebatch.js`);

const model = (x = 0) => ({ visible: true, parent: 'floor', position: { x, y: 0, z: 0 }, quaternion: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } });
function setup() {
  let live = true;
  const calls = [], undone = [];
  const lb = initLiveBatch({
    isLive: () => live,
    batch: (g, models) => { calls.push([g, models.slice()]); return models.length ? { meshes: [1], parts: models } : null; },
    unbatch: (b) => undone.push(b),
  });
  return { lb, calls, undone, setLive: (v) => { live = v; } };
}

test('live: every floor is merged with its models; the editor: nothing merged', () => {
  const { lb, calls, undone, setLive } = setup();
  const a = model(), b = model(1), c = model(2);
  lb.add('g0', [a, b]); lb.add('g1', [c]);
  lb.apply();
  assert.deepEqual(calls.map(([g, m]) => [g, m.length]), [['g0', 2], ['g1', 1]]);
  assert.equal(lb.parts(), 3);
  assert.equal(lb.meshes(), 2);
  setLive(false); lb.apply();
  assert.equal(undone.length, 2);
  assert.equal(lb.parts(), 0);
  assert.equal(lb.check(), false, 'nothing is watched in the editor');
});

test('a model hidden, shown again or moved after the merge stays out, the rest is merged anew', () => {
  const { lb, calls } = setup();
  const sofa = model(), person = model(1), car = model(2);
  lb.add('g', [sofa, person, car]);
  lb.apply();
  assert.equal(lb.check(), false, 'nothing changed: nothing to do');
  person.visible = false;                                         // the person leaves
  assert.equal(lb.check(), true);
  assert.deepEqual(calls.at(-1)[1], [sofa, car]);
  assert.ok(lb.restless(person));
  person.visible = true;                                          // back home: still drawn by itself
  assert.equal(lb.check(), false);
  car.position.x = 7;                                             // the car moves
  assert.equal(lb.check(), true);
  assert.deepEqual(calls.at(-1)[1], [sofa]);
  car.quaternion.w = 0.9; assert.equal(lb.check(), false, 'the car is not watched any more');
});

test('a new house forgets everything; undo puts every piece back until the next apply', () => {
  const { lb, calls, undone } = setup();
  const sofa = model();
  lb.add('g', [sofa]); lb.apply();
  sofa.position.y = 1; lb.check();
  lb.reset();
  assert.equal(lb.parts(), 0);
  assert.equal(lb.restless(sofa), false);
  lb.add('g', [sofa]); lb.apply();
  assert.deepEqual(calls.at(-1)[1], [sofa]);
  const n = undone.length; lb.undo();
  assert.equal(undone.length, n + 1);
  assert.equal(lb.parts(), 0);
  assert.equal(poseOf(sofa).length, 12);
});
