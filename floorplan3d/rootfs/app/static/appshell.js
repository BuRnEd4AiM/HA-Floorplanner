/* 📱 Handy wie eine App (5.22.0, the owner 2026-11-20: "eine bessere ansicht fürs handy das es nicht so selbstgebaut wirkt … mehr nach
 * einer app aussieht … intuitiver"; his choice: pictures docs/ideen-5.21 8, 9, 10 "genau so"): on a phone in the live view the bar at the
 * bottom has five fixed tabs, Start, Räume, 3D-Haus, Energie and Mehr (every other page, the settings, the classic view). Start greets,
 * shows what is going on as chips, a picture of the house and the rooms as tiles; Räume all rooms by floor; a room opens as a page of its
 * own (its card, full size, "‹ Räume"). The pure rules; appui.js draws, tabsui.js puts the bar together. Unit test: tests/appshell.test.mjs. */

export const START = 'start', ROOMS = 'rooms', MORE = 'more', HOUSE = 'house', ENERGY = 'energy';
/** the pages of the app that are not tabs of their own anywhere else */
export const APP_PAGES = [START, ROOMS];
export const PREF_KEY = 'fp.phoneUi';                 // per phone: 'app' (default) or 'classic'
export const PIN_KEY = 'fp.appPins';                  // per phone: { <house id>: ['<floor id>/<room id>', …] } the rooms pinned on Start (5.36.0)
/** how many rooms Start shows at least (more when more are pinned or lit) */
export const START_MIN = 6;
export const MAX_PINS = 30;

/** is the app view on: a phone, the live view, not the dashboard card, not a guest's or a room tablet's screen, not switched to classic */
export const appMode = ({ phone, live, card, guest, roomTablet, pref }) => !!(phone && live && !card && !guest && !roomTablet && pref !== 'classic');

/** the tabs of the app's bar: Start, Räume, 3D-Haus, Energie (when the screen has it), Mehr; tabs: the tabs this screen may show */
export const barItems = (tabs) => [START, ROOMS, HOUSE, ...(tabs.includes(ENERGY) ? [ENERGY] : []), MORE];
/** the tabs under "Mehr": every other tab of the screen, in the order of the bar */
export const moreItems = (tabs) => tabs.filter((k) => ![START, ROOMS, HOUSE, ENERGY].includes(k));
/** which tab of the bar lights up for the open page: a page under "Mehr" lights up "Mehr" */
export const activeItem = (open, tabs) => (barItems(tabs).includes(open) ? open : MORE);

/** "Guten Morgen" … by the hour: morning 5–11, day 11–17, evening 17–22, night */
export const greeting = (hour) => (hour >= 5 && hour < 11 ? 'morning' : hour >= 11 && hour < 17 ? 'day' : hour >= 17 && hour < 22 ? 'evening' : 'night');

/**
 * The rooms as tiles: rooms [{ fi, floor (name), id, key, name, temp, lights, all, rgb, open, occupied }] -> the same, those with a name, sorted: lights on
 * first, then somebody there, then by floor and name. `top`: the first n only (the start page)
 */
export function roomTiles(rooms, top = 0) {
  const list = (rooms || []).filter((r) => r && r.name).slice()
    .sort((a, b) => (b.lights > 0) - (a.lights > 0) || (b.occupied ? 1 : 0) - (a.occupied ? 1 : 0) || a.fi - b.fi || a.name.localeCompare(b.name));
  return top ? list.slice(0, top) : list;
}
/**
 * The rooms on Start (5.36.0, the owner 2026-11-25: "da aktuell nur 6 räume platz haben die räume die an sind priorisiert werden und
 * das man … räume anheften kann das man immer seine räume oben hat"): the pinned ones first, in the order they were pinned; then every
 * room with a light on, never cut off (before, a 7th lit room was simply missing, so a light going on there seemed not to show); then the
 * others (somebody there first) until there are `min` tiles. rooms: [{ key, … }] as roomTiles takes them; pins: [key].
 * -> the rooms, the pinned ones with pin: true
 */
export function startRooms(rooms, pins = [], min = START_MIN) {
  const list = roomTiles(rooms), byKey = new Map(list.map((r) => [r.key, r])), set = new Set(pins || []);
  const pinned = [...set].map((k) => byKey.get(k)).filter(Boolean).map((r) => ({ ...r, pin: true }));
  const rest = list.filter((r) => !set.has(r.key)), lit = rest.filter((r) => r.lights > 0), other = rest.filter((r) => !(r.lights > 0));
  return [...pinned, ...lit, ...other.slice(0, Math.max(0, min - pinned.length - lit.length))];
}
/** pin a room or take its pin away: the new list (a newly pinned room comes last), at most MAX_PINS */
export const togglePin = (pins, key) => ((pins || []).includes(key) ? pins.filter((k) => k !== key) : [...(pins || []), key].slice(-MAX_PINS));
/** the pins of a house from what the phone keeps ({ house: [key] }, made safe: strings, each once, at most MAX_PINS) */
export function pinsOf(stored, house) {
  const l = stored && typeof stored === 'object' && Array.isArray(stored[house || 'main']) ? stored[house || 'main'] : [];
  return [...new Set(l.filter((k) => typeof k === 'string' && k && k.length < 120))].slice(0, MAX_PINS);
}
/** what the phone keeps after the pins of one house changed */
export const withPins = (stored, house, pins) => ({ ...(stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}), [house || 'main']: pins });

/**
 * What the round button of a room's tile offers (5.36.0, the owner: "über die Raumkachel mit dem Knopf, mit dem man alles aus machen kann,
 * auch alles an machen … mit Bestätigung, evtl. auch Szene"): a list from below, a tap on a line is the confirmation.
 * r: { lights (on now), all (lights in the room), pin }; scenes: [{ id, name }] the room's scenes.
 * -> [{ key: 'on' | 'off' | 'scene' | 'pin' | 'open', n, id, name, on }] ("Alle 3 Lichter an" while one is off, "Alle aus" while one is on)
 */
export function roomActions(r, scenes = []) {
  const all = r?.all || 0, lit = Math.min(r?.lights || 0, all || Infinity), out = [];
  if (all > lit) out.push({ key: 'on', n: all });
  if (lit > 0) out.push({ key: 'off', n: lit, all });
  (scenes || []).forEach((s) => out.push({ key: 'scene', id: s.id, name: s.name }));
  out.push({ key: 'pin', on: !!r?.pin }, { key: 'open' });
  return out;
}

/** the rooms by floor for "Räume": [{ fi, floor, rooms }] in the order of the floors, the ground floor first when asked (ground) */
export function byFloor(rooms, ground = 0) {
  const map = new Map();
  (rooms || []).filter((r) => r && r.name).forEach((r) => { if (!map.has(r.fi)) map.set(r.fi, { fi: r.fi, floor: r.floor, rooms: [] }); map.get(r.fi).rooms.push(r); });
  const out = [...map.values()].sort((a, b) => (a.fi === ground ? -1 : b.fi === ground ? 1 : b.fi - a.fi));
  out.forEach((g) => g.rooms.sort((a, b) => a.name.localeCompare(b.name)));
  return out;
}

/** the chips at the top of Start: [{ key, icon, text, tone }]. s: { lightsOn, alarm ('armed' | 'disarmed' | null), offline, low (batteries),
 *  open (windows / doors), check (urgent things of the 🩺 Haus-Check), temp (outside, °C or null), cams (cameras: the page 📷 is there,
 *  5.36.0: on the phone it is under "Mehr" only), motion (cameras and sensors that see movement) }; t: the texts. They wrap into lines
 *  (5.36.0, the owner: "ohne dass man scrollen muss nach links") */
export function statusChips(s, t, num = String) {
  const out = [];
  out.push({ key: 'lights', icon: '💡', text: s.lightsOn ? t('app.lightsOn', { n: s.lightsOn }) : t('app.lightsOff'), tone: s.lightsOn ? 'on' : '' });
  if (s.alarm) out.push({ key: 'alarm', icon: '🛡', text: t(s.alarm === 'armed' ? 'app.armed' : 'app.disarmed'), tone: s.alarm === 'armed' ? 'warn' : 'ok' });
  if (s.open) out.push({ key: 'open', icon: '🪟', text: t('app.open', { n: s.open }), tone: 'warn' });
  if (s.offline) out.push({ key: 'offline', icon: '📴', text: t('app.offline', { n: s.offline }), tone: 'warn' });
  if (s.low) out.push({ key: 'low', icon: '🔋', text: t('app.low', { n: s.low }), tone: 'warn' });
  if (s.check) out.push({ key: 'check', icon: '🩺', text: t('app.check', { n: s.check }), tone: 'warn' });   // 🩺 Haus-Check (5.24.0)
  if (s.cams) out.push({ key: 'cams', icon: '📷', text: s.motion ? t('app.motion', { n: s.motion }) : t('app.cams', { n: s.cams }), tone: s.motion ? 'warn' : '' });
  if (s.temp != null && Number.isFinite(s.temp)) out.push({ key: 'temp', icon: '🌡', text: `${num(s.temp)}°`, tone: '' });
  return out;
}
