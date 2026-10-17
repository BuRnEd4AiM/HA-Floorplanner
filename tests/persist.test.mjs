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
test('redo brings back what was undone; a new change empties it (#404)', () => {
  let layout = { n: 1 };
  const p = P.initPersist({ t: (k) => k, layout: () => layout, url: () => 'x', autosaveSeconds: () => 1, setStatus: () => {} });
  assert.equal(p.canUndo(), false); assert.equal(p.canRedo(), false);
  p.snapshot(); layout = { n: 2 };
  p.snapshot(); layout = { n: 3 };
  layout = p.popUndo(); assert.deepEqual(layout, { n: 2 });
  layout = p.popUndo(); assert.deepEqual(layout, { n: 1 });
  assert.equal(p.canUndo(), false); assert.equal(p.canRedo(), true);
  layout = p.popRedo(); assert.deepEqual(layout, { n: 2 });
  layout = p.popRedo(); assert.deepEqual(layout, { n: 3 });
  assert.equal(p.popRedo(), null);
  layout = p.popUndo(); assert.deepEqual(layout, { n: 2 });
  p.snapshot(); layout = { n: 9 };                                    // a new change after the undo
  assert.equal(p.canRedo(), false);
  assert.deepEqual(p.popUndo(), { n: 2 });
  p.snapshot(); p.popUndo(); p.clearUndo();
  assert.equal(p.canUndo(), false); assert.equal(p.canRedo(), false);
});
test('renamed entities rewrite the redo list too', () => {
  let layout = { n: 1 };
  const p = P.initPersist({ t: (k) => k, layout: () => layout, url: () => 'x', autosaveSeconds: () => 1, setStatus: () => {} });
  p.snapshot(); layout = { n: 2 }; layout = p.popUndo();
  p.mapUndo((s) => s.replace('"n":', '"m":'));
  assert.deepEqual(p.popRedo(), { m: 2 });
});
test('a save carries the version tag; 409 means another screen saved meanwhile (#403)', () => {
  assert.deepEqual(P.saveHeaders('"abc"'), { 'Content-Type': 'application/json', 'If-Match': '"abc"' });
  assert.deepEqual(P.saveHeaders(null), { 'Content-Type': 'application/json' });
  assert.equal(P.saveOutcome(200), 'ok');
  assert.equal(P.saveOutcome(409), 'conflict');
  assert.equal(P.saveOutcome(500), 'failed');
  assert.equal(P.saveOutcome(403), 'failed');
  assert.equal(P.renamedRev('"a"', ['"a"', '"b"']), '"b"');            // the add-on rewrote the plan this screen loaded
  assert.equal(P.renamedRev('"x"', ['"a"', '"b"']), '"x"');            // saved elsewhere before: the old tag stays (a conflict is right then)
  assert.equal(P.renamedRev('"a"', undefined), '"a"');
  assert.equal(P.renamedRev(null, ['"a"', '"b"']), null);
});

/** a fake add-on: one stored plan with a version tag, answering GET and PUT like server.py */
function fakeServer(start) {
  const s = { plan: JSON.stringify(start), rev: 1, puts: [] };
  s.fetch = async (url, init = {}) => {
    const headers = new Map([['ETag', `"${s.rev}"`]]);
    const res = (status, body) => ({ status, ok: status < 300, headers: { get: (k) => headers.get(k) ?? null }, json: async () => body });
    if (!init.method) return res(200, JSON.parse(s.plan));
    s.puts.push(init.headers['If-Match'] ?? null);
    if (init.headers['If-Match'] && init.headers['If-Match'] !== `"${s.rev}"`) return res(409, { conflict: true });
    s.plan = init.body; s.rev++; headers.set('ETag', `"${s.rev}"`);
    return res(200, { ok: true });
  };
  return s;
}
const quiet = (over) => ({ t: (k) => k, url: () => 'api/layout', autosaveSeconds: () => 1, setStatus: () => {}, ...over });

test('two screens: the second save of an older plan asks, "reload" takes the other screen\'s plan (#403)', async () => {
  const srv = fakeServer({ n: 0 });
  globalThis.fetch = srv.fetch;
  let a, b, asked = 0, reopened = null;
  const pa = P.initPersist(quiet({ layout: () => a }));
  const pb = P.initPersist(quiet({ layout: () => b, conflict: async () => { asked++; return 'reload'; }, reopen: (l) => { reopened = l; b = l; } }));
  a = await pa.load(); b = await pb.load();
  a = { n: 'A' }; await pa.save();                                     // screen A saves first
  assert.equal(srv.plan, '{"n":"A"}');
  pb.snapshot(); b = { n: 'B' }; await pb.save();                      // screen B still has the old tag: asked, not saved
  assert.equal(asked, 1);
  assert.equal(srv.plan, '{"n":"A"}');
  assert.deepEqual(reopened, { n: 'A' });                              // B now shows A's plan
  assert.equal(pb.canUndo(), false);                                   // its old undo steps belong to the plan it dropped
  b = { n: 'B2' }; await pb.save();                                    // and saves on top of it with the new tag
  assert.equal(srv.plan, '{"n":"B2"}');
  assert.equal(pb.rev(), `"${srv.rev}"`);
});
test('"keep" saves this screen\'s plan over the other one; one save at a time, never a false alarm (#403)', async () => {
  const srv = fakeServer({ n: 0 });
  globalThis.fetch = srv.fetch;
  let a, b, asked = 0;
  const pa = P.initPersist(quiet({ layout: () => a, conflict: async () => { asked++; return 'keep'; } }));
  const pb = P.initPersist(quiet({ layout: () => b }));
  a = await pa.load(); b = await pb.load();
  b = { n: 'B' }; await pb.save();
  a = { n: 'A' }; await pa.save();
  assert.equal(asked, 1);
  assert.equal(srv.plan, '{"n":"A"}');
  assert.deepEqual(srv.puts.slice(-2), ['"1"', null]);                 // the second try goes without a tag
  asked = 0;
  a = { n: 'A2' };
  await Promise.all([pa.save(), pa.save(), pa.save()]);               // e.g. the save button while the autosave runs
  assert.equal(asked, 0);
  assert.equal(srv.plan, '{"n":"A2"}');
});
test('an older add-on (or the demo) without tags: saves as before, without a tag', async () => {
  const sent = [];
  globalThis.fetch = async (url, init = {}) => {
    if (init.method) sent.push(init.headers['If-Match'] ?? null);
    return { status: 200, ok: true, headers: { get: () => null }, json: async () => (init.method ? { ok: true } : { n: 1 }) };
  };
  let l;
  const p = P.initPersist(quiet({ layout: () => l, conflict: async () => { throw new Error('never asked'); } }));
  l = await p.load(); l = { n: 2 };
  await p.save(); await p.save();
  assert.equal(p.rev(), null);
  assert.deepEqual(sent, [null, null]);
});
