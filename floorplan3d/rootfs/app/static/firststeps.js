/* 🧭 Erste Schritte (5.25.0, the owner's choice docs/ideen-5.21 picture 2): a guide in four steps from the empty plan to the finished
 * house: 1 draw the plan (or take the example house), 2 link the rooms with Home Assistant's areas, 3 set the areas' devices into their
 * rooms, 4 look at the live view. Each step is worked out from the house itself, so it can be stopped any time and goes on later.
 * The pure rules (unit test: tests/firststeps.test.mjs); firststepsui.js draws the card in the editor. */

export const STEPS = ['draw', 'link', 'place', 'live'];
export const KEY = 'fp3d.firstSteps';          // this browser: 'open' (the card is shown) or 'closed'
export const KEY_LIVE = 'fp3d.firstStepsLive'; // this browser has seen the live view once ('1')

/** the rooms of the house with their floor: [{ fi, room }] (rooms without a name count too: they are drawn) */
const roomsOf = (layout) => (layout?.floors || []).flatMap((f, fi) => (f.rooms || []).map((room) => ({ fi, room })));

/**
 * what is still to place: the rooms linked to an area whose entities (that have a place in a room: placeable(id)) are not in the plan yet.
 * layout, areas [{ id, entities }], placed: Set of entity ids already in the plan -> [{ fi, room, ids }], each entity once
 */
export function toPlace(layout, areas, placed, placeable = () => true) {
  const seen = new Set(placed || []), out = [];
  roomsOf(layout).forEach(({ fi, room }) => {
    if (!room.area) return;
    const ids = ((areas || []).find((a) => a.id === room.area)?.entities || []).filter((id) => !seen.has(id) && placeable(id));
    ids.forEach((id) => seen.add(id));
    if (ids.length) out.push({ fi, room, ids });
  });
  return out;
}

/** the first room without an area: { fi, room } or null */
export const firstUnlinked = (layout) => roomsOf(layout).find((x) => !x.room.area) || null;

/**
 * The state of the four steps. s: { rooms (rooms in the house), linked (rooms with an area), areas (Home Assistant's areas), toLink (rooms
 * called like a free area, linked in one step), unplaced (entities still to place), devices (devices in the plan), liveSeen }.
 * -> { steps: [{ key, state: 'done' | 'now' | 'later' }], now (key of the open step or null), percent (0–100), done (all four) }
 */
export function progress(s) {
  const draw = s.rooms > 0;
  const link = draw && (!s.areas || s.linked >= s.rooms || (s.linked > 0 && !s.toLink));
  const place = link && !s.unplaced && (s.devices > 0 || !s.areas);
  const live = place && !!s.liveSeen;
  const ok = { draw, link, place, live };
  const now = STEPS.find((k) => !ok[k]) || null;
  const steps = STEPS.map((key) => ({ key, state: ok[key] ? 'done' : key === now ? 'now' : 'later' }));
  let part = 0;                                             // how far the open step is (0–1)
  if (now === 'link' && s.rooms) part = Math.min(1, s.linked / s.rooms);
  if (now === 'place' && s.devices + s.unplaced) part = s.devices / (s.devices + s.unplaced);
  const percent = Math.round((STEPS.filter((k) => ok[k]).length + (now && !ok[now] ? part : 0)) * 25);
  return { steps, now, percent: Math.min(100, percent), done: !now };
}
