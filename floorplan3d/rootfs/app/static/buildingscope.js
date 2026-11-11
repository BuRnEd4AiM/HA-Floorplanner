/* The building chosen at the top counts on every page (#677; 5.5.0, the owner, 2026-11-11: "selbst wenn ich oben Gebäude 1 auswähle,
 * werden mir Geräte und Automatisierungen von Gebäude 2 angezeigt"): the screen part of buildingents.js. It puts together what the filter
 * needs (the plan as each building sees it, Home Assistant's areas, what the scenes, groups, automations and scripts use) and gives the
 * pages one question to ask: shows(entity). What an automation or script uses comes from the add-on (api/uses, for every user, asked
 * again every ten minutes); a scene and a light group say it in their state. The rules are in buildingents.js (tested). */
import { makeBuildingFilter, entityBuildings, areaEntities } from './buildingents.js';
import { buildingsOf, viewOf, roomOwners } from './buildings.js';

const AGAIN = 10 * 60 * 1000;
/** what is worth a line in "in no building" of the panel: what the pages list */
const LISTED = /^(light|switch|climate|cover|fan|media_player|camera|vacuum|lock|scene|script|automation|water_heater|humidifier|alarm_control_panel)\./;

/** what every automation and script of Home Assistant uses: { entity: [entity | 'area:<id>'] }; {} without Home Assistant (the demo).
 *  fresh: Home Assistant is asked again (for who may edit; else the add-on keeps the answer five minutes) */
export async function fetchUses(fresh = false) {
  try {
    const r = await fetch(`api/uses${fresh ? '?fresh=1' : ''}`), d = r.ok ? await r.json() : null;
    return d && typeof d.uses === 'object' && d.uses ? d.uses : {};
  } catch { return {}; }
}

/** ctx: layout() (the whole plan), shown() (the building chosen at the top, null: all), areas() (Home Assistant's), states(),
 *  devices(floor) -> [entity], openings(floor) -> [entity], changed() (what uses what was read again: draw the pages) */
export function initBuildingScope(ctx) {
  let uses = {}, at = 0, busy = false;
  async function load(fresh = false) {
    if (busy) return;
    busy = true;
    const next = await fetchUses(fresh), was = JSON.stringify(uses);
    uses = next; at = Date.now(); busy = false;
    if (JSON.stringify(next) !== was) ctx.changed?.();
  }
  const members = (e) => ctx.states()[e]?.members || uses[e] || [];
  const filter = makeBuildingFilter({
    layout: ctx.layout, shown: ctx.shown, areas: ctx.areas, ids: () => buildingsOf(ctx.layout()).map((b) => b.id), view: (b) => viewOf(ctx.layout(), b),
    devices: ctx.devices, openings: ctx.openings, members,
    area: (room) => (room.area ? areaEntities((ctx.areas() || []).find((x) => x.id === room.area)) : []),
    rooms: () => roomOwners(ctx.layout()).flat().map(({ room, b }) => ({ name: room.name, b })),
  });
  /** does an entity (or a group: a list of them) show with the building chosen at the top */
  function shows(e) {
    if (ctx.shown() && at && Date.now() - at > AGAIN) load();     // a new automation: known a little later
    return filter.shows(e);
  }
  /** the entities the pages list that are in no building (they show with every building): [entity], by id */
  function loose() {
    const sets = filter.sets();
    return Object.keys(ctx.states() || {}).filter((e) => LISTED.test(e) && !entityBuildings(sets, e, members).size).sort();
  }
  /** for the panel "🏘 Gebäude in diesem Plan", worked out afresh: { auto: Map(area id -> { b, how }) (what every area takes by itself),
   *  loose: [entity] } */
  function info() {
    filter.reset();
    return { auto: filter.autoOwners(), loose: loose() };
  }
  return { shows, load, info };
}
