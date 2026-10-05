/* Heating panel (#134): next to the room panel, for the thermostats of the room (live mode).
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

/**
 * @param {{box: HTMLElement, t: Function, states: () => object, callService: Function, open: () => boolean}} ctx
 *   `open` says whether the room panel is open (the heating panel only shows next to it).
 */
export function initHeatPanel({ box, t, states, callService, open }) {
  const pending = new Map();                 // entity -> { v, timer }: a target that was clicked but not sent yet
  let devs = [];
  const target = (e, s) => pending.get(e)?.v ?? s?.tt;
  function send(e, v) {
    v = clampTarget(states()[e], v);
    const old = pending.get(e); if (old) clearTimeout(old.timer);
    pending.set(e, { v, timer: setTimeout(() => { pending.delete(e); callService(e, 'set_temperature', { temperature: v }); }, HEAT_DELAY) });
    render();
  }
  function render(list) {
    if (list) devs = list;
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
      box.append(card);
    });
  }
  return { render, pending: () => pending.size };
}
