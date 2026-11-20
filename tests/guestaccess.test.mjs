// Unit tests for guestaccess.js (👥 Gäste-Zugang; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const G = await import(`${process.env.STATIC_DIR || '/tmp/static'}/guestaccess.js`);

test('the address: the add-on\'s panel in Home Assistant, without query and hash', () => {
  assert.equal(G.guestUrl({ origin: 'https://ha.example:8123', pathname: '/hassio/ingress/a1b2_floorplan3d' }, { origin: 'x', pathname: '/y' }),
    'https://ha.example:8123/hassio/ingress/a1b2_floorplan3d');
  assert.equal(G.guestUrl(null, { origin: 'https://demo.example', pathname: '/beta/' }), 'https://demo.example/beta/');
});

test('the "bis" time: form <-> settings, the quick buttons, over or not, in words', () => {
  const iso = G.untilFromInput('2026-11-23T12:00');
  assert.match(iso, /^2026-11-23T12:00[+-]\d{2}:\d{2}$/);
  assert.equal(G.inputFromUntil(iso), '2026-11-23T12:00');
  assert.equal(G.untilFromInput(''), ''); assert.equal(G.inputFromUntil('junk'), '');
  assert.equal(G.untilIn(3, new Date(2026, 10, 20, 9, 30)), '2026-11-23T12:00');
  assert.ok(G.isOver(iso, new Date(2026, 10, 24))); assert.ok(!G.isOver(iso, new Date(2026, 10, 21))); assert.ok(!G.isOver('', new Date()));
  assert.match(G.untilText(iso, 'de'), /23\.11\./);
});

test('the QR code: the three finder squares, a quiet zone, longer text a bigger code, UTF-8 text', () => {
  const q = G.qrModules('https://ha.example:8123/hassio/ingress/a1b2_floorplan3d');
  assert.ok(q.n >= 25 && (q.n - 17) % 4 === 0);
  for (const [r, c] of [[0, 0], [0, q.n - 7], [q.n - 7, 0]]) {             // each finder: dark ring, light ring, dark 3×3 middle
    assert.ok(q.dark(r, c) && q.dark(r + 6, c + 6) && !q.dark(r + 1, c + 1) && q.dark(r + 3, c + 3));
  }
  assert.ok(G.qrModules('x'.repeat(200)).n > q.n);
  const svg = G.qrSvg('Gästezimmer');
  assert.match(svg, /^<svg[^>]+viewBox="0 0 29 29"/);                         // 21 modules + 4 + 4
  assert.ok(svg.includes('<path d="M4 4h1v1h-1z'));
});
