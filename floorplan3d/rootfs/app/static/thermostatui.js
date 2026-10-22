/* Draws the thermostat of thermostat.js (#495): the circle (drag the knob or tap the circle), − / +, the modes, presets and fan modes; big
 * (the whole card) or small (the circle with − / + beside it). Several taps on − / + and a drag become one call after a short pause
 * (HEAT_DELAY, as in the heating panel). Used by the page 🌡 Klima (pageclimate.js) and the own card "Thermostat" (cardsui.js). */
import { thermoModel, angleOf, arcPath, pointAt, valueAt, START, SWEEP } from './thermostat.js';
import { clampTarget, HEAT_DELAY, chipText } from './heatpanel.js';

const NS = 'http://www.w3.org/2000/svg';
const W = 220, H = 196, CX = 110, CY = 104, R = 88;
const TONES = { heat: ['#ffc85a', '#ff5b2e'], cool: ['#9fe3ff', '#2f8cf0'], auto: ['#7ee0a0', '#ffb04a'], fan: ['#b6c4d2', '#6f8aa6'], off: ['#5b6875', '#5b6875'] };
let uid = 0;

/** ctx: t, lang(), settings() (units), states(), callService(entity, service, data), changed() (a target is waiting or was sent: draw again) */
export function initThermostat(ctx) {
  const { t } = ctx;
  const pending = new Map();                         // entity -> { v, timer }
  let dragging = null;                               // the entity whose knob is being dragged
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const svg = (tag, attrs) => { const n = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); return n; };
  const btn = (cls, text, on, title) => {
    const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title;
    b.addEventListener('click', (e) => { e.stopPropagation(); on(); });
    return b;
  };
  const lang = () => ctx.lang() || 'de';
  const imperial = () => ctx.settings().units === 'imperial';
  const deg = (c) => {
    if (typeof c !== 'number') return '–';
    const v = imperial() ? c * 9 / 5 + 32 : c;
    try { return v.toLocaleString(lang(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }); } catch { return v.toFixed(1); }
  };
  const wanted = (e) => pending.get(e)?.v ?? null;
  const readOnly = (e) => !e.startsWith('climate.');   // a water heater's target is shown, not set (the add-on only sets thermostats)

  function send(e, v) {
    v = clampTarget(ctx.states()[e], v);
    const old = pending.get(e); if (old) clearTimeout(old.timer);
    pending.set(e, { v, timer: setTimeout(() => { pending.delete(e); ctx.callService(e, 'set_temperature', { temperature: v }); ctx.changed(); }, HEAT_DELAY) });
    ctx.changed();
  }
  const modeText = (m) => { const k = `heat.mode.${m}`, x = t(k); return x === k ? m : x; };

  /** the circle with the target in the middle; drag the knob (or tap the circle) to set it */
  function dial(e, m, small) {
    const box = make('div', `thDial tone-${m.tone}`);
    const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'thSvg', role: 'slider', 'aria-label': t('th.target'), 'aria-valuemin': m.lo, 'aria-valuemax': m.hi });
    const id = `thg${++uid}`, [c0, c1] = TONES[m.tone];
    const defs = svg('defs', {}), grad = svg('linearGradient', { id, x1: 0, x2: 1, y1: 0, y2: 0 });
    grad.append(svg('stop', { offset: 0, 'stop-color': c0 }), svg('stop', { offset: 1, 'stop-color': c1 }));
    defs.append(grad); s.append(defs);
    s.append(svg('path', { d: arcPath(CX, CY, R, START, START + SWEEP), class: 'thTrack' }));
    const val = svg('path', { d: '', class: 'thArc', stroke: `url(#${id})` });
    s.append(val);
    if (!small) {
      for (let i = 0; i <= 26; i++) {
        const a = START + (i / 26) * SWEEP, [x0, y0] = pointAt(CX, CY, R - 17, a), [x1, y1] = pointAt(CX, CY, R - 12, a);
        s.append(svg('line', { x1: x0.toFixed(1), y1: y0.toFixed(1), x2: x1.toFixed(1), y2: y1.toFixed(1), class: 'thTick' }));
      }
    }
    const nowDot = svg('circle', { r: 4, class: 'thNowDot' }), knob = svg('circle', { r: 13, class: 'thKnob' });
    s.append(nowDot, knob);
    const mid = make('div', 'thMid'), lab = make('small'), big = make('b', 'thT'), sub = make('span', 'thNow');
    mid.append(lab, big, sub);
    box.append(s, mid);
    const show = (target) => {
      const on = target !== null;
      val.setAttribute('d', on ? arcPath(CX, CY, R, START, angleOf(target, m.lo, m.hi)) : '');
      knob.style.display = on ? '' : 'none';
      if (on) { const [x, y] = pointAt(CX, CY, R, angleOf(target, m.lo, m.hi)); knob.setAttribute('cx', x.toFixed(1)); knob.setAttribute('cy', y.toFixed(1)); }
      nowDot.style.display = m.now === null ? 'none' : '';
      if (m.now !== null) { const [x, y] = pointAt(CX, CY, R, angleOf(m.now, m.lo, m.hi)); nowDot.setAttribute('cx', x.toFixed(1)); nowDot.setAttribute('cy', y.toFixed(1)); }
      lab.textContent = on ? t('th.target') : m.off ? t('heat.off') : t('th.now');
      big.replaceChildren(document.createTextNode(deg(on ? target : m.now)), make('sup', '', '°'));
      sub.textContent = on ? (m.now !== null ? t('th.nowIs', { v: `${deg(m.now)}°` }) : '') : t('th.inRoom');
      s.setAttribute('aria-valuenow', on ? target : '');
    };
    show(m.target);
    if (m.target !== null && !readOnly(e)) {         // dragging: the circle follows the finger, the value is sent when it lets go
      s.classList.add('thDrag');
      const at = (ev) => { const r = s.getBoundingClientRect(); return valueAt(((ev.clientX - r.left) / r.width) * W, ((ev.clientY - r.top) / r.height) * H, CX, CY, ctx.states()[e]); };
      let v = m.target;
      s.addEventListener('pointerdown', (ev) => {
        if (ev.button > 0) return;
        ev.preventDefault(); ev.stopPropagation();
        dragging = e; s.setPointerCapture?.(ev.pointerId);
        v = at(ev); show(v);
      });
      s.addEventListener('pointermove', (ev) => { if (dragging !== e) return; v = at(ev); show(v); });
      const end = () => { if (dragging !== e) return; dragging = null; send(e, v); };
      s.addEventListener('pointerup', end); s.addEventListener('pointercancel', end);
      s.addEventListener('click', (ev) => ev.stopPropagation());
    }
    return box;
  }
  function steps(e, m) {
    const row = make('div', 'thPM');
    if (m.target === null || readOnly(e)) return row;
    row.append(btn('thMinus', '−', () => send(e, m.target - m.step), t('heat.minus')), btn('thPlus', '+', () => send(e, m.target + m.step), t('heat.plus')));
    return row;
  }
  function modes(e, m, small) {
    const row = make('div', `thModes${small ? ' small' : ''}`);
    m.modes.forEach((x) => {
      const b = btn(`thMode m-${x.key}${x.on ? ' on' : ''}`, null, () => ctx.callService(e, 'set_hvac_mode', { hvac_mode: x.key }), modeText(x.key));
      b.dataset.mode = x.key;
      b.append(make('span', 'thModeIcon', x.icon));
      if (!small) b.append(make('small', '', modeText(x.key)));
      row.append(b);
    });
    return row;
  }
  function chips(e, list, kind, service, field) {
    const row = make('div', `thChips th-${kind}s`);
    list.list.forEach((p) => {
      const b = btn(`thChip${p === list.value ? ' on' : ''}`, chipText(t, kind, p), () => ctx.callService(e, service, { [field]: p }));
      b.dataset.v = p; row.append(b);
    });
    return row;
  }

  /** the thermostat of an entity: { el, model } (el null without a state); size 'big' | 'small' */
  function render(e, size = 'big') {
    const s = ctx.states()[e], m = thermoModel(s, wanted(e));
    if (!m) return { el: null, model: null };
    const small = size === 'small';
    const el = make('div', `th ${small ? 'small' : 'big'}`); el.dataset.entity = e;
    if (small) {
      const side = make('div', 'thSide');
      side.append(steps(e, m));
      if (m.modes.length) side.append(modes(e, m, true));
      el.append(dial(e, m, true), side);
    } else {
      el.append(dial(e, m, false), steps(e, m));
      if (m.modes.length) el.append(modes(e, m, false));
      if (m.presets) el.append(chips(e, m.presets, 'preset', 'set_preset_mode', 'preset_mode'));
      if (m.fans) el.append(chips(e, m.fans, 'fan', 'set_fan_mode', 'fan_mode'));
    }
    return { el, model: m };
  }
  /** what a thermostat's card depends on (its states, a target being tapped) */
  const sig = (e) => { const s = ctx.states()[e]; return s ? [s.state, s.ct, s.tt, s.hvac, s.modes, s.ctl?.preset, s.ctl?.fan, s.ctl?.presets, s.ctl?.fans, s.tmin, s.tmax, s.tstep, wanted(e)] : null; };
  return { render, sig, busy: () => dragging !== null, wanted };
}
