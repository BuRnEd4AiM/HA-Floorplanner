/* Dashboard card (#13): the add-on page inside the Lovelace card `custom:floorplan3d-card` (dist/floorplan3d-card.js in the repository).
 * The card opens this page through Ingress with ?card=1 and its options in the address. Then the page is a live view without editing
 * (like a wall tablet, appstate.js), starts on the card's floor or the whole house and comes back to it when idle (kiosk.js), takes the
 * card's look for this screen only (never saved as everybody's settings, viewprefs.js), can start with a room colouring and can leave out
 * the room panel and the bars over the house. With a room the card can also show only that room in 3D and never leave it (view=room), or
 * only the room panel of that room, its controls without the 3D picture (view=panel), so a dashboard can have the room and its controls
 * side by side in two cards (#356). cardOptions and cardFloor are pure (unit test: tests/cardmode.test.mjs). */

const one = (v, list) => (list.includes(v) ? v : null);
/** yes / no from the address: null when it is not there */
const flag = (v) => (v == null || v === '' ? null : !['0', 'false', 'no', 'off'].includes(String(v).toLowerCase()));

/** the walls option of the card -> the settings it stands for */
export const WALLS = {
  auto: { cutaway: true, seeThrough: false, lowWalls: false },        // walls facing the camera sink down
  see_through: { cutaway: true, seeThrough: true, lowWalls: false },  // ... turn see-through instead
  low: { lowWalls: true },                                            // all walls low
  full: { cutaway: false, seeThrough: false, lowWalls: false },       // all walls full height
};

/** the card's options from the address; null when the page was not opened by the card. look: the settings for this screen only */
export function cardOptions(params) {
  if (!flag(params.get('card'))) return null;
  const look = { ...WALLS[params.get('walls')] };
  const theme = one(params.get('theme'), ['holo', 'dark', 'light']);
  if (theme) look.theme = theme;
  const labels = one(params.get('labels'), ['important', 'all', 'none']);
  if (labels) look.labelMode = labels;
  const alerts = flag(params.get('alerts'));
  if (alerts !== null) look.alerts = alerts;
  const idle = params.get('idle_return');
  if (/^\d{1,4}$/.test(idle || '') && +idle <= 1440) look.idleReturn = +idle;
  const night = one(params.get('night'), ['off', 'sun', 'time']);
  if (night) look.nightDim = night;
  return {
    floor: (params.get('floor') || '').trim().slice(0, 60) || null,
    view: one(params.get('view'), ['room', 'panel']) || '3d',        // 3d: the house as usual; room: only the card's room, never left; panel: only its room panel
    heat: one(params.get('heatmap'), ['temp', 'humid', 'co2']),
    roomPanel: flag(params.get('room_panel')) !== false,
    nav: flag(params.get('show_nav')) !== false,
    bar: flag(params.get('show_bar')) !== false,
    tabs: flag(params.get('tabs')) === true,                        // the tab bar at the bottom (#479): off in a card unless asked for
    look,
  };
}

/** where the card starts: { whole: true } for the whole house, { floor: i } for a floor by its name, id or number (0 = the ground floor,
 *  1 = the floor above, -1 = the basement), null when there is no such floor (the start stays automatic). floors: [{ id, name }] */
export function cardFloor(floors, want, ground = 0) {
  const w = String(want ?? '').trim().toLowerCase();
  if (!w || !floors?.length) return null;
  if (w === 'house' || w === 'all') return { whole: true };
  const i = floors.findIndex((f) => f.id === want || String(f.name || '').trim().toLowerCase() === w);
  if (i >= 0) return { floor: i };
  if (!/^-?\d{1,2}$/.test(w)) return null;
  const n = ground + Number(w);
  return n >= 0 && n < floors.length ? { floor: n } : null;
}

/** ctx: $, t, opts (from cardOptions), layout(), groundIdx(), tabletRoom(), switchFloor(i), setHouseMode(on), floorIdx(), focusedRoom(),
 *  focusRoom(id), room() ({ floor, room } of the card's room, null without one), openRoomPanel(id) */
export function initCardMode(ctx) {
  const { $, opts } = ctx;
  const locked = opts.view !== '3d';                                  // only the room or only its panel: nothing leads to another room
  document.body.classList.add('card');
  document.body.classList.toggle('card-nonav', !opts.nav || locked);
  document.body.classList.toggle('card-nobar', !opts.bar);
  document.body.classList.toggle('card-room', opts.view === 'room');
  document.body.classList.toggle('card-panel', opts.view === 'panel');
  let started = false;
  /** a card for one room without a room (none chosen, or no room of that name): say so on the card */
  function hint(show) {
    let box = $('#cardHint');
    if (!show) { if (box) box.hidden = true; return; }
    if (!box) { box = document.createElement('div'); box.id = 'cardHint'; $('#stage').append(box); }
    box.textContent = ctx.t('card.pickRoom');
    box.hidden = false;
  }
  /** a card locked to its room: into the room (again after the idle time, the camera back to the room too), its panel for view=panel */
  function startRoom() {
    const hit = ctx.room();
    hint(!hit);
    if (hit && (started || ctx.focusedRoom() !== hit.room.id)) {
      if (ctx.floorIdx() !== hit.floor) ctx.switchFloor(hit.floor);
      ctx.focusRoom(hit.room.id);
    }
    if (hit && opts.view === 'panel') ctx.openRoomPanel(hit.room.id);
    started = true;
    return Promise.resolve(true);                                     // never a saved start view instead
  }
  /** go to the card's floor or the whole house: a promise of true (as the start view does, kiosk.js); null when the card has no floor
   *  that fits, or a room (then the room tablet start does it) */
  function start() {
    if (locked) return startRoom();
    const at = !ctx.tabletRoom() && cardFloor(ctx.layout().floors, opts.floor, ctx.groundIdx());
    if (!at) return null;
    if (at.whole) ctx.setHouseMode(true); else ctx.switchFloor(at.floor);
    return Promise.resolve(true);
  }
  /** the room colouring the card asked for (temperature, humidity, CO2), as a tap on its button */
  function heat() {
    if (opts.heat) $(`#modeBar button[data-vm="${opts.heat}"]`)?.click();
  }
  return {
    start, heat,
    roomPanel: () => (opts.view === '3d' ? opts.roomPanel : opts.view === 'panel'),   // view=room: the controls belong in a card of their own
    locked: () => opts.view === 'room',                               // a tap on the room never leaves it, no other room either
    panelOnly: () => opts.view === 'panel',                           // no 3D picture: nothing to draw
  };
}
