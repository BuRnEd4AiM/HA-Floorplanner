/* Wall tablet (#61): after a while without a touch the start view comes back and the house may turn (screen saver); at night the screen dims.
 * Since 5.12.0 the screen saver can be chosen, a motion sensor wakes the screen, the page reloads every night (kioskprefs.js, kioskui.js).
 * kioskDecision is the pure rule (tested), initKiosk wires it to the page. */
import { nightActive } from './alerts.js';
import { saverWait, someoneThere, reloadDue } from './kioskprefs.js';

/** what to do now: `live` = live mode, `idleReturn` minutes (0 = never), `idleMs` since the last touch, `home` = the start view is shown already,
 *  `night` = it is night time and dimming is on; since 5.12.0 (kioskprefs.js): `activeMs` since the last touch or movement (a motion sensor,
 *  else idleMs), `saverWait` minutes until the screen saver (0 = none), `nightAfter` minutes without a touch until it is dimmed (1) */
export function kioskDecision({ live, idleReturn, idleMs, home, night, activeMs = idleMs, saverWait = 0, nightAfter = 1 }) {
  return {
    goHome: !!live && idleReturn > 0 && idleMs > idleReturn * 60000 && !home,
    dimShown: !!live && !!night && activeMs > nightAfter * 60000,  // dimmed at night, but only after a while without a touch
    saverShown: !!live && saverWait > 0 && activeMs > saverWait * 60000,
  };
}

/** ctx: $, controls, settings(), states(), isLive(), closeLivePopup(), closeRoomPanel(), closeSearch(), tabletRoom(), findRoomByName(name), switchFloor(i), focusRoom(id), focusedRoom(),
 *  openRoomPanel(id), groundIdx(), fitCamera(),
 *  applyStart() (go to the saved start view: a promise of true / false, null when there is none, #315), homeTab() (the start tab, #479),
 *  prefs() (what counts on this screen, kioskprefs.js kioskFor: the general settings and this tablet's own, 5.12.0), screens (kioskui.js:
 *  the screen saver, the dimmed night, the cleaning button, Fully Kiosk), reload() (load the page again) */
export function initKiosk(ctx) {
  const { $ } = ctx;
  const loadedAt = Date.now();
  let lastTouch = loadedAt, lastActive = loadedAt, kioskHome = true;
  /** any touch, key or wheel: wake the screen, stop the turning */
  function touched() {
    lastTouch = lastActive = Date.now(); kioskHome = false;
    ctx.screens?.wake();
    if (ctx.controls.autoRotate) ctx.controls.autoRotate = false;
    if (!$('#nightDim').hidden) $('#nightDim').hidden = true;
  }
  ['pointerdown', 'keydown', 'wheel'].forEach((ev) => addEventListener(ev, touched, { passive: true, capture: true }));
  function goHome() {
    ctx.closeLivePopup(); ctx.closeRoomPanel(); ctx.closeSearch();
    ctx.homeTab?.();                                               // the start tab of the tab bar (#479)
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
    const p = ctx.prefs(), live = ctx.isLive(), now = Date.now();
    if (p.wakeSensor && someoneThere(ctx.states()[p.wakeSensor]?.state)) lastActive = now;   // somebody near the tablet (5.12.0)
    const night = live && nightActive(p.nightDim, p.nightFrom, p.nightTo, new Date(now), ctx.states()['sun.sun']?.state);
    const d = kioskDecision({ live, idleReturn: p.idleReturn, idleMs: now - lastTouch, activeMs: now - lastActive, home: kioskHome, night,
      saverWait: saverWait(p), nightAfter: p.nightAfter });
    if (d.goHome) {
      kioskHome = true;
      goHome();
    }
    if (ctx.screens) ctx.screens.update({ live, saver: d.saverShown ? p.saver : null, dim: d.dimShown, p });
    else {
      if (d.saverShown && p.saver === 'orbit' && !ctx.controls.autoRotate) { ctx.controls.autoRotate = true; ctx.controls.autoRotateSpeed = 0.6; }
      $('#nightDim').hidden = !d.dimShown;
    }
    if (live && reloadDue({ at: p.reloadAt, loadedAt, now, touchMs: now - lastTouch })) ctx.reload?.();
  }
  setInterval(tick, 2000);
  $('#nightDim').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); touched(); });   // the first touch only wakes the screen
  return { touched, tick, idle: (ms) => { lastTouch = lastActive = Date.now() - ms; kioskHome = false; } };       // idle: for the browser tests
}
