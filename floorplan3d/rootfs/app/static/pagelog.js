/* The page 📜 Protokoll of the tab bar (the owner's wish, 2026-10-28, his choice from docs/ideen-4.40/: pictures 2 + 3): everything that
 * happens with the devices of the plans and who it was, the add-on's commands and whether Home Assistant took them, devices that stop
 * reporting and a lost connection; filters (day, kind, who, room, search), the numbers on top, a tap on a row shows that device's day on
 * the side, "📋 Bericht kopieren" and "⬇ Exportieren" (text to copy, a .txt or a .csv file; the last hour, the day or the last 7 days;
 * everything shown, only the faults, or one device). Only for who may edit (it says when somebody was at home): the server answers
 * api/log only them. The words and the numbers come from devlog.js (tested); the add-on keeps the events in the files of 🛡 Sicherheit. */
import { KINDS, KIND_ICON, WHO, filterEvents, tiles, rowOf, deviceDay, toCsv, report, dayText, clock, stateWord, isError } from './devlog.js';

const SHOW = 150;              // rows shown first ("Mehr zeigen": more)
const FRESH = 15000;           // ms: today is asked again this often while the page is shown

/** ctx: t, el (the page), states(), nameOf(entity), roomOf(entity) (its room in the plans), rooms() (the rooms of the house shown, names),
 *  openings() (Set of the contact entities of the plans), canEdit(), deg(°C), usedBy() (usedbyui.js: button(entity), or null) */
export function initLogPage(ctx) {
  const { t, el } = ctx;
  let data = null, loading = null, want = { day: '', n: 1 }, f = { kind: 'all', who: 'all', room: '', q: '' }, device = '', shown = SHOW, dlg = null, copied = '',
    timer = 0, sig = '', drawn = '', table = null, side = null, nums = null;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on, title) => { const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', on); return b; };
  const name = (e) => ctx.nameOf(e) || e;
  const words = () => ({ t, deg: ctx.deg, name, roomOf: ctx.roomOf, dc: (e) => ctx.states()[e]?.dc, openings: ctx.openings() });
  const today = () => { const d = new Date(), p = (x) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
  const dayOf = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d).getTime() / 1000; };
  const isToday = () => (want.day || today()) === today();

  async function load(day = want.day, n = want.n) {
    want = { day, n };
    if (loading) return loading.then(() => (data?.day === (day || today()) && data?.n === n ? null : load(day, n)));
    loading = (async () => {
      try {
        const r = await fetch(`api/log?day=${encodeURIComponent(day || today())}&days=${n}`);
        if (r.ok) {
          data = await r.json();
          const s = JSON.stringify([data.day, data.n, data.events.length, data.events[data.events.length - 1], data.recording, data.on]);
          if (s !== sig) { sig = s; draw(); }
        } else if (r.status === 403) { data = { forbidden: true }; draw(); }
      } catch { /* no answer: what was there stays */ }
      loading = null;
    })();
    return loading;
  }
  function tick() {
    clearTimeout(timer);
    timer = setTimeout(() => { if (el.isConnected && !el.hidden && isToday() && want.n === 1) load().then(tick); else tick(); }, FRESH);
  }

  /* ---- copy and save ---- */
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch {
      const ta = make('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.append(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove();
      return ok;
    }
  }
  function save(text, ext, type) {
    const a = make('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = `floorplan3d-protokoll-${(data?.from || today())}${want.n > 1 ? `-${want.n}-tage` : ''}.${ext}`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  const filterText = () => [f.kind !== 'all' ? t(`log.kind.${f.kind}`) : '', f.who !== 'all' ? t(`log.whoF.${f.who}`) : '', f.room, f.q ? `„${f.q}“` : '']
    .filter(Boolean).join(', ');
  const meta = (evs) => ({ version: data?.version, now: Date.now() / 1000, from: data?.from && dayText(dayOf(data.from)), to: data?.day && dayText(dayOf(data.day)),
    filters: filterText(), recording: data?.recording, n: evs.length });
  const list = () => filterEvents(data?.events, f, words());     // the device on the side is only marked in the table

  async function quickCopy(b) {
    const ok = await copy(report(list(), words(), meta(list())));
    copied = ok ? 'ok' : 'self';
    b.textContent = ok ? `✓ ${t('hd.copied')}` : t('hd.copySelf');
    if (!ok) openExport();
    setTimeout(() => { copied = ''; b.textContent = `📋 ${t('hd.copy')}`; }, 4000);
  }

  /* ---- the window "Exportieren" ---- */
  function openExport() {
    if (!dlg) { dlg = make('dialog', 'lgDlg ceDlg'); dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }); document.body.append(dlg); }
    const pick = { span: 'day', what: device ? 'device' : 'all', as: 'text' };
    const paint = () => {
      const head = make('div', 'ceHead');
      head.append(make('h3', '', `⬇ ${t('log.export')}`), make('p', 'tpSub', t('log.exportSub')));
      const group = (key, opts) => {
        const box = make('div', 'lgOpts'); box.dataset.group = key;
        opts.forEach(([v, label, sub, off]) => {
          const o = btn(`lgOpt${pick[key] === v ? ' on' : ''}`, null, () => { pick[key] = v; paint(); });
          o.dataset.opt = v; o.disabled = !!off;
          o.append(make('b', '', label));
          if (sub) o.append(make('small', '', sub));
          box.append(o);
        });
        return box;
      };
      const out = make('textarea', 'hdText lgOut'); out.readOnly = true; out.rows = 7; out.hidden = copied !== 'self';
      const go = btn('bdBtn', pick.as === 'text' ? `📋 ${t('log.copy')}` : `⬇ ${t('log.save')}`, async () => {
        let evs = data?.events || [];
        if (pick.span === 'week' && want.n < 7) { await load(today(), 7); evs = data?.events || []; }
        const now = Date.now() / 1000;
        let sel = filterEvents(evs, pick.what === 'all' ? f : { device: pick.what === 'device' ? device : '' }, words());
        if (pick.what === 'errors') sel = sel.filter(isError);
        if (pick.span === 'hour') sel = sel.filter((x) => x.t >= now - 3600);
        const m = meta(sel);
        if (pick.as === 'csv') { save(toCsv(sel, words()), 'csv', 'text/csv;charset=utf-8'); dlg.close(); return; }
        const text = report(sel, words(), m);
        if (pick.as === 'txt') { save(text, 'txt', 'text/plain;charset=utf-8'); dlg.close(); return; }
        if (await copy(text)) { go.textContent = `✓ ${t('hd.copied')}`; setTimeout(() => dlg.close(), 900); } else { out.value = text; out.hidden = false; out.select(); go.textContent = t('hd.copySelf'); }
      });
      go.dataset.act = 'exportGo';
      const bar = make('div', 'ceBtns');
      bar.append(btn('bdBtn', t('ce.cancel'), () => dlg.close()), go);
      dlg.replaceChildren(head, make('div', 'lgSec', t('log.span')), group('span', [['hour', t('log.span.hour')], ['day', want.n > 1 ? t('log.span.shown') : isToday() ? t('log.span.today') : dayText(dayOf(want.day))], ['week', t('log.span.week')]]),
        make('div', 'lgSec', t('log.what')), group('what', [['all', t('log.what.all'), t('log.what.allSub')], ['errors', t('log.what.errors'), t('log.what.errorsSub')],
          ['device', t('log.what.device'), device ? name(device) : t('log.what.deviceNone'), !device]]),
        make('div', 'lgSec', t('log.as')), group('as', [['text', `📋 ${t('log.as.text')}`, t('log.as.textSub')], ['txt', `📄 ${t('log.as.txt')}`, t('log.as.txtSub')], ['csv', `📊 ${t('log.as.csv')}`, t('log.as.csvSub')]]),
        make('p', 'lgNote', t('log.exportNote')), out, bar);
    };
    paint();
    if (!dlg.open) dlg.showModal();
  }

  /* ---- the side: one device's day ---- */
  function sidePanel() {
    const box = make('div', 'lgSide'); box.dataset.device = device;
    const s = ctx.states()[device], w = words();
    const head = make('div', 'lgSideHead');
    head.append(make('h3', '', name(device)), btn('tpChip', '✕', () => { device = ''; fill(); }, t('ce.cancel')));
    box.append(head, make('span', 'tpSub', [device, ctx.roomOf(device)].filter(Boolean).join(' · ')));
    const kv = (k, v) => { const r = make('div', 'kv'); r.append(make('span', '', k), make('b', '', v)); return r; };
    if (s) box.append(kv(t('log.now'), [stateWord(device, s.state, t, s.dc), typeof s.tt === 'number' ? t('log.target1', { v: ctx.deg(s.tt) }) : '', typeof s.ct === 'number' && device.startsWith('climate.') ? t('hd.th.meas', { v: ctx.deg(s.ct) }) : '']
      .filter(Boolean).join(' · ')));
    const one = want.n === 1, start = dayOf(want.day || today());
    const d = deviceDay(data?.events, device, start, start + 86400, Date.now() / 1000);
    box.append(kv(one ? t('log.day') : t('log.days'), t('log.changes', { n: d.changes, a: d.addon })), kv(t('log.cmds'), `${d.ok} ✓ · ${d.commands - d.ok} ✗`));
    if (one && d.bar.length) {
      const bar = make('div', 'lgBar');
      d.bar.forEach(([a, b, on, gone]) => { const i = make('i', gone ? 'gone' : on ? 'on' : 'off'); i.style.left = `${a * 100}%`; i.style.width = `${(b - a) * 100}%`; bar.append(i); });
      const axis = make('div', 'lgAxis'); ['0:00', '6:00', '12:00', '18:00', '24:00'].forEach((x) => axis.append(make('span', '', x)));
      box.append(bar, axis);
    }
    const mini = make('div', 'lgMini');
    filterEvents(data?.events, { device }, w).slice(0, 10).forEach((x) => {
      const r = rowOf(x, w), row = make('div', r.err ? 'err' : '');
      row.append(make('span', 'at', clock(x.t).slice(0, 5)), make('span', '', `${r.what} · ${r.who.text}`));
      mini.append(row);
    });
    box.append(mini);
    const bar = make('div', 'lgBtns');
    const c = btn('bdBtn', `📋 ${t('log.copyDevice')}`, async () => { const ok = await copy(report(filterEvents(data?.events, { device }, w), w, { ...meta([]), filters: name(device) })); c.textContent = ok ? `✓ ${t('hd.copied')}` : t('hd.copySelf'); });
    c.dataset.act = 'copyDevice';
    bar.append(c);
    const u = ctx.usedBy?.()?.button?.(device);
    if (u) { u.classList.add('bdBtn'); bar.append(u); }
    box.append(bar);
    return box;
  }

  /* ---- the table and the numbers (drawn again on a filter, a search, new events) ---- */
  function fill() {
    if (!table) return;
    const w = words(), evs = list(), n = tiles(filterEvents(data?.events, {}, w));
    nums.replaceChildren(...[['', n.events, t('log.tile.events', { d: n.devices })], ['', n.commands, t('log.tile.cmds', { ok: n.ok })], [n.errors ? 'bad' : '', n.errors, t('log.tile.errors')],
      ['', data?.recording ? `🔗 ${t('log.tile.on')}` : `⚠️ ${t('log.tile.off')}`, data?.recording ? t('log.tile.onSub') : t('log.tile.offSub')]].map(([c, v, s]) => {
      const d = make('div', `lgTile ${c}`); d.append(make('b', '', String(v)), make('span', '', s)); return d;
    }));
    const head = make('div', 'lgRow th');
    [t('log.col.time'), t('log.col.device'), t('log.col.what'), t('log.col.who')].forEach((x) => head.append(make('span', '', x)));
    const rows = [head];
    let day = '';
    evs.slice(0, shown).forEach((x) => {
      const d = dayText(x.t);
      if (want.n > 1 && d !== day) { day = d; rows.push(make('div', 'lgDay', d)); }
      const r = rowOf(x, w), row = make('div', `lgRow${r.err ? ' err' : ''}${r.e && r.e === device ? ' sel' : ''}`);
      row.dataset.kind = x.k; if (r.e) row.dataset.entity = r.e;
      const dev = make('span', 'dev'); dev.append(make('b', '', `${r.icon} ${r.dev}`)); if (r.room) dev.append(make('small', '', r.room));
      const who = make('span', ''); who.append(make('span', `lgWho ${r.who.k}`, r.who.text)); if (r.who.sub) who.append(make('small', '', r.who.sub));
      row.append(make('span', 'at', clock(x.t)), dev, make('span', 'what', r.what), who);
      if (r.e) row.addEventListener('click', () => { device = device === r.e ? '' : r.e; fill(); });
      rows.push(row);
    });
    if (!evs.length) rows.push(make('p', 'tpSub lgEmpty', data?.events?.length ? t('log.noMatch') : t('log.none')));
    if (evs.length > shown) { const m = btn('tpChip roMore', t('log.more', { n: evs.length - shown }), () => { shown += 300; fill(); }); rows.push(m); }
    table.replaceChildren(...rows);
    const main = table.parentElement;
    main.classList.toggle('side', !!device);
    side?.remove();
    side = device ? sidePanel() : null;
    if (side) main.append(side);
  }

  function draw() {
    clearTimeout(timer);
    if (!data) { load(); el.replaceChildren(make('p', 'tpSub', t('ub.loading'))); return; }
    if (data.forbidden || !ctx.canEdit()) { el.replaceChildren(make('p', 'tpSub', t('log.onlyAdmins'))); return; }
    const head = make('div', 'tpHead lgHead');
    head.append(make('h2', '', `📜 ${t('tab.log')}`), make('span', 'tpSub', t('log.sub')));
    const bar = make('div', 'lgBtns');
    const cp = btn('bdBtn', `📋 ${t('hd.copy')}`, (e) => quickCopy(e.currentTarget)); cp.dataset.act = 'copy';
    const ex = btn('bdBtn', `⬇ ${t('log.export')}`, openExport); ex.dataset.act = 'export';
    bar.append(cp, ex);
    head.append(bar);
    const out = [head];
    if (!data.ha) out.push(make('p', 'tpSub lgNote', t('log.noHa')));
    else if (!data.on) out.push(make('p', 'tpSub lgNote', `⚠️ ${t('log.off')}`));
    const tools = make('div', 'lgTools');
    const days = (data.days || []).map((d) => d.day), now = today(), y = new Date(Date.now() - 86400000), p = (x) => String(x).padStart(2, '0');
    const yday = `${y.getFullYear()}-${p(y.getMonth() + 1)}-${p(y.getDate())}`;
    const dayChips = [[now, t('log.today')], ...days.filter((d) => d !== now).slice(0, 4).map((d) => [d, d === yday ? t('log.yesterday') : dayText(dayOf(d)).slice(0, 6)])];
    dayChips.forEach(([d, label]) => { const b = btn(`tpChip${want.n === 1 && (want.day || now) === d ? ' on' : ''}`, label, () => { shown = SHOW; load(d, 1); }); b.dataset.day = d; tools.append(b); });
    const wk = btn(`tpChip${want.n > 1 ? ' on' : ''}`, t('log.span.week'), () => { shown = SHOW; load(now, 7); }); wk.dataset.day = 'week'; tools.append(wk);
    tools.append(make('span', 'lgSep'));
    KINDS.forEach((k) => { const b = btn(`tpChip${f.kind === k ? ' on' : ''}`, `${KIND_ICON[k] ? `${KIND_ICON[k]} ` : ''}${t(`log.kind.${k}`)}`, () => { f.kind = k; shown = SHOW; draw(); }); b.dataset.kind = k; tools.append(b); });
    tools.append(make('span', 'lgSep'));
    const who = make('select', 'lgSel'); who.dataset.filter = 'who';
    WHO.forEach((k) => { const o = make('option', '', t(`log.whoF.${k}`)); o.value = k; o.selected = f.who === k; who.append(o); });
    who.addEventListener('change', () => { f.who = who.value; shown = SHOW; fill(); });
    const room = make('select', 'lgSel'); room.dataset.filter = 'room';
    [['', t('hd.all')], ...ctx.rooms().map((r) => [r, r])].forEach(([v, label]) => { const o = make('option', '', label); o.value = v; o.selected = f.room === v; room.append(o); });
    room.addEventListener('change', () => { f.room = room.value; shown = SHOW; fill(); });
    const q = make('input', 'lgSearch'); q.type = 'search'; q.placeholder = `🔎 ${t('log.search')}`; q.value = f.q; q.dataset.filter = 'q';
    q.addEventListener('input', () => { f.q = q.value; shown = SHOW; fill(); });
    tools.append(who, room, q);
    nums = make('div', 'lgTiles');
    const main = make('div', 'lgMain');
    table = make('div', 'lgTable');
    main.append(table);
    side = null;
    el.replaceChildren(...out, tools, nums, main);
    fill();
    tick();
  }

  return {
    render: () => { drawn = ''; if (!data || isToday()) load(); draw(); },
    update: () => {                                     // a state changed: only the device on the side shows it now
      if (!device || !side) return;
      const s = ctx.states()[device], k = JSON.stringify([s?.state, s?.tt, s?.ct]);
      if (k !== drawn) { drawn = k; fill(); }
    },
    has: () => ctx.canEdit(),
    reset: () => { if (dlg?.open) dlg.close(); device = ''; f = { kind: 'all', who: 'all', room: '', q: '' }; shown = SHOW; },
  };
}
