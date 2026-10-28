/* 🌡 Klima → 🩺 Protokoll (#579): who controls what. On top the connection and the settings that decide, then every room as the add-on
 * sees it (who controls it now, its thermostats and who changed them last, its windows and doors and whether the window rule counts
 * them), then the journal of the heating, newest first, with a filter per room; "📋 Bericht kopieren" puts the whole as text on the
 * clipboard (to paste into a chat), "⬇ Als Datei" saves it with the whole journal. Asks api/rules/trace every few seconds while shown;
 * the words come from heatdiag.js (tested). */
import { roomViews, journalRows, headLines, loneContacts, contactSub, report, clock } from './heatdiag.js';

const FRESH = 5000;                // ms: the journal is asked again after this while the view is shown
const SHOW = 25;                   // lines of the journal shown first

/** ctx: t, rules (rulesstore.js), deg(°C), nameOf(entity), layout() (the building shown), houseId(), sensorLog(entry) (🌡 Raumfühler's
 *  lines, roomsensorsui.js), changed() (draw the page again) */
export function initHeatDiagUi(ctx) {
  const { t } = ctx;
  let data = null, sig = '', loading = null, room = '', many = false, copied = '', shown = null, timer = 0;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on) => { const b = make('button', cls, text); b.type = 'button'; b.addEventListener('click', on); return b; };
  const now = () => Math.round(Date.now() / 1000);

  async function load() {
    if (loading) return loading;
    loading = (async () => {
      try {
        const r = await fetch('api/rules/trace');
        if (r.ok) {
          data = await r.json();
          const s = JSON.stringify([data.rooms, data.states, data.trace, data.running, data.loose]);
          if (s !== sig) { sig = s; ctx.changed(); }
        }
      } catch { /* no answer: what was there stays */ }
      loading = null;
    })();
    return loading;
  }
  const name = (e) => data?.states?.[e]?.n || ctx.nameOf(e) || e;
  const roomName = (k) => (data?.rooms || []).find((r) => r.key === k)?.name || String(k || '').split('/')[1] || '';
  const roomOf = (e) => (data?.rooms || []).find((r) => r.climates.includes(e))?.key || '';
  const words = () => ({ t, deg: ctx.deg, name, roomName, roomOf, now: now(), sensorLog: ctx.sensorLog, version: data?.version,
    lone: loneContacts(ctx.layout()?.floors, data) });
  const house = () => ctx.houseId() || 'main';
  /** asked again every few seconds while the view is shown */
  function tick() {
    clearTimeout(timer);
    timer = setTimeout(() => { if (shown?.isConnected) load().then(tick); }, FRESH);
  }

  function text(all) { return report(data, ctx.rules.get(), words(), all ? 0 : 150); }
  async function copy() {
    const s = text(false);
    try { await navigator.clipboard.writeText(s); copied = 'ok'; } catch {
      const ta = make('textarea'); ta.value = s; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.append(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove();
      copied = ok ? 'ok' : 'self';
    }
    ctx.changed();
    if (copied === 'ok') setTimeout(() => { copied = ''; ctx.changed(); }, 4000);
  }
  function download() {
    const a = make('a');
    a.href = URL.createObjectURL(new Blob([text(true)], { type: 'text/plain;charset=utf-8' }));
    a.download = `heizung-protokoll-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.txt`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function roomCard(r) {
    const c = make('div', 'tpCard hdRoom'); c.dataset.room = r.key;
    c.append(make('h3', 'peH', r.name));
    const n = make('div', `hdNow${r.now.icon === '–' ? ' none' : ''}`); n.dataset.now = '1';
    n.append(make('span', '', `${r.now.icon} ${r.now.text}`));
    c.append(n);
    r.climates.forEach((x) => {
      const d = make('div', 'hdLine'); d.dataset.climate = x.e;
      d.append(make('b', '', `🌡️ ${x.name}`), make('span', '', x.text));
      if (x.sensor) d.append(make('small', '', x.sensor));
      if (x.last) d.append(make('small', 'hdLast', x.last));
      c.append(d);
    });
    r.contacts.forEach((x) => {
      const d = make('div', `hdLine hdContact ${x.state}${x.why ? ' not' : ''}`); d.dataset.contact = x.e;
      d.append(make('b', '', `${x.use === 'window' ? '🪟' : '🚪'} ${x.name}: ${t(`hd.s.${x.state}`)}`), make('small', '', contactSub(x, t)));
      c.append(d);
    });
    if (!r.contacts.length) c.append(make('p', 'tpSub', t('hd.noContacts')));
    return c;
  }

  function view() {
    const box = make('div', 'hrView hdView');
    shown = box;
    tick();
    if (!data) { load(); box.append(make('p', 'tpSub', t('ub.loading'))); return box; }
    const w = words(), rules = ctx.rules.get();
    const head = make('div', 'tpCard hdHead');
    head.append(make('h3', 'peH', `🩺 ${t('hd.title')}`), make('p', 'tpSub', t('hd.sub')));
    headLines(data, rules, w).forEach((l) => head.append(make('div', 'hdCfg', l)));
    if ((data.loose || []).length) { const d = make('div', 'hdWarn'); d.append(make('b', '', `⚠️ ${t('hd.loose', { list: data.loose.map(name).join(', ') })}`), make('small', '', t('hd.looseSub'))); head.append(d); }
    if (w.lone.length) { const d = make('div', 'hdWarn'); d.append(make('b', '', `⚠️ ${t('hd.lone', { list: w.lone.map(name).join(', ') })}`), make('small', '', t('hd.loneSub'))); head.append(d); }
    const bar = make('div', 'hdBtns');
    const cp = btn('bdBtn', copied === 'ok' ? `✓ ${t('hd.copied')}` : `📋 ${t('hd.copy')}`, copy); cp.dataset.act = 'copy';
    const dl = btn('bdBtn', `⬇ ${t('hd.download')}`, download); dl.dataset.act = 'download';
    bar.append(cp, dl);
    head.append(bar);
    if (copied === 'self') {
      head.append(make('p', 'tpSub', t('hd.copySelf')));
      const ta = make('textarea', 'hdText'); ta.value = text(false); ta.readOnly = true; ta.rows = 8;
      head.append(ta);
    }
    box.append(head);
    const rooms = roomViews(data, rules, { ...w, house: house() });
    const chips = make('div', 'tpTools hdChips');
    [['', t('hd.all')], ...rooms.map((r) => [r.key, r.name])].forEach(([k, label]) => {
      const b = btn(`tpChip${room === k ? ' on' : ''}`, label, () => { room = k; ctx.changed(); }); b.dataset.room = k || 'all';
      chips.append(b);
    });
    box.append(chips);
    const grid = make('div', 'hdGrid');
    rooms.filter((r) => !room || r.key === room).forEach((r) => grid.append(roomCard(r)));
    box.append(grid);
    const log = make('div', 'tpCard roLog hdLog');
    log.append(make('h3', 'peH', `📜 ${t('hd.log')}`));
    const rows = journalRows(data.trace, { ...w, room });
    if (!rows.length) log.append(make('p', 'tpSub', t('hd.empty')));
    rows.slice(0, many ? 300 : SHOW).forEach((x) => {
      const r = make('div', `roLogRow${x.tone ? ` ${x.tone}` : ''}`);
      r.append(make('b', 'at', clock(x.t, w.now)));
      const tx = make('div', '');
      tx.append(make('span', '', `${x.icon} ${x.text}`));
      if (x.sub) tx.append(make('small', '', x.sub));
      r.append(tx);
      log.append(r);
    });
    if (rows.length > SHOW) log.append(btn('tpChip roMore', many ? t('ro.less') : t('ro.more'), () => { many = !many; ctx.changed(); }));
    box.append(log);
    return box;
  }

  return {
    view, load,
    /** show one room (from its card on 🌡 Klima) */
    room: (key) => { room = key || ''; load(); },
    viewSig: () => JSON.stringify([sig, room, many, copied, ctx.rules.get()?.status, ctx.rules.get()?.heat?.window, ctx.rules.get()?.heat?.schedule?.hand,
      ctx.rules.get()?.running, ctx.houseId(), Math.floor(Date.now() / 60000)]),
  };
}
