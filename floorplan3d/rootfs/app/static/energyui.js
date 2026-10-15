/* The tab "⚡ Rechnung" of the power editor (#378): a window in which you set which Home Assistant sensor is what (grid, solar, battery,
 * house, rooms) and how it is counted, with the calculation live at the top and what does not add up (with a button to turn a sign
 * round). Saved with the house in layout.energy; the power overview at the top left (also in live mode) counts with it. The rules are
 * in energycalc.js (unit tests); this file only draws the window. */
import { energyBalance, energySources, energyChecks, balanceRows, suggestRooms, flipSign, sensorWatts, fmtSigned, isPowerState, batteryNow } from './energycalc.js';

/**
 * ctx: $, t, layout(), states(), entities(), entityPicker(list, room, current, onChange), pickerField(label, picker), snapshot(),
 * changed() (saves; nothing in 3D changes), refresh() (the power overview), areaOf(), pointInPoly(x, z, points)
 */
export function initEnergyUi(ctx) {
  const { $, t } = ctx;
  const dlg = $('#energyDialog'), result = $('#energyResult'), body = $('#energyBody');
  let lives = [], drawn = null;                                    // [element, () => text]: the values that follow the states; the plan drawn

  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const energy = () => { const L = ctx.layout(); if (!L.energy || typeof L.energy !== 'object') L.energy = {}; return L.energy; };
  const part = (k) => { const e = energy(); if (!e[k] || typeof e[k] !== 'object') e[k] = {}; return e[k]; };
  /** a change: undo step, change, save, the overview and the window again */
  function edit(fn) { ctx.snapshot(); fn(); ctx.changed(); ctx.refresh(); render(); }
  const setOr = (o, k, v) => { if (v) o[k] = v; else delete o[k]; };

  const sensors = () => ctx.entities().filter((e) => e.entity_id.startsWith('sensor.'));
  /** the sensors in W / kW (all sensors while Home Assistant has not told the units yet) */
  function powerSensors() { const all = sensors(), st = ctx.states(), p = all.filter((e) => isPowerState(st[e.entity_id])); return p.length ? p : all; }
  function levelSensors() { const all = sensors(), st = ctx.states(), p = all.filter((e) => (st[e.entity_id]?.unit || '') === '%'); return p.length ? p : all; }
  const nameOf = (id) => ctx.entities().find((e) => e.entity_id === id)?.name || id;
  /** the value of a sensor now, with its sign: "−1.20 kW", "–" without a number */
  const now = (id) => { const w = sensorWatts(ctx.states(), id); return w === null ? (ctx.states()[id]?.state ?? '–') : fmtSigned(w); };
  const live = (node, fn) => { lives.push([node, fn]); node.textContent = fn(); return node; };

  /** a picker with the value now below it; onChange(id or '') */
  function picker(label, list, current, onChange, room = null, meaning = null) {
    const f = ctx.pickerField(label, ctx.entityPicker(list, room, current || '', onChange));
    if (current) f.append(live(el('small', 'enNow'), () => `${t('energy.now')}: ${now(current)}${meaning ? meaning(sensorWatts(ctx.states(), current)) : ''}`));
    return f;
  }
  /** a picker that only adds (its "nothing chosen" line is hidden) */
  function adder(list, room, onAdd) {
    const p = ctx.entityPicker(list, room, '', (v) => { if (v) onAdd(v); });
    p.classList.add('enAdd');
    const s = p.querySelector('input'); if (s) s.placeholder = t('energy.add');
    return p;
  }
  /** a chosen sensor as a chip: name, value now, × */
  function chip(id, onRemove) {
    const c = el('span', 'enChip'); c.title = id;
    c.append(el('b', '', nameOf(id)), live(el('small'), () => now(id)));
    const x = el('button', '', '×'); x.type = 'button'; x.title = t('energy.remove'); x.addEventListener('click', onRemove);
    c.append(x); return c;
  }
  function select(id, options, value, onChange) {
    const s = el('select'); s.id = id;
    options.forEach(([v, key]) => s.add(new Option(t(key), v)));
    s.value = value; s.addEventListener('change', () => onChange(s.value));
    return s;
  }
  function check(id, key, on, onChange) {
    const r = el('div', 'row check'), i = el('input'); i.type = 'checkbox'; i.id = id; i.checked = on;
    const l = el('label', '', t(key)); l.htmlFor = id;
    i.addEventListener('change', () => onChange(i.checked));
    r.append(i, l); return r;
  }
  const devName = (d, e = d.entity) => `${d.name || t(`dev.${d.type}`)}${e ? ` (${e})` : ''}`;
  /** where a part comes from when the tab does not set it: the devices of the plan (each with its sensor) and, if given, the value now */
  function fromPlan(from, names, value = null) {
    if (from === 'plan') {
      const p = el('p', 'sub enFrom', t('energy.fromPlan', { list: names.join(', ') }));
      if (value) p.append(live(el('span'), () => ` · ${t('energy.now')}: ${value()}`));
      return p;
    }
    return from ? null : el('p', 'sub enFrom', t('energy.fromNone'));
  }
  /** the battery device of the plan a sensor belongs to, by name */
  const batName = (src, e) => { const d = src.battery.devices.find((x) => x.batPower === e || x.entity === e); return d ? devName(d, e) : e; };
  const planSum = (list, meaning) => () => {
    const w = list.map((e) => sensorWatts(ctx.states(), e)).filter((x) => x !== null);
    if (!w.length) return '–';
    const s = w.reduce((p, q) => p + q, 0);
    return `${fmtSigned(s)}${meaning ? meaning(s) : ''}`;
  };

  /* ---------- the calculation at the top ---------- */
  function renderResult() {
    const bal = energyBalance(ctx.states(), ctx.layout()), rows = balanceRows(bal, t), checks = energyChecks(bal);
    const out = [el('h3', '', t('energy.result'))];
    if (!rows.length) out.push(el('p', 'sub', t('energy.empty')));
    else {
      const tbl = el('div', 'enRows');
      rows.forEach((r) => {
        const line = el('div', `enRow ${r.cls}`.trim());
        line.append(el('span', 'enSign', r.sign), el('span', 'enLabel', r.label), el('span', 'enVal', r.value));
        tbl.append(line);
      });
      out.push(tbl);
    }
    if (!bal.sources.grid.from) out.push(el('p', 'enWarn', `⚠ ${t('energy.missGrid')}`));
    checks.forEach((c) => {
      const p = el('div', 'enWarn'); p.dataset.code = c.code;
      p.append(el('span', '', `⚠ ${t(`energy.chk.${c.code}`, c.params)}`));
      c.fixes.forEach((k) => {
        const b = el('button', 'enFix', t(`energy.fix.${k}`)); b.type = 'button'; b.dataset.fix = k;
        b.addEventListener('click', () => edit(() => flipSign(energy(), k)));
        p.append(b);
      });
      out.push(p);
    });
    if (rows.length && bal.sources.grid.from && !checks.length) out.push(el('p', 'enOk', t('energy.ok')));
    result.replaceChildren(...out);
  }

  /* ---------- the settings ---------- */
  function render() {
    lives = []; drawn = ctx.layout();
    const states = ctx.states(), L = ctx.layout(), cfg = L.energy || {};
    const src = energySources(cfg, L.floors.flatMap((f) => f.devices || []), states);
    const out = [];

    // the grid: one sensor (plus = drawn) or drawn and fed in apart
    const g = cfg.grid || {};
    out.push(el('h3', '', t('energy.grid')));
    out.push(ctx.pickerField(t('energy.how'), select('enGridMode', [['one', 'energy.grid.one'], ['two', 'energy.grid.two']], g.split ? 'two' : 'one',
      (v) => edit(() => { const p = part('grid'); if (v === 'two') p.split = true; else delete p.split; }))));
    if (g.split) {
      out.push(picker(t('energy.grid.imp'), powerSensors(), g.imp, (v) => edit(() => setOr(part('grid'), 'imp', v))));
      out.push(picker(t('energy.grid.exp'), powerSensors(), g.exp, (v) => edit(() => setOr(part('grid'), 'exp', v))));
    } else {
      const sign = (w) => (w === null ? '' : ` → ${t((g.invert ? -w : w) < 0 ? 'energy.means.feedIn' : 'energy.means.draw')}`);
      out.push(picker(t('energy.sensor'), powerSensors(), g.entity, (v) => edit(() => setOr(part('grid'), 'entity', v)), null, sign));
      out.push(check('enGridInvert', 'energy.grid.invert', !!g.invert, (on) => edit(() => setOr(part('grid'), 'invert', on))));
    }
    if (src.grid.from !== 'set') { const n = fromPlan(src.grid.from, src.grid.devices.map((d) => devName(d)), planSum(src.grid.net, g.split ? null : (w) => (w === null ? '' : ` → ${t((g.invert ? -w : w) < 0 ? 'energy.means.feedIn' : 'energy.means.draw')}`))); if (n) out.push(n); }

    // the production: several sensors, added up
    const pv = Array.isArray(cfg.solar?.entities) ? cfg.solar.entities.filter(Boolean) : [];
    out.push(el('h3', '', t('energy.solar')), el('p', 'sub', t('energy.solar.hint')));
    const chips = el('div', 'enChips');
    pv.forEach((id) => chips.append(chip(id, () => edit(() => { part('solar').entities = pv.filter((x) => x !== id); }))));
    out.push(chips, adder(powerSensors(), null, (v) => edit(() => { if (!pv.includes(v)) part('solar').entities = [...pv, v]; })));
    if (!pv.length) { const n = fromPlan(src.solar.from, src.solar.devices.map((d) => devName(d)), planSum(src.solar.entities)); if (n) out.push(n); }

    // the battery: level, one sensor or charge and discharge apart, counted in the consumption or not
    const b = cfg.battery || {};
    out.push(el('h3', '', t('energy.battery')));
    out.push(picker(t('energy.bat.level'), levelSensors(), b.level, (v) => edit(() => setOr(part('battery'), 'level', v))));
    if (!b.level && src.battery.levelFrom === 'plan') out.push(fromPlan('plan', [batName(src, src.battery.level)], () => { const v = parseFloat(ctx.states()[src.battery.level]?.state); return Number.isFinite(v) ? `${Math.round(v)} %` : '–'; }));
    out.push(ctx.pickerField(t('energy.how'), select('enBatMode', [['one', 'energy.bat.one'], ['two', 'energy.bat.two']], b.split ? 'two' : 'one',
      (v) => edit(() => { const p = part('battery'); if (v === 'two') p.split = true; else delete p.split; }))));
    if (b.split) {
      out.push(picker(t('energy.bat.charge'), powerSensors(), b.charge, (v) => edit(() => setOr(part('battery'), 'charge', v))));
      out.push(picker(t('energy.bat.discharge'), powerSensors(), b.discharge, (v) => edit(() => setOr(part('battery'), 'discharge', v))));
    } else {
      const sign = (w) => (w === null || !w ? '' : ` → ${t((b.invert ? -w : w) > 0 ? 'energy.means.charge' : 'energy.means.discharge')}`);
      out.push(picker(t('energy.sensor'), powerSensors(), b.entity, (v) => edit(() => setOr(part('battery'), 'entity', v)), null, sign));
      out.push(check('enBatInvert', 'energy.bat.invert', !!b.invert, (on) => edit(() => setOr(part('battery'), 'invert', on))));
    }
    if (src.battery.from === 'plan') {
      const flow = () => { const n = batteryNow(ctx.states(), src.battery); return n?.flow == null ? '–' : `${fmtSigned(n.flow)}${n.dir ? ` → ${t(n.dir > 0 ? 'energy.means.charge' : 'energy.means.discharge')}` : ''}`; };
      out.push(fromPlan('plan', src.battery.power.map((p) => batName(src, p.e)), flow));
    }
    out.push(check('enBatBalance', 'energy.bat.balance', b.balance !== false, (on) => edit(() => { const p = part('battery'); if (on) delete p.balance; else p.balance = false; })));
    out.push(el('p', 'sub', t('energy.bat.balanceHint')));

    // the house: calculated, or a sensor of its own (the calculation then is the check)
    out.push(el('h3', '', t('energy.house')), el('p', 'sub', t('energy.house.hint')));
    const hp = picker(t('energy.house.sensor'), powerSensors(), cfg.house?.entity, (v) => edit(() => setOr(part('house'), 'entity', v))); hp.id = 'enHouse';
    out.push(hp);

    // the rooms: which sensors measure what a room uses
    out.push(el('h3', '', t('energy.rooms')), el('p', 'sub', t('energy.rooms.hint')));
    const rooms = cfg.rooms && typeof cfg.rooms === 'object' ? cfg.rooms : {};
    const anyRoom = L.floors.some((f) => (f.rooms || []).length);
    if (!anyRoom) out.push(el('p', 'sub', t('energy.rooms.none')));
    else {
      const sug = el('button', '', t('energy.rooms.suggest')); sug.type = 'button'; sug.id = 'enSuggest'; sug.title = t('energy.rooms.suggestTip');
      const said = el('span', 'sub enSaid');
      sug.addEventListener('click', () => {
        const found = suggestRooms(ctx.layout(), ctx.states(), ctx.areaOf(), ctx.pointInPoly), n = Object.values(found).flat().length;
        if (n) edit(() => { const e = energy(); e.rooms = e.rooms || {}; Object.entries(found).forEach(([k, v]) => { e.rooms[k] = [...(e.rooms[k] || []), ...v]; }); });
        const msg = $('#energyBody .enSaid'); if (msg) msg.textContent = n ? t('energy.rooms.suggested', { n }) : t('energy.rooms.noneFound');
      });
      const bar = el('div', 'stopTools'); bar.append(sug, said); out.push(bar);
      L.floors.forEach((f) => {
        if (!(f.rooms || []).length) return;
        if (L.floors.length > 1) out.push(el('h4', 'enFloor', f.name || ''));
        f.rooms.forEach((r) => {
          const mine = Array.isArray(rooms[r.id]) ? rooms[r.id].filter(Boolean) : [];
          const box = el('div', 'enRoom'); box.dataset.room = r.id;
          const head = el('div', 'enRoomHead'); head.append(el('b', '', r.name || t('energy.room')));
          if (mine.length) head.append(live(el('small', 'enRoomSum'), () => { const w = mine.map((e) => sensorWatts(ctx.states(), e)).filter((x) => x !== null); return w.length ? fmtSigned(w.reduce((p, q) => p + q, 0)) : '–'; }));
          const cs = el('div', 'enChips');
          mine.forEach((id) => cs.append(chip(id, () => edit(() => { const e = energy(); const l = mine.filter((x) => x !== id); if (l.length) e.rooms[r.id] = l; else delete e.rooms[r.id]; }))));
          box.append(head, cs, adder(powerSensors(), r, (v) => edit(() => { const e = energy(); e.rooms = e.rooms || {}; if (!mine.includes(v)) e.rooms[r.id] = [...mine, v]; })));
          out.push(box);
        });
      });
    }
    body.replaceChildren(...out);
    renderResult();
  }

  /** after every state update: the calculation and the values while the window is open (the pickers stay as they are; all of it again
   *  when the plan was replaced, e.g. by undo) */
  function update() {
    if (!dlg?.open) return;
    if (ctx.layout() !== drawn) { render(); return; }
    renderResult();
    lives.forEach(([node, fn]) => { node.textContent = fn(); });
  }
  function open() { render(); dlg.showModal(); }
  $('#energyBtn')?.addEventListener('click', open);
  $('#energyClose')?.addEventListener('click', () => dlg.close());
  dlg?.addEventListener('click', (e) => {                       // a click on the dark backdrop closes it (not one on the window's own edge)
    const r = dlg.getBoundingClientRect();
    if (e.target === dlg && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) dlg.close();
  });
  return { open, update, isOpen: () => !!dlg?.open };
}
