/* Light groups (#471): the button "💡 n an" at the top opens a short list: the whole house and the groups of rooms set up in the settings
 * (⚙ → Quick access), each with how many of its lights are on and an "Off" button. The owner's wish: switch off a group on purpose
 * ("Kinder", "Oben") instead of the whole house while somebody is still in a room, and nothing switches off by accident: the first tap
 * on "Off" only asks ("Sure?"), a second one within CONFIRM_MS switches. Pure (unit test: tests/lightgroups.test.mjs); lightgroupsui.js
 * draws the button, the list and the group editor of the settings. */
import { roomEntityIds } from './roomtiles.js';

export const MAX_GROUPS = 12;
export const MAX_NAME = 40;
/** how long the "Sure?" of a first tap on "Off" waits for the second one (ms) */
export const CONFIRM_MS = 3000;
/** the id of the row "whole house" */
export const HOUSE = '*';

const isLight = (id) => typeof id === 'string' && id.startsWith('light.');

/** the stored groups made safe: [{ id, name, rooms: [room id] }], at most MAX_GROUPS, names cut to MAX_NAME, rooms without doubles;
 *  a group without a name is called by `fallback(i)` (i from 1), one without rooms stays (it was just added) */
export function cleanGroups(list, fallback = (i) => `#${i}`) {
  if (!Array.isArray(list)) return [];
  const ids = new Set();
  return list.filter((g) => g && typeof g === 'object').slice(0, MAX_GROUPS).map((g, i) => {
    let id = typeof g.id === 'string' && g.id ? g.id.slice(0, 40) : `g${i + 1}`;
    while (ids.has(id)) id += '_';
    ids.add(id);
    const name = typeof g.name === 'string' && g.name.trim() ? g.name.trim().slice(0, MAX_NAME) : fallback(i + 1);
    const rooms = [...new Set((Array.isArray(g.rooms) ? g.rooms : []).filter((r) => typeof r === 'string' && r))].slice(0, 200);
    return { id, name, rooms };
  });
}

/** the lights of a room: the light entities placed in it (also LED ring sections and LED zones, entityDevices) and those of its area */
export function roomLights(room, placed, areaEntities = []) {
  return [...roomEntityIds(room, placed, areaEntities)].filter(isLight);
}

/**
 * The rows of the list: the whole house first, then every group with at least one of its rooms in this plan, in their order.
 * row: { id (HOUSE or the group's id), name ('' for the house: the caller names it), lights (entity ids), on (those on now), rooms (how
 * many of its rooms are in the plan), occupied (somebody is in one of its rooms) }.
 * env: { floors (of the plan), groups (cleanGroups), placed(f) (entityDevices of a floor), areaEntities(room), isOn(entity),
 * occupied(room, f) (optional) }. The whole house: every light placed on any floor, in a room or not (the garden), and those of the
 * rooms' areas.
 */
export function lightRows(env) {
  const { floors = [], groups = [] } = env, isOn = env.isOn || (() => false);
  const where = new Map(), house = new Set();                                  // room id -> { room, f }
  floors.forEach((f) => {
    const placed = env.placed(f);
    placed.forEach((d) => { if (isLight(d.entity)) house.add(d.entity); });
    (f.rooms || []).forEach((r) => {
      where.set(r.id, { room: r, f, lights: roomLights(r, placed, env.areaEntities?.(r) || []) });
      where.get(r.id).lights.forEach((e) => house.add(e));
    });
  });
  const row = (id, name, lights, rooms) => {
    const list = [...new Set(lights)];
    return { id, name, lights: list, on: list.filter((e) => isOn(e)), rooms: rooms.length,
      occupied: !!env.occupied && rooms.some((w) => env.occupied(w.room, w.f)) };
  };
  const all = [...where.values()];
  const out = [row(HOUSE, '', [...house], all)];
  groups.forEach((g) => {
    const rooms = g.rooms.map((id) => where.get(id)).filter(Boolean);
    if (rooms.length) out.push(row(g.id, g.name, rooms.flatMap((w) => w.lights), rooms));
  });
  return out;
}

/** how many lights of the whole house are on (the number on the button) */
export const lightsOn = (rows) => rows.find((r) => r.id === HOUSE)?.on.length || 0;

/**
 * A tap on "Off" of row `id` at time `now` (ms): the first tap arms it (the button asks "Sure?"), a second tap on the same row within
 * `ms` switches off. armed: { id, at } of the tap before, or null. -> { fire (switch off now), armed (what waits for a second tap) }
 */
export function confirmTap(armed, id, now, ms = CONFIRM_MS) {
  if (armed && armed.id === id && now - armed.at >= 0 && now - armed.at <= ms) return { fire: true, armed: null };
  return { fire: false, armed: { id, at: now } };
}

/** the rooms the group editor offers: [{ floor (its name), rooms: [{ id, name }] }] for every floor with rooms, rooms by name;
 *  unnamed (t) when a room has none */
export function roomChoices(floors, unnamed = '?') {
  return (floors || []).map((f, i) => ({
    floor: f.name || `#${i + 1}`,
    rooms: (f.rooms || []).map((r) => ({ id: r.id, name: r.name || unnamed })).sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((x) => x.rooms.length);
}

/** a new group's id that none of `groups` has */
export function newGroupId(groups, rnd = Math.random) {
  const have = new Set((groups || []).map((g) => g.id));
  let id = `g${Math.floor(rnd() * 1e9).toString(36)}`;
  while (have.has(id)) id += '_';
  return id;
}
