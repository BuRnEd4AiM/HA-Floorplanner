/* The top of the tab "⚡ Rechnung" of the power editor (#407): take over the energy dashboard of Home Assistant (grid, solar, battery
 * with their signs, its gas and water meters) and the check list of what is set up and what is still missing, each with what to do.
 * The rules are in energyprefs.js (tested); this file only draws. 5.6.0: a card of its own under the calculation; the check list folds
 * away while nothing is to do (its line says how many are done and open), a tap opens it (and it stays as tapped). */
import { fromEnergyPrefs, applyPrefs, setupChecklist } from './energyprefs.js';
import { energyBalance } from './energycalc.js';

const ICON = { ok: '✅', todo: '○', warn: '⚠', info: 'ℹ' };

/** ctx: $, t, layout(), units (energyunitsui.js: energyOf(), editLayout()), states(), entities(), snapshot(), changed(), refresh() (the power
 *  overview), rerender() (the whole tab); for a
 *  meter of the energy dashboard put into the plan: floor(), center() ({ cx, cz } of the open floor), uid(), setStatus(txt), deviceY(type),
 *  onWall(device) (a wall meter onto the nearest wall), placed() (the plan built again) */
export function initEnergySetup(ctx) {
  const { $, t } = ctx;
  let prop = null, status = '', busy = false;                       // what the energy dashboard proposes, a line under the button
  let listOpen = null;                                              // the check list opened or closed by a tap (null: open while something is to do)
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const nameOf = (id) => { const n = ctx.entities().find((e) => e.entity_id === id)?.name; return n && n !== id ? `${n} (${id})` : id; };
  const energy = () => ctx.units.energyOf();                         // the plan's calculation, or the building's (energyunits.js)

  /** ask the add-on for the energy dashboard's settings */
  async function load() {
    busy = true; status = t('energy.ha.loading'); render();
    try {
      const r = await fetch('api/energy/prefs'), j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || r.status);
      prop = j.prefs ? fromEnergyPrefs(j.prefs, j.siblings || {}, ctx.states()) : null;
      status = !j.prefs ? t('energy.ha.none') : prop.empty ? t('energy.ha.nothing') : t('energy.ha.found');
    } catch (err) { prop = null; status = `${t('energy.ha.failed')}: ${err.message}`; }
    busy = false;
    ctx.rerender();
  }
  /** the proposal as lines: what would be set (a guess is marked: the sign may need turning round in the checks below) */
  function proposalLines(p) {
    const out = [], guess = (g) => (g ? ` · ${t('energy.ha.guess')}` : '');
    if (p.grid?.split) out.push(t('energy.ha.gridSplit', { imp: nameOf(p.grid.imp || '–'), exp: nameOf(p.grid.exp || '–') }) + guess(p.grid.guess));
    else if (p.grid) out.push(t(p.grid.invert ? 'energy.ha.gridInv' : 'energy.ha.grid', { e: nameOf(p.grid.entity) }) + guess(p.grid.guess));
    if (p.solar.length) out.push(t('energy.ha.solar', { list: p.solar.map(nameOf).join(', ') }) + guess(p.solarGuess));
    const b = p.battery;
    if (b?.split) out.push(t('energy.ha.batSplit', { c: nameOf(b.charge || '–'), d: nameOf(b.discharge || '–') }));
    else if (b?.entity) out.push(t(b.invert ? 'energy.ha.batInv' : 'energy.ha.bat', { e: nameOf(b.entity) }) + guess(b.guess));
    if (b?.level) out.push(t('energy.ha.level', { e: nameOf(b.level) }));
    if (p.meters.length) out.push(t('energy.ha.meters', { list: p.meters.map((m) => `${t(`energy.cl.kind.${m.kind}`)}: ${nameOf(m.entity)}`).join(', ') }));
    p.more.forEach((k) => out.push(t(`energy.ha.more.${k}`)));
    return out;
  }
  function apply() {
    if (!prop) return;
    ctx.snapshot();
    const done = applyPrefs(energy(), prop);
    ctx.changed(); ctx.refresh();
    status = done.length ? t('energy.ha.done', { list: done.map((k) => t(`energy.${k}`)).join(', ') }) : t('energy.ha.nothing');
    ctx.rerender();
  }

  /** a meter of the energy dashboard into the middle of the open floor (a wall meter onto the nearest wall), linked to its sensor */
  function addMeter(kind, entity) {
    const type = `${kind}meter`, { cx, cz } = ctx.center(), name = ctx.entities().find((v) => v.entity_id === entity)?.name || t(`dev.${type}`);
    const d = { id: ctx.uid(), type, x: +cx.toFixed(2), z: +cz.toFixed(2), y: ctx.deviceY(type), rot: 0, scale: 1, name, entity };
    ctx.snapshot();
    ctx.onWall(d);
    ctx.floor().devices.push(d);
    ctx.placed();
    ctx.setStatus(t('energy.cl.placed', { name }));
  }

  /** the check list, drawn again at every state update while the window is open: folded away while nothing is to do */
  function checklist() {
    const L = ctx.units.editLayout(), states = ctx.states(), list = setupChecklist(energyBalance(states, L), L, states, prop);
    const box = el('details', 'enClBox'); box.id = 'enClBox';
    const todo = list.filter((c) => c.level === 'todo' || c.level === 'warn').length, ok = list.filter((c) => c.level === 'ok').length;
    box.open = listOpen ?? todo > 0;
    const sum = el('summary', '');
    sum.append(el('b', '', t('energy.cl.title')), el('span', `enClCount${todo ? ' todo' : ''}`, t('energy.cl.count', { ok, todo })));
    sum.addEventListener('click', () => { listOpen = !box.open; });   // before it toggles: the state it is going to
    box.append(sum);
    const ul = el('ul', 'enChecklist'); ul.id = 'enChecklist';
    list.forEach((c) => {
      const li = el('li', `enCl ${c.level}`); li.dataset.key = c.key; li.dataset.level = c.level;
      li.append(el('span', 'enClIcon', ICON[c.level]), el('span', '', t(`energy.cl.${c.key}.${c.level}`, c.params)));
      (c.params.missing || []).forEach((m) => {
        const b = el('button', 'enAddMeter', t('energy.cl.addMeter', { kind: t(`energy.cl.kind.${m.kind}`) })); b.type = 'button'; b.dataset.entity = m.entity;
        b.title = m.entity;
        b.addEventListener('click', () => { addMeter(m.kind, m.entity); ctx.rerender(); });
        li.append(b);
      });
      ul.append(li);
    });
    box.append(ul);
    return box;
  }
  function render() {
    const box = $('#energySetup');
    if (!box) return;
    if (!ctx.units.editLayout()) { box.replaceChildren(); return; }   // per building, none chosen yet
    const out = [el('h3', 'enSetupHead', t('energy.setup'))];
    const bar = el('div', 'stopTools'), go = el('button', '', t('energy.ha.load')); go.type = 'button'; go.id = 'enHaLoad'; go.title = t('energy.ha.loadTip'); go.disabled = busy;
    go.addEventListener('click', load);
    bar.append(go);
    if (prop && !prop.empty) {
      const ap = el('button', 'primary', t('energy.ha.apply')); ap.type = 'button'; ap.id = 'enHaApply'; ap.title = t('energy.ha.applyTip');
      ap.addEventListener('click', apply);
      bar.append(ap);
    }
    out.push(bar);
    if (status) out.push(el('p', 'sub enHaStatus', status));
    if (prop && !prop.empty) { const ul = el('ul', 'enHaList'); proposalLines(prop).forEach((x) => ul.append(el('li', '', x))); out.push(ul); }
    out.push(checklist());
    box.replaceChildren(...out);
  }
  /** the values changed: only the check list again */
  function update() { const old = $('#enClBox'); if (old && ctx.units.editLayout()) old.replaceWith(checklist()); }
  return { render, update };
}
