/* Live popup: the small card that opens when a device or a door / window is tapped in live mode (state, actions, light controls, the scenes the
 * light is part of, the whole room; a window's roller shutter: its own card, shuttercard.js, #331, #335), and the LED ring card with one
 * button per section. The card is drawn anew only when something it shows changes (#336): a state update of any other entity of the house
 * (power meters, temperatures every few seconds) no longer replaces its buttons and sliders under the finger. popupKey is pure (unit test). */
import { ACTIONS, ACTION_LABEL } from './livecontrols.js';
import { ringCount, segEntity, ringEntities } from './ledring.js';
import { shutterEntity } from './shutters.js';
import { initShutterCard } from './shuttercard.js';

/** what the card shows of an entity's state: the state and its unit, brightness, colour, effects, a cover's position (not: since, other attributes) */
export const shownState = (s) => (s ? [s.state, s.unit, s.brightness, s.rgb, s.fx, s.fxc, s.position] : null);
/** the key of the card: the device (or window) as stored, the tapped LED ring section, the language, what else the card depends on (extra), and
 *  for each entity it shows (ids, any order) its name and the shown part of its state. The same key: the card would look the same. */
export function popupKey({ dev = null, seg = null, lang = '', extra = null, ids = [], states = {}, name = (e) => e }) {
  const list = [...new Set(ids.filter(Boolean))].sort();
  return JSON.stringify([dev, seg, lang, extra, list.map((e) => [e, name(e), shownState(states[e])])]);
}

/** ctx: $, t, lang(), live (initLiveControls), floor(), findOpening(id), stateText(id), openText(id), cams, settings(), pointInPoly, states(), onStates */
export function initLivePopup(ctx) {
  const { $, t, live } = ctx;
  const box = $('#livePopup');
  let forId = null, seg = null;                 // the device (or opening) shown, and the tapped section of an LED ring
  let key = '';                                 // what the card shows (popupKey); '' = draw it anew
  let sliding = false;                          // a slider of the card is held (phones do not always give it the focus)
  const shutter = initShutterCard({ t, live, states: () => ctx.states(), rerender: () => render() });
  const letGo = () => { if (sliding) { sliding = false; if (forId) setTimeout(render); } };      // let go: what changed meanwhile is drawn
  box.addEventListener('pointerdown', (ev) => {
    if (!ev.target.matches?.('input[type=range]')) return;
    sliding = true;
    ['pointerup', 'pointercancel'].forEach((n) => window.addEventListener(n, letGo, { once: true }));   // also let go beside it
  });
  // a slider (also the shutter's), colour picker or effect list in use is not replaced; what changed meanwhile is drawn when the focus leaves the card
  const busy = () => sliding || shutter.busy() || !!document.activeElement?.matches?.('#livePopup input, #livePopup select');
  box.addEventListener('focusout', (ev) => { if (forId && !box.contains(ev.relatedTarget)) setTimeout(render); });
  function close() { forId = null; key = ''; sliding = false; shutter.reset(); box.hidden = true; }
  function show(id, section = null) {
    forId = id; seg = section; key = ''; sliding = false; shutter.reset();
    if (box.contains(document.activeElement)) document.activeElement.blur();      // another device: always drawn
    render();
  }
  /** the device shown, or a door / window with a contact sensor, or the ball of a window's roller shutter (shutterOf: that window) */
  function shown() {
    const d = ctx.floor()?.devices.find((v) => v.id === forId);
    if (d) return { d, shutterOf: null };
    const fo = ctx.findOpening(forId);
    if (!fo) return null;
    return { d: { name: fo.opening.name || t(`prop.${fo.opening.type}`), entity: fo.opening.entity, isOpening: true }, shutterOf: shutterEntity(fo.opening) ? fo.opening : null };
  }
  const roomOf = (d) => ctx.floor().rooms.find((r) => ctx.pointInPoly(d.x, d.z, r.points));
  const withRoom = (d) => !!d.entity && /^(light|scene)\./.test(d.entity) && !d.isOpening;     // a lamp or a scene: the whole room is on the card
  /** what the card shows: the entities whose state it reads (the device's, the camera's motion, the ring's sections, the room's lights),
   *  the room, and the scene buttons (only their names: a scene's state is the time it was last used) */
  function keyOf(d) {
    const ids = [d.entity, d.motionEntity], scenes = [];
    let room = null;
    if (d.type === 'ledring') ids.push(...ringEntities(d));
    else if (withRoom(d)) {
      if (d.entity.startsWith('light.')) scenes.push(...live.scenesWith([d.entity]));
      const rm = roomOf(d), r = rm && live.roomIds(rm);
      if (rm) { ids.push(...r.lights); scenes.push(...r.scenes); room = [rm.id, rm.name]; }
    }
    const extra = [room, scenes.map((e) => [e, live.nameOf(e)]), !!ctx.settings().cameraImages];
    return popupKey({ dev: d, seg, lang: ctx.lang?.(), extra, ids, states: ctx.states(), name: live.nameOf });
  }
  function render() {
    if (busy()) return;                                // a slider is held, a field has the focus: not drawn anew under the finger
    const found = shown();
    if (!found) { close(); return; }
    const { d, shutterOf } = found, wasHidden = box.hidden;
    box.hidden = false;
    box.classList.toggle('shutterCard', !!shutterOf);
    keepAboveBar(box);
    if (shutterOf) { key = ''; shutter.render(box, shutterEntity(shutterOf), shutterOf.name || ''); return; }   // only the shutter, not the window's contact (#335); it has its own key
    const k = keyOf(d);
    if (k === key && !wasHidden && box.firstElementChild) return;      // nothing on the card has changed: its buttons stay under the finger
    key = k;
    box.innerHTML = '';
    if (d.type === 'ledring') { ringPopup(box, d); return; }
    const title = document.createElement('div'); title.className = 'title'; title.textContent = d.name || '';
    const sub = document.createElement('div'); sub.className = 'sub';
    sub.textContent = d.entity ? `${d.isOpening ? ctx.openText(d.entity) : ctx.stateText(d.entity)} · ${d.entity}` : t('live.noEntity');
    const mi = live.detailsButton(d.entity);
    if (mi) title.append(mi);
    box.append(title, sub);
    if (d.type === 'camera') {                                  // #69: still image (renewed every few seconds), a second tap opens Home Assistant's live view
      if (d.motionEntity) { const mo = document.createElement('div'); mo.className = 'sub'; mo.textContent = ctx.cams.motion(d) ? t('cam.motionOn') : t('cam.motionOff'); box.append(mo); }
      if (d.entity?.startsWith('camera.') && ctx.settings().cameraImages) box.append(ctx.cams.camImage(d.entity, 'pop-cam'));
    }
    const acts = d.entity ? ACTIONS[d.entity.split('.')[0]] : null;
    if (acts) {
      const row = document.createElement('div'); row.className = 'actions';
      (d.entity.startsWith('scene.') || d.entity.startsWith('script.') ? ['turn_on'] : acts).forEach((a) => {
        const b = document.createElement('button');
        b.textContent = d.entity.match(/^(scene|script)\./) ? t('live.activate') : t(ACTION_LABEL[a]);
        b.addEventListener('click', () => live.callService(d.entity, a));
        row.append(b);
      });
      box.append(row);
    }
    if (d.entity && d.entity.startsWith('light.') && !d.isOpening) {
      box.append(live.lightControls([d.entity]));
      const sc = live.sceneButtons(live.scenesWith([d.entity]), 'live.sceneWith');   // scenes this light is part of
      if (sc) box.append(sc);
    }
    if (withRoom(d)) {                                          // the whole room this device is in
      const rm = roomOf(d);
      const rc = rm && live.roomControls(rm);
      if (rc) box.append(rc);
    }
  }
  /** the card stays clear of the view buttons at the bottom (Normal, Temp. ...), which wrap into two rows on a phone (#335) */
  function keepAboveBar(box) {
    const bar = document.getElementById('modeBar'), host = box.offsetParent;
    if (!bar || !host || !bar.offsetParent) { box.style.bottom = ''; return; }      // no bar (the security view): as the style sheet says
    const free = host.getBoundingClientRect().bottom - bar.getBoundingClientRect().top + 10;
    box.style.bottom = free > 72 ? `${Math.round(free)}px` : '';
  }
  /** LED ring in live mode: one button per section, the tapped section's own controls, then the whole ring */
  function ringPopup(box, d) {
    const states = ctx.states();
    const n = ringCount(d), all = ringEntities(d), isOnE = (e) => !!e && ctx.onStates.has(states[e]?.state);
    const div = (cls, txt) => { const x = document.createElement('div'); x.className = cls; if (txt != null) x.textContent = txt; return x; };
    const on = Array.from({ length: n }, (_, i) => isOnE(segEntity(d, i))).filter(Boolean).length;
    const title = div('title', d.name || t('dev.ledring')), mi = live.detailsButton(d.entity);
    if (mi) title.append(mi);
    box.append(title, div('sub', all.length ? t('ring.summary', { on, n }) : t('live.noEntity')));
    if (!all.length) return;
    const row = div('actions ringSegs');
    for (let i = 0; i < n; i++) {
      const e = segEntity(d, i), b = document.createElement('button');
      b.textContent = String(i + 1); b.title = e || t('live.noEntity');
      b.classList.toggle('on', isOnE(e)); b.classList.toggle('sel', seg === i);
      const c = isOnE(e) ? (Array.isArray(states[e]?.rgb) ? states[e].rgb : [255, 210, 122]) : null;
      if (c) b.style.setProperty('--seg', `rgb(${c[0]},${c[1]},${c[2]})`);      // a lit section shows its colour
      b.disabled = !e;
      b.addEventListener('click', () => { seg = seg === i ? null : i; render(); });
      row.append(b);
    }
    box.append(row);
    const e = seg != null && seg < n ? segEntity(d, seg) : '';
    if (e) {
      const h = document.createElement('h4'); h.textContent = t('ring.section', { n: seg + 1 });
      const r = div('actions');
      [['turn_on', 'live.on'], ['turn_off', 'live.off']].forEach(([svc, k]) => {
        const b = document.createElement('button'); b.textContent = t(k);
        b.addEventListener('click', () => live.callService(e, svc));
        r.append(b);
      });
      const smi = live.detailsButton(e);
      if (smi) h.append(smi);
      box.append(h, div('sub', `${ctx.stateText(e)} · ${e}`), r);
      if (e.startsWith('light.')) box.append(live.lightControls([e]));
    }
    if (all.length > 1 || !e) {
      const h = document.createElement('h4'); h.textContent = t('ring.whole');
      const r = div('actions');
      [['turn_on', 'live.allOn'], ['turn_off', 'live.allOff']].forEach(([svc, k]) => {
        const b = document.createElement('button'); b.textContent = t(k);
        b.addEventListener('click', () => all.forEach((id) => live.callService(id, svc)));
        r.append(b);
      });
      box.append(h, r);
      const lights = all.filter((id) => id.startsWith('light.'));
      if (lights.length) box.append(live.lightControls(lights));
    }
  }
  return { show, render, close, current: () => forId };
}
