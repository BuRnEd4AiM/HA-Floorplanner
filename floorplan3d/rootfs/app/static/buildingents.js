/* Which building an entity belongs to (#677, the owner: "oben einstellen, welches Gebäude man gerade anschaut, dass man dann auch
 * wirklich nur in den Dashboards die Entitäten sieht, die dem Gebäude zugeordnet sind"). With a building chosen at the top (#409) every
 * page leaves out what belongs to another building of the plan: 🌡 Klima "Ohne Raum", 📷 Kameras, 🎵 Musik & TV, 🧺 Haushalt, ▶ Abläufe,
 * 📜 Protokoll, the scene bar, own cards; and an own page given to a building shows only with it. An entity belongs to a building when a
 * device of the plan with it stands there, a window or door with it is in a wall there, or it is in the area of Home Assistant of a room
 * there (room.area). What belongs to no building (the garden, the plot, the weather, people, the car …) always shows; so does what
 * belongs to the building shown as well (a device on the plot is in every building's view). Pure (no DOM, no three.js; unit test:
 * tests/buildingents.test.mjs). */

/**
 * The entities of a view of the plan (buildings.viewOf: the floors with only what belongs to one building or to the plot).
 * h: devices(floor) -> entity ids of its devices, openings(floor) -> entity ids of its windows and doors, area(room) -> entity ids of
 * the area of Home Assistant of a room (empty when it has none)
 */
export function entitiesOf(view, h) {
  const out = new Set();
  const add = (list) => (list || []).forEach((e) => { if (typeof e === 'string' && e) out.add(e); });
  (view?.floors || []).forEach((f) => {
    add(h.devices(f));
    add(h.openings(f));
    (f.rooms || []).forEach((r) => add(h.area(r)));
  });
  return out;
}

/** the entities of every building: Map(building id -> Set) for the ids, view(id) the plan as that building sees it */
export function buildingSets(ids, view, h) {
  return new Map((ids || []).map((b) => [b, entitiesOf(view(b), h)]));
}

/**
 * Does an entity show while building `shown` is chosen: (entity) -> boolean. Everything shows with no building chosen (all of them) or
 * an unknown one; else what belongs to it, or to no building at all. A group that is in no building itself (a light group of Home
 * Assistant, a scene) by its members (membersOf(entity) -> [entity]): it shows when one of them does.
 */
export function buildingFilter(sets, shown, membersOf = () => []) {
  if (!shown || !sets?.has(shown)) return () => true;
  const mine = sets.get(shown), other = new Set();
  sets.forEach((s, b) => { if (b !== shown) s.forEach((e) => other.add(e)); });
  const one = (e) => mine.has(e) || !other.has(e);
  return (e) => {
    if (!e || mine.has(e)) return true;
    if (other.has(e)) return false;
    const m = (membersOf(e) || []).filter((x) => typeof x === 'string' && x && x !== e);
    return !m.length || m.some(one);
  };
}

/**
 * The filter of a screen, worked out again when the plan, the areas or the building shown change (and every few seconds while somebody
 * edits): { shows(entity) }. ctx: layout(), shown() (the building chosen at the top, null: all), areas() (only compared), ids() (the
 * plan's building ids), view(id) (buildings.viewOf), devices(floor), openings(floor), area(room), members(entity), now() (ms)
 */
export function makeBuildingFilter(ctx) {
  let memo = { key: '' };
  function shows(e) {
    const shown = ctx.shown();
    if (!shown) return true;
    const key = `${shown}|${Math.floor((ctx.now?.() ?? Date.now()) / 4000)}`, layout = ctx.layout(), areas = ctx.areas?.();
    if (memo.key !== key || memo.layout !== layout || memo.areas !== areas) {
      memo = { key, layout, areas, fn: buildingFilter(buildingSets(ctx.ids(), ctx.view, ctx), shown, ctx.members) };
    }
    return memo.fn(e);
  }
  return { shows };
}

/** does an own card show (shows: buildingFilter): one with devices only when one of them shows; a card of a room only in its building;
 *  one without devices (text, built-in, calendar …) always. ents: its entities (cards.cardEntities), roomShows(room id): the room is in
 *  the building shown */
export function cardShows(card, ents, shows, roomShows = () => true) {
  if (card?.type === 'room' && card.room) return roomShows(card.room);
  const list = (ents || []).filter((e) => typeof e === 'string' && e);
  return !list.length || list.some((e) => shows(e));
}

/** does an own page show: one given to a building (page.building) only with it or with all of them shown */
export const pageShows = (page, shown) => !page?.building || !shown || page.building === shown;

/** a page's building made safe: an id of the plan's buildings, else '' (for all of them) */
export const cleanPageBuilding = (v) => (typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v) ? v : '');
