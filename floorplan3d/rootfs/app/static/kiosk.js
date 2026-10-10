/* Wall tablet (#61): after a while without a touch the start view comes back and the house may turn (screen saver); at night the screen dims.
 * kioskDecision is the pure rule (tested), initKiosk wires it to the page. */
import { nightActive } from './alerts.js';

/** what to do now: `live` = live mode, `idleReturn` minutes (0 = never), `idleMs` since the last touch, `home` = the start view is shown already, `night` = it is night time and dimming is on */
export function kioskDecision({ live, idleReturn, idleMs, home, night }) {
  return {
    goHome: !!live && idleReturn > 0 && idleMs > idleReturn * 60000 && !home,
    dimShown: !!live && !!night && idleMs > 60000,                  // dimmed at night, but only after a minute without a touch
  };
}

/** ctx: $, controls, settings(), states(), isLive(), closeLivePopup(), closeRoomPanel(), closeSearch(), tabletRoom(), findRoomByName(name), switchFloor(i), focusRoom(id), focusedRoom(),
 *  openRoomPanel(id), groundIdx(), fitCamera(),
 *  applyStart() (go to the saved start view: a promise of true / false, null when there is none, #315) */
export function initKiosk(ctx) {
  const { $ } = ctx;
  let lastInput = Date.now(), kioskHome = true;
  /** any touch, key or wheel: wake the screen, stop the turning */
  function touched() {
    lastInput = Date.now(); kioskHome = false;
    if (ctx.controls.autoRotate) ctx.controls.autoRotate = false;
    if (!$('#nightDim').hidden) $('#nightDim').hidden = true;
  }
  ['pointerdown', 'keydown', 'wheel'].forEach((ev) => addEventListener(ev, touched, { passive: true, capture: true }));
  function goHome() {
    ctx.closeLivePopup(); ctx.closeRoomPanel(); ctx.closeSearch();
    const saved = ctx.applyStart?.();                              // a saved start view (#315): a promise, null without one
    if (saved) {
      saved.then((ok) => {
        if (!ok) { autoHome(); return; }                         // it belongs to another house or its floor is gone
        const room = ctx.tabletRoom(), hit = room && ctx.findRoomByName(room);
        if (hit && ctx.focusedRoom() === hit.room.id) ctx.openRoomPanel(hit.room.id);
      });
      return;
    }
    autoHome();
  }
  /** the automatic start: the room of this tablet, else the ground floor */
  function autoHome() {
    const room = ctx.tabletRoom(), hit = room && ctx.findRoomByName(room);
    if (hit) { ctx.switchFloor(hit.floor); ctx.focusRoom(hit.room.id); ctx.openRoomPanel(hit.room.id); }
    else { if (ctx.focusedRoom()) ctx.focusRoom(null); ctx.switchFloor(ctx.groundIdx()); }
    ctx.fitCamera();
  }
  function tick() {
    const st = ctx.settings(), live = ctx.isLive(), idleMs = Date.now() - lastInput;
    const night = live && nightActive(st.nightDim, st.nightFrom, st.nightTo, new Date(), ctx.states()['sun.sun']?.state);
    const d = kioskDecision({ live, idleReturn: st.idleReturn, idleMs, home: kioskHome, night });
    if (d.goHome) {
      kioskHome = true;
      goHome();
      if (st.idleOrbit) { ctx.controls.autoRotate = true; ctx.controls.autoRotateSpeed = 0.6; }
    }
    $('#nightDim').hidden = !d.dimShown;
  }
  setInterval(tick, 5000);
  $('#nightDim').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); touched(); });   // the first touch only wakes the screen
  return { touched, tick, idle: (ms) => { lastInput = Date.now() - ms; kioskHome = false; } };       // idle: for the browser tests
}
