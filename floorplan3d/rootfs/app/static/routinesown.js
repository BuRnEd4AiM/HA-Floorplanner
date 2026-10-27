/* ▶ Abläufe (#546; picture docs/ideen-4.28/2-ablaeufe.jpg): the add-on's own routines "Wenn … dann …" as chains to read (on / off, "läuft
 * gerade", when they last ran, ▶ for a routine with a button, ✏ to change it, ＋ Neuer Ablauf, 📋 Aus Vorlage), the automations of Home
 * Assistant with the devices they use, what they do, "läuft gerade" and when they last ran (editors: on / off; since #564 also ▶ run it
 * now, ↗ change it in Home Assistant's editor, 🗑 delete it with "↶ Wiederherstellen", hamanage.js), and
 * "📜 Was ist passiert": what the rules and routines did. A routine that is an automation of Home Assistant (#548) says so ("🏠 Home
 * Assistant", ↗ opens it there), its "läuft" and "zuletzt" come from its automations; those automations are not listed a second time
 * among Home Assistant's. pageroutines.js puts these cards on its board; the words come from rules.js. */
import { blockWords, ago, sumWords, templates, entIcon, groupOf, flowLive, ours, autoId, haEditUrl } from './rules.js';

const FILTERS = ['all', 'heat', 'light', 'cover', 'running'];

/** ctx: t, lang(), states(), nameOf(entity), canEdit(), locked() (may not switch), callService(entity, service, data), rules (rulesstore.js),
 *  edit(flow) (the editor, flowedit.js: a routine of the list, or a new one), openRules() (🌡 Klima → 📋 Heiz-Regeln), details(entity) (Home
 *  Assistant's window: a button or null), scenes (scenesui.js: the card 🎨 Szenen), manage (hamanage.js), changed() (draw the page again) */
export function initRoutinesOwn(ctx) {
  const { t } = ctx;
  let filter = 'all', autos = null, autosAt = 0, loading = false, allAutos = false, longLog = false, tplOpen = false;
  const ran = new Map();                             // automation -> 'ok' | 'bad' for a moment after its ▶ (#564)
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on, title) => { const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', on); return b; };
  const now = () => Math.round(Date.now() / 1000);
  const wctx = () => ({ t, lang: ctx.lang(), nameOf: ctx.nameOf, states: ctx.states() });

  async function loadAutos(fresh = false) {
    if (loading || !ctx.canEdit() || (!fresh && autos && Date.now() - autosAt < 60000)) return;
    loading = true;
    try {
      const r = await fetch(`api/automations${fresh ? '?fresh=1' : ''}`);
      if (r.ok) { autos = (await r.json()).rows || []; autosAt = Date.now(); ctx.changed(); }
    } catch { /* no answer: the card shows the automations from the states only */ }
    loading = false;
  }

  /* ---- own routines ---- */
  const flowsOf = () => ctx.rules.get()?.flows || [];
  const laneState = (f, l) => ctx.rules.lane(`${f.id}/${l.id}`) || {};
  const live = (f) => flowLive(f, ctx.states(), ctx.rules.lane);
  const touches = (f, re) => f.lanes.some((l) => l.blocks.some((b) => (b.ents || []).some((e) => re.test(e)) || (b.k === 'heat' && re.test('climate.')) || (b.k === 'cover' && re.test('cover.'))));
  function shown(f) {
    if (filter === 'heat') return touches(f, /^climate\./);
    if (filter === 'light') return touches(f, /^light\./);
    if (filter === 'cover') return touches(f, /^cover\./);
    if (filter === 'running') return live(f).running;
    return true;
  }
  function chain(lane) {
    const box = make('div', 'roChain');
    lane.blocks.forEach((b, i) => {
      if (i) box.append(make('span', 'ar', '→'));
      const w = blockWords(b, wctx());
      box.append(make('span', `k ${groupOf(b.k)}`, `${w.icon} ${w.text}${w.sub && ['hold', 'wait'].includes(b.k) ? ` ${w.sub}` : ''}`));
    });
    return box;
  }
  async function toggle(f, on) {
    await ctx.rules.save({ flows: flowsOf().map((x) => (x.id === f.id ? { ...x, on } : x)) });
  }
  function flowRow(f) {
    const lv = live(f), lanes = f.lanes.map((l) => ({ l, s: laneState(f, l) }));
    const running = f.ha ? (lv.running ? { s: {}, l: f.lanes[0] } : null) : lanes.find((x) => x.s.running), last = lv.last;
    const r = make('div', `roRow${running ? ' live' : ''}${f.on ? '' : ' dim'}`); r.dataset.flow = f.id;
    const sw = make('label', 'sw'); sw.title = t('ro.onOff');
    const cb = make('input'); cb.type = 'checkbox'; cb.checked = f.on; cb.disabled = !ctx.canEdit(); cb.dataset.flowOn = f.id;
    cb.addEventListener('change', () => toggle(f, cb.checked));
    sw.append(cb, make('span'));
    const tx = make('div', 'roTx');
    const title = make('div', 'roName'); title.append(make('b', '', f.name));
    if (ctx.rules.get()?.ha) {                           // where it runs (#548)
      const where = make('span', `roWhere${f.ha ? ' ha' : ''}`, f.ha ? `🏠 ${t('fe.ha.where.ha')}` : `⚙️ ${t('fe.ha.where.addon')}`);
      where.title = f.ha ? (lv.lanes.every((x) => x.entity) ? t('ro.inHa') : t('ro.notInHa')) : t('ro.inAddon'); where.dataset.where = f.ha ? 'ha' : 'addon';
      if (f.ha && !lv.lanes.every((x) => x.entity)) where.classList.add('bad');
      title.append(where);
    }
    tx.append(title, chain(f.lanes[0]));
    if (f.lanes.length > 1) tx.append(make('small', 'tpSub', t('ro.moreLanes', { n: f.lanes.length - 1 })));
    const st = make('div', 'roSt');
    if (running) {
      const w = running.s.wait != null ? blockWords(running.l.blocks[running.s.wait], wctx()) : null;
      st.append(make('span', 'ubChip run', t('ro.running')), make('small', '', w && running.s.until ? t('ro.waits', { n: Math.max(1, Math.ceil((running.s.until - now()) / 60)) }) : ago(running.s.t0, now(), t)));
    } else if (!f.on) st.append(make('span', 'ubChip off', t('ub.off')));
    else st.append(make('small', '', last ? t('ro.last', { when: ago(last, now(), t) }) : t('ro.never')));
    r.append(sw, tx, st);
    const button = f.on && f.lanes.find((l) => l.blocks[0].k === 'button' && (!f.ha || lv.lanes.find((x) => x.lane === l)?.entity));
    if (button && !ctx.locked()) { const b = btn('roIcon', '▶', () => ctx.rules.run(f.id, button.id), t('ro.run')); b.dataset.runFlow = f.id; r.append(b); }
    if (f.ha && ctx.canEdit() && lv.lanes[0]?.entity) {
      const base = ctx.rules.get()?.haLink || '', a = make('a', 'roIcon', '↗');
      a.href = haEditUrl(base, autoId(f.id, f.lanes[0].id)); a.target = base ? '_blank' : '_top'; a.rel = 'noopener'; a.title = t('fe.ha.open'); a.dataset.haOpen = f.id;
      r.append(a);
    }
    if (ctx.canEdit()) { const b = btn('roIcon', '✏️', () => ctx.edit(f), t('ro.edit')); b.dataset.editFlow = f.id; r.append(b); }
    return r;
  }
  function ownCard() {
    const c = make('div', 'tpCard roCard roOwn');
    const h = make('h3', 'peH roHead'); h.append(make('span', '', `🏠 ${t('ro.own')}`), make('span', 'tpSub roHint', t('ro.ownHint')));
    c.append(h);
    if (ctx.canEdit()) {
      const bar = make('div', 'roBar');
      const add = btn('bdBtn primary', `＋ ${t('ro.new')}`, () => ctx.edit(null)); add.dataset.act = 'newFlow';
      const tpl = btn('bdBtn', `📋 ${t('ro.fromTpl')}`, () => { tplOpen = !tplOpen; ctx.changed(); }); tpl.dataset.act = 'tplFlow';
      bar.append(add, tpl);
      const chips = make('div', 'roFilters');
      FILTERS.forEach((k) => { const b = btn(`tpChip${filter === k ? ' on' : ''}`, t(`ro.filter.${k}`), () => { filter = k; ctx.changed(); }); b.dataset.filter = k; chips.append(b); });
      bar.append(chips);
      c.append(bar);
      if (tplOpen) {
        const menu = make('div', 'roTpls');
        templates(ctx.states(), t).forEach((x) => {
          const b = btn('roTpl', '', () => { tplOpen = false; ctx.edit({ id: null, name: x.name, on: true, lanes: x.lanes }); });
          b.append(make('span', 'ic', x.icon), make('b', '', x.name)); b.dataset.tpl = x.key;
          menu.append(b);
        });
        c.append(menu);
      }
    }
    const list = flowsOf().filter(shown);
    if (!flowsOf().length) c.append(make('p', 'tpSub', ctx.canEdit() ? t('ro.noneEdit') : t('ro.none')));
    else if (!list.length) c.append(make('p', 'tpSub', t('ro.noneHere')));
    list.forEach((f) => c.append(flowRow(f)));
    const heat = ctx.rules.get()?.heat;
    const on = heat ? ['window', 'away', 'night', 'schedule', 'summer', 'holiday'].filter((k) => heat[k]?.on) : [];
    const link = make('div', 'roHeat');
    link.append(make('span', '', on.length ? t('ro.heatOn', { names: on.map((k) => t(`hr.rule.${k}`)).join(', ') }) : t('ro.heatOff')));
    const go = btn('tpChip', `🌡 ${t('ro.heatGo')}`, () => ctx.openRules()); go.dataset.act = 'openHeatRules';
    link.append(go);
    c.append(link);
    return c;
  }

  /* ---- automations of Home Assistant ---- */
  function autoRows() {
    const st = ctx.states(), known = new Map((autos || []).map((a) => [a.entity, a]));
    const ids = Object.keys(st).filter((e) => e.startsWith('automation.') && !ours(st[e]?.cid) && !ctx.manage.hidden(st[e]?.cid))   // the add-on's own: its routines above
      .sort((a, b) => (ctx.nameOf(a) || a).localeCompare(ctx.nameOf(b) || b));
    return ids.map((e) => ({ e, a: known.get(e) || null, s: st[e] }));
  }
  function autoCard() {
    loadAutos();
    const rows = autoRows();
    const c = make('div', 'tpCard roCard roAutos');
    const h = make('h3', 'peH roHead'); h.append(make('span', '', `⚙️ ${t('ro.autos', { n: rows.length })}`), make('span', 'tpSub roHint', t('ro.autosHint')));
    c.append(h);
    const undo = ctx.manage.undoRow('automation');
    if (undo) c.append(undo);
    if (!rows.length) c.append(make('p', 'tpSub', t('ro.noAutos')));
    rows.slice(0, allAutos ? 150 : 8).forEach(({ e, a, s }) => {
      const running = (s?.run ?? 0) > 0, on = s?.state === 'on';
      const r = make('div', `roRow small${running ? ' live' : ''}${on ? '' : ' dim'}`); r.dataset.auto = e;
      const sw = make('label', 'sw'); sw.title = t('live.toggle');
      const cb = make('input'); cb.type = 'checkbox'; cb.checked = on; cb.dataset.auto = e;
      cb.addEventListener('change', () => ctx.callService(e, cb.checked ? 'turn_on' : 'turn_off'));
      sw.append(cb, make('span'));
      const tx = make('div', 'roTx');
      tx.append(make('b', '', ctx.nameOf(e) || a?.name || e));
      const uses = (a?.uses || []).filter((u) => !u.startsWith('automation.')).slice(0, 3);
      if (uses.length) tx.append(make('small', 'roUses', `${t('ro.uses')} ${uses.map((u) => `${entIcon(u, ctx.states())} ${ctx.nameOf(u) || u}`).join(' · ')}`));
      if (a?.sum) tx.append(make('small', 'roWhat', sumWords(a.sum, wctx())));
      const stc = make('div', 'roSt');
      if (running) stc.append(make('span', 'ubChip run', t('ub.running')));
      if (s?.at) stc.append(make('small', '', ago(s.at, now(), t)));
      const acts = make('div', 'roActs');                // the buttons go below the words when the card is narrow (#564)
      r.append(sw, tx, stc, acts);
      if (!ctx.locked()) {
        const p = btn(`roIcon${ran.has(e) ? ` ${ran.get(e)}` : ''}`, ran.get(e) === 'ok' ? '✓' : '▶', async () => {
          ran.set(e, (await ctx.callService(e, 'trigger')) ? 'ok' : 'bad'); ctx.changed();
          setTimeout(() => { ran.delete(e); ctx.changed(); }, 2500);
        }, t('ro.runAuto'));
        p.dataset.runAuto = e; acts.append(p);
      }
      if (s?.cid) {                                     // made in Home Assistant's editor (#564): change it there, or delete it here
        const base = ctx.rules.get()?.haLink || '', go = make('a', 'roIcon', '↗');
        go.href = haEditUrl(base, s.cid); go.target = base ? '_blank' : '_top'; go.rel = 'noopener'; go.title = t('ro.editInHa'); go.dataset.haAuto = e;
        const del = btn('roIcon', '🗑', async () => { if (await ctx.manage.remove('automation', s.cid, ctx.nameOf(e) || a?.name || e)) loadAutos(true); }, t('ro.deleteAuto'));
        del.dataset.delAuto = e;
        acts.append(go, del);
      }
      const det = ctx.details(e);
      if (det) acts.append(det);
      c.append(r);
    });
    if (rows.length > 8) { const more = btn('tpChip roMore', allAutos ? t('ro.less') : t('ro.all', { n: rows.length }), () => { allAutos = !allAutos; ctx.changed(); }); c.append(more); }
    return c;
  }

  /* ---- what happened ---- */
  function logText(x) {
    const name = x.ent ? ctx.nameOf(x.ent) || x.ent : '';
    if (x.src === 'heat') {
      const what = x.act === 'off' ? t('fl.heat.off') : x.act === 'temp' ? `${String(x.v).replace('.', ',')}°` : t(`fl.heat.${x.v}`) === `fl.heat.${x.v}` ? x.v : t(`fl.heat.${x.v}`);
      return { icon: '🔥', text: `${name} ${what}`, sub: t(`hr.why.${x.why}`) };
    }
    if (x.act === 'start') return { icon: '▶', text: x.test ? t('ro.log.test', { name: x.name }) : t('ro.log.start', { name: x.name }), sub: name };
    if (x.act === 'stop') return { icon: '⏹', text: t('ro.log.stop', { name: x.name }), sub: '' };
    if (x.act === 'notify') return { icon: '🔔', text: t('fl.b.notify'), sub: `${x.name}: „${x.v || ''}“` };
    const word = { turn_on: t('fl.do.on'), turn_off: t('fl.do.off'), toggle: t('fl.do.toggle'), open_cover: t('fl.cover.open'), close_cover: t('fl.cover.close'),
      set_hvac_mode: x.v === 'off' ? t('fl.heat.off') : t('fl.heat.heat') }[x.do];
    const v = x.do === 'set_temperature' ? `${String(x.v).replace('.', ',')}°` : x.do === 'set_cover_position' ? `${x.v} %` : word || x.do || '';
    return { icon: x.act === 'restore' ? '↩' : entIcon(x.ent, ctx.states()), text: `${name} ${v}${x.do === 'turn_on' && x.v ? ` ${x.v} %` : ''}`.trim(), sub: x.name };
  }
  function logCard() {
    const c = make('div', 'tpCard roCard roLog');
    const h = make('h3', 'peH roHead'); h.append(make('span', '', `📜 ${t('ro.log')}`));
    c.append(h);
    const list = [...(ctx.rules.get()?.log || [])].reverse().slice(0, longLog ? 60 : 10);
    if (!list.length) c.append(make('p', 'tpSub', t('ro.logNone')));
    list.forEach((x) => {
      const w = logText(x), r = make('div', 'roLogRow');
      const d = new Date(x.t * 1000), today = new Date().toDateString() === d.toDateString();
      r.append(make('b', 'at', today ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : ago(x.t, now(), t)));
      const tx = make('div', '');
      tx.append(make('span', '', `${w.icon} ${w.text}`));
      if (w.sub) tx.append(make('small', '', w.sub));
      r.append(tx);
      c.append(r);
    });
    if ((ctx.rules.get()?.log || []).length > 10) c.append(btn('tpChip roMore', longLog ? t('ro.less') : t('ro.more'), () => { longLog = !longLog; ctx.changed(); }));
    return c;
  }

  /** the cards for the board of ▶ Abläufe */
  function items() {
    const data = ctx.rules.get(), st = ctx.states();
    const out = [];
    const haAutos = Object.keys(st).filter((e) => ours(st[e]?.cid)).map((e) => [e, st[e].cid, st[e].state, st[e].run, st[e].at]);
    const ownSig = JSON.stringify([data?.flows, data?.heat, data?.status?.lanes, haAutos, filter, tplOpen, ctx.canEdit(), ctx.locked(), Math.floor(Date.now() / 30000), t('ro.own')]);
    out.push({ key: 'own', width: 4, sig: ownSig, make: ownCard });
    if (ctx.canEdit()) {
      const ids = Object.keys(st).filter((e) => e.startsWith('automation.') && !ours(st[e]?.cid));
      const sig = JSON.stringify([ids.map((e) => [e, st[e]?.state, st[e]?.run, st[e]?.at, st[e]?.cid, ctx.nameOf(e)]), autos, allAutos, ctx.locked(), ctx.manage.sig(), [...ran],
        Math.floor(Date.now() / 30000), t('ro.own')]);
      out.push({ key: 'autos', width: 2, sig, make: autoCard });
    }
    out.push({ key: 'log', width: 2, sig: JSON.stringify([data?.log?.length, data?.log?.[data.log.length - 1], longLog, Math.floor(Date.now() / 60000), t('ro.log')]), make: logCard });
    if (ctx.scenes) out.push(...ctx.scenes.items());       // 🎨 Szenen (#549, scenesui.js)
    return out;
  }
  return { items, sig: () => JSON.stringify([ctx.rules.get(), filter, tplOpen, autos, allAutos, longLog, Math.floor(Date.now() / 30000), ctx.scenes?.sig(), ctx.manage.sig(), [...ran]]) };
}
