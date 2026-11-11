/* ⚡ Power per building, the screen part: which calculations this screen shows (the building chosen at the top, or every building apart
 * with "🏘 Alle Gebäude"; the plan as one when it is not counted per building), and the head of the tab "⚡ Rechnung": the tick "⚡ Eigene
 * Rechnung je Gebäude" (from two buildings on) and "Rechnung für: Haupthaus | Gartenhaus" (switches the building shown, like the switch at
 * the top). Used by the power overview (power.js), the energy flow (energyflowui.js), ☀ Heute (pagetoday.js), the tab (energyui.js,
 * energysetup.js) and the page ⚡ Energie. The rules: energyunits.js (tested). */
import { perBuilding, shownUnits, energyTarget, splitEnergy, joinEnergy } from './energyunits.js';
import { buildingsOf, pickBuilding } from './buildings.js';

/** ctx: $, t, layout(), shown() (the building shown at the top, null: all), setShown(id), snapshot(), changed()
 *  (saves), refresh() (the power overview and what shows power), rerender() (the tab again), setStatus(text), confirm(text) */
export function initEnergyUnitsUi(ctx) {
  const { $, t } = ctx;
  let cache = { sig: null, units: [] };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const unnamed = () => t('bld.unnamed');

  /** what makes the units new: the plan, the building shown, its calculations, a rebuild (invalidate) */
  let rev = 0;
  function sig() {
    const L = ctx.layout();
    return [L, ctx.shown(), rev, L?.energy, ...buildingsOf(L).flatMap((b) => [b, b.energy, b.name])];
  }
  const same = (a, b) => !!a && a.length === b.length && a.every((x, i) => x === b[i]);
  /** the units this screen shows: [{ key, bid, name, layout }] (one, or every building apart) */
  function shown() {
    const s = sig();
    if (!same(cache.sig, s)) cache = { sig: s, units: shownUnits(ctx.layout(), ctx.shown(), {}, { unnamed: unnamed() }) };
    return cache.units;
  }
  /** the unit the tab sets: the only one shown, null when the plan counts per building and all buildings are shown */
  const edited = () => { const u = shown(); return u.length === 1 ? u[0] : null; };
  /** where the tab writes (made when missing), null without a building chosen */
  const energyOf = () => energyTarget(ctx.layout(), ctx.shown());

  /** "Rechnung für: 🏠 Haupthaus | 🏠 Anbau": a button per building, the one set now lit (5.6.0: also fixed in the title of the window) */
  function chips(L, bs) {
    const cur = pickBuilding(L, ctx.shown()), row = el('div', 'euChips'); row.append(el('span', 'sub', t('eu.for')));
    bs.forEach((b) => {
      const c = el('button', `euChip${b.id === cur ? ' on' : ''}`, `🏠 ${b.name || unnamed()}`); c.type = 'button'; c.dataset.building = b.id;
      c.addEventListener('click', () => { ctx.setShown(b.id); ctx.rerender(); });
      row.append(c);
    });
    return row;
  }

  /* ---- the head of the tab: a card "🏘 n Gebäude in diesem Plan" at the top (5.6.0), the buildings again in the title of the window ---- */
  function renderHead() {
    const box = $('#energyUnits'), bar = $('#energyBld');
    if (!box) return;
    const L = ctx.layout(), bs = buildingsOf(L);
    if (bs.length < 2) { box.replaceChildren(); box.hidden = true; if (bar) { bar.replaceChildren(); bar.hidden = true; } return; }
    box.hidden = false;
    const on = perBuilding(L), out = [el('h3', 'euHead', `🏘 ${t('eu.count', { n: bs.length })}`)];
    const row = el('div', 'row check'), cb = el('input'); cb.type = 'checkbox'; cb.id = 'enPerBuilding'; cb.checked = on;
    const lab = el('label', '', t('eu.per')); lab.htmlFor = 'enPerBuilding';
    row.append(cb, lab);
    cb.addEventListener('change', () => {
      if (cb.checked) {
        ctx.snapshot();
        const heir = splitEnergy(ctx.layout(), ctx.shown());
        ctx.changed(); ctx.refresh();
        ctx.setStatus(t('eu.splitDone', { name: bs.find((b) => b.id === heir)?.name || unnamed() }));
      } else {
        const keep = pickBuilding(L, ctx.shown()) || bs.find((b) => b.energy && Object.keys(b.energy).length)?.id || bs[0].id;
        const name = bs.find((b) => b.id === keep)?.name || unnamed();
        if (!ctx.confirm(t('eu.joinAsk', { name }))) { cb.checked = true; return; }
        ctx.snapshot();
        joinEnergy(ctx.layout(), keep);
        ctx.changed(); ctx.refresh();
        ctx.setStatus(t('eu.joinDone', { name }));
      }
      ctx.rerender();
    });
    out.push(row, el('p', 'sub', t(on ? 'eu.onHint' : 'eu.offHint')));
    if (on) {
      out.push(chips(L, bs));
      if (!pickBuilding(L, ctx.shown())) out.push(el('p', 'enWarn euPick', t('eu.pick')));
    }
    box.classList.toggle('on', on);
    box.replaceChildren(...out);
    if (bar) { bar.hidden = !on; bar.replaceChildren(...(on ? [chips(L, bs)] : [])); }   // in the title: always in sight while scrolling
  }

  return {
    shown, edited, energyOf, renderHead,
    /** the plan as the unit set in the tab sees it (with .energy), null without one */
    editLayout: () => edited()?.layout || null,
    /** what the tab draws: a new one draws the window again */
    editKey: () => `${edited()?.bid ?? (edited() ? 'plan' : '-')}|${perBuilding(ctx.layout())}`,
    /** the plan was built again (rooms, devices or buildings may have changed) */
    invalidate: () => { rev++; },
  };
}
