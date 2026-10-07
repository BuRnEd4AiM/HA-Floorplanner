// Unit tests for appstate.js (default settings, how a screen starts, units; split step 22 of #137; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const dir = process.env.STATIC_DIR || '/tmp/static';
const A = await import(`${dir}/appstate.js`);
const P = (q) => new URLSearchParams(q);

test('default settings: a fresh copy each time, changing it never changes the defaults', () => {
  const a = A.defaultSettings();
  a.tempStops.push({ v: 99, c: '#000000' }); a.grid = 1;
  const b = A.defaultSettings();
  assert.equal(b.tempStops.length, 5); assert.equal(b.grid, 0.25);
  assert.equal(A.DEFAULT_SETTINGS.belowLabels, true);
});
test('every default setting is one the add-on knows (server.py DEFAULT_SETTINGS), else it would never be saved', () => {
  const server = [path.resolve(dir, '../server.py'), path.resolve('floorplan3d/rootfs/app/server.py')].find((p) => fs.existsSync(p));
  if (!server) return;                                        // the static folder was copied somewhere without the server next to it
  const src = fs.readFileSync(server, 'utf8');
  const known = new Set([...src.slice(src.indexOf('DEFAULT_SETTINGS = {'), src.indexOf('RANGES = {')).matchAll(/^\s*"(\w+)":/gm)].map((m) => m[1]));
  const unknown = Object.keys(A.DEFAULT_SETTINGS).filter((k) => !known.has(k));
  assert.deepEqual(unknown, []);
});
test('how a screen starts: editor, wall tablet, room tablet, read-only user', () => {
  assert.deepEqual(A.startup({ canEdit: true }, P('')), { tabletRoom: null, kiosk: false, readonly: false, live: false });
  assert.deepEqual(A.startup({ canEdit: true }, P('mode=live')), { tabletRoom: null, kiosk: false, readonly: false, live: true });
  assert.deepEqual(A.startup({ canEdit: true }, P('kiosk=1')), { tabletRoom: null, kiosk: true, readonly: false, live: true });
  assert.deepEqual(A.startup({ canEdit: true, room: 'Küche' }, P('')), { tabletRoom: 'Küche', kiosk: true, readonly: false, live: true });
  assert.equal(A.startup({ canEdit: true, room: 'Küche' }, P('room=Bad')).tabletRoom, 'Bad');      // the address wins
  assert.deepEqual(A.startup({ canEdit: false }, P('')), { tabletRoom: null, kiosk: true, readonly: true, live: true });
});
test('lengths in metres or feet', () => {
  assert.equal(A.toDisp(2.5, false), 2.5); assert.equal(A.toDisp(1, true), 3.281);
  assert.ok(Math.abs(A.fromDisp(3.28084, true) - 1) < 1e-9); assert.equal(A.fromDisp(2, false), 2);
  assert.equal(A.fmtLen(2.5, false), '2.50 m'); assert.equal(A.fmtLen(2.5, true), '8.20 ft');
});
