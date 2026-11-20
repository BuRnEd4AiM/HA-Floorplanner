/* 📱 Handy wie eine App (5.22.0, the owner 2026-11-20: "eine bessere ansicht fürs handy das es nicht so selbstgebaut wirkt … mehr nach
 * einer app aussieht … intuitiver"; his choice: pictures docs/ideen-5.21 8, 9, 10 "genau so"): on a phone in the live view the bar at the
 * bottom has five fixed tabs, Start, Räume, 3D-Haus, Energie and Mehr (every other page, the settings, the classic view). Start greets,
 * shows what is going on as chips, a picture of the house and the rooms as tiles; Räume all rooms by floor; a room opens as a page of its
 * own (its card, full size, "‹ Räume"). The pure rules; appui.js draws, tabsui.js puts the bar together. Unit test: tests/appshell.test.mjs. */

export const START = 'start', ROOMS = 'rooms', MORE = 'more', HOUSE = 'house', ENERGY = 'energy';
/** the pages of the app that are not tabs of their own anywhere else */
export const APP_PAGES = [START, ROOMS];
export const PREF_KEY = 'fp.phoneUi';                 // per phone: 'app' (default) or 'classic'

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
 * The rooms as tiles: rooms [{ fi, floor (name), id, name, temp, lights, open, occupied }] -> the same, those with a name, sorted: lights on
 * first, then somebody there, then by floor and name. `top`: the first n only (the start page)
 */
export function roomTiles(rooms, top = 0) {
  const list = (rooms || []).filter((r) => r && r.name).slice()
    .sort((a, b) => (b.lights > 0) - (a.lights > 0) || (b.occupied ? 1 : 0) - (a.occupied ? 1 : 0) || a.fi - b.fi || a.name.localeCompare(b.name));
  return top ? list.slice(0, top) : list;
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
 *  open (windows / doors), temp (outside, °C or null) }; t: the texts */
export function statusChips(s, t, num = String) {
  const out = [];
  out.push({ key: 'lights', icon: '💡', text: s.lightsOn ? t('app.lightsOn', { n: s.lightsOn }) : t('app.lightsOff'), tone: s.lightsOn ? 'on' : '' });
  if (s.alarm) out.push({ key: 'alarm', icon: '🛡', text: t(s.alarm === 'armed' ? 'app.armed' : 'app.disarmed'), tone: s.alarm === 'armed' ? 'warn' : 'ok' });
  if (s.open) out.push({ key: 'open', icon: '🪟', text: t('app.open', { n: s.open }), tone: 'warn' });
  if (s.offline) out.push({ key: 'offline', icon: '📴', text: t('app.offline', { n: s.offline }), tone: 'warn' });
  if (s.low) out.push({ key: 'low', icon: '🔋', text: t('app.low', { n: s.low }), tone: 'warn' });
  if (s.temp != null && Number.isFinite(s.temp)) out.push({ key: 'temp', icon: '🌡', text: `${num(s.temp)}°`, tone: '' });
  return out;
}
