/* Live popup: the small card that opens when a device or a door / window is tapped in live mode (state, actions, light controls, the scenes the
 * light is part of, the whole room; a window's roller shutter: up, stop, down and its position, #331), and the LED ring card with one button
 * per section. */
import { ACTIONS, ACTION_LABEL } from './livecontrols.js';
import { ringCount, segEntity, ringEntities } from './ledring.js';
import { shutterEntity, shutterText } from './shutters.js';

/** ctx: $, t, live (initLiveControls), floor(), findOpening(id), stateText(id), openText(id), cams, settings(), pointInPoly, states(), onStates */
export function initLivePopup(ctx) {
  const { $, t, live } = ctx;
  let forId = null, seg = null;                 // the device (or opening) shown, and the tapped section of an LED ring
  let sliding = false;                          // the shutter's position slider is held: a state update does not draw the card anew under the finger
  function close() { forId = null; sliding = false; $('#livePopup').hidden = true; }
  function show(id, section = null) { forId = id; seg = section; sliding = false; render(); }
  function render() {
    if (sliding) return;
    const box = $('#livePopup');
    let d = ctx.floor()?.devices.find((v) => v.id === forId);
    if (!d) {                                          // a door/window with a contact sensor
      const fo = ctx.findOpening(forId);
      if (fo) d = { name: fo.opening.name || t(`prop.${fo.opening.type}`), entity: fo.opening.entity, isOpening: true, shutter: shutterEntity(fo.opening) };
    }
    if (!d) { close(); return; }
    box.hidden = false;
    box.innerHTML = '';
    if (d.type === 'ledring') { ringPopup(box, d); return; }
    const title = document.createElement('div'); title.className = 'title'; title.textContent = d.name || '';
    const sub = document.createElement('div'); sub.className = 'sub';
    sub.textContent = d.entity ? `${d.isOpening ? ctx.openText(d.entity) : ctx.stateText(d.entity)} · ${d.entity}` : t('live.noEntity');
    const mi = live.detailsButton(d.entity);
    if (mi) title.append(mi);
    box.append(title);
    if (d.entity || !d.shutter) box.append(sub);                // a window with only a shutter: no "nothing linked" line
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
    if (d.shutter) shutterCard(box, d.shutter);
    if (d.entity && d.entity.startsWith('light.') && !d.isOpening) {
      box.append(live.lightControls([d.entity]));
      const sc = live.sceneButtons(live.scenesWith([d.entity]), 'live.sceneWith');   // scenes this light is part of
      if (sc) box.append(sc);
    }
    if (d.entity && /^(light|scene)\./.test(d.entity) && !d.isOpening) {          // the whole room this device is in
      const rm = ctx.floor().rooms.find((r) => ctx.pointInPoly(d.x, d.z, r.points));
      const rc = rm && live.roomControls(rm);
      if (rc) box.append(rc);
    }
  }
  /** the roller shutter of a window (#331): its state, up / stop / down and the position (100 % = open) */
  function shutterCard(box, e) {
    const h = document.createElement('h4'); h.textContent = `🪟 ${t('shutter.title')}`;
    const smi = live.detailsButton(e);
    if (smi) h.append(smi);
    const sub = document.createElement('div'); sub.className = 'sub'; sub.textContent = `${shutterText(ctx.states()[e], t)} · ${e}`;
    box.append(h, sub);
    const dom = e.split('.')[0], row = document.createElement('div'); row.className = 'actions shutterActs';
    const acts = dom === 'cover' ? [['open_cover', 'shutter.up'], ['stop_cover', 'live.stop'], ['close_cover', 'shutter.down']] : (ACTIONS[dom] || []).map((a) => [a, ACTION_LABEL[a]]);
    acts.forEach(([a, k]) => {
      const b = document.createElement('button'); b.textContent = t(k);
      b.addEventListener('click', () => live.callService(e, a));
      row.append(b);
    });
    if (acts.length) box.append(row);
    const pos = ctx.states()[e]?.position;
    if (dom === 'cover' && typeof pos === 'number') {
      const pr = document.createElement('div'); pr.className = 'actions shutterPos';
      const r = document.createElement('input'); r.type = 'range'; r.min = 0; r.max = 100; r.step = 1; r.value = pos; r.id = 'shutterPos'; r.title = t('shutter.pos');
      r.addEventListener('pointerdown', () => { sliding = true; window.addEventListener('pointerup', () => { sliding = false; }, { once: true }); });   // also let go beside it
      ['pointercancel', 'blur'].forEach((ev) => r.addEventListener(ev, () => { sliding = false; }));
      r.addEventListener('change', () => { sliding = false; live.callService(e, 'set_cover_position', { position: +r.value }); });
      pr.append(r);
      box.append(pr);
    }
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
