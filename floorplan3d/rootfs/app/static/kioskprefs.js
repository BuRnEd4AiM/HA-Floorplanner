/* Wall tablet settings beyond on / off (5.12.0, the owner: "mehr Einstellungen für Tablets … nicht nur ein und aus"): which screen saver
 * (the house turning at a speed, the floors one after another, a big clock, black) and when it starts, how dark the night is and after how
 * long, a clock in the dark, a motion sensor that wakes the screen, a reload every night, the 🧽 cleaning button, and for a tablet with
 * Fully Kiosk its real brightness. Every value is set for all screens (⚙ → 📱 Wandtablet); a tablet can have its own (⚙ → 👥 Benutzer &
 * Tablets → ⚙ of its user, the setting "userKiosk"), kioskFor lays them over the general ones. Pure (unit test: tests/kioskprefs.test.mjs);
 * kiosk.js and kioskui.js use it, server.py checks the same values (clean_kiosk). */

export const SAVERS = ['off', 'orbit', 'floors', 'clock', 'black'];
/** how fast the house turns (OrbitControls.autoRotateSpeed; 0.6 was the only speed before 5.12.0) */
export const SPEEDS = { slow: 0.25, mid: 0.6, fast: 1.5 };
export const FLOOR_SECONDS = 12;            // the screen saver "floors": each floor this long
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const WAKE = /^(binary_sensor|input_boolean)\.[a-z0-9_]{1,200}$/;
const BRIGHT = /^number\.[a-z0-9_]{1,200}$/;
const SCREEN = /^(switch|light)\.[a-z0-9_]{1,200}$/;
const num = (lo, hi) => (v) => (typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? v : undefined);
const oneOf = (...xs) => (v) => (xs.includes(v) ? v : undefined);
const re = (r) => (v) => (typeof v === 'string' && r.test(v) ? v : undefined);
const bool = (v) => (typeof v === 'boolean' ? v : undefined);

/** what a tablet may set for itself, each with its check (a value that fails it is dropped: the general setting counts then). The last
 *  five are only per tablet: the entities of its Fully Kiosk app and how bright it is by day and at night */
export const KIOSK_FIELDS = {
  idleReturn: num(0, 240), saver: oneOf(...SAVERS), saverSpeed: oneOf(...Object.keys(SPEEDS)), saverAfter: num(0, 240),
  nightDim: oneOf('off', 'sun', 'time'), nightFrom: re(TIME), nightTo: re(TIME), nightLevel: num(10, 95), nightAfter: num(1, 60), nightClock: bool,
  wakeSensor: re(WAKE), reloadAt: (v) => (v === '' || (typeof v === 'string' && TIME.test(v)) ? v : undefined), cleanBtn: bool, cleanSecs: num(10, 300),
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

/** the screen saver of the settings: "saver", or for settings saved before 5.12.0 the old tick "idleOrbit" (the house turns) */
export const saverMode = (s) => (SAVERS.includes(s?.saver) ? s.saver : s?.idleOrbit ? 'orbit' : 'off');

/** what counts on this screen: the general settings with this tablet's own values over them (own: from api/me) */
export function kioskFor(settings, own) {
  const s = settings || {}, o = cleanKiosk(own);
  const pick = (k, d) => (k in o ? o[k] : KIOSK_FIELDS[k](s[k]) ?? d);
  return {
    idleReturn: pick('idleReturn', 0), saver: o.saver || saverMode(s), saverSpeed: pick('saverSpeed', 'mid'), saverAfter: pick('saverAfter', 0),
    nightDim: pick('nightDim', 'off'), nightFrom: pick('nightFrom', '22:00'), nightTo: pick('nightTo', '06:00'), nightLevel: pick('nightLevel', 72),
    nightAfter: pick('nightAfter', 1), nightClock: pick('nightClock', false), wakeSensor: pick('wakeSensor', ''), reloadAt: pick('reloadAt', ''),
    cleanBtn: pick('cleanBtn', true), cleanSecs: pick('cleanSecs', 30),
    fullyBright: o.fullyBright || '', fullyScreen: o.fullyScreen || '', brightDay: o.brightDay ?? 80, brightNight: o.brightNight ?? 10, screenOff: !!o.screenOff,
  };
}

/** minutes without a touch (or movement) until the screen saver starts: its own time, else when the start view comes back; 0 = never */
export const saverWait = (p) => (p.saver === 'off' ? 0 : p.saverAfter || p.idleReturn || 0);

/** a motion or presence sensor that says somebody is there (it wakes the screen and holds off the screen saver and the dimming) */
export const someoneThere = (state) => state === 'on';

/** what the Fully Kiosk app of this tablet should do: 'day' (bright), 'night' (dim) or 'off' (screen off while the screen saver runs, when
 *  that is wanted and a screen switch is set); null when the tablet has no Fully entities */
export function screenWant(p, { saverShown, dimShown }) {
  if (!p.fullyBright && !p.fullyScreen) return null;
  if (p.screenOff && p.fullyScreen && saverShown) return 'off';
  return dimShown ? 'night' : 'day';
}

/** reload the page now? at "HH:MM" every day, when the page was loaded before the last time it came, no longer than 6 hours ago, and
 *  nobody touched the screen for 2 minutes (a wall tablet gets slow after days; nobody loses what they are doing) */
export function reloadDue({ at, loadedAt, now, touchMs }) {
  if (typeof at !== 'string' || !TIME.test(at)) return false;
  const [h, m] = at.split(':').map(Number), d = new Date(now);
  const today = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m).getTime();
  const last = today <= now ? today : new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1, h, m).getTime();
  return loadedAt < last && now - last < 6 * 3600000 && touchMs > 120000;
}

/** the floors the screen saver "floors" shows one after another: every floor that is not a roof, the lowest first */
export function saverFloors(floors) {
  return (floors || []).map((f, i) => (f?.kind === 'roof' ? -1 : i)).filter((i) => i >= 0);
}
/** the next floor of that tour after `cur` (the first one when cur is not in it) */
export function nextSaverFloor(list, cur) {
  if (!list.length) return null;
  const i = list.indexOf(cur);
  return list[(i + 1) % list.length];
}
