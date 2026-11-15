/* Wall tablet (#61): after a while without a touch the start view comes back and the screen saver starts (the house turns, the floors
 * one after another, a big clock or a black screen); the screen dims at night or whenever nobody touches it, a motion sensor wakes it, the screen may be kept on and the page
 * may load itself again once a day. The rules are pure (tested: tests/kiosk.test.mjs); initKiosk wires them to the page, what the overlays
 * show is in kioskscreen.js. */
import { nightActive } from './alerts.js';
import { initKioskScreen } from './kioskscreen.js';

/** the screen savers: off, the house turns, the floors one after another (5.13.0), a big clock, a black screen */
export const SAVERS = ['off', 'orbit', 'floors', 'clock', 'black'];
/** the screen saver "floors": each floor this long, the house turning slowly */
export const FLOOR_SECONDS = 12;
/** the floors it shows one after another: every floor that is not a roof, the lowest first */
export function saverFloors(floors) {
  return (floors || []).map((f, i) => (f?.kind === 'roof' ? -1 : i)).filter((i) => i >= 0);
}
/** the next floor of that tour after `cur` (the first one when cur is not in it); null without floors */
export function nextSaverFloor(list, cur) {
  if (!list.length) return null;
  return list[(list.indexOf(cur) + 1) % list.length];
}
/** the screen savers in which the house turns */
const turning = (k) => k === 'orbit' || k === 'floors';
/** how fast the house turns (OrbitControls' autoRotateSpeed: 1 = one turn a minute); normal is the speed it always had */
export const SAVER_SPEED = { slow: 0.3, normal: 0.6, fast: 1.5 };
/** when the screen dims: off, at night by the sun, at night by the clock, always when nobody touches it */
export const DIM_MODES = ['off', 'sun', 'time', 'always'];
const MIN = 60000;

/** what to do now: `live` = live mode, `idleReturn` minutes (0 = never), `idleMs` since the last touch, `home` = the start view is shown
 *  already, `night` = dimming is due now (dimNow), `saver` (SAVERS) after `saverAfter` minutes, `saverOn` = it runs already, `dimAfter`
 *  minutes without a touch before the screen dims */
export function kioskDecision({ live, idleReturn, idleMs, home, night, saver = 'off', saverAfter = 5, saverOn = false, dimAfter = 1 }) {
  return {
    goHome: !!live && idleReturn > 0 && idleMs > idleReturn * MIN && !home,
    // since 5.12.0 on its own: before it only started together with "back to the start view" and never when nobody had touched the page yet
    saverStart: !!live && saver !== 'off' && SAVERS.includes(saver) && idleMs > Math.max(1, saverAfter || 0) * MIN && !saverOn,
    dimShown: !!live && !!night && idleMs > Math.max(1, dimAfter || 0) * MIN,
  };
}

/** is the screen to be dimmed now? mode: DIM_MODES; from / to: 'HH:MM' (mode time); sunState: the state of sun.sun */
export function dimNow(mode, from, to, date, sunState) {
  return mode === 'always' || nightActive(mode, from, to, date, sunState);
}

/** reload the page now? `at` 'HH:MM' (else never), `loadedAt` / `now` ms: the last `at` before now came after the page was loaded, and
 *  nobody touched the screen for two minutes (a page in use is never reloaded under the finger; it waits until it rests) */
export function reloadDue(at, loadedAt, now, idleMs) {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(at || '');
  if (!m) return false;
  const last = new Date(now);
  last.setHours(+m[1], +m[2], 0, 0);
  if (last.getTime() > now) last.setDate(last.getDate() - 1);
  return last.getTime() > loadedAt && idleMs > 2 * MIN;
}

/** a motion sensor (or a switch) that wakes the screen: on, open, detected, home, playing count as "somebody is there" */
export const wakeState = (s) => ['on', 'open', 'detected', 'home', 'playing'].includes(String(s || '').toLowerCase());

/** ctx: $, t, lang(), controls, settings(), states(), isLive(), closeLivePopup(), closeRoomPanel(), closeSearch(), tabletRoom(), findRoomByName(name),
 *  switchFloor(i), focusRoom(id), focusedRoom(), openRoomPanel(id), groundIdx(), fitCamera(),
 *  applyStart() (go to the saved start view: a promise of true / false, null when there is none, #315), homeTab() (the start tab, #479),
 *  houseTab() (the tab with the house: the turning house must be seen), reload() (load the page again),
 *  layout(), floorIdx() (the screen saver "floors", 5.13.0), onScreen({ live, saver, dim }) (the 🧽 button and Fully Kiosk follow the
 *  screen: tabletextras.js, 5.13.0) */
export function initKiosk(ctx) {
  const { $ } = ctx;
  const loadedAt = Date.now();
  let lastInput = Date.now(), kioskHome = true, saverOn = null, preview = null;   // preview: 'saver' / 'dim' shown by "Ausprobieren" until a touch
  let floorTimer = 0;                                              // the screen saver "floors": the next floor every FLOOR_SECONDS
  const told = (dim) => ctx.onScreen?.({ live: ctx.isLive(), saver: saverOn, dim });
  const screen = initKioskScreen({ $, t: ctx.t, lang: ctx.lang, settings: ctx.settings, states: ctx.states, onTouch: () => touched() });
  /** the screen saver ends: the house stops turning, the clock or the black screen goes */
  function stopSaver() {
    if (!saverOn) return;
    if (turning(saverOn)) kioskHome = false;                       // the house stands turned: back to the start view after the idle time again
    saverOn = null;
    clearInterval(floorTimer); floorTimer = 0;
    if (ctx.controls.autoRotate) ctx.controls.autoRotate = false;
    screen.saver(null);
  }
  /** somebody is there (a motion sensor): the screen wakes, the view stays as it is */
  function wakeUp() {
    lastInput = Date.now(); preview = null;
    stopSaver();
    screen.dim(false);
    told(false);
  }
  /** any touch, key or wheel: wake the screen, stop the turning */
  function touched() {
    kioskHome = false;
    if (ctx.controls.autoRotate) ctx.controls.autoRotate = false;
    wakeUp();
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
  function startSaver(kind, st) {
    saverOn = kind;
    if (turning(kind)) {
      if (!kioskHome) { kioskHome = true; goHome(); }
      ctx.houseTab?.();                                            // a page of the tab bar would hide the turning house
      ctx.closeRoomPanel();
      ctx.controls.autoRotate = true;
      ctx.controls.autoRotateSpeed = SAVER_SPEED[st.saverSpeed] || SAVER_SPEED.normal;
    }
    if (kind === 'floors' && ctx.layout) {
      floorTimer = setInterval(() => {
        const n = nextSaverFloor(saverFloors(ctx.layout().floors), ctx.floorIdx());
        if (n != null && n !== ctx.floorIdx()) ctx.switchFloor(n);
      }, FLOOR_SECONDS * 1000);
    }
    screen.saver(kind);
  }
  function tick() {
    if (preview) return;                                           // "Ausprobieren": stays until a touch, also in the edit mode
    const st = ctx.settings(), live = ctx.isLive(), idleMs = Date.now() - lastInput;
    if (!live) stopSaver();
    if (saverOn && saverOn !== st.saver) stopSaver();              // the screen saver was changed in the settings meanwhile
    const night = live && dimNow(st.nightDim, st.nightFrom, st.nightTo, new Date(), ctx.states()['sun.sun']?.state);
    const d = kioskDecision({ live, idleReturn: st.idleReturn, idleMs, home: kioskHome, night, saver: st.saver, saverAfter: st.saverAfter, saverOn: !!saverOn, dimAfter: st.dimAfter });
    if (d.goHome) { kioskHome = true; goHome(); }
    if (d.saverStart) startSaver(st.saver, st);
    else if (turning(saverOn)) ctx.controls.autoRotateSpeed = SAVER_SPEED[st.saverSpeed] || SAVER_SPEED.normal;
    screen.dim(d.dimShown, saverOn);
    told(d.dimShown);
    screen.keepAwake(!!st.keepAwake && live);
    if (live && reloadDue(st.reloadAt, loadedAt, Date.now(), idleMs)) (ctx.reload || (() => location.reload()))();
  }
  /** the motion sensor of ⚙ → Wandtablet: while it says somebody is there, the screen stays awake */
  function checkWake() {
    const id = ctx.settings().wakeEntity;
    if (id && ctx.isLive() && wakeState(ctx.states()[id]?.state)) wakeUp();
  }
  /** ⚙ → Wandtablet, "▶ Ausprobieren": the screen saver or the dimmed screen at once (the settings close), until the next touch */
  function tryNow(what) {
    const st = ctx.settings();
    $('#settingsDialog')?.close?.();
    setTimeout(() => {                                             // after the click that closed the dialog (it counts as a touch)
      preview = what;
      if (what === 'saver' && st.saver !== 'off') { stopSaver(); startSaver(st.saver, st); }
      if (what === 'dim') screen.dim(true, saverOn);
      told(what === 'dim');
    }, 50);
  }
  $('#saverTry')?.addEventListener('click', () => tryNow('saver'));
  $('#dimTry')?.addEventListener('click', () => tryNow('dim'));
  setInterval(tick, 5000);
  setInterval(checkWake, 1000);
  return {
    touched, tick, checkWake,
    idle: (ms) => { lastInput = Date.now() - ms; kioskHome = false; },   // idle: for the browser tests
    saver: () => saverOn, tryNow,
  };
}
