/* Heating panel (#134): next to the room panel, for the thermostats of the room (live mode), each with the other entities of its device
 * (child lock, window detection ..., #370) instead of among the room's switches.
 * A target temperature that is clicked with - / + is only sent after a short pause, so clicks in a row become one call. */
export const HEAT_DELAY = 700;

/** a wanted target temperature, rounded to the thermostat's step and held inside its limits (defaults 7 to 30 degrees, step 0.5) */
export function clampTarget(s, v) {
  const lo = s?.tmin ?? 7, hi = s?.tmax ?? 30, step = s?.tstep || 0.5;
  return Math.min(hi, Math.max(lo, Math.round(v / step) * step));
}
/** what the badge shows: off | heating | cooling | idle (a thermostat that is not reported counts as off) */
export function heatBadge(s) {
  if (!s || s.state === 'off') return 'off';
  return s.hvac || 'idle';
}

/** the rows of the room panel ([{ entity, name }]) split (#370): the other entities of a shown thermostat's device (partOf: entity ->
 *  its climate entity, from the areas) go with the heating, { parts: { climate id: [rows] }, rest: [rows] }; those of a thermostat that is
 *  not shown (another room) stay in rest */
export function splitHeatParts(rows, climates, partOf = {}) {
  const shown = new Set(climates), parts = {}, rest = [];
  rows.forEach((d) => {
    const c = partOf[d.entity];
    if (c && shown.has(c) && !d.entity.startsWith('climate.')) (parts[c] ||= []).push(d);
    else rest.push(d);
  });
  return { parts, rest };
}
/** the name of a thermostat's part without the thermostat's name in front ("Heizung Küche Child lock" -> "Child lock") */
export function partName(name, head) {
  const n = name || '', h = (head || '').trim();
  return h && n.length > h.length && n.toLowerCase().startsWith(`${h.toLowerCase()} `) ? n.slice(h.length + 1) : n;
}
const TOGGLES = new Set(['switch', 'input_boolean', 'fan']);   // parts with a slide switch; the others show their state

/**
 * @param {{box: HTMLElement, t: Function, states: () => object, callService: Function, open: () => boolean, stateText?: Function, isOn?: Function}} ctx
 *   `open` says whether the room panel is open (the heating panel only shows next to it); stateText(id) / isOn(id): a part's state.
 */
export function initHeatPanel({ box, t, states, callService, open, stateText = (e) => states()[e]?.state ?? '', isOn = (e) => states()[e]?.state === 'on' }) {
  const pending = new Map();                 // entity -> { v, timer }: a target that was clicked but not sent yet
  let devs = [], parts = {};
  const target = (e, s) => pending.get(e)?.v ?? s?.tt;
  function send(e, v) {
    v = clampTarget(states()[e], v);
    const old = pending.get(e); if (old) clearTimeout(old.timer);
    pending.set(e, { v, timer: setTimeout(() => { pending.delete(e); callService(e, 'set_temperature', { temperature: v }); }, HEAT_DELAY) });
    render();
  }
  /** a part of a thermostat's device (#370): a slide switch (child lock ...) or its value */
  function partRow(d, head) {
    const e = d.entity, row = document.createElement('div'); row.className = 'hp-part';
    const n = document.createElement('span'); n.className = 'hp-part-n'; n.textContent = partName(d.name || states()[e]?.name || e, head);
    row.append(n);
    if (TOGGLES.has(e.split('.')[0])) {
      const sw = document.createElement('label'); sw.className = 'sw'; sw.title = t('live.toggle');
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = isOn(e);
      cb.addEventListener('change', () => callService(e, cb.checked ? 'turn_on' : 'turn_off'));
      sw.append(cb, document.createElement('span'));
      row.append(sw);
    } else {
      const v = document.createElement('span'); v.className = 'hp-part-v'; v.textContent = stateText(e);
      row.append(v);
    }
    return row;
  }
  /** list: the thermostats [{ entity, name }]; withParts: { climate id: [rows] } (splitHeatParts) */
  function render(list, withParts) {
    if (list) { devs = list; parts = withParts || {}; }
    if (!devs.length || !open()) { box.hidden = true; return; }
    box.hidden = false; box.replaceChildren();
    const h = document.createElement('h4'); h.textContent = t('heat.title'); box.append(h);
    devs.forEach((d) => {
      const e = d.entity, s = states()[e], card = document.createElement('div'); card.className = 'hp';
      const head = document.createElement('div'); head.className = 'hp-head';
      const nm = document.createElement('span'); nm.className = 'hp-name'; nm.textContent = d.name || s?.name || e;
      const badge = document.createElement('span');
      const act = heatBadge(s);
      badge.className = 'hp-badge ' + act;
      badge.textContent = act === 'heating' ? `🔥 ${t('heat.heating')}` : act === 'cooling' ? `❄ ${t('heat.cooling')}` : act === 'off' ? t('heat.off') : t('heat.idle');
      head.append(nm, badge);
      const temps = document.createElement('div'); temps.className = 'hp-temps';
      const now = document.createElement('div'); now.className = 'hp-now';
      now.append(typeof s?.ct === 'number' ? `${Math.round(s.ct * 10) / 10} °C` : '– °C');
      const lab = document.createElement('small'); lab.textContent = t('heat.now'); now.append(lab);
      temps.append(now);
      const goal = target(e, s);
      if (typeof goal === 'number' && s?.state !== 'off') {
        const set = document.createElement('div'); set.className = 'hp-set';
        const step = s.tstep || 0.5;
        const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.title = t('heat.minus');
        const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.title = t('heat.plus');
        const val = document.createElement('b'); val.textContent = `${Math.round(goal * 10) / 10} °C`; val.title = t('heat.target');
        minus.addEventListener('click', () => send(e, goal - step));
        plus.addEventListener('click', () => send(e, goal + step));
        set.append(minus, val, plus); temps.append(set);
      }
      card.append(head, temps);
      if (Array.isArray(s?.modes) && s.modes.length) {
        const modes = document.createElement('div'); modes.className = 'hp-modes';
        s.modes.forEach((m) => {
          const b = document.createElement('button'); b.type = 'button'; b.className = m === s.state ? 'on' : ''; b.textContent = t(`heat.mode.${m}`) === `heat.mode.${m}` ? m : t(`heat.mode.${m}`);
          b.addEventListener('click', () => callService(e, 'set_hvac_mode', { hvac_mode: m }));
          modes.append(b);
        });
        card.append(modes);
      }
      (parts[e] || []).forEach((p) => card.append(partRow(p, nm.textContent)));
      box.append(card);
    });
  }
  return { render, pending: () => pending.size };
}
