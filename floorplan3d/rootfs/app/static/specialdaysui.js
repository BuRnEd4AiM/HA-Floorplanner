/* The window "📅 Besondere Tage" (the owner, 2026-11-01: "diese Automatisierung soll aber am folgenden Tag … Feiertag … oder einen
 * vordefinierten Tag … anders sein, wie zum Beispiel an Halloween, an Heiligabend"): the one list of special days of all routines, opened
 * from ▶ Abläufe and from the block "Nur wenn: besonderer Tag" of the editor (flowedit.js). Every day with its name, what it is (a date
 * every year, from … to, once, around Easter, the public holidays of Germany or one state, a calendar of Home Assistant), when it comes
 * next; "＋" adds a ready one (Feiertage, Heiligabend, Halloween, Urlaub …); "✓ Speichern" saves the list (api/rules, part "days"; the
 * automations of Home Assistant that use a day are written anew). The rules are in specialdays.js (tested). */
import { cleanDays, cleanDay, newDayId, presets, hasPreset, kindText, dayName, dayIcon, nextOf, dateText, holidays, which, REGIONS, REGION_NAMES, ymd } from './specialdays.js';

/** ctx: t, lang(), states(), entities() ([{ entity_id, name }]), nameOf(entity), canEdit(), rules (rulesstore.js) */
export function initSpecialDaysUi(ctx) {
  const { t } = ctx;
  let dlg = null, draft = [], dirty = false, flash = '', after = null, fresh = '';
  let cals = null;                                     // Home Assistant's calendars (api/calendars, like the calendar card), asked once
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on, title) => { const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', on); return b; };
  const lang = () => ctx.lang();
  const nameOf = (e) => ctx.nameOf(e) || e;
  const change = (fn) => { fn(); dirty = true; draw(); };
  const today = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
  const field = (label, ...nodes) => { const f = make('label', 'sdField'); f.append(make('span', '', label), ...nodes); return f; };
  function dateInput(value, set, data) {
    const i = make('input', 'sdDate'); i.type = 'date'; i.value = value; if (data) i.dataset.field = data;
    i.addEventListener('change', () => { if (/^\d{4}-\d{2}-\d{2}$/.test(i.value)) set(i.value); });
    return i;
  }
  /** a day of the year (MM-DD) in a date field: this year's, the 29 February of the next leap year */
  const mdValue = (md) => { let y = today().getFullYear(); if (md === '02-29') while (new Date(y, 1, 29).getMonth() !== 1) y++; return `${y}-${md}`; };

  /** what is special today: "Heute: 🎄 Heiligabend" or "Heute ist kein besonderer Tag" */
  function todayLine(days) {
    const ids = which(days, today(), ctx.states());
    const names = ids.map((id) => days.find((x) => x.id === id)).map((x) => `${dayIcon(x)} ${dayName(x, t, lang(), nameOf)}`);
    const p = make('p', `sdToday${names.length ? ' on' : ''}`, names.length ? t('sd.todayIs', { days: names.join(', ') }) : t('sd.todayNone'));
    p.dataset.field = 'today';
    return p;
  }
  /** "nächstes Mal: Do., 24. Dez." (a holiday with its name), "heute", or for a calendar what it says now */
  function nextLine(d) {
    if (d.kind === 'calendar') return ctx.states()[d.ent]?.state === 'on' ? t('sd.calOn') : t('sd.calOff');
    const n = nextOf(d, today());
    if (!n) return t('sd.past');
    const when = ymd(n.date) === ymd(today()) ? t('sd.today') : dateText(n.date, lang());
    return n.key ? t('sd.nextHoliday', { name: t(`sd.h.${n.key}`), date: when }) : t('sd.next', { date: when });
  }
  function fields(d) {
    const box = make('div', 'sdFields');
    const set = (fn) => change(() => { fn(d); Object.assign(d, cleanDay(d) || {}); });
    if (d.kind === 'date') {
      box.append(field(d.to ? t('sd.from') : t('sd.date'), dateInput(mdValue(d.md), (v) => set((x) => { x.md = v.slice(5); }), 'md')));
      if (d.to) box.append(field(t('sd.to'), dateInput(mdValue(d.to), (v) => set((x) => { x.to = v.slice(5); }), 'to')));
      const more = btn('tpChip', d.to ? `✕ ${t('sd.oneDay')}` : `＋ ${t('sd.moreDays')}`, () => set((x) => {
        if (x.to) delete x.to;
        else { const a = new Date(2024, Number(x.md.slice(0, 2)) - 1, Number(x.md.slice(3)) + 1); x.to = ymd(a).slice(5); }
      }));
      more.dataset.act = 'sdRange';
      box.append(more);
    } else if (d.kind === 'once') {
      box.append(field(t('sd.from'), dateInput(d.from, (v) => set((x) => { x.from = v; if (x.to < v) x.to = v; }), 'from')),
        field(t('sd.to'), dateInput(d.to, (v) => set((x) => { x.to = v; }), 'to')));
    } else if (d.kind === 'easter') {
      const i = make('input', 'feNum'); i.type = 'number'; i.min = -70; i.max = 70; i.step = 1; i.value = d.off; i.dataset.field = 'off';
      i.addEventListener('change', () => { const n = Math.round(Number(i.value)); if (Number.isFinite(n)) set((x) => { x.off = n; }); });
      box.append(field(t('sd.easterOff'), i), make('small', 'tpSub', t('sd.easterHelp')));
    } else if (d.kind === 'holidays') {
      const sel = make('select', 'ceSelect'); sel.dataset.field = 'region';
      REGIONS.forEach((r) => sel.append(new Option(r === 'DE' ? t('sd.regionDE') : REGION_NAMES[r], r)));
      sel.value = d.region;
      sel.addEventListener('change', () => set((x) => { x.region = sel.value; }));
      box.append(field(t('sd.region'), sel));
      const year = today().getFullYear(), from = ymd(today());
      const soon = [...holidays(d.region, year), ...holidays(d.region, year + 1)].filter((h) => h.date >= from).slice(0, 4);
      const list = make('small', 'tpSub sdSoon');
      list.textContent = soon.map((h) => `${t(`sd.h.${h.key}`)} ${dateText(new Date(Number(h.date.slice(0, 4)), Number(h.date.slice(5, 7)) - 1, Number(h.date.slice(8))), lang())}`).join(' · ');
      box.append(list, make('small', 'tpSub', t('sd.otherCountry')));
    } else if (d.kind === 'calendar') {
      const seen = new Set((cals || []).map((c) => c.entity_id));
      const list = [...(cals || []), ...ctx.entities().filter((e) => e.entity_id.startsWith('calendar.') && !seen.has(e.entity_id))];
      const sel = make('select', 'ceSelect'); sel.dataset.field = 'ent';
      sel.append(new Option(t('sd.pickCal'), ''), ...list.map((c) => new Option(c.name || c.entity_id, c.entity_id)));
      sel.value = d.ent || '';
      sel.addEventListener('change', () => change(() => { d.ent = sel.value; }));
      box.append(field(t('sd.calendar'), sel), make('small', 'tpSub', list.length ? t('sd.calHelp') : t('sd.noCals')));
    }
    return box;
  }
  function row(d) {
    const r = make('div', `sdRow${fresh === d.id ? ' fresh' : ''}${cleanDay(d) ? '' : ' bad'}`); r.dataset.day = d.id;
    const head = make('div', 'sdHead');
    const icon = make('input', 'sdIcon'); icon.value = d.icon || dayIcon(d); icon.maxLength = 8; icon.title = t('sd.icon'); icon.dataset.field = 'icon';
    icon.addEventListener('change', () => change(() => { d.icon = icon.value.trim().slice(0, 8); }));
    const name = make('input', 'sdName'); name.value = d.name; name.maxLength = 40; name.placeholder = kindText(d, t, lang(), nameOf); name.dataset.field = 'name';
    name.addEventListener('change', () => change(() => { d.name = name.value.trim().slice(0, 40); }));
    const del = btn('bdBtn', '🗑', () => change(() => { draft = draft.filter((x) => x !== d); }), t('sd.delete')); del.dataset.act = 'sdDelete';
    head.append(icon, name, del);
    r.append(head, make('div', 'sdKind', `${kindText(d, t, lang(), nameOf)} · ${nextLine(d)}`), fields(d));
    return r;
  }
  function addRow() {
    const box = make('div', 'sdAdd');
    box.append(make('small', '', t('sd.add')));
    const chips = make('div', 'feChips');
    presets(today()).forEach((p) => {
      const b = btn('tpChip', `${p.icon} ${t(`sd.p.${p.key}`)}`, () => change(() => {
        const id = newDayId(draft.map((x) => x.id));
        draft.push({ id, name: ['own', 'holidays', 'calendar', 'tomorrow'].includes(p.key) ? '' : t(`sd.p.${p.key}`), icon: p.icon, ...p.day });   // no name: what it is
        fresh = id;
      }));
      b.dataset.add = p.key;
      if (hasPreset(draft, p)) { b.disabled = true; b.classList.add('on'); }   // already in the list
      chips.append(b);
    });
    box.append(chips);
    return box;
  }
  function draw() {
    if (!dlg?.open) return;
    const head = make('div', 'ceHead');
    head.append(make('h3', '', `📅 ${t('sd.title')}`), make('p', 'tpSub', t('sd.sub')));
    const list = make('div', 'sdList');
    if (!draft.length) list.append(make('p', 'tpSub sdEmpty', t('sd.empty')));
    draft.forEach((d) => list.append(row(d)));
    const bar = make('div', 'ceBtns');
    if (flash) bar.append(make('span', 'feFlash', flash));
    const close = btn('bdBtn', t('ce.cancel'), shut); close.dataset.act = 'sdClose';
    const ok = draft.every((d) => cleanDay(d));
    const save = btn('bdBtn primary', `✓ ${t('fe.save')}`, store); save.dataset.act = 'sdSave'; save.disabled = !dirty || !ok;
    bar.append(close, save);
    const scroll = make('div', 'sdBody');
    scroll.append(todayLine(cleanDays(draft)), list, addRow());
    if (!ok) scroll.append(make('p', 'feMissing', `⚠ ${t('sd.missing')}`));
    dlg.replaceChildren(head, scroll, bar);
    if (fresh) { dlg.querySelector(`.sdRow[data-day="${fresh}"]`)?.scrollIntoView({ block: 'nearest' }); fresh = ''; }
  }
  async function store() {
    const res = await ctx.rules.save({ days: cleanDays(draft) });
    if (!res) { flash = t('fe.notSaved'); draw(); return; }
    dirty = false;
    draft = JSON.parse(JSON.stringify(res.days || []));
    shut();
  }
  function shut() {
    if (dirty && !window.confirm(t('fe.leaveAsk'))) return;
    dirty = false;
    dlg?.close();
  }
  /** the window; then: called when it closes (the editor draws its block again) */
  function open(then) {
    if (!ctx.canEdit()) return;
    if (!dlg) {
      dlg = make('dialog', 'ceDlg sdDlg');
      dlg.addEventListener('cancel', (e) => { e.preventDefault(); shut(); });
      dlg.addEventListener('close', () => { const a = after; after = null; a?.(); });
      document.body.append(dlg);
    }
    after = then || null;
    draft = JSON.parse(JSON.stringify(ctx.rules.get()?.days || []));
    dirty = false; flash = ''; fresh = '';
    if (!dlg.open) dlg.showModal();
    draw();
    if (!cals) {
      cals = [];
      fetch('api/calendars').then((r) => (r.ok ? r.json() : [])).then((l) => {
        cals = (Array.isArray(l) ? l : []).filter((c) => typeof c?.entity_id === 'string' && c.entity_id.startsWith('calendar.'));
        if (cals.length) draw();
      }).catch(() => {});
    }
  }
  return { open, isOpen: () => !!dlg?.open };
}
