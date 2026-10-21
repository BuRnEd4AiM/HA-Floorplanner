/* The part "Zähler für den Verlauf" of the window ⚡ Rechnung (#481): which meters (kWh, m³) the page ⚡ Energie counts with for this
 * house, and its prices. Empty means: those of Home Assistant's energy dashboard (there is only one of it for the whole Home Assistant,
 * so a second house needs its own meters here). "Aus dem Energie-Dashboard übernehmen" copies them in. Kept with the house in
 * layout.energy.meters and layout.energy.price. The rules are in energyhistory.js (tested); energyui.js puts this part into its window. */
import { METER_KEYS, KIND_SORT, meterKind, cleanMeters, hasMeters } from './energyhistory.js';

/** h: { t, el(tag, cls, text), edit(fn) (undo step, change, save, draw again), energy() (layout.energy), adder(list, room, onAdd),
 *  entities(), states() }; returns the nodes of the part */
export function meterPart(h) {
  const { t, el } = h;
  const out = [el('h3', '', t('em.title')), el('p', 'sub', t('em.hint'))];
  const meters = () => cleanMeters(h.energy().meters);
  const sensorsFor = (k) => {
    const st = h.states(), list = h.entities().filter((e) => e.entity_id.startsWith('sensor.'));
    const fit = list.filter((e) => KIND_SORT[k].includes(meterKind(st[e.entity_id])));
    return fit.length ? fit : list;
  };
  const set = (k, ids) => h.edit(() => {
    const e = h.energy(), m = cleanMeters(e.meters);
    m[k] = ids;
    if (hasMeters(m)) e.meters = Object.fromEntries(Object.entries(m).filter(([, v]) => v.length)); else delete e.meters;
  });
  /** a chosen meter as a chip: its name, what it counts now with its unit, × */
  const chip = (id, onRemove) => {
    const st = h.states()[id], c = el('span', 'enChip'); c.title = id;
    const name = h.entities().find((e) => e.entity_id === id)?.name || id;
    c.append(el('b', '', name), el('small', '', st && st.state !== '' ? `${st.state}${st.unit ? ` ${st.unit}` : ''}` : '–'));
    const x = el('button', '', '×'); x.type = 'button'; x.title = t('energy.remove'); x.addEventListener('click', onRemove);
    c.append(x);
    return c;
  };
  const now = meters();
  out.push(el('p', `sub emSource${hasMeters(now) ? ' own' : ''}`, t(hasMeters(now) ? 'em.own' : 'em.fromHa')));
  const take = el('button', '', t('em.take')); take.type = 'button'; take.id = 'emTake'; take.title = t('em.takeTip');
  const said = el('span', 'sub emSaid');
  take.addEventListener('click', async () => {
    try {
      const r = await fetch('api/energy/meters');
      if (!r.ok) throw new Error(String(r.status));
      const x = await r.json(), m = cleanMeters(x.meters);
      if (!hasMeters(m)) { said.textContent = t('em.takeNone'); return; }
      h.edit(() => {
        const e = h.energy();
        e.meters = Object.fromEntries(Object.entries(m).filter(([, v]) => v.length));
        if (x.price?.buy > 0 && !(Number(e.price?.buy) > 0)) e.price = { buy: x.price.buy, ...(x.price.sell > 0 ? { sell: x.price.sell } : {}) };
      });
    } catch { said.textContent = t('em.takeFail'); }
  });
  const bar = el('div', 'stopTools'); bar.append(take, said);
  if (hasMeters(now)) {
    const clear = el('button', '', t('em.clear')); clear.type = 'button'; clear.id = 'emClear';
    clear.addEventListener('click', () => h.edit(() => { delete h.energy().meters; }));
    bar.append(clear);
  }
  out.push(bar);
  METER_KEYS.forEach((k) => {
    const box = el('div', 'emKind'); box.dataset.kind = k;
    box.append(el('b', '', t(`em.${k}`)));
    const chips = el('div', 'enChips');
    now[k].forEach((id) => chips.append(chip(id, () => set(k, now[k].filter((x) => x !== id)))));
    box.append(chips, h.adder(sensorsFor(k), null, (v) => { if (!now[k].includes(v)) set(k, [...now[k], v]); }));
    out.push(box);
  });
  // the prices: per kWh drawn and per kWh fed in (empty: those of the energy dashboard, if it has fixed ones)
  const price = h.energy().price || {};
  const row = el('div', 'emPrices');
  [['buy', 'em.buy'], ['sell', 'em.sell']].forEach(([k, key]) => {
    const lab = el('label', '', t(key));
    const inp = el('input'); inp.type = 'number'; inp.min = '0'; inp.step = '0.001'; inp.id = `emPrice_${k}`; inp.value = Number(price[k]) > 0 ? String(price[k]) : '';
    inp.placeholder = '0.30';
    inp.addEventListener('change', () => {
      const v = parseFloat(inp.value), want = v > 0 && v < 100 ? v : undefined;
      if (want === (Number(h.energy().price?.[k]) > 0 ? Number(h.energy().price[k]) : undefined)) return;   // nothing new (a second change on leaving the field)
      setTimeout(() => h.edit(() => {                                  // after the field has let go: the window is drawn again
        const e = h.energy(), p = { ...(e.price || {}) };
        if (want !== undefined) p[k] = want; else delete p[k];
        if (Object.keys(p).length) e.price = p; else delete e.price;
      }));
    });
    lab.append(inp); row.append(lab);
  });
  out.push(row, el('p', 'sub', t('em.priceHint')));
  return out;
}
