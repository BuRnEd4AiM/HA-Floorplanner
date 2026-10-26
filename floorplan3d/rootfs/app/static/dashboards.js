/* The pages of the tab bar as dashboards an admin arranges (#484): puts together the own cards (cardsui.js), the board of every page
 * (pageboard.js: order, hidden cards, the edit mode), the windows to add and set a card (cardeditor.js), the bar's edit mode with own
 * pages (tabedit.js), the own pages themselves (pagecustom.js), the thermostat as a circle (thermostatui.js, #495) and the calendar card
 * (calcardui.js, #495), the window with the controls of a button card (ctlwindow.js, #495), the own versions of a page per user
 * (variantsui.js, #507). app.js only calls initDashboards and hands the result to the pages and the tab bar. */
import { initCards } from './cardsui.js';
import { initThermostat } from './thermostatui.js';
import { initCalendarCard } from './calcardui.js';
import { initControlsWindow } from './ctlwindow.js';
import { canMoreInfo, openMoreInfo } from './moreinfo.js';
import { initBoard } from './pageboard.js';
import { initCardEditor } from './cardeditor.js';
import { initTabEdit } from './tabedit.js';
import { initCustomPages } from './pagecustom.js';
import { initVariantsUi } from './variantsui.js';
import { cleanCustomTabs } from './tabs.js';
import { roomSummary } from './roomtiles.js';

/** ctx: $, t, lang(), settings(), save(), canEdit(), states(), entities(), areas(), nameOf(entity), stateText(entity),
 *  callService(entity, service, data), layout() (the building shown), placed(floor), areaEntities(room), isOn(entity), isOpen(entity),
 *  openingEntities(opening), openRoom(floorIndex, roomId), camImage(entity), openCamera(entity), builtin(key), tabsUi() (the tab bar,
 *  made after this), live() (livecontrols.js, made after this), me() (api/me), refill() (the settings dialog shows the settings again),
 *  usedBy(entity) (🔎 Wird benutzt, #546: a button) */
export function initDashboards(ctx) {
  const { $, t } = ctx;
  const bar = () => ctx.tabsUi();
  /** a room of the plan for a card "Raum": its name, floor and what its tile shows */
  function room(id) {
    const floors = ctx.layout().floors || [];
    for (let fi = 0; fi < floors.length; fi++) {
      const f = floors[fi], r = (f.rooms || []).find((x) => x.id === id);
      if (!r) continue;
      const s = roomSummary(r, f, { placed: ctx.placed(f), areaEntities: ctx.areaEntities(r), states: ctx.states(), isOn: ctx.isOn, isOpen: ctx.isOpen, openingEntities: ctx.openingEntities });
      return { name: r.name || '?', floor: f.name || '', fi, temp: s.temp, lights: s.lights, open: s.open, occupied: s.occupied };
    }
    return null;
  }
  const rooms = () => (ctx.layout().floors || []).flatMap((f) => (f.rooms || []).map((r) => ({ id: r.id, name: r.name || '?', floor: f.name || '' })));
  const pageName = (page) => cleanCustomTabs(ctx.settings().customTabs).find((x) => x.id === page)?.name || t(`tab.${page}`);

  /** the thermostat as a circle (#495): the own card "Thermostat" and the page 🌡 Klima; a tap draws the open page again */
  const thermo = initThermostat({ t, lang: ctx.lang, settings: ctx.settings, states: ctx.states, callService: ctx.callService,
    changed: () => bar().update() });
  /** the calendar card (#495): several calendars, a week / list / month, "＋ Termin" */
  const calendar = initCalendarCard({ t, lang: ctx.lang, callService: ctx.callService, changed: () => { board.refresh(bar().open()); editor.refresh(); } });
  /** the window with the controls of a device: a tap or a long press on a button card (#495) */
  const word = (e) => {                             // a state in words: the app's texts for it (open, locked, docked …), else as Home Assistant says it
    const k = ctx.states()[e]?.state;
    for (const key of [`dc.st.${k}`, `state.${k}`]) { const x = t(key); if (x !== key) return x; }
    return ctx.stateText(e);
  };
  const controls = initControlsWindow({ t, states: ctx.states, nameOf: ctx.nameOf, word, callService: ctx.callService, thermo,
    live: { lightControls: (ids) => ctx.live().lightControls(ids), detailsButton: (e) => ctx.live().detailsButton(e) }, usedBy: (e) => ctx.usedBy?.(e) });
  const cards = initCards({
    t, lang: ctx.lang, states: ctx.states, settings: ctx.settings, nameOf: ctx.nameOf, stateText: ctx.stateText, callService: ctx.callService,
    camImage: ctx.camImage, openCamera: ctx.openCamera, room,
    openRoom: (id) => { const r = room(id); if (r) ctx.openRoom(r.fi, id); },
    builtin: ctx.builtin, thermo, calendar, controls: (e) => controls.open(e),
    moreInfo: (e) => { if (!canMoreInfo()) return false; openMoreInfo(e); return true; },
    showPage: (k) => bar().show(k), pages: () => bar().tabs().map((x) => ({ key: x.key, name: pageName(x.key) })),
    changed: () => { board.refresh(bar().open()); editor.refresh(); },
  });
  /** the own versions of a page per user (#507): which one the board draws, their strip in the edit mode, "Wer sieht was" */
  const variants = initVariantsUi({
    t, $, settings: ctx.settings, save: ctx.save, me: ctx.me, pageName, board: () => board, open: () => bar().open(),
    redraw: (page) => bar().render(page), changed: () => bar().redraw(), refill: ctx.refill,
  });
  const board = initBoard({
    t, settings: ctx.settings, canEdit: ctx.canEdit, save: ctx.save, cards, pageName, variants,
    redraw: (page) => bar().render(page), changed: () => bar().redraw(),
    addCard: (page) => editor.add(page), editCard: (page, card) => editor.edit(page, card),
    editTabs: () => tabEdit.start(), editOwnPage: (page) => tabEdit.ownPage(page),
  });
  const editor = initCardEditor({ t, entities: ctx.entities, rooms, cards, board, calendar });
  const tabEdit = initTabEdit({
    t, $, settings: ctx.settings, save: ctx.save, areas: ctx.areas, states: ctx.states, board,
    tabs: () => bar().tabs(), tabName: (k) => t(`tab.${k}`), changed: () => bar().redraw(), show: (k) => bar().show(k),
  });
  const custom = initCustomPages({ t, host: $('#tabPages'), settings: ctx.settings, board, canEdit: ctx.canEdit });
  return {
    board, tabEdit, thermo, variants,
    customPages: () => custom.all(),
    edit: { can: () => ctx.canEdit() && !variants.viewing(), editing: board.editing, toggle: board.toggle, refresh: board.refresh },   // "Ansehen als": no ✎
  };
}
