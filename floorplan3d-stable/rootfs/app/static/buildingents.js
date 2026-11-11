/* Which building an entity belongs to (#677, the owner: "oben einstellen, welches Gebäude man gerade anschaut, dass man dann auch
 * wirklich nur in den Dashboards die Entitäten sieht, die dem Gebäude zugeordnet sind"). With a building chosen at the top (#409) every
 * page leaves out what belongs to another building of the plan: 🌡 Klima "Ohne Raum", 📷 Kameras, 🎵 Musik & TV, 🧺 Haushalt, ▶ Abläufe,
 * 📜 Protokoll, the scene bar, own cards; and an own page given to a building shows only with it. An entity belongs to a building when a
 * device of the plan with it stands there, a window or door with it is in a wall there, or it is in the area of Home Assistant of a room
 * there (room.area). What belongs to no building (the garden, the plot, the weather, people, the car …) always shows; so does what
 * belongs to the building shown as well (a device on the plot is in every building's view).
 *
 * Since 5.5.0 (the owner, 2026-11-11: "selbst wenn ich oben Gebäude 1 auswähle, werden mir Geräte und Automatisierungen von Gebäude 2
 * angezeigt, auch in allen Dashboards") the rest of Home Assistant follows too:
 * - a whole area of Home Assistant belongs to a building (areaOwners): the one somebody chose for it (layout.areaBuildings, the panel
 *   "🏘 Gebäude in diesem Plan"), else the one its devices in the plan stand in, else the one with a room called like it. So the lamp
 *   that is not in the plan, the sensors of a device in the plan and an area without a room in the plan (the cellar) follow.
 * - an automation, a script, a scene or a group that is in no building itself belongs where the devices it uses are (membersOf, also the
 *   areas it names as `area:<id>`): it shows with the building of one of them, and always when none of them is in a building.
 * Pure (no DOM, no three.js; unit test: tests/buildingents.test.mjs). */

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

/** an area chosen for every building (layout.areaBuildings): its devices show whatever building is chosen */
export const ALL = 'all';
/** the name an area of Home Assistant goes by among the entities: what an automation names with `area_id` */
export const areaKey = (id) => `area:${id}`;
const sameName = (a, b) => typeof a === 'string' && typeof b === 'string' && !!a.trim() && a.trim().toLowerCase() === b.trim().toLowerCase();
/** every entity of an area of Home Assistant, also the ones kept off the dashboards (diagnostic, hidden: "side") */
export const areaEntities = (a) => [...(a?.entities || []), ...(a?.side || [])].filter((e) => typeof e === 'string' && e);

/**
 * The building every area of Home Assistant belongs to: Map(area id -> { b, how }). b: a building id, ALL (every building) or null (none
 * known: its entities count one by one). how: 'fixed' (chosen in the panel), 'devices' (its devices in the plan stand in one building, or
 * a room there is linked to it), 'name' (a room of one building is called like it), 'mixed' (its devices stand in several buildings),
 * 'none'. sets: buildingSets (what the plan says); areas: [{ id, name, entities, side }]; fixed: layout.areaBuildings ({ area id:
 * building id | ALL }); rooms: [{ name, b }] (the rooms with their building, roomOwners)
 */
export function areaOwners(sets, areas, fixed = {}, rooms = []) {
  const out = new Map(), ids = [...(sets?.keys() || [])];
  (Array.isArray(areas) ? areas : []).forEach((a) => {
    if (!a || typeof a.id !== 'string') return;
    const f = fixed?.[a.id];
    if (f === ALL || (typeof f === 'string' && sets.has(f))) { out.set(a.id, { b: f, how: 'fixed' }); return; }
    const votes = new Set();
    areaEntities(a).forEach((e) => {
      const here = ids.filter((b) => sets.get(b).has(e));
      if (here.length === 1) votes.add(here[0]);                  // in every building's view: the plot, no vote
    });
    if (votes.size === 1) { out.set(a.id, { b: [...votes][0], how: 'devices' }); return; }
    if (votes.size > 1) { out.set(a.id, { b: null, how: 'mixed' }); return; }
    const named = new Set((rooms || []).filter((r) => r.b && sets.has(r.b) && sameName(r.name, a.name)).map((r) => r.b));
    out.set(a.id, named.size === 1 ? { b: [...named][0], how: 'name' } : { b: null, how: 'none' });
  });
  return out;
}

/** the entities of every building with the areas of Home Assistant that belong to it (owners: areaOwners): a new Map(building id -> Set);
 *  an area itself is in it as areaKey(id) */
export function withAreas(sets, areas, owners) {
  const out = new Map([...(sets || [])].map(([b, s]) => [b, new Set(s)]));
  (Array.isArray(areas) ? areas : []).forEach((a) => {
    const o = owners?.get(a?.id);
    if (!o?.b) return;
    (o.b === ALL ? [...out.values()] : [out.get(o.b)]).forEach((s) => { s?.add(areaKey(a.id)); areaEntities(a).forEach((e) => s?.add(e)); });
  });
  return out;
}

const DEPTH = 3;       // an automation starts a script that plays a scene of lamps
/**
 * The buildings an entity belongs to: a Set of building ids, empty for none (the weather, a person). What the plan and the areas say
 * (sets) comes first; what is in no building itself and uses other things (a light group of Home Assistant, a scene, an automation, a
 * script: membersOf(entity) -> [entity | areaKey]) belongs where they are. Given a list instead of an entity, the list is such a group
 * (the devices of a card, of a routine).
 */
export function entityBuildings(sets, e, membersOf = () => []) {
  const ids = [...(sets?.keys() || [])], seen = new Set();
  const group = (list, depth, out) => {
    (Array.isArray(list) ? list : []).forEach((x) => {
      if (typeof x !== 'string' || !x || seen.has(x)) return;
      seen.add(x);
      const here = ids.filter((b) => sets.get(b).has(x));
      if (here.length) here.forEach((b) => out.add(b));
      else if (depth < DEPTH) group(membersOf(x), depth + 1, out);
    });
    return out;
  };
  return group(Array.isArray(e) ? e : [e], 0, new Set());
}

/**
 * Does an entity (or a list of them: a group) show while building `shown` is chosen: (entity | [entities]) -> boolean. Everything shows
 * with no building chosen (all of them) or an unknown one; else what belongs to it (entityBuildings), or to no building at all. So a
 * scene or an automation shows with the building of one of its devices, not when they are all in other buildings, and always when none
 * of them is in a building (the weather, the sun).
 */
export function buildingFilter(sets, shown, membersOf = () => []) {
  if (!shown || !sets?.has(shown)) return () => true;
  return (e) => {
    if (!e) return true;
    const b = entityBuildings(sets, e, membersOf);
    return !b.size || b.has(shown);
  };
}

/**
 * The filter of a screen, worked out again when the plan, the areas or the building shown change (and every few seconds while somebody
 * edits): { shows(entity | [entities]), owners(), autoOwners(), sets(), reset() }. ctx: layout(), shown() (the building chosen at the top, null: all), areas() (Home
 * Assistant's: [{ id, name, entities, side }]), ids() (the plan's building ids), view(id) (buildings.viewOf), devices(floor),
 * openings(floor), area(room), members(entity), rooms() ([{ name, b }], for an area called like a room), now() (ms)
 */
export function makeBuildingFilter(ctx) {
  let memo = { key: '' }, own = { layout: undefined };
  /** what the plan and Home Assistant's areas say, whatever building is shown: { sets, owners } */
  function data() {
    const key = Math.floor((ctx.now?.() ?? Date.now()) / 4000), layout = ctx.layout(), areas = ctx.areas?.();
    if (own.key !== key || own.layout !== layout || own.areas !== areas) {
      const base = buildingSets(ctx.ids(), ctx.view, ctx), rooms = ctx.rooms?.() || [], owners = areaOwners(base, areas, layout?.areaBuildings, rooms);
      own = { key, layout, areas, owners, base, rooms, sets: withAreas(base, areas, owners) };
    }
    return own;
  }
  function shows(e) {
    const shown = ctx.shown();
    if (!shown) return true;
    const d = data();
    if (memo.data !== d || memo.shown !== shown) memo = { data: d, shown, fn: buildingFilter(d.sets, shown, ctx.members) };
    return memo.fn(e);
  }
  return { shows, owners: () => data().owners, sets: () => data().sets,
    /** the building every area would take by itself (nothing chosen for it): areaOwners without layout.areaBuildings */
    autoOwners: () => { const d = data(); return areaOwners(d.base, d.areas, {}, d.rooms); },
    /** the plan was changed just now: work it out again at the next question */
    reset: () => { own = { layout: undefined }; } };
}

/** does an own card show (shows: buildingFilter): one with devices when one of them is in the building shown or none of them is in a
 *  building; a card of a room only in its building; one without devices (text, built-in, calendar …) always. ents: its entities
 *  (cards.cardEntities), roomShows(room id): the room is in the building shown */
export function cardShows(card, ents, shows, roomShows = () => true) {
  if (card?.type === 'room' && card.room) return roomShows(card.room);
  const list = (ents || []).filter((e) => typeof e === 'string' && e);
  return !list.length || shows(list) !== false;
}

/** the choices of layout.areaBuildings made safe: { area id: building id | ALL } for the areas and buildings there are */
export function cleanAreaBuildings(v, buildingIds, areaIds = null) {
  const out = {};
  Object.entries(v && typeof v === 'object' && !Array.isArray(v) ? v : {}).forEach(([a, b]) => {
    if ((b === ALL || buildingIds.includes(b)) && (!areaIds || areaIds.includes(a))) out[a] = b;
  });
  return out;
}

/** does an own page show: one given to a building (page.building) only with it or with all of them shown */
export const pageShows = (page, shown) => !page?.building || !shown || page.building === shown;

/** a page's building made safe: an id of the plan's buildings, else '' (for all of them) */
export const cleanPageBuilding = (v) => (typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v) ? v : '');
