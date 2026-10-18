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

/** do the labels over the rooms show? on (setting), live mode, a wide screen (phones have the tiles), one floor (the whole house would
 *  pile them up), no room opened (its card says it all) and the 3D view shown */
export const labelsShown = ({ on, live, wide, house, focused, view3d }) => !!(on && live && wide && !house && !focused && view3d);

/** how high over its floor the label of a room floats (m): over most furniture, low enough to stay over its room when the camera looks
 *  down at an angle */
export const labelHeight = (wallHeight) => Math.min(1.2, 0.47 * (wallHeight || 2.6));

/** labels over the rooms that land on each other on the screen (the camera low, rooms one behind the other) are pushed apart, upwards:
 *  the lowest one (mostly the nearest room) keeps its place, a line still leads down to its room. items: [{ x (middle), y (where the line
 *  ends, over the room), w, h }] in screen pixels; stem: the line under a label that is not pushed; gap: room between two labels.
 *  Returns how far each label goes up (pixels), in the order given */
export function stackLabels(items, stem = 8, gap = 4) {
  const order = items.map((_, i) => i).sort((a, b) => items[b].y - items[a].y || items[a].x - items[b].x);
  const up = items.map(() => 0), placed = [];
  const mid = (i) => items[i].y - stem - items[i].h / 2 - up[i];          // the middle of label i on the screen
  for (const i of order) {
    let moved = true, guard = 0;
    while (moved && guard++ < 20) {                                      // up until it covers no label placed before it
      moved = false;
      for (const j of placed) {
        const a = items[i], b = items[j];
        if (Math.abs(a.x - b.x) < (a.w + b.w) / 2 + gap && Math.abs(mid(i) - mid(j)) < (a.h + b.h) / 2 + gap) {
          up[i] = a.y - stem - a.h / 2 - (mid(j) - (a.h + b.h) / 2 - gap); moved = true;
        }
      }
    }
    placed.push(i);
  }
  return up.map((u) => Math.max(0, Math.round(u)));
}

/** a strip that scrolls sideways (the room tiles when they do not fit, 3.99.2): is there more to see on the left / on the right?
 *  { left, right } from its scroll position and sizes (pixels; 2 px slack for rounding) */
export function stripEnds(scrollLeft, scrollWidth, clientWidth) {
  const max = scrollWidth - clientWidth;
  return { left: max > 2 && scrollLeft > 2, right: max > 2 && scrollLeft < max - 2 };
}
