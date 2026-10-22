/* "⤵ Von oben übernehmen" in "Zähler für den Verlauf" of the window ⚡ Rechnung (#501): asks the add-on for the counters (kWh) of the power
 * sensors set above (api/energy/counters), puts the ones it found into the meters and says per kind what it did; where a power sensor has
 * no counter, "＋ Zähler anlegen" makes one in Home Assistant (its "Integral" helper, api/energy/counter), which counts from then on.
 * energycounters.js has the rules; energymetersui.js puts the button into its part. */
import { COUNTER_KINDS, powerSources, counterQuery, takeCounters } from './energycounters.js';
import { cleanMeters, hasMeters } from './energyhistory.js';

const said = new WeakMap();                          // layout.energy -> the lines of the last "Von oben übernehmen" (the window is drawn again after it)

/** h: { t, el(tag, cls, text), edit(fn), energy() (layout.energy), sources() (energycalc.js energySources) }; -> { button, lines } */
export function counterPart(h) {
  const { t, el } = h;
  const store = (meters) => { const e = h.energy(); if (hasMeters(meters)) e.meters = Object.fromEntries(Object.entries(meters).filter(([, v]) => v.length)); else delete e.meters; };
  const lines = el('div', 'emCounters');
  const show = () => {
    const list = said.get(h.energy()) || [];
    lines.replaceChildren(...list.map((x) => {
      const r = el('div', `emCounter ${x.ok ? 'ok' : 'no'}`); r.dataset.kind = x.kind;
      r.append(el('b', '', `${x.ok ? '✓' : '•'} ${t(`em.${x.kind}`)}:`), el('span', '', x.text));
      if (x.make) {
        const b = el('button', '', t('ec.make')); b.type = 'button'; b.dataset.act = 'emMake'; b.dataset.source = x.make; b.title = t('ec.makeTip');
        b.addEventListener('click', () => make(x, b));
        r.append(b);
      }
      return r;
    }));
  };
  const remember = (list) => { said.set(h.energy(), list); show(); };
  async function make(x, b) {
    b.disabled = true; b.textContent = t('ec.making');
    try {
      const r = await fetch('api/energy/counter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: x.make }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.entity_id) throw new Error(j.error || String(r.status));
      const list = (said.get(h.energy()) || []).map((y) => (y === x ? { kind: x.kind, ok: true, text: `${j.name} — ${t('ec.made')}` } : y));
      said.set(h.energy(), list);
      h.edit(() => { const m = cleanMeters(h.energy().meters); if (!m[x.kind].includes(j.entity_id)) m[x.kind] = [...m[x.kind], j.entity_id]; store(m); });
    } catch { b.disabled = false; b.textContent = t('ec.make'); x.text = `${x.powerName} — ${t('ec.makeFail')}`; show(); }
  }
  const button = el('button', '', t('ec.take')); button.type = 'button'; button.id = 'emFromPower'; button.title = t('ec.takeTip');
  button.addEventListener('click', async () => {
    const src = powerSources(h.sources());
    if (!Object.keys(src.kinds).length) { remember([{ kind: 'from', ok: false, text: t('ec.nothing') }]); return; }
    button.disabled = true;
    let found;
    try {
      const r = await fetch(`api/energy/counters?${counterQuery(src.kinds)}`);
      if (!r.ok) throw new Error(String(r.status));
      found = (await r.json()).found || {};
    } catch { button.disabled = false; remember([{ kind: 'from', ok: false, text: t('em.takeFail') }]); return; }
    button.disabled = false;
    const res = takeCounters(h.energy().meters, found), list = [];
    COUNTER_KINDS.forEach((kind) => (found[kind] || []).forEach((x) => {
      const name = x.power_name || x.power;
      if (x.counter) list.push({ kind, ok: true, text: `${x.counter.name} ${res.had.some((y) => y.kind === kind && y.id === x.counter.entity_id) ? t('ec.had') : t('ec.added')}` });
      else if (src.signed.includes(x.power)) list.push({ kind, ok: false, text: `${name} — ${t('ec.signed')}` });
      else list.push({ kind, ok: false, text: `${name} — ${t('ec.none')}`, make: x.power, powerName: name });
    }));
    said.set(h.energy(), list);                      // before the window is drawn again: the new one shows it
    if (res.added.length) h.edit(() => store(res.meters)); else show();
  });
  show();
  return { button, lines };
}
