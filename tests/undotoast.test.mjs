// Unit tests for undotoast.js (the note "Gelöscht · ↶ Rückgängig" after a deletion, #471; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const U = await import(`${process.env.STATIC_DIR || '/tmp/static'}/undotoast.js`);

test('one thing or several things deleted', () => {
  const t = (k, p) => (p ? `${k}:${p.n}` : k);
  assert.equal(U.deletedText(1, t), 'undo.deleted');
  assert.equal(U.deletedText(3, t), 'undo.deletedN:3');
  assert.ok(U.TOAST_MS >= 4000);                                   // long enough to read it and reach the button
});
