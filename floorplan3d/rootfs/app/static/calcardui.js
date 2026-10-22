/* The calendar card (#495; calcard.js has the rules): asks the add-on for the events of its calendars (api/calendar/events, again after
 * 5 minutes or after a new event), draws them as a week (a column per day), a list, a month or only the next event, with a chip per
 * calendar in its colour, and "＋ Termin": a window that puts a new event into one of the card's calendars (Home Assistant's
 * calendar.create_event through live.callService). Also the part of the window "Karte einstellen" for this kind (cardeditor.js): the
 * calendars with their colours, the days, the view, "＋ Termin" yes or no. */
import { CAL_VIEWS, CAL_DAYS, CAL_COLORS, CAL_HEX, MAX_CALS, calWindow, eventsByDay, upcoming, dayWord, dayKey, newEvent } from './calcard.js';

const KEEP = 300000;                                  // the events of a card are asked again after 5 minutes

/** ctx: t, lang(), callService(entity, service, data) (-> true when taken), changed() (events arrived: draw the open page again) */
export function initCalendarCard(ctx) {
  const { t } = ctx;
  const got = new Map();                             // "ids|first day|days" -> { at, events, failed, asking }
  const picked = new Map();                          // card id -> the day tapped in the month
  let names = null, asking = null, dlg = null;       // the names of Home Assistant's calendars (api/calendars), asked once
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on, title) => { const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', (e) => { e.stopPropagation(); on(e); }); return b; };
  const fmt = (d, o) => { try { return new Intl.DateTimeFormat(ctx.lang(), o).format(d); } catch { return d.toDateString(); } };
  const hm = (d) => fmt(d, { hour: '2-digit', minute: '2-digit' });
  const nameOf = (id) => names?.get(id) || id.replace(/^calendar\./, '').replace(/_/g, ' ');

  /** Home Assistant's calendars [{ entity_id, name }] (the window and the chips need their names) */
  function calendars() {
    if (!asking) {
      asking = fetch('api/calendars').then((r) => (r.ok ? r.json() : [])).then((l) => (Array.isArray(l) ? l : [])).catch(() => [])
        .then((l) => { names = new Map(l.map((c) => [c.entity_id, c.name || c.entity_id])); if (!l.length) asking = null; ctx.changed(); return l; });
    }
    return asking;
  }
  const keyOf = (c, win) => `${c.cals.map((x) => x.id).join(',')}|${dayKey(win.start)}|${win.days.length}`;
  function load(c, win) {
    if (!names) calendars();
    const key = keyOf(c, win), h = got.get(key);
    if (h && (h.asking || Date.now() - h.at < KEEP)) return h;
    const next = { at: Date.now(), events: h?.events || null, failed: h?.failed || [], asking: true };
    got.set(key, next);
    const q = new URLSearchParams({ ids: c.cals.map((x) => x.id).join(','), start: win.start.toISOString(), end: win.end.toISOString() });
    fetch(`api/calendar/events?${q}`).then((r) => (r.ok ? r.json() : null))
      .then((x) => { next.events = Array.isArray(x?.events) ? x.events : next.events || []; next.failed = Array.isArray(x?.failed) ? x.failed : []; })
      .catch(() => { next.events = next.events || []; })
      .finally(() => { next.asking = false; ctx.changed(); });
    return next;
  }

  /** an event as a coloured block (week) or a row with a bar in its colour (list) */
  function block(ev) {
    const b = make('div', 'calEv'); b.style.background = CAL_HEX[ev.color]; b.dataset.cal = ev.cal;
    b.append(make('small', '', ev.cont ? t('cal.cont') : ev.allDay ? t('cal.allDay') : hm(ev.start)), make('b', '', ev.title));
    b.title = `${ev.title} · ${nameOf(ev.cal)}`;
    return b;
  }
  function row(ev) {
    const r = make('div', 'calRow'); r.dataset.cal = ev.cal;
    const bar = make('i', 'calBar'); bar.style.background = CAL_HEX[ev.color];
    r.append(bar, make('b', 'calTime', ev.cont ? t('cal.cont') : ev.allDay ? t('cal.allDay') : hm(ev.start)), make('span', 'calTitle', ev.title));
    r.title = nameOf(ev.cal);
    return r;
  }
  const dayHead = (d, now) => { const w = dayWord(d, now); return w ? t(`cal.${w}`) : fmt(d, { weekday: 'long', day: 'numeric', month: 'numeric' }); };

  function week(by, days, now, box) {
    const g = make('div', 'calWeek');
    days.forEach((d) => {
      const col = make('div', `calDay${dayKey(d) === dayKey(now) ? ' today' : ''}`); col.dataset.day = dayKey(d);
      col.append(make('div', 'calDayHead', fmt(d, { weekday: 'short', day: 'numeric' })));
      (by.get(dayKey(d)) || []).forEach((ev) => col.append(block(ev)));
      g.append(col);
    });
    box.append(g);
  }
  function list(by, days, now, box) {
    const l = make('div', 'calAgenda');
    days.forEach((d) => {
      const evs = by.get(dayKey(d)) || [];
      if (!evs.length) return;
      const grp = make('div', 'calGroup'); grp.dataset.day = dayKey(d);
      grp.append(make('h4', '', dayHead(d, now)), ...evs.map(row));
      l.append(grp);
    });
    if (!l.childElementCount) l.append(make('p', 'tpSub', t('cal.none')));
    box.append(l);
  }
  function month(c, by, days, now, box) {
    const g = make('div', 'calMonth'), here = now.getMonth();
    days.slice(0, 7).forEach((d) => g.append(make('span', 'calWd', fmt(d, { weekday: 'short' }))));
    const sel = picked.get(c.id) || dayKey(now);
    days.forEach((d) => {
      const k = dayKey(d), evs = by.get(k) || [];
      const cell = btn(`calCell${d.getMonth() !== here ? ' other' : ''}${k === dayKey(now) ? ' today' : ''}${k === sel ? ' on' : ''}`, null,
        () => { picked.set(c.id, k); ctx.changed(); });
      cell.dataset.day = k;
      cell.append(make('b', '', String(d.getDate())));
      const dots = make('span', 'calDots');
      evs.slice(0, 4).forEach((ev) => { const i = make('i'); i.style.background = CAL_HEX[ev.color]; dots.append(i); });
      cell.append(dots);
      if (evs.length) cell.title = evs.map((ev) => ev.title).join(', ');
      g.append(cell);
    });
    box.append(g);
    const d = days.find((x) => dayKey(x) === sel);
    if (d) {
      const evs = by.get(sel) || [], l = make('div', 'calAgenda calPicked');
      l.append(make('h4', '', dayHead(d, now)), ...(evs.length ? evs.map(row) : [make('p', 'tpSub', t('cal.none'))]));
      box.append(l);
    }
  }
  /** the next event big, the two after it as rows */
  function next(c, events, now, box) {
    const [ev, ...later] = upcoming(events, c.cals, now, 3);
    if (!ev) { box.append(make('p', 'tpSub calNone', t('cal.noNext'))); return; }
    const n = make('div', 'calNext'); n.dataset.cal = ev.cal;
    const bar = make('i', 'calBar'); bar.style.background = CAL_HEX[ev.color];
    const when = ev.start <= now ? t('cal.now') : `${dayHead(ev.start, now)}${ev.allDay ? '' : ` · ${hm(ev.start)}`}`;
    const txt = make('div');
    txt.append(make('small', 'tpSub', when), make('b', 'calNextTitle', ev.title), make('small', 'tpSub', nameOf(ev.cal)));
    n.append(bar, txt);
    box.append(n);
    if (later.length) {
      const l = make('div', 'calAgenda calLater');
      l.append(make('h4', '', t('cal.later')), ...later.map((x) => { const r = row(x); r.querySelector('.calTime').textContent = `${dayHead(x.start, now)}${x.allDay ? '' : ` · ${hm(x.start)}`}`; return r; }));
      box.append(l);
    }
  }

  /** the card's body into box (cardsui.js put its heading above) */
  function render(c, box) {
    const now = new Date(), win = calWindow(c, now), h = load(c, win);
    const top = make('div', 'calTop'), chips = make('div', 'calChips');
    c.cals.forEach((x) => {
      const ch = make('span', 'calChip'); ch.dataset.cal = x.id;
      const dot = make('i'); dot.style.background = CAL_HEX[x.color];
      ch.append(dot, document.createTextNode(nameOf(x.id)));
      chips.append(ch);
    });
    top.append(chips);
    if (c.add) { const a = btn('bdBtn calAdd', t('cal.addBtn'), () => open(c), t('cal.newSub')); a.dataset.act = 'calAdd'; top.append(a); }
    box.append(top);
    box.classList.add(`cal-${c.view}`);
    if (!h.events) { box.append(make('p', 'tpSub', t('tp.today.loading'))); return; }
    if (h.failed.length) box.append(make('p', 'tpSub calFailed', t('cal.failedCal', { names: h.failed.map(nameOf).join(', ') })));
    if (c.view === 'next') { next(c, h.events, now, box); return; }
    const by = eventsByDay(h.events, c.cals, win.days);
    if (c.view === 'week') week(by, win.days, now, box);
    else if (c.view === 'month') month(c, by, win.days, now, box);
    else list(by, win.days, now, box);
  }
  /** what the card shows depends on: its events, the day, the names, the tapped day; the next event every minute */
  function sig(c) {
    const now = new Date(), win = calWindow(c, now), h = got.get(keyOf(c, win));
    return [h?.at, h?.events?.length ?? -1, h?.asking, dayKey(now), names?.size ?? -1, picked.get(c.id), c.view === 'next' ? Math.floor(+now / 60000) : 0];
  }

  /** "＋ Termin": title, calendar, day, all day or from / to */
  function open(c, day = picked.get(c.id) || dayKey(new Date())) {
    if (!dlg) { dlg = make('dialog', 'ceDlg calDlg'); dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }); document.body.append(dlg); }
    const field = (label, ...nodes) => { const f = make('div', 'ceField'); f.append(make('label', '', label), ...nodes); return f; };
    const input = (type, act, value) => { const i = make('input', 'ceInput'); i.type = type; i.dataset.act = act; i.value = value; return i; };
    const title = input('text', 'calTitle', ''); title.maxLength = 200; title.placeholder = t('cal.titlePh');
    const cal = make('select', 'ceSelect'); cal.dataset.act = 'calCal';
    c.cals.forEach((x) => cal.append(new Option(nameOf(x.id), x.id)));
    const soon = new Date(); soon.setHours(soon.getHours() + 1, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    const dayIn = input('date', 'calDay', day), toDay = input('date', 'calToDay', day);
    const from = input('time', 'calFrom', `${pad(soon.getHours())}:00`), to = input('time', 'calTo', `${pad((soon.getHours() + 1) % 24)}:00`);
    const all = make('input'); all.type = 'checkbox'; all.dataset.act = 'calAllDay';
    const allRow = make('label', 'calAllDay'); allRow.append(all, document.createTextNode(` ${t('cal.allDayLong')}`));
    const times = make('div', 'calTimes'); times.append(field(t('cal.from'), from), field(t('cal.to'), to));
    const lastDay = field(t('cal.toDay'), toDay);
    const show = () => { times.hidden = all.checked; lastDay.hidden = !all.checked; };
    all.addEventListener('change', show); show();
    dayIn.addEventListener('change', () => { if (!toDay.value || toDay.value < dayIn.value) toDay.value = dayIn.value; });
    const err = make('p', 'calErr');
    const save = btn('bdBtn primary', `✓ ${t('cal.save')}`, async () => {
      const data = newEvent({ title: title.value, day: dayIn.value, allDay: all.checked, from: from.value, to: to.value, toDay: toDay.value },
        (d, tm) => new Date(`${d}T${tm}:00`).getTimezoneOffset());
      if (data.error) { err.textContent = t(data.error); return; }
      save.disabled = true; err.textContent = '';
      const ok = await ctx.callService(cal.value, 'create_event', data);
      save.disabled = false;
      if (!ok) { err.textContent = t('cal.failed'); return; }
      got.clear();                                   // every card asks again: the new event is in it
      dlg.close(); ctx.changed();
    });
    save.dataset.act = 'calSave';
    const head = make('div', 'ceHead'); head.append(make('h3', '', t('cal.newTitle')), make('p', 'tpSub', t('cal.newSub')));
    const bar = make('div', 'ceBtns'); bar.append(btn('bdBtn', t('ce.cancel'), () => dlg.close()), save);
    dlg.replaceChildren(head, field(t('cal.title'), title), field(t('cal.cal'), cal), field(t('cal.day'), dayIn), allRow, times, lastDay, err, bar);
    if (!dlg.open) dlg.showModal();
    title.focus();
  }

  /**
   * The part of "Karte einstellen" (cardeditor.js) for a calendar card: draft is the card being set; ui: { field(label, ...nodes),
   * seg(values, text, key), preview() }
   */
  function fields(draft, ui) {
    draft.cals = Array.isArray(draft.cals) ? draft.cals.map((x) => ({ ...x })) : [];
    const box = make('div', 'calPicks');
    const draw = (all) => {
      if (!all.length) { box.replaceChildren(make('p', 'tpSub', names ? t('ce.noCals') : t('tp.today.loading'))); return; }
      box.replaceChildren(...all.map((cal) => {
        const mine = draft.cals.find((x) => x.id === cal.entity_id);
        const r = make('div', `calPick${mine ? ' on' : ''}`); r.dataset.cal = cal.entity_id;
        const tick = btn('ceTick calTick', mine ? '☑' : '☐', () => {
          draft.cals = mine ? draft.cals.filter((x) => x !== mine) : [...draft.cals, { id: cal.entity_id, color: CAL_COLORS.find((k) => !draft.cals.some((x) => x.color === k)) || 'blue' }].slice(0, MAX_CALS);
          draw(all); ui.preview();
        }, t('ce.cals'));
        const dots = make('span', 'calColors');
        CAL_COLORS.forEach((k) => {
          const d = btn(`calDot${mine?.color === k ? ' on' : ''}`, null, () => {
            if (mine) mine.color = k; else draft.cals = [...draft.cals, { id: cal.entity_id, color: k }].slice(0, MAX_CALS);
            draw(all); ui.preview();
          }, t(`cal.color.${k}`));
          d.dataset.color = k; d.style.background = CAL_HEX[k]; d.setAttribute('aria-label', t(`cal.color.${k}`));
          dots.append(d);
        });
        const nm = make('span', 'calPickName'); nm.append(make('span', 'ceName', cal.name || cal.entity_id), make('small', '', cal.entity_id));
        r.append(tick, nm, dots);
        return r;
      }));
    };
    draw([]);
    calendars().then((all) => draw([...all, ...draft.cals.filter((x) => !all.some((c) => c.entity_id === x.id)).map((x) => ({ entity_id: x.id, name: nameOf(x.id) }))]));
    ui.field(t('ce.cals'), box);
    ui.field(t('cal.days'), ui.seg(CAL_DAYS, (d) => t(`cal.days.${d}`), 'days'));
    ui.field(t('cal.view'), ui.seg(CAL_VIEWS, (v) => t(`cal.view.${v}`), 'view'));
    ui.field(t('cal.add'), ui.seg([true, false], (v) => t(v ? 'cal.addOn' : 'cal.addOff'), 'add'));
  }
  return { render, sig, open, fields };
}
