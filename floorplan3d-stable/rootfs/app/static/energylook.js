/* The look of the tab "⚡ Rechnung" (5.6.0, the owner: "dass du den Stromrechner besser machst … visuell besser aufbereitest, dass man das
 * besser versteht … dass der besser aussieht und man ihn einfacher bedienen kann"): the parts of the window in their order, each with its
 * symbol and colour (those of the power picture, energyflowui.js), what it is read from now (chosen, from the plan, missing …: a coloured
 * dot in the bar at the top and a label on its card) and its value now. Pure (unit test: tests/energylook.test.mjs); energyui.js draws it. */
import { fmtWatts } from './powerlogic.js';
import { IDLE } from './energycalc.js';

/** the parts of the window in their order: key, symbol, colour (grid, solar, battery and house as in the power picture) */
export const PARTS = [
  { key: 'grid', icon: '⚡', color: '#488fc2' },
  { key: 'solar', icon: '☀️', color: '#ff9800' },
  { key: 'battery', icon: '🔋', color: '#f06292' },
  { key: 'house', icon: '🏠', color: '#4caf50' },
  { key: 'rooms', icon: '🚪', color: '#9575cd' },
  { key: 'meters', icon: '📈', color: '#26a69a' },
];
export const PART_KEYS = PARTS.map((p) => p.key);
export const partOf = (key) => PARTS.find((p) => p.key === key) || null;

/** what a line of the calculation (balanceRows, its label key) belongs to: the part its card sets, null for the extras at the end */
const ROW_PART = { 'energy.r.prod': 'solar', 'energy.r.draw': 'grid', 'energy.r.feedIn': 'grid', 'energy.r.charge': 'battery', 'energy.r.discharge': 'battery',
  'energy.r.batOff': 'battery', 'energy.r.calc': 'house', 'energy.r.measured': 'house', 'energy.r.rest': 'rooms', room: 'rooms' };
export const rowPart = (key) => ROW_PART[key] || null;

/**
 * The state of every part for the bar at the top and the head of its card: { grid, solar, battery, house, rooms, meters: { state, tone, now } }.
 * state (the key of its label, energy.st.<state>): set (a sensor chosen here), plan (from the power devices in the plan), none (missing:
 * the grid is needed), off (no solar / no battery: fine), noValue (chosen or found, but it gives no number), calc / own (the house: calculated
 * or its own sensor), rooms (n of all rooms have a sensor), metersOwn / metersHa (the meters of the page ⚡ Energie: own ones or those of the
 * energy dashboard). tone: ok | plan | warn | off (the colour of the dot). now: { w, dir } the watts now (dir for grid and battery: 1 drawn /
 * charging, -1 fed in / discharging, 0 idle) or null; rooms: { n, of }.
 * bal: energyBalance; roomCount: the rooms of the plan the tab sets; ownMeters: the tab has meters of its own (energyhistory.js hasMeters).
 */
export function partStates(bal, roomCount = 0, ownMeters = false) {
  const src = bal.sources, out = {};
  const from = (f, value, need) => {
    if (!f) return { state: need ? 'none' : 'off', tone: need ? 'warn' : 'off' };
    if (value === null) return { state: 'noValue', tone: 'warn' };
    return { state: f, tone: f === 'set' ? 'ok' : 'plan' };
  };
  const dir = (w) => (w === null ? null : Math.abs(w) < IDLE ? 0 : Math.sign(w));
  out.grid = { ...from(src.grid.from, bal.grid, true), now: bal.grid === null ? null : { w: bal.grid, dir: dir(bal.grid) } };
  out.solar = { ...from(src.solar.from, bal.prod, false), now: bal.prod === null ? null : { w: bal.prod, dir: null } };
  const flow = bal.battery?.flow ?? null, bDir = bal.battery?.dir ?? dir(flow);
  out.battery = { ...from(src.battery.from || src.battery.levelFrom, bal.battery, false), now: bal.battery ? { w: flow, dir: bDir, level: bal.battery.v } : null };
  out.house = src.house ? { ...(bal.measured === null ? { state: 'noValue', tone: 'warn' } : { state: 'own', tone: 'ok' }) }
    : { state: 'calc', tone: bal.calc === null ? 'off' : 'plan' };
  out.house.now = bal.load === null ? null : { w: bal.load, dir: null };
  const n = bal.rooms.length;
  out.rooms = { state: 'rooms', tone: n ? 'ok' : 'off', now: bal.roomsSum === null ? null : { w: bal.roomsSum, dir: null }, n, of: roomCount };
  out.meters = { state: ownMeters ? 'metersOwn' : 'metersHa', tone: ownMeters ? 'ok' : 'plan', now: null };
  return out;
}

/** the value of a part now as a text: "614 W" with its direction for the grid ("614 W Bezug") and the battery ("82 % · lädt 600 W"); '' without */
export function nowText(key, now, t) {
  if (!now) return '';
  const w = now.w === null || now.w === undefined ? '' : fmtWatts(now.w);
  if (key === 'grid') return now.dir ? `${w} ${t(now.dir > 0 ? 'energy.means.draw' : 'energy.means.feedIn')}` : w;
  if (key === 'battery') {
    const lvl = now.level == null ? '' : `${Math.round(now.level)} %`;
    const move = now.dir ? `${t(now.dir > 0 ? 'energy.means.charge' : 'energy.means.discharge')}${w ? ` ${w}` : ''}` : now.dir === 0 ? t('energy.st.idle') : '';
    return [lvl, move].filter(Boolean).join(' · ');
  }
  return w;
}
