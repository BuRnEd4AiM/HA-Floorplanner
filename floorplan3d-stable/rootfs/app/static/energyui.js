/* The tab "⚡ Rechnung" of the power editor (#378): a window in which you set which Home Assistant sensor is what (grid, solar, battery,
 * house, rooms) and how it is counted, with the calculation live at the top and what does not add up (with a button to turn a sign
 * round). Saved with the house in layout.energy, or per building in building.energy (4.70.0, energyunits.js: the head of the window,
 * energyunitsui.js); the power overview at the top left (also in live mode) counts with it. The rules are in energycalc.js (unit
 * tests); this file only draws the window.
 * 5.6.0 (the owner: "dass der besser aussieht und man ihn einfacher bedienen kann"): at the top the power picture (energyflowui.js) next to
 * the calculation, each line with its symbol and where it comes from, a tap on it opens its part; every part a card of its own with its
 * symbol, what it is read from now and its value; a bar under the title jumps to a part (a coloured dot: chosen, from the plan, missing);
 * the rooms side by side. The look (parts, states, values) is in energylook.js (tested). */
import { energyBalance, energySources, energyChecks, balanceRows, suggestRooms, flipSign, sensorWatts, fmtSigned, isPowerState, batteryNow } from './energycalc.js';
import { energyFlows, flowTexts } from './energyflow.js';
import { flowSvg } from './energyflowui.js';
import { PARTS, partOf, rowPart, partStates, nowText } from './energylook.js';
import { hasMeters, cleanMeters } from './energyhistory.js';

/**
 * ctx: $, t, layout(), states(), entities(), entityPicker(list, room, current, onChange), pickerField(label, picker), snapshot(),
 * changed() (saves; nothing in 3D changes), refresh() (the power overview), areaOf(), pointInPoly(x, z, points), setup (the top of the
 * window: the energy dashboard and the check list, energysetup.js, #407), meterPart(helpers) (the meters of the page ⚡ Energie,
 * energymetersui.js, #481), units (energyunitsui.js: energyOf() where to write, editLayout() the plan as the calculation set here sees
 * it (with .energy; null: per building and no building chosen), editKey(), renderHead())
 */
export function initEnergyUi(ctx) {
  const { $, t } = ctx;
  const dlg = $('#energyDialog'), result = $('#energyResult'), body = $('#energyBody'), nav = $('#energyNav');
  let lives = [], drawn = null, drawnKey = '';                    // () => void: the values that follow the states; the plan drawn
  let res = null, pic = '';                                        // the calculation's card (its picture stays while it is the same: the dots run on)
  const FLOW_PART = { 'ef-solar': 'solar', 'ef-grid': 'grid', 'ef-home': 'house', 'ef-battery': 'battery' };

  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const energy = () => ctx.units.energyOf();                       // the plan's calculation, or the building's (energyunits.js)
  const scope = () => ctx.units.editLayout();                      // the plan as this calculation sees it (only its building's rooms and devices)
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
  const live = (node, fn) => { const set = () => { node.textContent = fn(); }; lives.push(set); set(); return node; };
  /** the states of the parts now (energylook.js): the dots of the bar, the labels and values on the cards */
  let stMemo = null;                                               // worked out once per drawing (render, update)
  function states() {
    if (stMemo) return stMemo;
    const L = scope(); if (!L) return null;
    const rooms = L.floors.reduce((n, f) => n + (f.rooms || []).length, 0);
    stMemo = partStates(energyBalance(ctx.states(), L), rooms, hasMeters(cleanMeters(energy().meters)));
    return stMemo;
  }
  const stateText = (st) => t(`energy.st.${st.state}`, { n: st.n, of: st.of });
  /** open a part: its card scrolls to the top under the title and lights up */
  function jump(key) {
    const card = document.getElementById(`enPart-${key}`);
    if (!card) return;
    card.scrollIntoView({ block: 'start', behavior: 'smooth' });
    card.classList.remove('enFlash'); void card.offsetWidth; card.classList.add('enFlash');
  }
  /** the bar under the title: a button per part with a coloured dot (chosen / from the plan / missing / none) */
  function renderNav() {
    if (!nav) return;
    const st = states();
    if (!st) { nav.replaceChildren(); nav.hidden = true; return; }
    nav.hidden = false; nav.setAttribute('aria-label', t('energy.nav'));
    nav.replaceChildren(...PARTS.map((p) => {
      const b = el('button', 'enNavBtn'); b.type = 'button'; b.dataset.part = p.key; b.style.setProperty('--pc', p.color);
      const dot = el('span', 'enDot');
      b.append(el('span', 'enNavIcon', p.icon), el('span', '', t(`energy.p.${p.key}`)), dot);
      const set = () => { const x = states()?.[p.key]; if (!x) return; dot.className = `enDot ${x.tone}`; b.title = t('energy.p.tip', { part: t(`energy.p.${p.key}`), state: stateText(x) }); };
      set(); lives.push(set);
      b.addEventListener('click', () => jump(p.key));
      return b;
    }));
  }
  /** a part as a card: symbol, title, what it is read from now and its value now (they follow the states), then its fields */
  function card(key, title, hint, children) {
    const p = partOf(key), box = el('section', 'enPart'); box.id = `enPart-${key}`; box.dataset.part = key; box.style.setProperty('--pc', p.color);
    const head = el('header', 'enPartHead'), name = el('div', 'enPartName');
    name.append(el('h3', '', title));
    if (hint) name.append(el('p', 'sub', hint));
    const pill = el('span', 'enPill'), now = el('b', 'enPartNow');
    head.append(el('span', 'enPartIcon', p.icon), name, el('span', 'enPartState'));
    head.lastChild.append(pill, now);
    const set = () => { const x = states()?.[key]; if (!x) return; pill.className = `enPill ${x.tone}`; pill.textContent = stateText(x); now.textContent = nowText(key, x.now, t); };
    set(); lives.push(set);
    box.append(head, ...children.filter(Boolean));
    return box;
  }

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

  /* ---------- the calculation at the top: the power picture next to the lines of the calculation ---------- */
  function renderResult() {
    if (!scope()) { result.replaceChildren(); res = null; pic = ''; return; }   // per building, none chosen: the head says to choose one
    const bal = energyBalance(ctx.states(), scope()), rows = balanceRows(bal, t), checks = energyChecks(bal), st = states();
    if (!res || !result.contains(res.box)) {
      const box = el('div', 'enResult'), flow = el('div', 'enFlowPic'), calc = el('div', 'enCalc'), msgs = el('div', 'enMsgs');
      flow.addEventListener('click', (ev) => {                       // a circle of the picture opens its part
        const n = ev.target.closest?.('.ef-node'), k = n && FLOW_PART[[...n.classList].find((c) => FLOW_PART[c])];
        if (k) jump(k);
      });
      const grid = el('div', 'enResGrid'); grid.append(flow, calc);
      const head = el('h3', '');
      box.append(head, grid, msgs);
      res = { box, head, flow, calc, msgs }; pic = '';
      result.replaceChildren(box);
    }
    const u = ctx.units.edited?.();                                // per building: whose calculation this is
    res.head.textContent = u?.bid ? `${t('energy.result')} · 🏠 ${u.name}` : t('energy.result');
    const fl = energyFlows(bal), html = fl ? flowSvg(fl, flowTexts(fl, t)) : '';   // the same picture as at the top right (energyflowui.js)
    if (html !== pic) { res.flow.innerHTML = html; pic = html; }
    res.flow.hidden = !html;
    const out = [];
    if (!rows.length) out.push(el('p', 'sub', t('energy.empty')));
    else {
      const tbl = el('div', 'enRows');
      rows.forEach((r) => {
        const key = rowPart(r.key), p = key && partOf(key);
        const line = el(key ? 'button' : 'div', `enRow ${r.cls}`.trim());
        if (key) { line.type = 'button'; line.dataset.part = key; line.style.setProperty('--pc', p.color); line.title = t('energy.rowTip', { part: t(`energy.p.${key}`) }); line.addEventListener('click', () => jump(key)); }
        const label = el('span', 'enLabel', r.label);
        const main = !r.cls.includes('room') && !r.cls.includes('extra') && key && st?.[key];
        if (main) label.append(el('small', 'enFromTag', stateText(st[key])));
        line.append(el('span', 'enSign', r.sign), el('span', 'enRowIcon', main ? p.icon : ''), label, el('span', 'enVal', r.value));
        tbl.append(line);
      });
      out.push(tbl, el('p', 'sub enFormula', t('energy.formula')));
    }
    res.calc.replaceChildren(...out);
    const msgs = [];
    if (!bal.sources.grid.from) msgs.push(el('p', 'enWarn', `⚠ ${t('energy.missGrid')}`));
    checks.forEach((c) => {
      const p = el('div', 'enWarn'); p.dataset.code = c.code;
      p.append(el('span', '', `⚠ ${t(`energy.chk.${c.code}`, c.params)}`));
      c.fixes.forEach((k) => {
        const b = el('button', 'enFix', t(`energy.fix.${k}`)); b.type = 'button'; b.dataset.fix = k;
        b.addEventListener('click', () => edit(() => flipSign(energy(), k)));
        p.append(b);
      });
      msgs.push(p);
    });
    if (rows.length && bal.sources.grid.from && !checks.length) msgs.push(el('p', 'enOk', t('energy.ok')));
    res.msgs.replaceChildren(...msgs);
  }

  /* ---------- the settings: a card per part ---------- */
  function render() {
    lives = []; stMemo = null; drawn = ctx.layout(); drawnKey = ctx.units.editKey();
    ctx.units.renderHead();
    if (!scope()) { body.replaceChildren(); renderNav(); renderResult(); ctx.setup?.render(); return; }
    const stNow = ctx.states(), L = scope(), cfg = L.energy || {};
    const src = energySources(cfg, L.floors.flatMap((f) => f.devices || []), stNow);
    const out = [];

    // the grid: one sensor (plus = drawn) or drawn and fed in apart
    const g = cfg.grid || {}, grid = [];
    grid.push(ctx.pickerField(t('energy.how'), select('enGridMode', [['one', 'energy.grid.one'], ['two', 'energy.grid.two']], g.split ? 'two' : 'one',
      (v) => edit(() => { const p = part('grid'); if (v === 'two') p.split = true; else delete p.split; }))));
    if (g.split) {
      grid.push(picker(t('energy.grid.imp'), powerSensors(), g.imp, (v) => edit(() => setOr(part('grid'), 'imp', v))));
      grid.push(picker(t('energy.grid.exp'), powerSensors(), g.exp, (v) => edit(() => setOr(part('grid'), 'exp', v))));
    } else {
      const sign = (w) => (w === null ? '' : ` → ${t((g.invert ? -w : w) < 0 ? 'energy.means.feedIn' : 'energy.means.draw')}`);
      grid.push(picker(t('energy.sensor'), powerSensors(), g.entity, (v) => edit(() => setOr(part('grid'), 'entity', v)), null, sign));
      grid.push(check('enGridInvert', 'energy.grid.invert', !!g.invert, (on) => edit(() => setOr(part('grid'), 'invert', on))));
    }
    if (src.grid.from !== 'set') grid.push(fromPlan(src.grid.from, src.grid.devices.map((d) => devName(d)), planSum(src.grid.net, g.split ? null : (w) => (w === null ? '' : ` → ${t((g.invert ? -w : w) < 0 ? 'energy.means.feedIn' : 'energy.means.draw')}`))));
    out.push(card('grid', t('energy.grid'), '', grid));

    // the production: several sensors, added up
    const pv = Array.isArray(cfg.solar?.entities) ? cfg.solar.entities.filter(Boolean) : [];
    const chips = el('div', 'enChips');
    pv.forEach((id) => chips.append(chip(id, () => edit(() => { part('solar').entities = pv.filter((x) => x !== id); }))));
    out.push(card('solar', t('energy.solar'), t('energy.solar.hint'), [pv.length ? chips : null, adder(powerSensors(), null, (v) => edit(() => { if (!pv.includes(v)) part('solar').entities = [...pv, v]; })),
      pv.length ? null : fromPlan(src.solar.from, src.solar.devices.map((d) => devName(d)), planSum(src.solar.entities))]));

    // the battery: level, one sensor or charge and discharge apart, counted in the consumption or not
    const b = cfg.battery || {}, bat = [];
    bat.push(picker(t('energy.bat.level'), levelSensors(), b.level, (v) => edit(() => setOr(part('battery'), 'level', v))));
    if (!b.level && src.battery.levelFrom === 'plan') bat.push(fromPlan('plan', [batName(src, src.battery.level)], () => { const v = parseFloat(ctx.states()[src.battery.level]?.state); return Number.isFinite(v) ? `${Math.round(v)} %` : '–'; }));
    bat.push(ctx.pickerField(t('energy.how'), select('enBatMode', [['one', 'energy.bat.one'], ['two', 'energy.bat.two']], b.split ? 'two' : 'one',
      (v) => edit(() => { const p = part('battery'); if (v === 'two') p.split = true; else delete p.split; }))));
    if (b.split) {
      bat.push(picker(t('energy.bat.charge'), powerSensors(), b.charge, (v) => edit(() => setOr(part('battery'), 'charge', v))));
      bat.push(picker(t('energy.bat.discharge'), powerSensors(), b.discharge, (v) => edit(() => setOr(part('battery'), 'discharge', v))));
    } else {
      const sign = (w) => (w === null || !w ? '' : ` → ${t((b.invert ? -w : w) > 0 ? 'energy.means.charge' : 'energy.means.discharge')}`);
      bat.push(picker(t('energy.sensor'), powerSensors(), b.entity, (v) => edit(() => setOr(part('battery'), 'entity', v)), null, sign));
      bat.push(check('enBatInvert', 'energy.bat.invert', !!b.invert, (on) => edit(() => setOr(part('battery'), 'invert', on))));
    }
    if (src.battery.from === 'plan') {
      const flow = () => { const n = batteryNow(ctx.states(), src.battery); return n?.flow == null ? '–' : `${fmtSigned(n.flow)}${n.dir ? ` → ${t(n.dir > 0 ? 'energy.means.charge' : 'energy.means.discharge')}` : ''}`; };
      bat.push(fromPlan('plan', src.battery.power.map((p) => batName(src, p.e)), flow));
    }
    bat.push(check('enBatBalance', 'energy.bat.balance', b.balance !== false, (on) => edit(() => { const p = part('battery'); if (on) delete p.balance; else p.balance = false; })));
    bat.push(el('p', 'sub', t('energy.bat.balanceHint')));
    out.push(card('battery', t('energy.battery'), '', bat));

    // the house: calculated, or a sensor of its own (the calculation then is the check)
    const hp = picker(t('energy.house.sensor'), powerSensors(), cfg.house?.entity, (v) => edit(() => setOr(part('house'), 'entity', v))); hp.id = 'enHouse';
    out.push(card('house', t('energy.house'), t('energy.house.hint'), [hp]));

    // the rooms: which sensors measure what a room uses, side by side
    const rooms = cfg.rooms && typeof cfg.rooms === 'object' ? cfg.rooms : {}, rs = [];
    const anyRoom = L.floors.some((f) => (f.rooms || []).length);
    if (!anyRoom) rs.push(el('p', 'sub', t('energy.rooms.none')));
    else {
      const sug = el('button', '', `✨ ${t('energy.rooms.suggest')}`); sug.type = 'button'; sug.id = 'enSuggest'; sug.title = t('energy.rooms.suggestTip');
      const said = el('span', 'sub enSaid');
      sug.addEventListener('click', () => {
        const found = suggestRooms(scope(), ctx.states(), ctx.areaOf(), ctx.pointInPoly), n = Object.values(found).flat().length;
        if (n) edit(() => { const e = energy(); e.rooms = e.rooms || {}; Object.entries(found).forEach(([k, v]) => { e.rooms[k] = [...(e.rooms[k] || []), ...v]; }); });
        const msg = $('#energyBody .enSaid'); if (msg) msg.textContent = n ? t('energy.rooms.suggested', { n }) : t('energy.rooms.noneFound');
      });
      const bar = el('div', 'stopTools'); bar.append(sug, said); rs.push(bar);
      L.floors.forEach((f) => {
        if (!(f.rooms || []).length) return;
        if (L.floors.length > 1) rs.push(el('h4', 'enFloor', f.name || ''));
        const list = el('div', 'enRooms');
        f.rooms.forEach((r) => {
          const mine = Array.isArray(rooms[r.id]) ? rooms[r.id].filter(Boolean) : [];
          const box = el('div', `enRoom${mine.length ? '' : ' empty'}`); box.dataset.room = r.id;
          const head = el('div', 'enRoomHead'); head.append(el('b', '', r.name || t('energy.room')));
          if (mine.length) head.append(live(el('small', 'enRoomSum'), () => { const w = mine.map((e) => sensorWatts(ctx.states(), e)).filter((x) => x !== null); return w.length ? fmtSigned(w.reduce((p, q) => p + q, 0)) : '–'; }));
          const cs = el('div', 'enChips');
          mine.forEach((id) => cs.append(chip(id, () => edit(() => { const e = energy(); const l = mine.filter((x) => x !== id); if (l.length) e.rooms[r.id] = l; else delete e.rooms[r.id]; }))));
          box.append(head);
          if (mine.length) box.append(cs);
          box.append(adder(powerSensors(), r, (v) => edit(() => { const e = energy(); e.rooms = e.rooms || {}; if (!mine.includes(v)) e.rooms[r.id] = [...mine, v]; })));
          list.append(box);
        });
        rs.push(list);
      });
    }
    out.push(card('rooms', t('energy.rooms'), t('energy.rooms.hint'), rs));
    if (ctx.meterPart) {                                            // the meters of the page ⚡ Energie (#481): "⤵ Von oben übernehmen"
      const nodes = ctx.meterPart({ t, el, edit, energy, adder, entities: ctx.entities, states: ctx.states,
        sources: () => energySources(energy(), scope().floors.flatMap((f) => f.devices || []), ctx.states()) });
      const title = nodes[0]?.tagName === 'H3' ? nodes.shift().textContent : t('em.title');
      out.push(card('meters', title, '', nodes));
    }
    body.replaceChildren(...out);
    renderNav();
    renderResult();
    ctx.setup?.render();
  }

  /** after every state update: the calculation and the values while the window is open (the pickers stay as they are; all of it again
   *  when the plan was replaced, e.g. by undo) */
  function update() {
    if (!dlg?.open) return;
    if (ctx.layout() !== drawn || ctx.units.editKey() !== drawnKey) { render(); return; }
    stMemo = null;
    renderResult();
    ctx.setup?.update();
    lives.forEach((set) => set());
  }
  /** while scrolling: the button of the part shown at the top is marked */
  let spy = 0;
  dlg?.addEventListener('scroll', () => {
    if (spy) return;
    spy = requestAnimationFrame(() => {
      spy = 0;
      const top = (nav?.getBoundingClientRect().bottom ?? 0) + 80;
      let on = '';
      body.querySelectorAll('.enPart').forEach((c) => { if (c.getBoundingClientRect().top <= top) on = c.dataset.part; });
      nav?.querySelectorAll('.enNavBtn').forEach((b) => b.classList.toggle('on', b.dataset.part === on));
    });
  }, { passive: true });
  function open() { render(); dlg.showModal(); }
  $('#energyBtn')?.addEventListener('click', open);
  $('#energyClose')?.addEventListener('click', () => dlg.close());
  dlg?.addEventListener('click', (e) => {                       // a click on the dark backdrop closes it (not one on the window's own edge)
    const r = dlg.getBoundingClientRect();
    if (e.target === dlg && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) dlg.close();
  });
  return { open, update, render, isOpen: () => !!dlg?.open };
}
