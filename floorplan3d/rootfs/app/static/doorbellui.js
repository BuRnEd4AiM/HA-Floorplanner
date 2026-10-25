/* 🔔 The doorbell window (owner's choice 2026-10-25, picture docs/ideen-4.3/6-klingel.jpg): somebody rings, and every screen in the live
 * mode shows the camera at the door with "🔓 Tür öffnen" (asks once more) and "✕ Schließen", wakes the screen and plays a gong. It closes by
 * itself after two minutes. A ring is seen in each pushed change (the live channel, `seen`) and in each full list of states (`update`); the
 * rules (which bells, their camera and opener, what is a ring) are in doorbell.js. */
import { findBells, isRing, openService, RING_MS, CONFIRM_MS } from './doorbell.js';

/** ctx: $, t, lang(), settings(), entities(), states(), isLive(), locked(key) (a lock of this user: 'doorbell', 'cameras', 'control'),
 *  replaying() (the security view plays the past), callService(entity, service), cams (camLive, haButton), wake() (the screen wakes up) */
export function initDoorbellUi(ctx) {
  const { $, t } = ctx;
  const dlg = $('#bellDlg'), head = $('#bellName'), time = $('#bellTime'), cam = $('#bellCam'), openBtn = $('#bellOpen'), haBox = $('#bellHa');
  const seen = new Map();                                      // bell -> the state seen last
  let bells = [], key = '', bell = null, closer = 0, sure = 0, audio = null;

  /** the bells to watch, found again only when the entities or the settings changed */
  function watched() {
    const ents = ctx.entities(), cfg = ctx.settings().doorbell || {}, k = `${ents.length}|${JSON.stringify(cfg.bells || [])}`;
    if (k !== key) { key = k; bells = findBells(ents, cfg.bells); }
    return cfg.on === false ? [] : bells;
  }
  /** a state of a bell: a ring when it changed like a ring (the first sight only counts as seen) */
  function see(id, state) {
    const b = watched().find((x) => x.entity === id);
    if (!b) return;
    const was = seen.get(id);
    seen.set(id, state);
    if (isRing(id, was, state) && !ctx.replaying()) show(b);
  }

  function chime() {
    if (ctx.settings().doorbell?.sound === false) return;
    try {
      const A = window.AudioContext || window.webkitAudioContext;
      if (!A) return;
      audio ||= new A();
      audio.resume?.();
      [[659, 0], [523, 0.5]].forEach(([f, at]) => {                // ding (E5), dong (C5)
        const o = audio.createOscillator(), g = audio.createGain(), t0 = audio.currentTime + at;
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
        o.connect(g).connect(audio.destination); o.start(t0); o.stop(t0 + 1.5);
      });
    } catch { /* no sound on this screen */ }
  }
  // browsers play a sound only after the page was touched once: the first touch prepares the sound for a later ring
  addEventListener('pointerdown', () => { try { const A = window.AudioContext || window.webkitAudioContext; if (A && !audio) audio = new A(); audio?.resume?.(); } catch { /* none */ } }, { once: true, capture: true });

  function resetOpen() {
    clearTimeout(sure); sure = 0;
    openBtn.classList.remove('sure', 'done');
    openBtn.disabled = false;
    openBtn.textContent = t('bell.open');
  }
  /** the window for bell b (test: from the ⚙ button, also outside the live mode) */
  function show(b, test = false) {
    if (!b || ctx.locked('doorbell') || (!test && !ctx.isLive())) return;
    const again = dlg.open && bell?.entity === b.entity;
    bell = b;
    head.textContent = t('bell.title', { name: b.name });
    time.textContent = new Date().toLocaleTimeString(ctx.lang(), { hour: '2-digit', minute: '2-digit' });
    if (!again) {
      cam.replaceChildren();
      if (b.camera && ctx.settings().cameraImages && !ctx.locked('cameras')) cam.append(ctx.cams.camLive(b.camera, 'bell-live'));
      else { const p = document.createElement('p'); p.className = 'bellNoCam'; p.textContent = t(b.camera ? 'bell.camOff' : 'bell.noCam'); cam.append(p); }
      haBox.replaceChildren(...(b.camera && !ctx.locked('cameras') ? [ctx.cams.haButton(b.camera)] : []));
      resetOpen();
      openBtn.hidden = !b.open || !openService(b.open) || ctx.locked('control');
    }
    ctx.wake();
    chime();
    if (!dlg.open) dlg.showModal();
    clearTimeout(closer);
    closer = setTimeout(close, RING_MS);
  }
  function close() {
    clearTimeout(closer); resetOpen();
    if (dlg.open) dlg.close();
    cam.replaceChildren();                                     // the live picture stops (camlive.js: its box left the page)
  }
  openBtn.addEventListener('click', async () => {
    const svc = bell && openService(bell.open);
    if (!svc || openBtn.disabled) return;
    if (!openBtn.classList.contains('sure')) {                 // the first tap asks: a door must not open by a slip of the finger
      openBtn.classList.add('sure'); openBtn.textContent = t('bell.sure');
      sure = setTimeout(resetOpen, CONFIRM_MS);
      return;
    }
    clearTimeout(sure);
    openBtn.disabled = true;
    const ok = await ctx.callService(bell.open, svc[1]);
    openBtn.classList.remove('sure');
    openBtn.classList.toggle('done', ok !== false);
    openBtn.textContent = t(ok !== false ? 'bell.opened' : 'bell.failed');
    clearTimeout(closer); closer = setTimeout(close, ok !== false ? 8000 : RING_MS);
  });
  $('#bellClose').addEventListener('click', close);
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });

  return {
    /** a change pushed by the live channel: [{ entity_id, state }] */
    pushed(list) { (list || []).forEach((e) => see(e.entity_id, e.state)); },
    /** after every new set of states (also a full list while the live channel is down) */
    update() { const st = ctx.states(); watched().forEach((b) => { if (st[b.entity]) see(b.entity, st[b.entity].state); }); },
    /** "🔔 Ausprobieren" in ⚙: the first bell (or a stand-in with the first camera) on this screen */
    test() {
      const b = watched()[0] || findBells(ctx.entities(), [])[0];
      const cams = ctx.entities().filter((e) => e.entity_id.startsWith('camera.'));
      show(b || { entity: '', camera: cams[0]?.entity_id || '', open: '', name: t('bell.testName') }, true);
    },
    bells: () => watched(),
    isOpen: () => dlg.open,
    close,
  };
}
