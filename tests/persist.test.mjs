// Unit tests for persist.js (changes, undo, saving; split step 22 part 2 of #137; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const P = await import(`${process.env.STATIC_DIR || '/tmp/static'}/persist.js`);

test('the undo list keeps the newest states up to the limit, oldest dropped first', () => {
  const s = [];
  for (let i = 0; i < 5; i++) P.pushUndo(s, `{"n":${i}}`, 3);
  assert.deepEqual(s, ['{"n":2}', '{"n":3}', '{"n":4}']);
  assert.equal(P.UNDO_LIMIT, 60);
});
test('snapshot / undo give back the plan as it was, then nothing', () => {
  let layout = { floors: [{ id: 'a' }] };
  const p = P.initPersist({ t: (k) => k, layout: () => layout, url: () => 'x', autosaveSeconds: () => 1, setStatus: () => {} });
  p.snapshot();
  layout = { floors: [] };
  assert.deepEqual(p.popUndo(), { floors: [{ id: 'a' }] });
  assert.equal(p.popUndo(), null);
  p.snapshot(); p.clearUndo();
  assert.equal(p.popUndo(), null);
  assert.equal(p.touched(), false);
});
test('the undo list can be rewritten (entities renamed in Home Assistant)', () => {
  let layout = { n: 1 };
  const p = P.initPersist({ t: (k) => k, layout: () => layout, url: () => 'x', autosaveSeconds: () => 1, setStatus: () => {} });
  p.snapshot(); layout = { n: 2 }; p.snapshot();
  p.mapUndo((s) => s.replace('"n":', '"m":'));
  assert.deepEqual(p.popUndo(), { m: 2 });
  assert.deepEqual(p.popUndo(), { m: 1 });
});
