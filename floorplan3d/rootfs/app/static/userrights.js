/* What a user / tablet may switch, per kind of device (5.13.0, the owner's choice: "Schalten je Geräteart" and "Stufen statt Haken"):
 * ✋ only look, 💡 only on / off, 🎚 everything (brightness, colour, temperature, volume …). Set in ⚙ → 👥 Benutzer & Tablets → ⚙ of a
 * user, kept in the setting "userRights" (and in users.json); the add-on refuses the same (tablets.py, api/service). The lock "Geräte
 * schalten" (userlocks.js) still takes all of it away. Pure (unit test: tests/userrights.test.mjs). */

/** the kinds in the order of the dialog: key, icon, how many levels (2: ✋ or 🎚 only, on / off is all a gate or a scene does) */
export const RIGHT_KINDS = [['light', '💡', 3], ['cover', '🪟', 3], ['climate', '🌡️', 3], ['media', '🎵', 3], ['switch', '🔌', 3], ['gate', '🚪', 2], ['scene', '🎬', 2]];
export const LEVELS = ['view', 'onoff', 'all'];
const GATES = new Set(['garage', 'gate', 'door']);
const KIND_OF = {
  light: 'light', lock: 'gate', climate: 'climate', water_heater: 'climate', humidifier: 'climate', media_player: 'media', remote: 'media',
  scene: 'scene', script: 'scene', switch: 'switch', input_boolean: 'switch', fan: 'switch', valve: 'switch', vacuum: 'switch', button: 'switch',
  input_button: 'switch', select: 'switch', input_select: 'switch',
};
/** what "only on / off" lets through: switching, opening and closing, play and pause, a button, a thermostat's mode */
const ONOFF = new Set(['turn_on', 'turn_off', 'toggle', 'open_cover', 'close_cover', 'stop_cover', 'lock', 'unlock', 'open_valve', 'close_valve', 'media_play',
  'media_pause', 'media_play_pause', 'media_stop', 'press', 'start', 'pause', 'stop', 'return_to_base', 'set_hvac_mode']);

/** the kind of an entity's domain (dc: its device class; a garage door, gate or door is a gate, not a cover); null: not one of them */
export function rightKind(domain, dc) {
  if (domain === 'cover') return GATES.has(dc) ? 'gate' : 'cover';
  return KIND_OF[domain] || null;
}
/** the level of a kind for a user's rights ({ kind: level }); 'all' when nothing is set */
export const levelOf = (rights, kind) => (kind && LEVELS.includes(rights?.[kind]) ? rights[kind] : 'all');

/** may this call go through? data: what it carries besides the entity (brightness, position …); "only on / off" lets no value through, a
 *  thermostat's mode only with its mode */
export function rightAllows(rights, domain, service, data, dc) {
  const level = levelOf(rights, rightKind(domain, dc));
  if (level === 'all') return true;
  if (level === 'view' || !ONOFF.has(service)) return false;
  const keys = Object.keys(data || {}).filter((k) => k !== 'entity_id');
  return service === 'set_hvac_mode' ? keys.every((k) => k === 'hvac_mode') : keys.length === 0;
}

/** one user's rights: only known kinds, only what is less than all; a kind with two levels has no "on / off" */
export function cleanRights(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return {};
  const out = {};
  RIGHT_KINDS.forEach(([k, , n]) => { if (r[k] === 'view' || (r[k] === 'onoff' && n === 3)) out[k] = r[k]; });
  return out;
}
/** { user: rights }: at most 50 users, users with all rights left out */
export function cleanUserRights(map) {
  if (!map || typeof map !== 'object' || Array.isArray(map)) return {};
  const out = {};
  Object.entries(map).slice(0, 50).forEach(([u, r]) => { const user = String(u).trim().slice(0, 80), c = cleanRights(r); if (user && Object.keys(c).length) out[user] = c; });
  return out;
}
/** the rows of the users dialog [{ user, rights }] -> { user: rights } */
export function collectUserRights(rows) {
  return cleanUserRights(Object.fromEntries((rows || []).filter((r) => (r.user || '').trim()).map((r) => [r.user.trim(), r.rights])));
}
/** the CSS that hides what such a user cannot use anyway: the brightness and colours of the lights when they are not "everything" */
export function rightsCss(rights) {
  return levelOf(rights, 'light') !== 'all' ? '.lightctl { display: none !important; }' : '';
}
