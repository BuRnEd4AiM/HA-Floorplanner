/* A wall tablet's own values (5.13.0, the owner: "Je Tablet eigene Werte" and "Echte Helligkeit (Fully)"): besides the screen saver, the
 * dimming and "keep the screen on" of the presets (viewprefs.js, 5.12.0), a tablet can have its own minutes, speed, how dark, clocks, motion
 * sensor (each tablet hangs in another room), nightly reload, 🧽 cleaning button, and the entities of its Fully Kiosk app with how bright
 * it is by day and at night. Set in ⚙ → 👥 Benutzer & Tablets → ⚙ of the tablet's user (fold "📱 Wandtablet: mehr eigene Werte"), kept
 * in the setting "userKiosk" (and in users.json); api/me hands the tablet its own, kioskFor lays them over the general ones.
 * Pure (unit test: tests/kioskprefs.test.mjs); server.py checks the same values (tablets.py). */

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const WAKE = /^(binary_sensor|input_boolean|switch|person|device_tracker|media_player)\.[a-z0-9_]{1,200}$/;   // as ⚙ → Wandtablet (server.py)
const BRIGHT = /^number\.[a-z0-9_]{1,200}$/;
const SCREEN = /^(switch|light)\.[a-z0-9_]{1,200}$/;
const num = (lo, hi) => (v) => (typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? v : undefined);
const oneOf = (...xs) => (v) => (xs.includes(v) ? v : undefined);
const re = (r) => (v) => (typeof v === 'string' && r.test(v) ? v : undefined);
const bool = (v) => (typeof v === 'boolean' ? v : undefined);

/** what a tablet may set for itself, each with its check (a value that fails it is dropped: the general setting counts then). The names
 *  are those of the general settings; the last five are only per tablet (Fully Kiosk) */
export const KIOSK_FIELDS = {
  saverAfter: num(1, 240), saverSpeed: oneOf('slow', 'normal', 'fast'), saverClock: bool,
  dimAfter: num(1, 240), dimLevel: num(0.2, 0.95), dimClock: bool, wakeEntity: re(WAKE),
  reloadAt: (v) => (v === '' || (typeof v === 'string' && TIME.test(v)) ? v : undefined), cleanBtn: bool, cleanSecs: num(10, 300),
  fullyBright: re(BRIGHT), fullyScreen: re(SCREEN), brightDay: num(1, 100), brightNight: num(0, 100), screenOff: bool,
};
export const KIOSK_KEYS = Object.keys(KIOSK_FIELDS);

/** one tablet's own values: only known keys with a good value; {} for junk */
export function cleanKiosk(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return {};
  const out = {};
  KIOSK_KEYS.forEach((k) => { const v = KIOSK_FIELDS[k](entry[k]); if (v !== undefined) out[k] = v; });
  return out;
}
/** { user: own values }: at most 50 users, users without a value left out */
export function cleanUserKiosk(map) {
  if (!map || typeof map !== 'object' || Array.isArray(map)) return {};
  const out = {};
  Object.entries(map).slice(0, 50).forEach(([u, e]) => { const user = String(u).trim().slice(0, 80), c = cleanKiosk(e); if (user && Object.keys(c).length) out[user] = c; });
  return out;
}
/** the rows of the users dialog [{ user, kiosk }] -> { user: own values } */
export function collectUserKiosk(rows) {
  return cleanUserKiosk(Object.fromEntries((rows || []).filter((r) => (r.user || '').trim()).map((r) => [r.user.trim(), r.kiosk])));
}

/** the settings as this tablet sees them: the general ones (with its preset) and its own values over them (own: from api/me); the same
 *  object when it has none */
export function kioskFor(settings, own) {
  const o = cleanKiosk(own);
  return Object.keys(o).length ? { ...settings, ...o } : settings;
}

/** what the Fully Kiosk app of this tablet should do: 'day' (bright), 'night' (dimmed) or 'off' (its screen off while the screen saver runs,
 *  when that is wanted and a screen switch is set); null when the tablet has no Fully Kiosk entities */
export function screenWant(p, { saver, dim }) {
  if (!p?.fullyBright && !p?.fullyScreen) return null;
  if (p.screenOff && p.fullyScreen && saver) return 'off';
  return dim ? 'night' : 'day';
}
