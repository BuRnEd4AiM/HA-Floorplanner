/* The add-on's own heating rules and routines on the page (#546): puts together the copy of api/rules every page shares (rulesstore.js),
 * 🔎 Wird benutzt (usedbyui.js), 🌡 Klima → 📋 Heiz-Regeln (heatrulesui.js) and 📅 Heizplan (heatplanui.js), the cards of ▶ Abläufe
 * (routinesown.js) and the editor of a routine (flowedit.js). app.js only calls initRulesUi and hands the parts to the pages, the room
 * labels and tiles ("⏸️ pausiert") and the live channel. */
import { initRulesStore } from './rulesstore.js';
import { initUsedBy } from './usedbyui.js';
import { initHeatRulesUi } from './heatrulesui.js';
import { initHeatPlanUi } from './heatplanui.js';
import { initFlowEdit } from './flowedit.js';
import { initRoutinesOwn } from './routinesown.js';
import { roomMark, roomKey } from './rules.js';

/** ctx: t, lang(), settings(), states(), entities(), nameOf(entity), canEdit(), locked() (may not switch), callService(entity, service, data),
 *  houseId(), layout() (the building shown), details(entity) (Home Assistant's window: a button or null), tabs() (the tab bar), climate()
 *  (the page 🌡 Klima), routines() (the page ▶ Abläufe), redraw() (the room tiles, labels and the open page) */
export function initRulesUi(ctx) {
  const { t } = ctx;
  const deg = (c) => {                                  // a temperature as the house shows it (°F only shown, the rules keep °C)
    const v = ctx.settings().units === 'imperial' ? c * 9 / 5 + 32 : c;
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
  const rules = initRulesStore({ changed: () => { ctx.redraw(); usedBy.redraw(); } });
  const flowEdit = initFlowEdit({ ...base, entities: ctx.entities, rules });
  const openRules = () => { ctx.tabs().show('climate'); ctx.climate().show('rules'); };
  const editFlow = (f) => { ctx.tabs().show('routines'); flowEdit.open(f); };
  const openFlow = (id) => { const f = (rules.get()?.flows || []).find((x) => x.id === id); if (f) editFlow(f); else ctx.tabs().show('routines'); };
  const usedBy = initUsedBy({ ...base, locked: ctx.locked, callService: ctx.callService, rules, roomName, deg, openRules, openFlow });
  const heat = initHeatRulesUi({ ...base, rules, locked: ctx.locked, houseId, rooms, deg, usedBy, editFlow, showPlan: () => ctx.climate().show('plan'),
    changed: () => ctx.climate()?.update() });
  const plan = initHeatPlanUi({ ...base, rules, houseId, rooms, deg, changed: () => ctx.climate()?.update(), back: () => ctx.climate().show('rules') });
  const own = initRoutinesOwn({ ...base, locked: ctx.locked, callService: ctx.callService, rules, edit: (f) => flowEdit.open(f), openRules, details: ctx.details,
    changed: () => ctx.routines()?.update() });
  rules.load();
  return {
    rules, usedBy, heat, plan, own, flowEdit,
    /** the mark of a room's label and tile: "⏸️ pausiert", "🚀 Boost" or '' */
    mark: (roomId) => roomMark(rules.status(roomKey(houseId(), roomId)), t),
    /** what the add-on pushed over the live channel ({type: "rules", rooms, lanes}) */
    pushed: (d) => rules.pushed(d),
  };
}
