/* Favourites (#471): the devices and scenes used most as buttons at the start of the strip at the bottom of the live mode, in front of the
 * room tiles. One tap switches a lamp, a switch, a fan, a roller shutter or a player, or starts a scene, a script or a button; nothing
 * else (a lock or an alarm panel is never one tap away). Set with ☆ on a device's card in live mode or in ⚙ → "Quick access". Stored
 * for everybody in the settings (`favorites`: entity ids in their order, server.py clean_favorites). Pure (unit test:
 * tests/favorites.test.mjs); favoritesui.js draws. */

export const MAX_FAVORITES = 16;
/** what a tap on a favourite does, by domain (the services controls.py lets through) */
export const FAV_SERVICE = {
  light: 'toggle', switch: 'toggle', input_boolean: 'toggle', fan: 'toggle', cover: 'toggle', media_player: 'toggle',
  scene: 'turn_on', script: 'turn_on', button: 'press', input_button: 'press',
};
const ICON = { light: '💡', switch: '⏻', input_boolean: '⏻', fan: '🌀', cover: '🪟', media_player: '🎵', scene: '🎬', script: '▶️', button: '🔘', input_button: '🔘' };
/** a scene, a script or a button is started, it has no "on" to show */
const STARTS = new Set(['scene', 'script', 'button', 'input_button']);
const ON = new Set(['on', 'open', 'opening', 'playing']);
const ID = /^[a-z_]+\.[a-z0-9_]+$/;

const domainOf = (id) => String(id).split('.')[0];
/** can this entity be a favourite? */
export const canFavorite = (id) => typeof id === 'string' && id.length <= 255 && ID.test(id) && !!FAV_SERVICE[domainOf(id)];

/** the stored list made safe: entity ids that can be favourites, each once, at most MAX_FAVORITES */
export function cleanFavorites(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.filter(canFavorite))].slice(0, MAX_FAVORITES);
}
export const isFavorite = (list, id) => Array.isArray(list) && list.includes(id);

/** ☆ / ★: id added at the end or taken out; a full list stays as it is (adding returns it unchanged) */
export function toggleFavorite(list, id) {
  const now = cleanFavorites(list);
  if (now.includes(id)) return now.filter((x) => x !== id);
  if (!canFavorite(id) || now.length >= MAX_FAVORITES) return now;
  return [...now, id];
}

/** ↑ / ↓ in the settings: id moved by `by` places (-1 up, +1 down), kept within the list */
export function moveFavorite(list, id, by) {
  const now = cleanFavorites(list), i = now.indexOf(id);
  if (i < 0) return now;
  const j = Math.max(0, Math.min(now.length - 1, i + by));
  now.splice(i, 1); now.splice(j, 0, id);
  return now;
}

/**
 * What the button of a favourite shows and does: { id, icon, name, svc (the service of a tap), on (lit: a lamp that is on, an open
 * shutter, a player that plays), starts (a scene, a script, a button: started, never "on"), off (Home Assistant does not know it or it
 * is offline) }. s: its state ({ state, rgb }) or undefined; name: its name (the caller's, else the id)
 */
export function favTile(id, s, name) {
  const dom = domainOf(id), starts = STARTS.has(dom);
  const off = !s || s.state === 'unavailable';
  return { id, icon: ICON[dom] || '•', name: name || id, svc: FAV_SERVICE[dom] || null, starts, on: !starts && !off && ON.has(s.state),
    rgb: dom === 'light' && Array.isArray(s?.rgb) && s.rgb.length === 3 ? s.rgb : null, off };
}

/** the short text under a favourite's name: "Aktivieren" for a scene, "An · 70 %" / "Aus" for a lamp, "Offen" / "Geschlossen" for a
 *  shutter, ▶ / ⏸ for a player; t: the texts */
export function favValue(f, s, t) {
  if (f.off) return t('off.unavailable');
  if (f.starts) return t('live.activate');
  const st = s.state, dom = f.id.split('.')[0];
  if (dom === 'cover') return st === 'open' || st === 'opening' ? t('state.open') : st === 'closed' || st === 'closing' ? t('state.closed') : st;
  if (dom === 'media_player' && (st === 'playing' || st === 'paused')) return st === 'playing' ? '▶' : '⏸';
  if (st === 'on') return typeof s.brightness === 'number' && dom === 'light' ? `${t('live.on')} · ${Math.round(s.brightness)} %` : t('live.on');
  if (st === 'off') return t('live.off');
  return st;
}

/** the favourites shown: those Home Assistant knows (states loaded: an unknown one would only be a dead button); none before the states
 *  are loaded */
export const shownFavorites = (list, states, ready = true) => (ready ? cleanFavorites(list).filter((id) => states[id]) : []);
