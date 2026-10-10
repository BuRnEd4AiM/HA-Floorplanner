// Unit tests for bootguard.js, a classic script run here in a sandbox with a fake window (run: STATIC_DIR=floorplan3d/rootfs/app/static node --test tests/bootguard.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const SRC = readFileSync(join(process.env.STATIC_DIR || '/tmp/static', 'bootguard.js'), 'utf8');

/** runs bootguard.js against a fake window; returns its error handler and what it did */
function boot({ stored = null, storage = true, language = 'de-DE', files = { 'app.js': 'x', 'plan2d.js': 'y' } } = {}) {
  const did = { fetched: [], reloads: 0, shown: [] };
  let handler = null, saved = stored;
  const el = (tag) => ({ tagName: tag.toUpperCase(), style: {}, children: [], append(...k) { this.children.push(...k); } });
  const w = {
    navigator: { language },
    sessionStorage: storage ? { getItem: () => saved, setItem: (k, v) => { saved = v; } } : { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } },
    location: { reload: () => { did.reloads++; } },
    document: { createElement: el, body: { append: (box) => did.shown.push(box) } },
    fetch: async (url, opt) => {
      did.fetched.push([url, opt.cache]);
      return { json: async () => ({ known: true, staticFiles: files }) };
    },
    addEventListener: (type, fn, capture) => { assert.equal(type, 'error'); assert.equal(capture, true); handler = fn; },
  };
  vm.runInNewContext(SRC, { window: w, Date, Promise, String, Object });
  return { w, did, fire: (e) => handler(e), stored: () => saved };
}
const settle = () => new Promise((r) => setTimeout(r, 0));
const textOf = (box) => box.children.map((c) => c.textContent).join(' | ');

test('an old module before the start: every file is fetched past the cache once, then the page reloads', async () => {
  const b = boot();
  b.fire({ message: "The requested module './modelfx.js' does not provide an export named 'ringLook'" });
  await settle(); await settle(); await settle();
  assert.deepEqual(b.did.fetched[0], ['api/version', 'no-store']);
  const again = b.did.fetched.slice(1);
  assert.ok(again.every(([, c]) => c === 'reload'));
  assert.deepEqual(again.map(([u]) => u).sort(), ['app.js', 'bootguard.js', 'index.html', 'plan2d.js', 'style.css']);   // no file twice
  assert.equal(b.did.reloads, 1);
  assert.equal(b.did.shown.length, 0);
  assert.ok(+b.stored() > 0);
});

test('a module that cannot be fetched counts too', async () => {
  const b = boot();
  b.fire({ target: { tagName: 'SCRIPT', getAttribute: () => 'app.js' } });
  await settle(); await settle(); await settle();
  assert.equal(b.did.reloads, 1);
});

test('still broken right after that reload: a message instead of an empty page, no reload loop', () => {
  const b = boot({ stored: String(Date.now() - 5000) });
  b.fire({ message: 'SyntaxError: import not found: ringLook' });
  assert.equal(b.did.fetched.length, 0);
  assert.equal(b.did.reloads, 0);
  assert.equal(b.did.shown.length, 1);
  assert.match(textOf(b.did.shown[0]), /konnte nicht starten.*Strg\+F5.*import not found/);
});

test('a long time after the last try it tries again', async () => {
  const b = boot({ stored: String(Date.now() - 10 * 60000) });
  b.fire({ message: 'x' });
  await settle(); await settle(); await settle();
  assert.equal(b.did.reloads, 1);
});

test('without session storage it never reloads (it could not stop), it shows the message in English', () => {
  const b = boot({ storage: false, language: 'en-US' });
  b.fire({ message: 'boom' });
  assert.equal(b.did.reloads, 0);
  assert.match(textOf(b.did.shown[0]), /could not start/);
});

test('after the start (app.js loaded) errors are left alone; other failing resources (pictures) too; only once per page', async () => {
  const b = boot();
  b.fire({ target: { tagName: 'IMG' } });
  b.w.fp3dBooted = true;
  b.fire({ message: 'TypeError: something else' });
  await settle();
  assert.equal(b.did.fetched.length + b.did.reloads + b.did.shown.length, 0);
  const c = boot({ stored: String(Date.now()) });
  c.fire({ message: 'a' }); c.fire({ message: 'b' });
  assert.equal(c.did.shown.length, 1);
});
