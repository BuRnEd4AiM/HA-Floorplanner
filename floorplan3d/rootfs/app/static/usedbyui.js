/* 🔎 Wird benutzt (#546, the owner: "dass man sieht, wenn das Thermostat in irgendeiner Automatisierung benutzt wird und ob diese gerade
 * verwendet wird"; picture docs/ideen-4.27/1-wird-benutzt.jpg): a window for one device with everything that uses it: the add-on's own
 * heating rules and routines (what they do now, ✏ to change them) and the automations, scripts and scenes of Home Assistant (on / off,
 * "läuft gerade", when they last ran, what they do in words), a warning when one of them sets the same thermostat as an own heating rule,
 * and whether the thermostat sees an open window itself. The add-on asks Home Assistant (api/related); the words come from rules.js. */
import { sumWords, ago, clashes, roomLine } from './rules.js';

const RULE_ICON = { window: '🪟', schedule: '📅', night: '🌙', away: '🚶', summer: '☀️', holiday: '✈️' };
const KIND_ICON = { automation: '⚙️', script: '📜', scene: '🎨' };

/** ctx: t, lang(), states(), nameOf(entity), canEdit(), locked() (may not switch), callService(entity, service, data), rules (rulesstore.js),
 *  roomName(key), deg(v), openRules() (🌡 Klima → 📋 Heiz-Regeln), openFlow(id) (▶ Abläufe, the routine's editor) */
export function initUsedBy(ctx) {
  const { t } = ctx;
  let dlg = null, forId = null, data = null, timer = 0, drawn = '';
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on, title) => { const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', on); return b; };
  const now = () => Math.round(Date.now() / 1000);

  /** the button that opens the window (compact: only 🔎) */
  function button(e, compact = false) {
    if (!e) return null;
    const b = btn(compact ? 'rp-more mi ubBtn' : 'mi ubBtn', compact ? '🔎' : `🔎 ${t('ub.button')}`, (ev) => { ev.stopPropagation(); open(e); }, t('ub.hint'));
    b.dataset.usedby = e;
    return b;
  }

  function sw(on, change, title) {
    const lab = make('label', 'sw'); lab.title = title || '';
    const cb = make('input'); cb.type = 'checkbox'; cb.checked = !!on; cb.disabled = !ctx.canEdit();
    cb.addEventListener('change', () => change(cb.checked));
    lab.append(cb, make('span'));
    return lab;
  }
  function chip(cls, text) { return make('span', `ubChip${cls ? ` ${cls}` : ''}`, text); }
  function row({ cls = '', icon, name, kind, what, chips = [], when = '', ctl = null, key }) {
    const r = make('div', `ubRow${cls ? ` ${cls}` : ''}`); if (key) r.dataset.row = key;
    const tx = make('div', 'ubTx');
    const head = make('div', 'ubName'); head.append(make('b', '', name), kind);
    tx.append(head);
    if (what) tx.append(make('span', 'ubWhat', what));
    if (chips.length) { const c = make('div', 'ubChips'); c.append(...chips); tx.append(c); }
    r.append(make('span', 'ubIcon', icon), tx, make('span', 'ubWhen', when));
    if (ctl) r.append(ctl);
    return r;
  }

  function ownRows(clash) {
    const out = [];
    (data?.own || []).forEach((o) => {
      if (o.kind === 'heat') {
        const s = ctx.rules.status(o.room), live = s && (s.why === o.rule || (o.rule === 'window' && s.waiting));
        const chips = [];
        if (live) chips.push(chip('run', t(o.rule === 'window' && !s.why ? 'ub.waits' : 'ub.running')));
        if (clash.length && o.rule !== 'window') chips.push(chip('warn', `⚠ ${t('ub.clashWith', { name: ctx.nameOf(clash[0]) || clash[0] })}`));
        out.push(row({ cls: `${live ? 'live' : ''}${clash.length && o.rule !== 'window' ? ' clash' : ''}`, icon: RULE_ICON[o.rule] || '📋', name: t(`hr.rule.${o.rule}`),
          kind: chip('fp', t('ub.own')), what: t('ub.inRoom', { room: ctx.roomName(o.room) }), chips, key: `heat:${o.rule}`,
          ctl: btn('bdBtn small', '✏️', () => { close(); ctx.openRules(); }, t('ub.change')) }));
      } else {
        const flow = (ctx.rules.get()?.flows || []).find((f) => f.id === o.id);
        const lanes = (flow?.lanes || []).map((l) => ctx.rules.lane(`${o.id}/${l.id}`)).filter(Boolean);
        const running = lanes.some((l) => l.running), last = Math.max(0, ...lanes.map((l) => l.end || l.t0 || 0));
        out.push(row({ cls: running ? 'live' : o.on ? '' : 'dim', icon: '⚙️', name: o.name, kind: chip('fp', t('ub.own')), what: t('ub.flow'),
          chips: running ? [chip('run', t('ub.running'))] : o.on ? [] : [chip('off', t('ub.off'))], when: last ? ago(last, now(), t) : '', key: `flow:${o.id}`,
          ctl: btn('bdBtn small', '✏️', () => { close(); ctx.openFlow(o.id); }, t('ub.change')) }));
      }
    });
    return out;
  }
  function haRows(clash) {
    const st = ctx.states();
    return (data?.rows || []).map((r) => {
      const live = st[r.entity] || {}, on = r.kind === 'automation' ? (live.state ? live.state === 'on' : r.on) : null;
      const running = (live.run ?? 0) > 0 || r.running || (r.kind === 'script' && live.state === 'on');
      const last = live.at ?? r.last, bad = clash.includes(r.entity);
      const chips = [];
      if (running) chips.push(chip('run', t('ub.running')));
      if (on === false) chips.push(chip('off', t('ub.off')));
      if (bad) chips.push(chip('warn', `⚠ ${t('ub.clashOwn')}`));
      let ctl = null;
      if (r.kind === 'automation') ctl = sw(on, (v) => ctx.callService(r.entity, v ? 'turn_on' : 'turn_off'), t('live.toggle'));
      else if (!ctx.locked()) ctl = btn('bdBtn small', `▶ ${t('ub.start')}`, () => ctx.callService(r.entity, 'turn_on'));
      return row({ cls: `${running ? 'live' : on === false ? 'dim' : ''}${bad ? ' clash' : ''}`, icon: KIND_ICON[r.kind] || '⚙️', name: (st[r.entity] && ctx.nameOf(r.entity)) || r.name,
        kind: chip('ha', t(`ub.kind.${r.kind}`)), what: r.sum ? sumWords(r.sum, { t, lang: ctx.lang(), nameOf: ctx.nameOf, states: st }) : '', chips,
        when: last ? ago(last, now(), t) : '', ctl, key: r.entity });
    });
  }

  function draw() {
    if (!dlg?.open || !forId) return;
    const e = forId, st = ctx.states();
    const clash = data ? clashes(e, data.rows, data.own) : [];
    const head = make('div', 'ceHead ubHead');
    head.append(make('h3', '', `🔎 ${ctx.nameOf(e) || e}`), make('p', 'tpSub', t('ub.sub')));
    const body = make('div', 'ubBody');
    if (!data) body.append(make('p', 'tpSub', t('ub.loading')));
    else {
      const room = (data.own || []).find((o) => o.kind === 'heat')?.room, s = room ? ctx.rules.status(room) : null;
      const line = roomLine(s, now(), t, ctx.deg);
      if (line) {
        const p = make('div', `ubPause ${line.tone}`); p.append(make('b', '', `${line.icon} ${line.text}`));
        if (s.why === 'window' && !ctx.locked()) p.append(btn('bdBtn small', `🔥 ${t('hr.anyway')}`, () => ctx.rules.room(room, 'skip')));
        body.append(p);
      }
      if (clash.length) {
        const w = make('div', 'ubWarn');
        w.append(make('span', 'big', '⚠️'), make('span', '', t('ub.clash', { names: clash.map((x) => ctx.nameOf(x) || x).join(', ') })));
        if (ctx.canEdit()) w.append(btn('bdBtn small', t('ub.clashOff'), () => clash.forEach((x) => ctx.callService(x, 'turn_off'))));
        body.append(w);
      }
      const own = ownRows(clash), ha = haRows(clash);
      if (own.length) { body.append(make('h4', 'peH', t('ub.ownHead'))); own.forEach((x) => body.append(x)); }
      if (ha.length) { body.append(make('h4', 'peH', t('ub.haHead'))); ha.forEach((x) => body.append(x)); }
      if (data.parts?.length) {
        body.append(make('h4', 'peH', t('ub.selfHead')));
        data.parts.forEach((p) => body.append(row({ cls: p.state === 'on' ? '' : 'dim', icon: '🪟', name: t('ub.selfWindow'), kind: '', what: `${p.name} · ${p.state === 'on' ? t('ub.on') : t('ub.off')}`, key: p.entity })));
      }
      if (!own.length && !ha.length) body.append(make('p', 'tpSub ubNone', data.ha === false ? t('ub.noHa') : t('ub.nothing')));
      if (data.error) body.append(make('p', 'tpSub', t('ub.error')));
    }
    const bar = make('div', 'ceBtns');
    const c = btn('bdBtn', t('ctl.close'), close); c.dataset.act = 'ubClose';
    bar.append(c);
    dlg.replaceChildren(head, body, bar);
    drawn = sig();
  }
  const sig = () => {
    const st = ctx.states();
    return JSON.stringify([forId, !!data, (data?.rows || []).map((r) => [st[r.entity]?.state, st[r.entity]?.run, st[r.entity]?.at]),
      (data?.own || []).map((o) => (o.kind === 'heat' ? ctx.rules.status(o.room) : o.id)), ctx.rules.get()?.status?.lanes]);
  };
  async function open(e) {
    if (!dlg) {
      dlg = make('dialog', 'ceDlg ubDlg');
      dlg.addEventListener('click', (ev) => { if (ev.target === dlg) close(); });
      dlg.addEventListener('close', () => { forId = null; clearInterval(timer); });
      document.body.append(dlg);
    }
    forId = e; data = null;
    if (!dlg.open) dlg.showModal();
    draw();
    if (!ctx.rules.get()) ctx.rules.load();
    try {
      const r = await fetch(`api/related?entity=${encodeURIComponent(e)}`);
      if (forId === e) data = r.ok ? await r.json() : { rows: [], own: [], error: true };
    } catch { if (forId === e) data = { rows: [], own: [], error: true }; }
    draw();
    clearInterval(timer);
    timer = setInterval(() => { if (dlg.open && sig() !== drawn) draw(); }, 1000);
  }
  function close() { if (dlg?.open) dlg.close(); }
  return { button, open, close, isOpen: () => !!dlg?.open, redraw: () => { if (dlg?.open) draw(); } };
}
