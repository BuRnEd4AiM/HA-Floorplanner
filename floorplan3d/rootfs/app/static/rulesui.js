/* The add-on's own heating rules and routines on the page (#546): puts together the copy of api/rules every page shares (rulesstore.js),
 * 🔎 Wird benutzt (usedbyui.js), 🌡 Klima → 📋 Heiz-Regeln (heatrulesui.js) and 📅 Heizplan (heatplanui.js), the cards of ▶ Abläufe
 * (routinesown.js), the editor of a routine (flowedit.js) and the scenes of Home Assistant with the scene editor (scenesui.js,
 * sceneedit.js, #549), deleting scenes and automations of Home Assistant with "↶ Wiederherstellen" (hamanage.js, #564) and 🩺 Protokoll
 * (heatdiagui.js, #579). app.js only calls initRulesUi and hands the parts to the pages, the room
 * labels and tiles ("⏸️ pausiert") and the live channel. */
import { initRulesStore } from './rulesstore.js';
import { initUsedBy } from './usedbyui.js';
import { initHeatRulesUi } from './heatrulesui.js';
import { initHeatPlanUi } from './heatplanui.js';
import { initFlowEdit } from './flowedit.js';
import { initRoutinesOwn } from './routinesown.js';
import { initSceneEdit } from './sceneedit.js';
import { initScenesCard } from './scenesui.js';
import { initHaManage } from './hamanage.js';
import { initRoomSensorsUi } from './roomsensorsui.js';
import { initHeatDiagUi } from './heatdiagui.js';
import { initRoomGroups } from './roomgroupsui.js';
import { roomMark, roomKey } from './rules.js';

/** ctx: t, lang(), settings(), states(), entities(), nameOf(entity), canEdit(), locked() (may not switch), callService(entity, service, data),
 *  houseId(), layout() (the building shown), details(entity) (Home Assistant's window: a button or null), tabs() (the tab bar), climate()
 *  (the page 🌡 Klima), routines() (the page ▶ Abläufe), redraw() (the room tiles, labels and the open page), partOf() (the entities of
 *  thermostats' devices, roomtiles.thermostatParts), areas() and areaOf() (Home Assistant's areas, {entity: area id}: ▶ Abläufe by room, #590) */
export function initRulesUi(ctx) {
  const { t } = ctx;
  const deg = (c) => {                                  // a temperature as the house shows it (°F only shown, the rules keep °C)
    const v = ctx.settings().units === 'imperial' ? c * 9 / 5 + 32 : c;
    try { return `${v.toLocaleString(ctx.lang(), { maximumFractionDigits: 1 })}°`; } catch { return `${v}°`; }
  };
  const delta = (c) => {                                // a difference of temperature (°F: only the scale, not the 32)
    const v = ctx.settings().units === 'imperial' ? c * 9 / 5 : c;
    try { return `${v.toLocaleString(ctx.lang(), { maximumFractionDigits: 1 })}°`; } catch { return `${v}°`; }
  };
  const houseId = () => ctx.houseId() || 'main';
  const roomName = (key) => {
    const id = key.split('/')[1];
    for (const f of ctx.layout().floors || []) { const r = (f.rooms || []).find((x) => x.id === id); if (r) return r.name || id; }
    return id;
  };
  const rooms = () => ctx.climate()?.heatRooms() || [];
  const base = { t, lang: ctx.lang, states: ctx.states, nameOf: ctx.nameOf, canEdit: ctx.canEdit };
  const rules = initRulesStore({ changed: () => { sensors.apply(ctx.states()); ctx.redraw(); usedBy.redraw(); } });
  const sensors = initRoomSensorsUi({ ...base, rules, deg, delta, rooms: () => ctx.climate()?.sensorRooms() || [], partOf: () => ctx.partOf?.() || {},   // 🌡 Raumfühler (#573)
    changed: () => ctx.climate()?.update() });
  const flowEdit = initFlowEdit({ ...base, entities: ctx.entities, rules });
  const openRules = () => { ctx.tabs().show('climate'); ctx.climate().show('rules'); };
  const editFlow = (f) => { ctx.tabs().show('routines'); flowEdit.open(f); };
  const openFlow = (id) => { const f = (rules.get()?.flows || []).find((x) => x.id === id); if (f) editFlow(f); else ctx.tabs().show('routines'); };
  const usedBy = initUsedBy({ ...base, locked: ctx.locked, callService: ctx.callService, rules, roomName, deg, openRules, openFlow });
  const diag = initHeatDiagUi({ t, rules, deg, delta, nameOf: ctx.nameOf, layout: ctx.layout, houseId, sensorLog: (x) => sensors.log(x),   // 🩺 (#579)
    changed: () => ctx.climate()?.update() });
  const heat = initHeatRulesUi({ ...base, rules, locked: ctx.locked, houseId, rooms, deg, delta, usedBy, editFlow, sensors, showPlan: () => ctx.climate().show('plan'),
    showDiag: (key) => { diag.room(key); ctx.climate().show('diag'); }, changed: () => ctx.climate()?.update() });
  const plan = initHeatPlanUi({ ...base, rules, houseId, rooms, deg, changed: () => ctx.climate()?.update(), back: () => ctx.climate().show('rules') });
  const manage = initHaManage({ t, changed: () => ctx.routines()?.update() });                                                     // #564
  const groups = initRoomGroups({ t, areas: () => ctx.areas?.() || [], changed: () => ctx.routines()?.update() });                 // by room (#590)
  const areaOf = () => ctx.areaOf?.() || {};
  const sceneEdit = initSceneEdit({ ...base, entities: ctx.entities, locked: ctx.locked, manage, saved: () => ctx.routines()?.update() });   // #549
  const scenes = initScenesCard({ ...base, locked: ctx.locked, callService: ctx.callService, ha: () => rules.get()?.ha === true, edit: (s) => sceneEdit.open(s),
    manage, groups, areaOf, changed: () => ctx.routines()?.update() });
  const own = initRoutinesOwn({ ...base, locked: ctx.locked, callService: ctx.callService, rules, edit: (f) => flowEdit.open(f), openRules, details: ctx.details,
    scenes, manage, groups, areaOf, sensorLog: (x) => sensors.log(x), changed: () => ctx.routines()?.update() });
  rules.load();
  return {
    rules, usedBy, heat, plan, own, flowEdit, sceneEdit, sensors, diag, groups,
    /** the page's states with the temperatures of the sensors in the rooms (🌡 Raumfühler, #573): after every change of the states */
    applySensors: () => sensors.apply(ctx.states()),
    /** the mark of a room's label and tile: "⏸️ pausiert", "🚀 Boost" or '' */
    mark: (roomId) => roomMark(rules.status(roomKey(houseId(), roomId)), t),
    /** what the add-on pushed over the live channel ({type: "rules", rooms, lanes}) */
    pushed: (d) => rules.pushed(d),
  };
}
