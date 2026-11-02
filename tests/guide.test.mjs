// Unit tests for guide.js (🎬 the window of the video guide; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const G = await import(`${process.env.STATIC_DIR || '/tmp/static'}/guide.js`);

test('German for German, English for every other language', () => {
  assert.equal(G.guideLang('de'), 'de');
  assert.equal(G.guideLang('de-AT'), 'de');
  for (const l of ['en', 'fr', 'zh', '', undefined]) assert.equal(G.guideLang(l), 'en');
});

test('the window shows the saved copy, otherwise the page on the internet', () => {
  assert.equal(G.guideSrc({ local: true }, 'de'), 'guide/?embed=1&lang=de');
  assert.equal(G.guideSrc({ local: false }, 'fr'), `${G.SITE}?embed=1&lang=en`);
  assert.equal(G.guideSrc(null, 'de', { q: 'Licht dimmen', clip: 'light' }), `${G.SITE}?embed=1&lang=de&q=Licht+dimmen#light`);
  assert.ok(G.SITE.startsWith('https://') && G.SITE.endsWith('/guide/'));
});

test('the size of the copy: the small videos of the language plus their pictures', () => {
  const data = { clips: [{ v: { de: { kb: 2000 }, en: { kb: 1800 } } }, { v: { de: { kb: 1000 } } }, { v: {} }] };
  assert.equal(G.sizeMb(data, 'de'), Math.round((2000 + 60 + 1000 + 60) / 1024));
  assert.equal(G.sizeMb(data, 'en'), 2);
  assert.equal(G.sizeMb(null, 'de'), 0);
  assert.equal(G.sizeMb({ clips: [{ v: { de: { kb: 10 } } }] }, 'de'), 1);       // never "0 MB" when there is something
});

test('the line under the title says where the videos come from', () => {
  assert.deepEqual(G.statusOf(null), ['vg.checking', {}]);
  assert.deepEqual(G.statusOf({ state: 'loading', done: 3, total: 90 }), ['vg.loading', { done: 3, total: 90 }]);
  assert.deepEqual(G.statusOf({ state: 'error', error: 'HTTP 404' }), ['vg.error', { msg: 'HTTP 404' }]);
  assert.deepEqual(G.statusOf({ state: 'idle', local: false }, true), ['vg.online', {}]);
  assert.deepEqual(G.statusOf({ state: 'idle', local: false }, false), ['vg.offline', {}]);
  assert.deepEqual(G.statusOf({ state: 'idle', local: false, demo: true }, true), ['vg.demo', {}]);
  const now = Date.UTC(2026, 10, 2), saved = now / 1000 - 3 * 86400;
  const [k, p] = G.statusOf({ state: 'done', local: true, mb: 41.5, saved }, false, now);
  assert.equal(k, 'vg.saved');
  assert.equal(p.mb, 41.5);
  assert.equal(p.old, 0);
  assert.equal(G.statusOf({ local: true, mb: 1, saved: now / 1000 - 90 * 86400 }, true, now)[1].old, 1);   // older than 60 days: shown in orange
});
