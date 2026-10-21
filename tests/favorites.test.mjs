// Unit tests for favorites.js (the favourites in front of the room tiles, #471; run like offline.test.mjs, see there)
import test from 'node:test';
import assert from 'node:assert/strict';

const F = await import(`${process.env.STATIC_DIR || '/tmp/static'}/favorites.js`);

test('only what one tap can switch or start can be a favourite (never a lock or an alarm panel)', () => {
  ['light.a', 'switch.b', 'input_boolean.c', 'fan.d', 'cover.e', 'media_player.f', 'scene.kino', 'script.gute_nacht', 'button.klingel', 'input_button.x']
    .forEach((id) => assert.ok(F.canFavorite(id), id));
  ['lock.tuer', 'alarm_control_panel.haus', 'climate.wz', 'sensor.t', 'binary_sensor.x', 'Light.A', 'light', 'light.a b', '', null, 42]
    .forEach((id) => assert.equal(F.canFavorite(id), false, String(id)));
});

test('the stored list made safe: known kinds, each once, at most MAX_FAVORITES', () => {
  assert.deepEqual(F.cleanFavorites(['scene.kino', 'lock.tuer', 'scene.kino', 'light.a', 7]), ['scene.kino', 'light.a']);
  assert.deepEqual(F.cleanFavorites('x'), []);
  assert.equal(F.cleanFavorites(Array.from({ length: 30 }, (_, i) => `light.l${i}`)).length, F.MAX_FAVORITES);
});

test('☆ adds at the end, ★ takes out; a full list stays; ↑ ↓ move within it', () => {
  assert.deepEqual(F.toggleFavorite([], 'scene.kino'), ['scene.kino']);
  assert.deepEqual(F.toggleFavorite(['scene.kino', 'light.a'], 'light.b'), ['scene.kino', 'light.a', 'light.b']);
  assert.deepEqual(F.toggleFavorite(['scene.kino', 'light.a'], 'scene.kino'), ['light.a']);
  assert.deepEqual(F.toggleFavorite(['light.a'], 'lock.tuer'), ['light.a']);
  const full = Array.from({ length: F.MAX_FAVORITES }, (_, i) => `light.l${i}`);
  assert.deepEqual(F.toggleFavorite(full, 'light.new'), full);
  assert.ok(F.isFavorite(['light.a'], 'light.a')); assert.equal(F.isFavorite(null, 'light.a'), false);
  assert.deepEqual(F.moveFavorite(['a.a', 'light.b', 'light.c'].slice(1).concat('scene.d'), 'scene.d', -1), ['light.b', 'scene.d', 'light.c']);
  assert.deepEqual(F.moveFavorite(['light.b', 'light.c'], 'light.b', -1), ['light.b', 'light.c']);   // already first
  assert.deepEqual(F.moveFavorite(['light.b', 'light.c'], 'light.b', 5), ['light.c', 'light.b']);
  assert.deepEqual(F.moveFavorite(['light.b'], 'light.x', 1), ['light.b']);
});

test('a button: a lamp toggles and is lit with its colour, a scene starts, an unknown one is "off"', () => {
  assert.deepEqual(F.favTile('light.a', { state: 'on', rgb: [255, 0, 0] }, 'Decke'), { id: 'light.a', icon: '💡', name: 'Decke', svc: 'toggle', starts: false, on: true, rgb: [255, 0, 0], off: false });
  const sc = F.favTile('scene.kino', { state: '2026-10-21T20:00:00' }, '');
  assert.equal(sc.svc, 'turn_on'); assert.equal(sc.starts, true); assert.equal(sc.on, false); assert.equal(sc.name, 'scene.kino'); assert.equal(sc.icon, '🎬');
  assert.equal(F.favTile('button.klingel', { state: 'unknown' }).svc, 'press');
  assert.equal(F.favTile('cover.rollo', { state: 'open' }).on, true);
  assert.equal(F.favTile('media_player.tv', { state: 'playing' }).on, true);
  assert.equal(F.favTile('switch.x', { state: 'off' }).on, false);
  assert.equal(F.favTile('switch.x', { state: 'unavailable' }).off, true);
  assert.equal(F.favTile('switch.x', undefined).off, true);
  assert.equal(F.favTile('switch.x', { state: 'on', rgb: [1, 2, 3] }).rgb, null);          // only a lamp has a colour
});

test('shown: only those Home Assistant knows, none before the states are loaded', () => {
  const states = { 'light.a': { state: 'on' }, 'scene.kino': { state: 'x' } };
  assert.deepEqual(F.shownFavorites(['scene.kino', 'light.gone', 'light.a'], states), ['scene.kino', 'light.a']);
  assert.deepEqual(F.shownFavorites(['light.a'], states, false), []);
});

test('the text under a favourite: started, on / off with the brightness, open / closed, ▶ / ⏸, offline', () => {
  const t = (k) => k;
  const v = (id, s) => F.favValue(F.favTile(id, s), s, t);
  assert.equal(v('scene.kino', { state: 'x' }), 'live.activate');
  assert.equal(v('light.a', { state: 'on', brightness: 69.6 }), 'live.on · 70 %');
  assert.equal(v('switch.a', { state: 'on', brightness: 50 }), 'live.on');
  assert.equal(v('light.a', { state: 'off' }), 'live.off');
  assert.equal(v('cover.r', { state: 'opening' }), 'state.open');
  assert.equal(v('cover.r', { state: 'closed' }), 'state.closed');
  assert.equal(v('media_player.tv', { state: 'paused' }), '⏸');
  assert.equal(v('media_player.tv', { state: 'idle' }), 'idle');
  assert.equal(v('light.a', { state: 'unavailable' }), 'off.unavailable');
});
