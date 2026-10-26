/* 🌡 Klima → 📋 Heiz-Regeln (#546, the owner: "Heizungssteuerung … wenn Fenster offen, dann wird Heizung deaktiviert"; picture
 * docs/ideen-4.27/3-heiz-regeln.jpg): the ready-made heating rules of the add-on as cards to switch on, their numbers changed with − / +
 * (Fenster offen → Heizung aus, Keiner zu Hause → kühler, Nachtabsenkung, Heizplan, Sommerpause, Boost-Knopf, Urlaub), what is active
 * now on top, and "＋ Eigene Regel" (a routine "Wenn … dann …"). Also what a room's card on the page shows of them: the line "⏸ Heizung
 * pausiert …" with "🔥 Trotzdem heizen", 🚀 Boost and 🔎 Wird benutzt. The add-on runs the rules (heatrules.py); saved a moment after the
 * last change. */
import { roomLine, roomKey, LEVEL_COLOR, dayBlocks, dayStart, templates } from './rules.js';

const RULES = ['window', 'away', 'night', 'schedule', 'summer', 'boost', 'holiday'];
const ICON = { window: '🪟', away: '🚶', night: '🌙', schedule: '📅', summer: '☀️', boost: '🚀', holiday: '✈️' };

/** ctx: t, lang(), rules (rulesstore.js), canEdit(), locked() (may not switch), houseId(), rooms() (the rooms of the house shown with a
 *  thermostat: [{ id, name, climate }]), deg(v), states(), usedBy (usedbyui.js), editFlow(flow) (the editor of a routine), showPlan()
 *  (the view 📅 Heizplan), changed() (draw the page again) */
export function initHeatRulesUi(ctx) {
  const { t } = ctx;
  let draft = null, timer = 0, saved = 0, openNight = false;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on, title) => { const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', on); return b; };
  const now = () => Math.round(Date.now() / 1000);
  const key = (id) => roomKey(ctx.houseId() || 'main', id);
  const heat = () => draft || ctx.rules.get()?.heat || null;

  /** a change: kept at once, saved a moment after the last one */
  function change(fn) {
    const h = JSON.parse(JSON.stringify(heat()));
    fn(h);
    draft = h;
    ctx.changed();
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const ok = await ctx.rules.save({ heat: draft });
      if (ok) { draft = null; saved = Date.now(); ctx.changed(); setTimeout(() => ctx.changed(), 2100); }
    }, 700);
  }

  /* ---- the pieces of a card ---- */
  function toggle(on, set, data) {
    const lab = make('label', 'sw'); lab.title = t('hr.onOff');
    const cb = make('input'); cb.type = 'checkbox'; cb.checked = !!on; cb.disabled = !ctx.canEdit();
    if (data) cb.dataset.rule = data;
    cb.addEventListener('change', () => set(cb.checked));
    lab.append(cb, make('span'));
    return lab;
  }
  function stepper(v, { step = 1, min, max, text = (x) => String(x), set, data }) {
    const box = make('span', 'hrStep');
    const val = make('b', '', text(v));
    const go = (d) => set(Math.max(min, Math.min(max, Math.round((v + d) / step) * step)));
    const minus = btn('', '−', () => go(-step), t('heat.minus')), plus = btn('', '+', () => go(step), t('heat.plus'));
    minus.disabled = plus.disabled = !ctx.canEdit();
    if (data) box.dataset.field = data;
    box.append(minus, val, plus);
    return box;
  }
  function timeField(v, set, data) {
    const i = make('input', 'hrTime'); i.type = 'time'; i.value = v; i.disabled = !ctx.canEdit(); if (data) i.dataset.field = data;
    i.addEventListener('change', () => { if (/^\d{2}:\d{2}$/.test(i.value)) set(i.value); });
    return i;
  }
  function kv(label, el) { const r = make('div', 'hrKv'); r.append(make('span', '', label), el); return r; }
  const temp = (v, set, data) => stepper(v, { step: 0.5, min: 5, max: 30, text: ctx.deg, set, data });
  const mins = (v, set, data, max = 240, step = 1) => stepper(v, { step, min: 0, max, text: (x) => t('fl.min', { n: x }), set, data });

  function card(rule, h, body, extra = null) {
    const on = rule === 'holiday' ? h.holiday.on || h.holiday.guard : h[rule].on;
    const c = make('div', `tpCard hrCard${on ? '' : ' off'}`); c.dataset.heatRule = rule;
    const head = make('div', 'hrHead');
    const tx = make('div', '');
    tx.append(make('b', '', t(`hr.rule.${rule}`)), make('small', 'tpSub', t(`hr.sub.${rule}`)));
    head.append(make('span', 'hrIc', ICON[rule]), tx, toggle(rule === 'holiday' ? h.holiday.on : h[rule].on, (v) => change((x) => { x[rule].on = v; }), rule));
    c.append(head);
    const kvs = make('div', 'hrKvs'); kvs.append(...body);
    c.append(kvs);
    if (extra) c.append(extra);
    return c;
  }
  function activeChips(rule) {
    const st = ctx.rules.get()?.status?.rooms || {}, names = new Map(ctx.rooms().map((r) => [key(r.id), r.name]));
    const on = Object.entries(st).filter(([k, s]) => s.why === rule && names.has(k)).map(([k]) => names.get(k));
    if (!on.length) return null;
    const box = make('div', 'hrActive');
    box.append(make('span', 'ubChip run', t('hr.activeIn', { rooms: on.join(', ') })));
    return box;
  }

  function cards(h) {
    const rooms = ctx.rooms();
    const out = [];
    const skip = new Set(h.window.skip);
    const roomChips = make('div', 'hrRooms');
    rooms.forEach((r) => {
      const b = btn(`tpChip${skip.has(key(r.id)) ? '' : ' on'}`, r.name, () => change((x) => {
        const k = key(r.id); x.window.skip = x.window.skip.includes(k) ? x.window.skip.filter((y) => y !== k) : [...x.window.skip, k];
      }));
      b.disabled = !ctx.canEdit(); b.dataset.room = r.id;
      roomChips.append(b);
    });
    out.push(card('window', h, [kv(t('hr.window.delay'), mins(h.window.delay, (v) => change((x) => { x.window.delay = v; }), 'window.delay', 60)),
      kv(t('hr.window.doors'), toggle(h.window.doors, (v) => change((x) => { x.window.doors = v; }), 'window.doors')),
      kv(t('hr.window.after'), make('b', '', t('hr.back')))], (() => { const d = make('div', ''); d.append(make('small', 'tpSub', t('hr.window.rooms')), roomChips); const a = activeChips('window'); if (a) d.append(a); return d; })()));
    out.push(card('away', h, [kv(t('hr.away.delay'), mins(h.away.delay, (v) => change((x) => { x.away.delay = v; }), 'away.delay', 240, 5)),
      kv(t('hr.temp'), temp(h.away.temp, (v) => change((x) => { x.away.temp = v; }), 'away.temp')), kv(t('hr.away.back'), make('b', '', t('hr.away.backWhen')))], activeChips('away')));
    const nightRooms = make('div', 'hrNightRooms');
    if (openNight) {
      rooms.forEach((r) => {
        const k = key(r.id), v = h.night.rooms[k];
        const row = kv(r.name, v == null ? btn('tpChip', t('hr.night.same'), () => change((x) => { x.night.rooms[k] = x.night.temp; })) : temp(v, (nv) => change((x) => { x.night.rooms[k] = nv; })));
        if (v != null && ctx.canEdit()) row.append(btn('tpChip', '↺', () => change((x) => { delete x.night.rooms[k]; }), t('hr.night.reset')));
        nightRooms.append(row);
      });
    }
    out.push(card('night', h, [kv(t('hr.from'), timeField(h.night.from, (v) => change((x) => { x.night.from = v; }), 'night.from')),
      kv(t('hr.to'), timeField(h.night.to, (v) => change((x) => { x.night.to = v; }), 'night.to')),
      kv(t('hr.temp'), temp(h.night.temp, (v) => change((x) => { x.night.temp = v; }), 'night.temp'))],
    (() => { const d = make('div', ''); d.append(btn('tpChip', openNight ? t('hr.night.less') : t('hr.night.rooms', { n: Object.keys(h.night.rooms).length }), () => { openNight = !openNight; ctx.changed(); }), nightRooms); return d; })()));
    const plans = Object.keys(h.schedule.rooms).filter((k) => k.startsWith(`${ctx.houseId() || 'main'}/`));
    const mini = make('div', 'hrMini');
    const first = h.schedule.rooms[plans[0]];
    if (first) [[0, t('hr.mini.work')], [5, t('hr.mini.home')]].forEach(([d, label]) => {
      const bar = make('span', 'bar');
      dayBlocks(first.days[d], dayStart(first.days, d)).forEach((b) => { const i = make('i'); i.style.width = `${((b.to - b.from) / 1440) * 100}%`; i.style.background = LEVEL_COLOR[b.level]; bar.append(i); });
      mini.append(make('span', '', label), bar);
    });
    const go = btn('bdBtn', `📅 ${t('hr.plan.edit')}`, () => ctx.showPlan()); go.dataset.act = 'openPlan';
    out.push(card('schedule', h, [kv(t('hr.plan.rooms'), make('b', '', String(plans.length))),
      kv(t('hr.plan.pre'), mins(h.schedule.pre, (v) => change((x) => { x.schedule.pre = v; }), 'schedule.pre', 120, 15))], (() => { const d = make('div', 'hrPlanBox'); if (first) d.append(mini); d.append(go); const a = activeChips('schedule'); if (a) d.append(a); return d; })()));
    out.push(card('summer', h, [kv(t('hr.summer.above'), temp(h.summer.above, (v) => change((x) => { x.summer.above = v; }), 'summer.above')),
      kv(t('hr.summer.hours'), stepper(h.summer.hours, { step: 1, min: 0, max: 72, text: (x) => t('fl.hour', { n: x }), set: (v) => change((x) => { x.summer.hours = v; }), data: 'summer.hours' }))], activeChips('summer')));
    out.push(card('boost', h, [kv(t('hr.boost.minutes'), mins(h.boost.minutes, (v) => change((x) => { x.boost.minutes = v; }), 'boost.minutes', 240, 5)),
      kv(t('hr.temp'), temp(h.boost.temp, (v) => change((x) => { x.boost.temp = v; }), 'boost.temp')), kv(t('hr.window.after'), make('b', '', t('hr.back')))], activeChips('boost')));
    const until = make('input', 'hrTime'); until.type = 'date'; until.value = h.holiday.until; until.disabled = !ctx.canEdit(); until.dataset.field = 'holiday.until';
    until.addEventListener('change', () => change((x) => { x.holiday.until = until.value; }));
    out.push(card('holiday', h, [kv(t('hr.temp'), temp(h.holiday.temp, (v) => change((x) => { x.holiday.temp = v; }), 'holiday.temp')), kv(t('hr.holiday.until'), until),
      kv(t('hr.holiday.back'), timeField(h.holiday.back, (v) => change((x) => { x.holiday.back = v; }), 'holiday.back')),
      kv(t('hr.holiday.guard'), toggle(h.holiday.guard, (v) => change((x) => { x.holiday.guard = v; }), 'holiday.guard'))], activeChips('holiday')));
    if (ctx.canEdit()) {
      const own = btn('tpCard hrOwn', '', () => ctx.editFlow({ id: null, ...templates(ctx.states?.() || {}, t)[0], name: t('fl.tpl.window') }));
      own.append(make('b', '', `＋ ${t('hr.own')}`), make('small', 'tpSub', t('hr.ownSub')));
      own.dataset.act = 'ownRule';
      out.push(own);
    }
    return out;
  }

  /** what is active now: a line per room whose rules do something special (a window open, boost, holidays …) */
  function banner() {
    const st = ctx.rules.get()?.status?.rooms || {}, out = [];
    ctx.rooms().forEach((r) => {
      const s = st[key(r.id)], line = roomLine(s, now(), t, ctx.deg);
      if (!line || !s.why || ['schedule', 'night'].includes(s.why)) return;
      const b = make('div', `hrBanner ${line.tone}`); b.dataset.room = r.id;
      const tx = make('div', ''); tx.append(make('b', '', `${line.icon} ${r.name}`), make('span', '', line.text));
      b.append(tx);
      if (s.why === 'window' && !ctx.locked()) b.append(btn('bdBtn', `🔥 ${t('hr.anyway')}`, () => ctx.rules.room(key(r.id), 'skip')));
      if (s.why === 'boost' && !ctx.locked()) b.append(btn('bdBtn', `■ ${t('hr.boostStop')}`, () => ctx.rules.room(key(r.id), 'boost')));
      out.push(b);
    });
    return out;
  }

  /** the view 📋 Heiz-Regeln */
  function view() {
    const box = make('div', 'hrView');
    const data = ctx.rules.get();
    if (!data) { ctx.rules.load(); box.append(make('p', 'tpSub', t('ub.loading'))); return box; }
    if (!data.ha) box.append(make('p', 'tpSub hrNote', t('hr.noHa')));
    else if (!data.running && data.active) box.append(make('p', 'tpSub hrNote', t('hr.notRunning')));
    box.append(...banner());
    if (!ctx.canEdit()) box.append(make('p', 'tpSub hrNote', t('hr.readOnly')));
    if (saved && Date.now() - saved < 2000) box.append(make('p', 'hrSaved', `✓ ${t('hr.saved')}`));
    const grid = make('div', 'hrGrid');
    grid.append(...cards(heat()));
    box.append(grid);
    return box;
  }

  /** what a room's card on 🌡 Klima shows: the line of its rules now, 🔥 Trotzdem heizen, 🚀 Boost, 🔎 Wird benutzt; null for nothing */
  function roomExtras(r) {
    const k = key(r.id), s = ctx.rules.status(k), h = ctx.rules.get()?.heat, line = roomLine(s, now(), t, ctx.deg);
    const box = make('div', 'hrRoom');
    if (line) {
      const p = make('div', `hrLine ${line.tone}`); p.dataset.line = s.why || (s.waiting ? 'waiting' : '');
      p.append(make('span', '', `${line.icon} ${line.text}`));
      if (s.why === 'window' && !ctx.locked()) p.append(btn('tpChip', `🔥 ${t('hr.anyway')}`, () => ctx.rules.room(k, 'skip')));
      box.append(p);
    }
    const bar = make('div', 'hrRoomBtns');
    const heater = r.climate && !(ctx.states()[r.climate]?.modes || []).includes('cool');   // an air conditioner: only the window rule (#546)
    if (h?.boost?.on && heater && !ctx.locked()) {
      const b = btn(`tpChip${s?.why === 'boost' ? ' on' : ''}`, s?.why === 'boost' ? `■ ${t('hr.boostStop')}` : `🚀 ${t('hr.boost')}`, () => ctx.rules.room(k, 'boost'));
      b.dataset.act = 'boost';
      bar.append(b);
    }
    if (r.climate) { const u = ctx.usedBy.button(r.climate); if (u) { u.classList.add('tpChip'); bar.append(u); } }
    if (bar.children.length) box.append(bar);
    return box.children.length ? box : null;
  }
  const sig = (r) => JSON.stringify([ctx.rules.status(key(r.id)), ctx.rules.get()?.heat?.boost?.on, ctx.locked(), Math.floor(Date.now() / 60000)]);
  /** the window rule takes care of the room's open window (paused, or about to): the page's own warning is not needed */
  const paused = (r) => { const s = ctx.rules.status(key(r.id)); return !!s && (s.why === 'window' || !!s.waiting); };
  return { view, roomExtras, sig, paused, viewSig: () => JSON.stringify([heat(), ctx.rules.get()?.status?.rooms, ctx.rules.get()?.running, saved && Date.now() - saved < 2000, openNight, ctx.canEdit(), Math.floor(Date.now() / 60000)]) };
}
