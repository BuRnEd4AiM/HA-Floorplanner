/* The page 🧺 Haushalt of the tab bar (#490): the washing machine, the dryer and the dishwasher (the add-on finds them and says what each
 * does: api/household), "✓ Ausgeräumt" when one is done (for every screen), the robot vacuums (start, pause, back to the station), the
 * shopping list of Home Assistant (api/todo: tick off, add, clear the ticked ones; anybody may) and the waste card of ☀ Heute. The number
 * on the tab: machines that are done. The rules are in household.js (tested). */
import { applianceView, tellButton, doneCount, vacuums, hasHousehold, cleanItem, dayOf, KIND_ICON } from './household.js';
import { controlPlan } from './devicecontrols.js';
import { initOutdoorCards } from './outdoorcards.js';

const POLL_OPEN = 30000, POLL_SHUT = 120000;

/** ctx: t, el (the page), lang(), states(), names(), entities(), settings(), callService(entity, service, data), locked() (this user may not
 *  switch), builtin(key) (a card of ☀ Heute: waste), changed() (the tab bar: the number on the tab), board (pageboard.js, #484: keys
 *  ap:<kind>, vac:<entity>, car, garden (#533, outdoorcards.js), todo, waste) */
export function initHouseholdPage(ctx) {
  const { t, el } = ctx;
  let open = false, drawn = '', machines = { at: 0, list: [], tell: {}, canTell: false, note: null, busy: false }, todo = { at: 0, entity: '', lists: [], items: [], busy: false, note: '' };
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on, title) => { const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', on); return b; };
  const lang = () => ctx.lang() || 'de';
  const outdoor = initOutdoorCards({ t, lang, states: ctx.states, entities: ctx.entities, settings: ctx.settings, callService: ctx.callService, locked: ctx.locked,
    redraw: () => { if (open) draw(false); } });   // 🚗 the car and 🌱 the garden (#533)
  const time = (iso) => new Intl.DateTimeFormat(lang(), { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  /** a time as "13:12", "gestern 19:40" or "Mo., 20.10. 19:40" */
  function when(iso) {
    const d = dayOf(iso, Date.now());
    if (d === 'today') return time(iso);
    if (d === 'yesterday') return t('hh.yesterday', { at: time(iso) });
    return `${new Intl.DateTimeFormat(lang(), { weekday: 'short', day: 'numeric', month: 'numeric' }).format(new Date(iso))} ${time(iso)}`;
  }
  const say = ({ key, vars }) => t(key, vars ? Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, k === 'at' ? when(v) : v])) : undefined);

  /* ---- what the add-on says ---- */
  async function loadMachines(force = false) {
    if (machines.busy || (!force && Date.now() - machines.at < (open ? POLL_OPEN : POLL_SHUT))) return;
    machines.busy = true;
    try {
      const r = await fetch('api/household');
      if (r.ok) took(await r.json());
    } catch { /* stays as it was */ }
    machines.at = Date.now(); machines.busy = false;
    ctx.changed(); if (open) draw(false);
  }
  async function loadTodo(force = false, entity = todo.entity) {
    if (todo.busy || (!force && Date.now() - todo.at < POLL_OPEN)) return;
    todo.busy = true;
    try {
      const r = await fetch(`api/todo${entity ? `?entity=${encodeURIComponent(entity)}` : ''}`);
      if (r.ok) { const x = await r.json(); todo = { ...todo, entity: x.entity || '', lists: x.lists || [], items: x.items || [] }; }
    } catch { /* stays */ }
    todo.at = Date.now(); todo.busy = false;
    if (open) draw(false);
  }
  async function change(body) {
    todo.note = '';
    try {
      const r = await fetch('api/todo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: todo.entity, ...body }) });
      const x = await r.json();
      if (x.items) todo = { ...todo, items: x.items, lists: x.lists || todo.lists };
      if (!r.ok) todo.note = t('hh.todoFailed');
    } catch { todo.note = t('hh.todoFailed'); }
    todo.at = Date.now(); draw(true);
  }
  /** what the add-on said: the machines, who wants to be told (#531) and whether a message can go out */
  function took(x) {
    machines.list = x.appliances || machines.list;
    machines.tell = x.tell || {}; machines.canTell = !!x.canTell;
  }
  async function emptied(kind) {
    try {
      const r = await fetch('api/household/ack', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind }) });
      if (r.ok) took(await r.json());
    } catch { /* the next look tries again */ }
    machines.at = Date.now(); ctx.changed(); draw(true);
  }
  /** 🔔 "Sag mir Bescheid" (#531): a message when it is done, or not any more; without a message channel it says where to set one up */
  async function tell(kind, on) {
    machines.note = null;
    if (!machines.canTell) { machines.note = { kind, key: 'hh.tellSetup' }; draw(true); return; }
    try {
      const r = await fetch('api/household/tell', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, on }) });
      if (r.ok) took(await r.json()); else machines.note = { kind, key: 'hh.tellFailed' };
    } catch { machines.note = { kind, key: 'hh.tellFailed' }; }
    draw(true);
  }

  /* ---- the cards ---- */
  function machineCard(a) {
    const v = applianceView(a, Date.now()), c = make('div', `tpCard hhCard hh-${v.tone}`);
    c.dataset.kind = a.kind;
    const top = make('div', 'hhTop'), txt = make('div', 'hhTxt');
    txt.append(make('b', 'hhName', t(`hh.kind.${a.kind}`)));
    if (v.line.length) txt.append(make('div', 'tpSub', v.line.map(say).join(' · ')));
    top.append(make('span', 'hhIcon', KIND_ICON[a.kind]), txt);
    if (v.badge) top.append(make('span', `hhBadge ${v.tone}`, t(v.badge)));
    else if (v.right) top.append(make('span', 'hhRight', say(v.right)));
    c.append(top);
    if (v.bar != null) { const bar = make('div', 'hhBar'), fill = make('i'); fill.style.width = `${v.bar}%`; bar.append(fill); c.append(bar); }
    if (v.ack) { const b = btn('bdBtn hhAck', `✓ ${t('hh.ack')}`, () => emptied(a.kind)); b.dataset.act = 'ack'; c.append(b); }
    const tb = tellButton(a, machines.tell);
    if (tb) { const b = btn(`bdBtn hhTell${tb.on ? ' on' : ''}`, t(tb.label), () => tell(a.kind, !tb.on), t('hh.tellTip')); b.dataset.act = 'tell'; c.append(b); }
    if (tb && machines.note?.kind === a.kind) c.append(make('p', 'hhNote', t(machines.note.key)));
    return c;
  }
  function vacuumCard(v) {
    const c = make('div', 'tpCard hhCard hhVac'), st = ctx.states()[v.entity];
    c.dataset.vacuum = v.entity;
    const top = make('div', 'hhTop'), txt = make('div', 'hhTxt'), k = `dc.st.${v.state}`, word = t(k) === k ? v.state : t(k);
    txt.append(make('b', 'hhName', v.name));
    if (v.battery != null) txt.append(make('div', 'tpSub', t('hh.battery', { n: v.battery })));
    top.append(make('span', 'hhIcon', '🤖'), txt, make('span', `hhBadge ${v.state === 'cleaning' ? 'running' : v.state === 'error' ? 'error' : 'off'}`, word));
    c.append(top);
    const plan = ctx.locked() ? null : controlPlan(v.entity, st);
    if (plan?.buttons?.length) {
      const row = make('div', 'hhBtns');
      plan.buttons.forEach((b, i) => { const x = btn(`bdBtn${i === 0 ? ' primary' : ''}`, `${b.icon} ${t(b.label)}`.trim(), () => ctx.callService(v.entity, b.svc)); x.dataset.svc = b.svc; row.append(x); });
      c.append(row);
    }
    return c;
  }
  let typed = '';                                                    // the new item being typed: kept while the page draws again
  function todoCard() {
    const c = make('div', 'tpCard hhTodo'), head = make('div', 'hhTodoHead');
    head.append(make('h3', 'peH', t('hh.shopping')));
    if (todo.lists.length > 1) {
      const sel = make('select', 'hhList'); sel.setAttribute('aria-label', t('hh.whichList'));
      todo.lists.forEach((l) => sel.add(new Option(l.name, l.entity)));
      sel.value = todo.entity;
      sel.addEventListener('change', () => loadTodo(true, sel.value));
      head.append(sel);
    }
    c.append(head);
    if (!todo.entity) { c.append(make('p', 'tpSub', todo.at ? t('hh.noList') : t('hh.loading'))); return c; }
    const ul = make('div', 'hhItems');
    todo.items.forEach((it) => {
      const lab = make('label', `hhItem${it.done ? ' done' : ''}`), cb = make('input'); cb.type = 'checkbox'; cb.checked = it.done; cb.dataset.uid = it.uid;
      cb.addEventListener('change', () => change({ action: cb.checked ? 'done' : 'undo', uid: it.uid }));
      lab.append(cb, make('span', '', it.summary));
      ul.append(lab);
    });
    if (!todo.items.length) ul.append(make('p', 'tpSub', t('hh.empty.list')));
    const add = make('form', 'hhAdd'), inp = make('input'); inp.type = 'text'; inp.maxLength = 200; inp.placeholder = `＋ ${t('hh.newItem')}`; inp.value = typed;
    inp.setAttribute('aria-label', t('hh.newItem'));
    inp.addEventListener('input', () => { typed = inp.value; });
    add.addEventListener('submit', async (e) => {
      e.preventDefault();
      const item = cleanItem(inp.value);
      if (!item) return;
      typed = ''; inp.value = '';
      await change({ action: 'add', item });
      el.querySelector('.hhAdd input')?.focus();
    });
    add.append(inp);
    c.append(ul, add);
    if (todo.items.some((i) => i.done)) { const b = btn('bdBtn hhClear', `🧹 ${t('hh.clear')}`, () => change({ action: 'clear' })); b.dataset.act = 'clear'; c.append(b); }
    if (todo.note) c.append(make('p', 'hhNote', todo.note));
    return c;
  }

  function draw(force = false) {
    loadMachines(); if (open) loadTodo();
    const focus = document.activeElement, typing = focus?.closest?.('.hhAdd') && el.contains(focus);
    const vac = vacuums(ctx.states(), ctx.names()), waste = ctx.builtin('waste');   // the waste card of ☀ Heute (its calendar comes a moment later)
    const sig = JSON.stringify([machines.list, machines.tell, machines.note, outdoor.sig(), vac, vac.map((v) => ctx.states()[v.entity]?.ctl), todo.entity, todo.lists, todo.items, todo.note, ctx.locked(),
      waste?.textContent || '', new Date().getMinutes(), t('tab.household')]);
    if (!force && (sig === drawn || typing)) return;
    drawn = sig;
    const head = make('div', 'tpHead');
    head.append(make('h2', '', `🧺 ${t('tab.household')}`));
    const grid = make('div', 'hhGrid'), items = [];
    machines.list.forEach((a) => items.push({ key: `ap:${a.kind}`, el: machineCard(a), width: 1 }));
    vac.forEach((v) => items.push({ key: `vac:${v.entity}`, el: vacuumCard(v), width: 1 }));
    items.push(...outdoor.items());
    if (Object.keys(ctx.states()).some((id) => id.startsWith('todo.'))) items.push({ key: 'todo', el: todoCard(), width: 2 });
    if (waste) items.push({ key: 'waste', el: waste, width: 2 });
    el.replaceChildren(head, ...(items.length ? [] : [make('p', 'tpSub', t('hh.none'))]), grid);
    ctx.board.fill('household', grid, items, { min: 340 });
    if (typing) el.querySelector('.hhAdd input')?.focus();
  }

  let tick = 0;
  return {
    render: () => { open = true; draw(true); loadMachines(true); loadTodo(true); clearInterval(tick); tick = setInterval(() => draw(false), POLL_OPEN); },
    update: () => draw(false),
    has: () => { loadMachines(); return hasHousehold(ctx.states(), machines.list) || outdoor.has(); },
    reset: () => { open = false; clearInterval(tick); tick = 0; drawn = ''; },
    /** the number on the tab: machines that are done */
    badge: () => doneCount(machines.list),
  };
}
