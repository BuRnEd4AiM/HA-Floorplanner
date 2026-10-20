/* Room tiles (#421): what a room's card in live mode shows: its temperature, how many lights are on (and their colour), open windows and
 * whether somebody is there. Also the average reading of a room (temperature, humidity, CO₂) that the room colours of the views "Temp." /
 * "Feuchte" / "CO₂" use (`roomReading`, moved here out of roomHeat in app.js). And what the labels over the rooms in the 3D view show and
 * when they show (#430). Pure (unit test: tests/roomtiles.test.mjs); roomtilesui.js draws the strip, roomlabels.js the labels. */
import { pointInPoly } from './rooms.js';
import { roomOpenings } from './roompanel.js';
import { occupied } from './nav.js';

/**
 * The average reading of a room: ids (entity ids in the room), states, mode temp | humid | co2. Temperature and humidity also from the
 * current values of thermostats (climate.…); °F is turned into °C. null without a value.
 */
export function roomReading(ids, states, mode) {
  const vals = [];
  ids.forEach((id) => {
    const s = states[id];
    if (!s) return;
    const num = parseFloat(s.state);
    if (id.startsWith('climate.')) {
      const v = mode === 'temp' ? s.ct : mode === 'humid' ? s.ch : null;
      if (typeof v === 'number') vals.push(v);
    } else if (!isNaN(num) && id.startsWith('sensor.')) {
      if (mode === 'temp' && (s.unit === '°C' || s.unit === '°F' || s.dc === 'temperature')) vals.push(s.unit === '°F' ? (num - 32) * 5 / 9 : num);
      else if (mode === 'humid' && s.unit === '%' && (s.dc === 'humidity' || /feucht|humid/i.test(id))) vals.push(num);
      else if (mode === 'co2' && (s.dc === 'carbon_dioxide' || (s.unit === 'ppm' && /co2/i.test(id)))) vals.push(num);
    }
  });
  return vals.length ? vals.reduce((x, y) => x + y) / vals.length : null;
}

/** the entities of a room: those of the devices placed in it (placed: [{ entity, x, z }], see entityDevices) and those of its area */
export function roomEntityIds(room, placed, areaEntities = []) {
  const ids = new Set(placed.filter((d) => d.entity && pointInPoly(d.x, d.z, room.points)).map((d) => d.entity));
  if (room.area) areaEntities.forEach((id) => ids.add(id));
  return ids;
}

const PRESENCE_DC = new Set(['occupancy', 'presence', 'motion']);

/**
 * What the tile of a room shows: { temp (°C or null), lights (how many lights are on), rgb (the colour of the first one, or null), open
 * (how many of its windows are open), occupied }.
 * ctx: placed (entityDevices of the floor), areaEntities (the entities of the room's area), states, isOn(entity), isOpen(entity),
 * openingEntities(opening)
 */
export function roomSummary(room, f, ctx) {
  const ids = roomEntityIds(room, ctx.placed, ctx.areaEntities);
  const lit = [...ids].filter((id) => id.startsWith('light.') && ctx.isOn(id));
  const rgbOf = lit.map((id) => ctx.states[id]?.rgb).find((c) => Array.isArray(c) && c.length === 3) || null;
  const open = roomOpenings(room, f).filter((o) => o.type === 'window' && ctx.openingEntities(o).some((e) => ctx.isOpen(e))).length;
  const someone = occupied(room, f, ctx.isOn, pointInPoly)
    || [...ids].some((id) => id.startsWith('binary_sensor.') && PRESENCE_DC.has(ctx.states[id]?.dc) && ctx.states[id]?.state === 'on')
    || [...ids].some((id) => /^binary_sensor\..*(praesenz|presence|bewegung|motion|occupancy)/.test(id) && ctx.states[id]?.state === 'on');
  return { temp: roomReading(ids, ctx.states, 'temp'), lights: lit.length, rgb: rgbOf, open, occupied: someone };
}

/** the texts of a tile: { temp: '21,4°' ('–' without one), lights: '💡 2 an' / '💡 aus', open: '🪟 offen' or '' }; num(v): v with one
 *  decimal in the language of the screen; imperial: °F */
export function tileTexts(s, t, num, imperial = false) {
  const temp = s.temp === null ? '–' : `${num(imperial ? s.temp * 9 / 5 + 32 : s.temp)}°`;
  return {
    temp,
    lights: `💡 ${s.lights ? t('tile.on', { n: s.lights }) : t('tile.off')}`,
    open: s.open ? `🪟 ${t('tile.open')}` : '',
  };
}

/** the texts of a label over a room in 3D (#430), short: { temp: '21,4°' or '' without one, lights: '💡 2' or '' (none on), open: '🪟' or '' } */
export function labelTexts(s, num, imperial = false) {
  return {
    temp: s.temp === null ? '' : `${num(imperial ? s.temp * 9 / 5 + 32 : s.temp)}°`,
    lights: s.lights ? `💡 ${s.lights}` : '',
    open: s.open ? '🪟' : '',
  };
}

/** a tap on "Im Bild: Raum-Schilder" or "Raum-Kacheln" in the View menu: in live mode it switches them on or off; in edit mode, where
 *  neither shows, it switches them on and goes live, so the tap shows what it says (the demo starts in edit mode: nothing happened there).
 *  -> { on: the setting, live: go to live mode } */
export const liveToggle = ({ on, live }) => (live ? { on: !on, live: false } : { on: true, live: true });

/** is the room view on ("Im Bild: Raum-Schilder"): the devices' balls and value labels are off? on (setting), live mode, `wide`: room for
 *  it (not the dashboard card or a room tablet; phones too since #444), no room opened (its card says it all) and the 3D view shown; the
 *  whole house too (#464) */
export const roomView = ({ on, live, wide, focused, view3d }) => !!(on && live && wide && !focused && view3d);

/** do the labels over the rooms show? In the room view on one floor. Not in the whole house: the labels would pile up there; the picture
 *  shows nothing then, only the floor cards beside the house (#464, the owner's choice; before, the devices showed and the switch seemed
 *  to do nothing) */
export const labelsShown = (s) => roomView(s) && !s.house;

/** how high over its floor the label of a room floats (m): over most furniture, low enough to stay over its room when the camera looks
 *  down at an angle */
export const labelHeight = (wallHeight) => Math.min(1.2, 0.47 * (wallHeight || 2.6));

/** how much a room's label matters when labels lie on each other (#436): lights on, somebody there, a window open, a temperature */
export const labelRank = (s) => (s.lights ? 8 : 0) + (s.occupied ? 4 : 0) + (s.open ? 2 : 0) + (s.temp !== null && s.temp !== undefined ? 1 : 0);

/**
 * Room labels that would lie on each other, tidied (3.99.1, #436): the ones that matter more (labelRank; then the nearer = lower on the
 * screen) keep their place. One that covers a label placed before it moves up just clear of it, a short line leading down to its room, but
 * at most `rows` rows; if it still covers one it shrinks to a small dot over its room (a tap opens the room as before) instead of a tower
 * of labels on long lines. items: [{ x (middle), y (where the line ends, over the room), w, h, rank, mini (a dot the frame before: it needs
 * a little more room to grow again, so it does not flicker while the view turns) }] in screen pixels; stem: the line under a label;
 * gap: room between two labels. Returns [{ up (pixels), mini }] in the order given
 */
export function tidyLabels(items, { stem = 8, gap = 4, rows = 1 } = {}) {
  const order = items.map((_, i) => i).sort((a, b) => (items[b].rank || 0) - (items[a].rank || 0) || items[b].y - items[a].y || items[a].x - items[b].x);
  const out = items.map(() => ({ up: 0, mini: false })), boxes = [];
  const box = (it, up) => ({ l: it.x - it.w / 2, r: it.x + it.w / 2, b: it.y - stem - up, t: it.y - stem - up - it.h });
  const hit = (q, o, g) => q.l < o.r + g && o.l < q.r + g && q.t < o.b + g && o.t < q.b + g;
  for (const i of order) {
    const it = items[i], g = it.mini ? gap + 6 : gap, most = rows * (it.h + gap);
    let up = 0, q = box(it, 0), over = boxes.filter((o) => hit(q, o, g));
    for (let guard = 0; over.length && up <= most && guard < 20; guard++) {
      up = it.y - stem - (Math.min(...over.map((o) => o.t)) - g);            // its foot just over the highest label in the way
      q = box(it, up); over = boxes.filter((o) => hit(q, o, g));
    }
    if (over.length || up > most) { out[i].mini = true; continue; }        // the dots are small: they keep no room free
    out[i].up = Math.max(0, Math.round(up)); boxes.push(q);
  }
  return out;
}

/** a strip that scrolls sideways (the room tiles when they do not fit, 3.99.2): is there more to see on the left / on the right?
 *  { left, right } from its scroll position and sizes (pixels; 2 px slack for rounding) */
export function stripEnds(scrollLeft, scrollWidth, clientWidth) {
  const max = scrollWidth - clientWidth;
  return { left: max > 2 && scrollLeft > 2, right: max > 2 && scrollLeft < max - 2 };
}
