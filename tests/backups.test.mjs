// Unit tests for backups.js (run: cp floorplan3d/rootfs/app/static/backups.js /tmp/backups.mjs && BACKUPS_MJS=/tmp/backups.mjs node --test tests/backups.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';

const B = await import(process.env.BACKUPS_MJS || '/tmp/backups.mjs');

test('file sizes are shown with a sensible unit', () => {
  assert.equal(B.fmtSize(0), '0 B');
  assert.equal(B.fmtSize(512), '512 B');
  assert.equal(B.fmtSize(1536), '1.5 KB');
  assert.equal(B.fmtSize(25 * 1024), '25 KB');
  assert.equal(B.fmtSize(3 * 1024 * 1024), '3.0 MB');
});
test('garbage sizes do not break the list', () => {
  assert.equal(B.fmtSize(undefined), '0 B');
  assert.equal(B.fmtSize('x'), '0 B');
});
test('the download link says what the two boxes say (recordings, CallMeBot keys)', () => {
  assert.equal(B.exportHref(true, false), 'api/backup?recording=1&secrets=0');
  assert.equal(B.exportHref(false, true), 'api/backup?recording=0&secrets=1');
  assert.equal(B.exportHref(undefined, undefined), 'api/backup?recording=0&secrets=0');
});
