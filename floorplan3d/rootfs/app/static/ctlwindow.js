/* The window with the controls of one device (#495, "Fenster mit Reglern" of a button card, on a tap or a long press; picture
 * docs/ideen-4.9/7-knoepfe.jpg): its name and state, on / off, and what the live card of the plan has for it: a lamp's brightness,
 * colour and effects (livecontrols.js), a thermostat's circle (thermostatui.js), a roller shutter's ▲ ■ ▼ and position, the buttons of
 * a player, fan, vacuum, alarm or choice list (devicecontrols.js), a scene or script to start; "Details" opens Home Assistant's own
 * window (its history) where the page runs inside Home Assistant. Drawn again when the device's state changes, not while a slider is
 * held or a field has the focus. */
import { initDeviceControls } from './devicecontrols.js';

const TOGGLE = new Set(['light', 'switch', 'input_boolean', 'fan', 'automation', 'media_player', 'humidifier']);
const RUN = new Set(['scene', 'script']);

/** ctx: t, states(), nameOf(entity), word(entity) (its state in words), callService(entity, service, data), live (lightControls(ids),
 *  detailsButton(entity)), thermo (thermostatui.js) */
export function initControlsWindow(ctx) {
  const { t } = ctx;
  const devCtl = initDeviceControls({ t, states: ctx.states, callService: ctx.callService });
  let dlg = null, forId = null, drawn = '', timer = 0, held = false;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on, title) => { const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', on); return b; };
  const sig = () => { const s = ctx.states()[forId]; return JSON.stringify(s ? [s.state, s.brightness, s.rgb, s.position, s.tt, s.ct, s.hvac, s.fxc, s.ctl] : null); };
  const busy = () => held || !!document.activeElement?.matches?.('.ctlDlg input:not([type=checkbox]), .ctlDlg select') || ctx.thermo?.busy?.();   // the switch: drawn at once

  function body(e) {
    const s = ctx.states()[e], dom = e.split('.')[0], out = [];
    if (!s) { out.push(make('p', 'tpSub', t('ct.missing', { e }))); return out; }
    if (TOGGLE.has(dom)) {
      const row = make('div', 'ocLine');
      const lab = make('label', 'sw'); lab.title = t('live.toggle');
      const cb = make('input'); cb.type = 'checkbox'; cb.checked = s.state === 'on' || s.state === 'playing' || s.state === 'paused';
      cb.dataset.act = 'ctlToggle';
      cb.addEventListener('change', () => ctx.callService(e, cb.checked ? 'turn_on' : 'turn_off'));
      lab.append(cb, make('span'));
      row.append(make('b', 'ocState', ctx.word(e)), lab);
      out.push(row);
    }
    if (dom === 'light' && s.state === 'on') out.push(ctx.live.lightControls([e]));
    if (dom === 'climate' || dom === 'water_heater') { const th = ctx.thermo?.render(e, 'big'); if (th?.el) out.push(th.el); }
    if (dom === 'cover') {
      const row = make('div', 'ocBtns');
      row.append(btn('', '▲', () => ctx.callService(e, 'open_cover'), t('ct.open')), btn('', '■', () => ctx.callService(e, 'stop_cover'), t('ct.stop')),
        btn('', '▼', () => ctx.callService(e, 'close_cover'), t('ct.close')));
      out.push(row);
      if (s.position != null) {
        const r = make('input', 'ocRange'); r.type = 'range'; r.min = 0; r.max = 100; r.value = Math.round(s.position);
        r.addEventListener('change', () => ctx.callService(e, 'set_cover_position', { position: Number(r.value) }));
        out.push(make('div', 'sub', `${t('ctl.position')} ${Math.round(s.position)} %`), r);
      }
    }
    if (dom === 'lock') {
      const row = make('div', 'ocBtns');
      row.append(btn(s.state === 'locked' ? 'on' : '', `🔒 ${t('ctl.lock')}`, () => ctx.callService(e, 'lock')), btn(s.state === 'unlocked' ? 'on' : '', `🔓 ${t('ctl.unlock')}`, () => ctx.callService(e, 'unlock')));
      out.push(row);
    }
    if (RUN.has(dom)) { const b = btn('bdBtn primary', `▶ ${t('ctl.run')}`, () => ctx.callService(e, 'turn_on')); b.dataset.act = 'ctlRun'; out.push(b); }
    if (!['climate', 'water_heater', 'light'].includes(dom)) { const d = devCtl.controls(e); if (d) out.push(d); }
    return out;
  }
  function draw() {
    if (!dlg?.open || !forId) return;
    const e = forId;
    const head = make('div', 'ceHead ctlHead');
    head.append(make('h3', '', ctx.nameOf(e) || e), make('p', 'tpSub', `${ctx.word(e)} · ${e}`));
    const bar = make('div', 'ceBtns');
    const det = ctx.live.detailsButton?.(e);
    if (det) bar.append(det);
    const close = btn('bdBtn', t('ctl.close'), () => dlg.close()); close.dataset.act = 'ctlClose';
    bar.append(close);
    const box = make('div', 'ctlBody'); box.append(...body(e));
    dlg.replaceChildren(head, box, bar);
    drawn = sig();
  }
  /** the window for entity e */
  function open(e) {
    if (!dlg) {
      dlg = make('dialog', 'ceDlg ctlDlg');
      dlg.addEventListener('click', (ev) => { if (ev.target === dlg) dlg.close(); });
      dlg.addEventListener('close', () => { forId = null; clearInterval(timer); });
      dlg.addEventListener('pointerdown', (ev) => { if (ev.target.matches?.('input[type=range]')) held = true; });
      ['pointerup', 'pointercancel'].forEach((n) => window.addEventListener(n, () => { held = false; }));
      document.body.append(dlg);
    }
    forId = e;
    if (!dlg.open) dlg.showModal();
    draw();
    clearInterval(timer);
    timer = setInterval(() => { if (dlg.open && !busy() && sig() !== drawn) draw(); }, 600);    // the state changed: drawn again
  }
  return { open, close: () => dlg?.close(), isOpen: () => !!dlg?.open };
}
