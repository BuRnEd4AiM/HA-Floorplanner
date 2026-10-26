/* 🌡 Klima → 📅 Heizplan (#546; picture docs/ideen-4.27/4-heizplan.jpg): a week plan per room with three levels (💤 Nacht, 🌙 Eco, ☀️
 * Komfort) and their temperatures. A tap on a block chooses it: its level, "✂ Teilen", "🗑 Weg" and its start time; its left edge can be
 * dragged (on 15 minutes). "Mo–Fr wie Montag", "Sa–So wie Samstag", "Für alle Räume übernehmen"; what the room does now and next. Kept
 * as a draft until "✓ Speichern". The blocks and what a tap or drag does are pure (rules.js, tested); the add-on runs the plan
 * (heatrules.py). */
import { LEVELS, LEVEL_ICON, LEVEL_COLOR, dayBlocks, dayStart, planNow, cycleBlock, moveStart, splitBlock, removeBlock, defaultPlan, roomKey, hhmm, minutes } from './rules.js';

/** ctx: t, lang(), rules (rulesstore.js), canEdit(), houseId(), rooms() ([{ id, name, climate }]), deg(v), changed(), back() (to the rules) */
export function initHeatPlanUi(ctx) {
  const { t } = ctx;
  let draft = null, room = null, sel = null, dirty = false, drag = null;   // sel: { d (day), from } of the chosen block
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on, title) => { const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', on); return b; };
  const key = (id) => roomKey(ctx.houseId() || 'main', id);
  const heat = () => draft || ctx.rules.get()?.heat || null;
  const edit = (fn) => { const h = JSON.parse(JSON.stringify(heat())); fn(h); draft = h; dirty = true; ctx.changed(); };
  const dayNames = () => Array.from({ length: 7 }, (_, i) => { try { return new Intl.DateTimeFormat(ctx.lang(), { weekday: 'short' }).format(new Date(2026, 9, 26 + i)).replace('.', ''); } catch { return String(i); } });

  function stepper(v, set, data) {
    const box = make('span', 'hrStep'); if (data) box.dataset.field = data;
    const go = (d) => set(Math.max(5, Math.min(30, Math.round((v + d) * 2) / 2)));
    const minus = btn('', '−', () => go(-0.5)), plus = btn('', '+', () => go(0.5));
    minus.disabled = plus.disabled = !ctx.canEdit();
    box.append(minus, make('b', '', ctx.deg(v)), plus);
    return box;
  }

  function week(h, k) {
    const plan = h.schedule.rooms[k], names = dayNames(), today = (new Date().getDay() + 6) % 7, nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const grid = make('div', 'hpWeek');
    plan.days.forEach((day, d) => {
      const head = make('div', 'hpDay'); head.append(make('b', '', names[d]));
      if (d === today) head.append(make('small', '', t('hp.today')));
      const bar = make('div', 'hpBar'); bar.dataset.day = d;
      dayBlocks(day, dayStart(plan.days, d)).forEach((b) => {
        const i = make('i', `hpBlock${sel && sel.d === d && sel.from === b.from ? ' sel' : ''}`);
        i.style.width = `${((b.to - b.from) / 1440) * 100}%`; i.style.background = LEVEL_COLOR[b.level];
        i.textContent = b.to - b.from >= 90 ? ctx.deg(h.schedule.levels[b.level]) : '';
        i.title = `${hhmm(b.from)}–${hhmm(b.to % 1440)} · ${t(`hr.level.${b.level}`)}`;
        i.dataset.from = b.from; i.dataset.level = b.level;
        i.addEventListener('click', () => { if (!ctx.canEdit()) return; if (sel && sel.d === d && sel.from === b.from) { edit((x) => { x.schedule.rooms[k].days[d] = cycleBlock(x.schedule.rooms[k].days[d], b); }); } sel = { d, from: b.from }; ctx.changed(); });
        if (ctx.canEdit() && b.i > 0) {                   // the left edge: drag to move the start
          const hd = make('span', 'hpHandle');
          hd.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); ev.preventDefault(); drag = { d, i: b.i, bar, day: null }; hd.setPointerCapture?.(ev.pointerId); });
          hd.addEventListener('click', (ev) => ev.stopPropagation());
          hd.addEventListener('pointermove', (ev) => {                     // the bar follows the finger; the plan changes when it lets go
            if (!drag) return;
            const r = drag.bar.getBoundingClientRect(), m = ((ev.clientX - r.left) / r.width) * 1440;
            drag.day = moveStart(heat().schedule.rooms[k].days[drag.d], drag.i, m);
            const els = drag.bar.querySelectorAll('.hpBlock');
            dayBlocks(drag.day, dayStart(plan.days, drag.d)).forEach((x, j) => { if (els[j]) els[j].style.width = `${((x.to - x.from) / 1440) * 100}%`; });
          });
          const end = () => { const dr = drag; drag = null; if (dr?.day) edit((x) => { x.schedule.rooms[k].days[dr.d] = dr.day; }); };
          hd.addEventListener('pointerup', end); hd.addEventListener('pointercancel', end);
          i.append(hd);
        }
        bar.append(i);
      });
      if (d === today) { const n = make('span', 'hpNow'); n.style.left = `${(nowMin / 1440) * 100}%`; bar.append(n); }
      grid.append(head, bar);
    });
    const hours = make('div', 'hpHours');
    [0, 3, 6, 9, 12, 15, 18, 21, 24].forEach((x) => hours.append(make('span', '', `${x}:00`)));
    grid.append(make('span'), hours);
    return grid;
  }

  function blockTools(h, k) {
    if (!sel || !ctx.canEdit()) return null;
    const plan = h.schedule.rooms[k], day = plan.days[sel.d], blocks = dayBlocks(day, dayStart(plan.days, sel.d));
    const b = blocks.find((x) => x.from === sel.from);
    if (!b) return null;
    const box = make('div', 'hpTools'); box.dataset.block = `${sel.d}:${b.from}`;
    box.append(make('b', '', `${dayNames()[sel.d]} ${hhmm(b.from)}–${hhmm(b.to % 1440)}`));
    LEVELS.forEach((lv) => {
      const c = btn(`tpChip${b.level === lv ? ' on' : ''}`, `${LEVEL_ICON[lv]} ${t(`hr.level.${lv}`)}`, () => edit((x) => {
        let d2 = x.schedule.rooms[k].days[sel.d];
        if (b.i < 0) d2 = [[0, lv], ...d2]; else d2 = d2.map((p, j) => (j === b.i ? [p[0], lv] : p));
        x.schedule.rooms[k].days[sel.d] = d2;
      }));
      c.dataset.level = lv;
      box.append(c);
    });
    if (b.i > 0) {
      const tm = make('input', 'hrTime'); tm.type = 'time'; tm.value = hhmm(b.from); tm.step = 900; tm.dataset.field = 'start';
      tm.addEventListener('change', () => { const m = minutes(tm.value); if (m != null) { edit((x) => { x.schedule.rooms[k].days[sel.d] = moveStart(x.schedule.rooms[k].days[sel.d], b.i, m); }); sel = null; } });
      box.append(tm);
    }
    const split = btn('tpChip', `✂ ${t('hp.split')}`, () => edit((x) => { x.schedule.rooms[k].days[sel.d] = splitBlock(x.schedule.rooms[k].days[sel.d], b); })); split.dataset.act = 'split';
    box.append(split);
    if (b.i > 0) { const rm = btn('tpChip', `🗑 ${t('hp.remove')}`, () => { edit((x) => { x.schedule.rooms[k].days[sel.d] = removeBlock(x.schedule.rooms[k].days[sel.d], b); }); sel = null; }); rm.dataset.act = 'remove'; box.append(rm); }
    return box;
  }

  function nowText(h, k) {
    const n = planNow(h.schedule.rooms[k], new Date()), lv = h.schedule.levels;
    if (!n.level) return '';
    const at = `${LEVEL_ICON[n.level]} ${t(`hr.level.${n.level}`)} ${ctx.deg(lv[n.level])}`;
    return n.until != null ? t('hp.nowUntil', { at, until: hhmm(n.until), next: `${LEVEL_ICON[n.next]} ${t(`hr.level.${n.next}`)} ${ctx.deg(lv[n.next])}` }) : t('hp.now', { at });
  }

  /** the view 📅 Heizplan */
  function view() {
    const box = make('div', 'hpView');
    const h = heat();
    if (!h) { ctx.rules.load(); box.append(make('p', 'tpSub', t('ub.loading'))); return box; }
    const rooms = ctx.rooms();
    if (!rooms.length) { box.append(make('p', 'tpSub', t('hp.noRooms'))); return box; }
    if (!room || !rooms.some((r) => r.id === room)) room = rooms[0].id;
    const k = key(room);
    const top = make('div', 'hpTop');
    const back = btn('bdBtn', `‹ ${t('hp.back')}`, () => ctx.back()); back.dataset.act = 'planBack';
    top.append(back);
    const chips = make('div', 'hpRooms');
    rooms.forEach((r) => { const c = btn(`tpChip${r.id === room ? ' on' : ''}${h.schedule.rooms[key(r.id)] ? ' has' : ''}`, r.name, () => { room = r.id; sel = null; ctx.changed(); }); c.dataset.room = r.id; chips.append(c); });
    top.append(chips);
    const onLab = make('label', 'hpOn');
    const cb = make('input'); cb.type = 'checkbox'; cb.checked = h.schedule.on; cb.disabled = !ctx.canEdit(); cb.dataset.rule = 'schedule';
    cb.addEventListener('change', () => edit((x) => { x.schedule.on = cb.checked; }));
    const sw = make('span', 'sw'); sw.append(cb, make('span'));
    onLab.append(sw, make('span', '', t('hp.on')));
    top.append(onLab);
    box.append(top);
    const levels = make('div', 'hpLevels');
    LEVELS.forEach((lv) => {
      const c = make('span', 'hpLevel'); c.dataset.level = lv;
      const sq = make('i'); sq.style.background = LEVEL_COLOR[lv];
      c.append(sq, make('b', '', `${LEVEL_ICON[lv]} ${t(`hr.level.${lv}`)}`), stepper(h.schedule.levels[lv], (v) => edit((x) => { x.schedule.levels[lv] = v; }), `level.${lv}`));
      levels.append(c);
    });
    box.append(levels);
    if (!h.schedule.rooms[k]) {
      const empty = make('div', 'tpCard hpEmpty');
      empty.append(make('p', '', t('hp.none', { room: rooms.find((r) => r.id === room).name })));
      if (ctx.canEdit()) { const mk = btn('bdBtn primary', `＋ ${t('hp.create')}`, () => edit((x) => { x.schedule.rooms[k] = defaultPlan(); x.schedule.on = true; })); mk.dataset.act = 'createPlan'; empty.append(mk); }
      box.append(empty);
    } else {
      box.append(week(h, k));
      const tools = blockTools(h, k);
      if (tools) box.append(tools);
      const bar = make('div', 'hpBar2');
      if (ctx.canEdit()) {
        const days = (src, to) => edit((x) => { to.forEach((d) => { x.schedule.rooms[k].days[d] = x.schedule.rooms[k].days[src].map((p) => [...p]); }); });
        const wk = btn('bdBtn', t('hp.weekdays'), () => days(0, [1, 2, 3, 4])); wk.dataset.act = 'weekdays';
        const we = btn('bdBtn', t('hp.weekend'), () => days(5, [6])); we.dataset.act = 'weekend';
        const all = btn('bdBtn', t('hp.allRooms'), () => edit((x) => { rooms.filter((r) => r.climate).forEach((r) => { x.schedule.rooms[key(r.id)] = JSON.parse(JSON.stringify(x.schedule.rooms[k])); }); })); all.dataset.act = 'allRooms';
        const del = btn('bdBtn', `🗑 ${t('hp.delete')}`, () => { if (window.confirm(t('hp.deleteAsk'))) { edit((x) => { delete x.schedule.rooms[k]; }); sel = null; } }); del.dataset.act = 'deletePlan';
        bar.append(wk, we, all, del);
      }
      bar.append(make('span', 'tpSub hpNowText', nowText(h, k)));
      box.append(bar);
    }
    const pre = make('div', 'hpPre');
    pre.append(make('span', 'tpSub', t('hp.note')));
    box.append(pre);
    if (ctx.canEdit()) {
      const save = make('div', 'hpSave');
      const ok = btn('bdBtn primary', `✓ ${t('hp.save')}`, async () => { if (await ctx.rules.save({ heat: draft })) { draft = null; dirty = false; ctx.changed(); } });
      ok.disabled = !dirty; ok.dataset.act = 'savePlan';
      const no = btn('bdBtn', t('hp.discard'), () => { draft = null; dirty = false; sel = null; ctx.changed(); });
      no.disabled = !dirty;
      save.append(no, ok);
      box.append(save);
    }
    return box;
  }
  return { view, viewSig: () => JSON.stringify([heat(), room, sel, dirty, ctx.canEdit(), Math.floor(Date.now() / 60000)]), busy: () => !!drag, dirty: () => dirty };
}
