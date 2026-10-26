/* The editor of an own routine "Wenn … dann …" (#546, the owner: "so ähnlich wie Node-RED, bloß halt in unserem Dashboard"; picture
 * docs/ideen-4.27/5-wenn-dann.jpg): on the left the blocks to tap (Wenn, Nur wenn, Warten, Dann), in the middle the routine's lanes as
 * blocks joined by lines like a Node-RED flow (actions that follow each other stand under each other: they happen at once), on the right
 * what the chosen block does (its devices, its times, its values), below the routine in words. Green ticks on the blocks show what ran last
 * and when, a purple one what is waiting now. "▶ Jetzt ausprobieren" does every action at once; "✓ Speichern" only when every block has
 * what it needs. Where the blocks stand, the words and whether a block is complete come from rules.js (tested); the add-on runs the
 * routine (flows.py). */
import { blockWords, laneWords, laneLayout, newBlock, newId, flowReady, blockReady, groupOf, TRIGGERS, duration, hhmm } from './rules.js';

const PALETTE = [
  ['when', [['state', { to: 'open' }, '🪟', 'fe.p.open'], ['state', { to: 'on' }, '🏃', 'fe.p.on'], ['time', null, '🕐', 'fe.p.time'], ['sun', null, '🌇', 'fe.p.sun'],
    ['presence', null, '👤', 'fe.p.presence'], ['num', null, '🌡', 'fe.p.num'], ['button', null, '🔘', 'fe.p.button']]],
  ['and', [['if_time', null, '🕐', 'fe.p.ifTime'], ['if_days', null, '📅', 'fe.p.ifDays'], ['if_home', null, '🏠', 'fe.p.ifHome'], ['if_outside', null, '🌡', 'fe.p.ifOutside'],
    ['if_sun', null, '🌙', 'fe.p.ifSun'], ['if_state', null, '💡', 'fe.p.ifState'], ['if_num', null, '📈', 'fe.p.ifNum']]],
  ['wait', [['hold', null, '⏱', 'fe.p.hold'], ['wait', null, '⏳', 'fe.p.wait']]],
  ['then', [['heat', null, '🔥', 'fe.p.heat'], ['switch', null, '💡', 'fe.p.switch'], ['cover', null, '🪟', 'fe.p.cover'], ['run', null, '🎬', 'fe.p.run'],
    ['notify', null, '🔔', 'fe.p.notify'], ['restore', null, '↩', 'fe.p.restore']]],
];
const GROUP_COLOR = { when: '#f5c542', and: '#6cbcf5', wait: '#b892e8', then: '#5cc472' };
const DOMS = {
  state: ['binary_sensor', 'light', 'switch', 'input_boolean', 'cover', 'lock', 'media_player', 'fan', 'climate'], num: ['sensor', 'number', 'input_number'],
  if_state: ['binary_sensor', 'light', 'switch', 'input_boolean', 'cover', 'lock', 'media_player', 'fan', 'climate', 'alarm_control_panel'],
  if_num: ['sensor', 'number', 'input_number'], switch: ['light', 'switch', 'fan', 'input_boolean', 'media_player'], heat: ['climate'], cover: ['cover'],
  run: ['scene', 'script'], restore: ['light', 'switch', 'fan', 'input_boolean', 'media_player', 'climate', 'cover'], presence: ['person'],
};
const SIZES = [30, 60, 120, 300, 600, 1800, 3600];
const MAX_LANES = 4, MAX_BLOCKS = 12;

/** ctx: t, lang(), entities() ([{ entity_id, name }]), states(), nameOf(entity), rules (rulesstore.js), canEdit() */
export function initFlowEdit(ctx) {
  const { t } = ctx;
  let dlg = null, draft = null, sel = null, dirty = false, flash = '', timer = 0, drawnSig = '', search = '';   // sel: { l (lane), i (block) }
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on, title) => { const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', on); return b; };
  const wctx = () => ({ t, lang: ctx.lang(), nameOf: ctx.nameOf, states: ctx.states() });
  const now = () => Math.round(Date.now() / 1000);
  const change = (fn) => { fn(); dirty = true; draw(); };
  const saved = () => (ctx.rules.get()?.flows || []).find((f) => f.id === draft?.id) || null;

  /* ---- changing the routine ---- */
  function laneId() { for (let n = 1; n <= MAX_LANES; n++) if (!draft.lanes.some((l) => l.id === `l${n}`)) return `l${n}`; return `l${Date.now() % 1000}`; }
  function add(k, extra) {
    const b = { ...newBlock(k), ...(extra || {}) };
    change(() => {
      if (TRIGGERS.includes(k)) {                       // a trigger starts a lane of its own
        if (draft.lanes.length >= MAX_LANES) { flash = t('fe.maxLanes'); return; }
        draft.lanes.push({ id: laneId(), blocks: [b] });
        sel = { l: draft.lanes.length - 1, i: 0 };
        return;
      }
      if (!draft.lanes.length) { flash = t('fe.triggerFirst'); return; }
      const l = sel ? sel.l : draft.lanes.length - 1, lane = draft.lanes[l];
      if (lane.blocks.length >= MAX_BLOCKS) { flash = t('fe.maxBlocks'); return; }
      const at = sel && sel.l === l ? sel.i + 1 : lane.blocks.length;
      lane.blocks.splice(at, 0, b);
      sel = { l, i: at };
    });
  }
  function move(d) {
    const lane = draft.lanes[sel.l], j = sel.i + d;
    if (sel.i === 0 || j < 1 || j >= lane.blocks.length) return;
    change(() => { [lane.blocks[sel.i], lane.blocks[j]] = [lane.blocks[j], lane.blocks[sel.i]]; sel = { l: sel.l, i: j }; });
  }
  function remove() {
    change(() => {
      const lane = draft.lanes[sel.l];
      if (sel.i === 0) draft.lanes.splice(sel.l, 1);   // without its trigger a lane is no lane
      else lane.blocks.splice(sel.i, 1);
      sel = null;
    });
  }
  const set = (fn) => change(() => fn(draft.lanes[sel.l].blocks[sel.i]));

  /* ---- the pieces of the panel on the right ---- */
  function chips(options, value, pick, data) {
    const box = make('div', 'feChips'); if (data) box.dataset.field = data;
    options.forEach(([v, text]) => { const b = btn(`tpChip${v === value ? ' on' : ''}`, text, () => pick(v)); b.dataset.value = String(v); box.append(b); });
    return box;
  }
  function field(label, el) { const f = make('div', 'feField'); f.append(make('label', '', label), el); return f; }
  function number(v, setV, { step = 1, min = -1e6, max = 1e6, data } = {}) {
    const i = make('input', 'feNum'); i.type = 'number'; i.value = v; i.step = step; i.min = min; i.max = max; if (data) i.dataset.field = data;
    i.addEventListener('change', () => { const n = Number(i.value); if (Number.isFinite(n)) setV(Math.max(min, Math.min(max, n))); });
    return i;
  }
  function time(v, setV, data) {
    const i = make('input', 'hrTime'); i.type = 'time'; i.value = v; if (data) i.dataset.field = data;
    i.addEventListener('change', () => { if (/^\d{2}:\d{2}$/.test(i.value)) setV(i.value); });
    return i;
  }
  function days(v, setV) {
    const names = Array.from({ length: 7 }, (_, d) => { try { return new Intl.DateTimeFormat(ctx.lang(), { weekday: 'short' }).format(new Date(2026, 9, 26 + d)).replace('.', ''); } catch { return String(d); } });
    const box = make('div', 'feChips'); box.dataset.field = 'days';
    names.forEach((n, d) => { const b = btn(`tpChip${v.includes(d) ? ' on' : ''}`, n, () => setV(v.includes(d) ? v.filter((x) => x !== d) : [...v, d].sort())); b.dataset.value = String(d); box.append(b); });
    return box;
  }
  /** a list of devices of some domains to pick from: one (single) or several */
  function picker(doms, chosen, single, pick) {
    const box = make('div', 'fePick');
    const q = make('input', 'feSearch'); q.type = 'search'; q.placeholder = t('fe.search'); q.value = search; q.dataset.field = 'search';
    const list = make('div', 'fePickList');
    const fill = () => {
      const needle = search.trim().toLowerCase();
      const all = ctx.entities().filter((e) => doms.includes(e.entity_id.split('.')[0]));
      const hit = (e) => !needle || (e.name || '').toLowerCase().includes(needle) || e.entity_id.includes(needle);
      const rows = [...all.filter((e) => chosen.includes(e.entity_id)), ...all.filter((e) => !chosen.includes(e.entity_id) && hit(e)).slice(0, 60)];
      list.replaceChildren(...rows.map((e) => {
        const r = make('label', `fePickRow${chosen.includes(e.entity_id) ? ' on' : ''}`); r.dataset.entity = e.entity_id;
        const cb = make('input'); cb.type = single ? 'radio' : 'checkbox'; cb.checked = chosen.includes(e.entity_id); cb.name = 'fePick';
        cb.addEventListener('change', () => pick(single ? [e.entity_id] : cb.checked ? [...chosen, e.entity_id] : chosen.filter((x) => x !== e.entity_id)));
        r.append(cb, make('span', '', e.name || e.entity_id), make('small', '', e.entity_id));
        return r;
      }));
      if (!rows.length) list.append(make('p', 'tpSub', t('fe.nothingFound')));
    };
    q.addEventListener('input', () => { search = q.value; fill(); });
    fill();
    box.append(q, list);
    return box;
  }
  function dur(v, setV) {
    const box = make('div', '');
    box.append(chips(SIZES.map((s) => [s, duration(s, t)]), v, setV, 'duration'));
    box.append(field(t('fe.minutes'), number(Math.round(v / 60), (m) => setV(Math.max(1, m) * 60), { min: 1, max: 1440, data: 'minutes' })));
    return box;
  }
  const canSame = (l) => ['state'].includes(draft.lanes[l].blocks[0].k);

  function panel() {
    const box = make('div', 'feProps');
    if (!sel || !draft.lanes[sel.l]?.blocks[sel.i]) {
      box.append(make('h5', '', t('fe.pickTitle')), make('p', 'tpSub', t('fe.pickHelp')));
      return box;
    }
    const b = draft.lanes[sel.l].blocks[sel.i], w = blockWords(b, wctx());
    const head = make('h5', '', `${w.icon} ${t(`fe.kind.${b.k}`)}`);
    box.append(head);
    const f = [];
    const same = (on) => { const lab = make('label', 'feSame'); const cb = make('input'); cb.type = 'checkbox'; cb.checked = !!b.same; cb.dataset.field = 'same';
      cb.addEventListener('change', () => set((x) => { x.same = cb.checked; if (cb.checked) x.ents = []; })); lab.append(cb, make('span', '', t('fe.sameRoom'))); return on ? lab : null; };
    switch (b.k) {
      case 'state':
        f.push(field(t('fe.when'), chips([['open', t('fl.to.open')], ['closed', t('fl.to.closed')], ['on', t('fl.to.on')], ['off', t('fl.to.off')], ['any', t('fl.to.any')]], b.to, (v) => set((x) => { x.to = v; }), 'to')));
        f.push(field(t('fe.devices'), picker(DOMS.state, b.ents, false, (v) => set((x) => { x.ents = v.slice(0, 20); }))));
        break;
      case 'num': case 'if_num':
        f.push(field(t('fe.device'), picker(DOMS.num, b.ent ? [b.ent] : [], true, (v) => set((x) => { x.ent = v[0]; }))));
        f.push(field(t('fe.op'), chips([['above', t('fl.op.above')], ['below', t('fl.op.below')]], b.op, (v) => set((x) => { x.op = v; }), 'op')));
        f.push(field(t('fe.value'), number(b.v, (v) => set((x) => { x.v = v; }), { step: 0.5, data: 'v' })));
        break;
      case 'time':
        f.push(field(t('fe.at'), time(b.at, (v) => set((x) => { x.at = v; }), 'at')), field(t('fe.days'), days(b.days, (v) => set((x) => { x.days = v; }))));
        break;
      case 'sun':
        f.push(field(t('fe.sun'), chips([['set', t('fl.b.sun.set')], ['rise', t('fl.b.sun.rise')]], b.ev, (v) => set((x) => { x.ev = v; }), 'ev')));
        f.push(field(t('fe.offset'), number(b.off, (v) => set((x) => { x.off = Math.round(v); }), { step: 5, min: -180, max: 180, data: 'off' })));
        break;
      case 'presence': {
        f.push(field(t('fe.when'), chips(['arrive', 'leave', 'all_away', 'first_home'].map((v) => [v, t(`fl.pres.${v}`)]), b.ev, (v) => set((x) => { x.ev = v; }), 'ev')));
        const persons = ctx.entities().filter((e) => e.entity_id.startsWith('person.'));
        if (['arrive', 'leave'].includes(b.ev)) f.push(field(t('fe.who'), chips([['', t('fl.somebody')], ...persons.map((p) => [p.entity_id, p.name || p.entity_id])], b.who, (v) => set((x) => { x.who = v; }), 'who')));
        break;
      }
      case 'button': f.push(make('p', 'tpSub', t('fe.buttonHelp'))); break;
      case 'if_time': f.push(field(t('fe.from'), time(b.from, (v) => set((x) => { x.from = v; }), 'from')), field(t('fe.to'), time(b.to, (v) => set((x) => { x.to = v; }), 'to'))); break;
      case 'if_days': f.push(field(t('fe.days'), days(b.days, (v) => set((x) => { x.days = v; })))); break;
      case 'if_home': {
        const persons = ctx.entities().filter((e) => e.entity_id.startsWith('person.'));
        f.push(field(t('fe.who'), chips([['', t('fl.b.somebodyHome')], ['nobody', t('fl.b.nobody')], ...persons.map((p) => [p.entity_id, p.name || p.entity_id])], b.who, (v) => set((x) => { x.who = v; }), 'who')));
        break;
      }
      case 'if_state':
        f.push(field(t('fe.device'), picker(DOMS.if_state, b.ent ? [b.ent] : [], true, (v) => set((x) => { x.ent = v[0]; }))));
        f.push(field(t('fe.is'), chips([['on', t('fl.is.on')], ['off', t('fl.is.off')], ['open', t('fl.is.open')], ['closed', t('fl.is.closed')]], b.is, (v) => set((x) => { x.is = v; }), 'is')));
        break;
      case 'if_outside':
        f.push(field(t('fe.op'), chips([['below', t('fl.op.colder')], ['above', t('fl.op.warmer')]], b.op, (v) => set((x) => { x.op = v; }), 'op')));
        f.push(field(t('fe.value'), number(b.v, (v) => set((x) => { x.v = v; }), { step: 1, min: -50, max: 60, data: 'v' })));
        break;
      case 'if_sun': f.push(field(t('fe.is'), chips([['dark', t('fl.b.sun.dark')], ['light', t('fl.b.sun.light')]], b.is, (v) => set((x) => { x.is = v; }), 'is'))); break;
      case 'hold': f.push(make('p', 'tpSub', t('fe.holdHelp')), field(t('fe.duration'), dur(b.s, (v) => set((x) => { x.s = v; })))); break;
      case 'wait': f.push(field(t('fe.duration'), dur(b.s, (v) => set((x) => { x.s = v; })))); break;
      case 'switch':
        f.push(field(t('fe.do'), chips([['on', t('fl.do.on')], ['off', t('fl.do.off')], ['toggle', t('fl.do.toggle')]], b.do, (v) => set((x) => { x.do = v; if (v !== 'on') delete x.pct; }), 'do')));
        if (b.do === 'on') f.push(field(t('fe.pct'), number(b.pct || 100, (v) => set((x) => { x.pct = Math.max(1, Math.min(100, Math.round(v))); }), { min: 1, max: 100, data: 'pct' })));
        { const s = same(canSame(sel.l)); if (s) f.push(s); }
        if (!b.same) f.push(field(t('fe.devices'), picker(DOMS.switch, b.ents, false, (v) => set((x) => { x.ents = v.slice(0, 20); }))));
        break;
      case 'heat':
        f.push(field(t('fe.do'), chips([['off', t('fl.heat.off')], ['heat', t('fl.heat.heat')], ['temp', t('fe.temp')]], b.do, (v) => set((x) => { x.do = v; if (v === 'temp' && x.v == null) x.v = 21; }), 'do')));
        if (b.do === 'temp') f.push(field(t('fe.value'), number(b.v ?? 21, (v) => set((x) => { x.v = Math.round(v * 2) / 2; }), { step: 0.5, min: 5, max: 30, data: 'v' })));
        { const s = same(canSame(sel.l)); if (s) f.push(s); }
        if (!b.same) f.push(field(t('fe.devices'), picker(DOMS.heat, b.ents, false, (v) => set((x) => { x.ents = v.slice(0, 20); }))));
        break;
      case 'cover':
        f.push(field(t('fe.do'), chips([['open', t('fl.cover.open')], ['close', t('fl.cover.close')], ['pos', t('fe.position')]], b.do, (v) => set((x) => { x.do = v; if (v === 'pos' && x.v == null) x.v = 50; }), 'do')));
        if (b.do === 'pos') f.push(field(t('fe.value'), number(b.v ?? 50, (v) => set((x) => { x.v = Math.max(0, Math.min(100, Math.round(v))); }), { min: 0, max: 100, data: 'v' })));
        { const s = same(canSame(sel.l)); if (s) f.push(s); }
        if (!b.same) f.push(field(t('fe.devices'), picker(DOMS.cover, b.ents, false, (v) => set((x) => { x.ents = v.slice(0, 20); }))));
        break;
      case 'run': f.push(field(t('fe.device'), picker(DOMS.run, b.ent ? [b.ent] : [], true, (v) => set((x) => { x.ent = v[0]; })))); break;
      case 'notify': {
        const ta = make('textarea', 'feText'); ta.value = b.text; ta.maxLength = 200; ta.rows = 3; ta.dataset.field = 'text';
        ta.addEventListener('change', () => set((x) => { x.text = ta.value; }));
        f.push(field(t('fe.text'), ta), make('p', 'tpSub', t('fe.textHelp')));
        break;
      }
      case 'restore': {
        f.push(make('p', 'tpSub', t('fe.restoreHelp')));
        const s = same(canSame(sel.l)); if (s) f.push(s);
        if (!b.same) f.push(field(t('fe.devicesOpt'), picker(DOMS.restore, b.ents, false, (v) => set((x) => { x.ents = v.slice(0, 20); }))));
        break;
      }
      default: break;
    }
    box.append(...f);
    if (!blockReady(b)) box.append(make('p', 'feMissing', `⚠ ${t('fe.missing')}`));
    const tools = make('div', 'feTools');
    if (sel.i > 0) tools.append(btn('bdBtn', '◀', () => move(-1), t('fe.earlier')), btn('bdBtn', '▶', () => move(1), t('fe.later')));
    const del = btn('bdBtn', `🗑 ${sel.i === 0 ? t('fe.removeLane') : t('fe.remove')}`, remove); del.dataset.act = 'removeBlock';
    tools.append(del);
    box.append(tools);
    return box;
  }

  /* ---- the canvas ---- */
  const W = 172, H = 80, GX = 34, GY = 16, PAD = 16;
  function canvas() {
    const box = make('div', 'feCanvas');
    const stat = (l) => (draft.id ? ctx.rules.lane(`${draft.id}/${l.id}`) : null) || {};
    let y = PAD;
    const svgParts = [];
    draft.lanes.forEach((lane, li) => {
      const L = laneLayout(lane, { W, H, gx: GX, gy: GY }), s = stat(lane);
      const label = make('div', 'feLane', `${t('fe.lane', { n: li + 1 })}${lane.blocks[0] ? ` · ${blockWords(lane.blocks[0], wctx()).text}` : ''}`);
      label.style.top = `${y}px`;
      box.append(label);
      const y0 = y + 26;
      lane.blocks.forEach((b, i) => {
        const [x, by] = L.pos[i], g = groupOf(b.k), w = blockWords(b, wctx());
        const el = make('div', `feBlk ${g}${sel && sel.l === li && sel.i === i ? ' sel' : ''}${blockReady(b) ? '' : ' bad'}${s.wait === i && s.running ? ' waiting' : ''}`);
        el.style.left = `${PAD + x}px`; el.style.top = `${y0 + by}px`; el.dataset.block = `${li}:${i}`;
        el.append(make('div', 'h', t(`fe.group.${g}`)));
        const body = make('div', 'b'); body.append(make('span', '', `${w.icon} ${w.text}`));
        if (w.sub) body.append(make('small', '', w.sub));
        el.append(body);
        if (i > 0) el.append(make('span', 'p l'));
        el.append(make('span', 'p r'));
        const passed = s.passed?.[String(i)];
        if (s.running && s.wait === i && s.until) el.append(make('span', 'feLive wt', `⏳ ${t('fe.left', { d: duration(Math.max(1, s.until - now()), t) })}`));
        else if (passed && (s.end || s.running) && now() - passed < 86400) { const d = new Date(passed * 1000); el.append(make('span', 'feLive ok', `✓ ${hhmm(d.getHours() * 60 + d.getMinutes())}`)); }
        else if (s.stop === i && s.end && now() - s.end < 86400) el.append(make('span', 'feLive no', '✕'));
        el.addEventListener('click', () => { sel = { l: li, i }; search = ''; draw(); });
        box.append(el);
      });
      L.edges.forEach(([a, c]) => {
        const [ax, ay] = L.pos[a], [cx, cy] = L.pos[c];
        const x1 = PAD + ax + W, y1 = y0 + ay + H / 2, x2 = PAD + cx, y2 = y0 + cy + H / 2, dx = Math.max(24, (x2 - x1) / 2);
        svgParts.push(`<path d="M${x1} ${y1} C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}" stroke="${GROUP_COLOR[groupOf(lane.blocks[a].k)]}" stroke-width="3" fill="none"/>`);
      });
      if (lane.blocks.length < MAX_BLOCKS) {
        const plus = btn('fePlus', `＋ ${t('fe.addHere')}`, () => { sel = { l: li, i: lane.blocks.length - 1 }; flash = t('fe.pickLeft'); draw(); });
        plus.style.left = `${PAD + L.w + GX}px`; plus.style.top = `${y0 + (H - 54) / 2}px`; plus.dataset.act = 'addHere';
        box.append(plus);
      }
      y = y0 + L.h + 34;
    });
    if (draft.lanes.length < MAX_LANES) {
      const nl = btn('fePlus lane', `＋ ${t('fe.newLane')}`, () => { flash = t('fe.newLaneHelp'); sel = null; draw(); });
      nl.style.left = `${PAD}px`; nl.style.top = `${y}px`; nl.dataset.act = 'newLane';
      box.append(nl);
      y += 70;
    }
    const wmax = Math.max(600, ...draft.lanes.map((l) => laneLayout(l, { W, H, gx: GX, gy: GY }).w + W + GX * 2 + PAD * 2));
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'feWires'); svg.setAttribute('width', wmax); svg.setAttribute('height', y + PAD);
    svg.innerHTML = svgParts.join('');
    const inner = make('div', 'feInner'); inner.style.width = `${wmax}px`; inner.style.height = `${y + PAD}px`;
    inner.append(svg, ...box.childNodes);
    box.replaceChildren(inner);
    return box;
  }

  function palette() {
    const box = make('div', 'fePal');
    PALETTE.forEach(([g, items]) => {
      const h = make('div', 'g', t(`fe.pal.${g}`)); h.style.setProperty('--c', GROUP_COLOR[g]);
      box.append(h);
      items.forEach(([k, extra, icon, label]) => {
        const b = btn('it', `${icon} ${t(label)}`, () => add(k, extra)); b.style.setProperty('--c', GROUP_COLOR[g]); b.dataset.add = `${k}${extra?.to ? `:${extra.to}` : ''}`;
        box.append(b);
      });
    });
    return box;
  }

  function draw() {
    if (!dlg?.open || !draft) return;
    const focus = document.activeElement, keep = focus && dlg.contains(focus) && focus.matches('input[type=search]') ? { field: focus.dataset.field, pos: focus.selectionStart } : null;
    const top = make('div', 'feTop');
    const back = btn('bdBtn', `‹ ${t('fe.back')}`, close); back.dataset.act = 'feBack';
    const name = make('input', 'feName'); name.value = draft.name; name.maxLength = 60; name.dataset.field = 'name';
    name.addEventListener('change', () => change(() => { draft.name = name.value.trim() || t('fl.newName'); }));
    const onLab = make('label', 'feOn'); const sw = make('span', 'sw'); const cb = make('input'); cb.type = 'checkbox'; cb.checked = draft.on; cb.dataset.field = 'on';
    cb.addEventListener('change', () => change(() => { draft.on = cb.checked; })); sw.append(cb, make('span')); onLab.append(sw, make('span', '', draft.on ? t('fe.on') : t('fe.off')));
    top.append(back, name, onLab);
    const right = make('div', 'feTopR');
    if (flash) right.append(make('span', 'feFlash', flash));
    const tryIt = btn('bdBtn', `▶ ${t('fe.try')}`, tryNow, t('fe.tryHelp')); tryIt.dataset.act = 'feTry'; tryIt.disabled = !flowReady(draft);
    const save = btn('bdBtn primary', `✓ ${t('fe.save')}`, () => store()); save.dataset.act = 'feSave'; save.disabled = !flowReady(draft) || !dirty;
    if (saved()) { const del = btn('bdBtn', `🗑 ${t('fe.delete')}`, drop); del.dataset.act = 'feDelete'; right.append(del); }
    right.append(tryIt, save);
    top.append(right);
    const body = make('div', 'feBody');
    body.append(palette(), canvas(), panel());
    const words = make('div', 'feWords');
    words.append(make('small', '', t('fe.words')));
    draft.lanes.forEach((l) => words.append(make('p', '', laneWords(l, wctx()))));
    if (!draft.lanes.length) words.append(make('p', 'tpSub', t('fe.empty')));
    dlg.replaceChildren(top, body, words);
    if (keep) { const i = dlg.querySelector(`input[type=search][data-field="${keep.field}"]`); if (i) { i.focus(); try { i.setSelectionRange(keep.pos, keep.pos); } catch { /* not every input */ } } }
    drawnSig = sig();
  }
  const sig = () => JSON.stringify([draft?.id ? (draft.lanes || []).map((l) => ctx.rules.lane(`${draft.id}/${l.id}`)) : null, Math.floor(Date.now() / 20000)]);

  async function store() {
    if (!flowReady(draft)) return false;
    const list = (ctx.rules.get()?.flows || []).filter((f) => f.id !== draft.id);
    const ok = await ctx.rules.save({ flows: [...list, draft] });
    flash = ok ? `✓ ${t('fe.saved')}` : t('fe.notSaved');
    if (ok) dirty = false;
    draw();
    setTimeout(() => { flash = ''; draw(); }, 2500);
    return ok;
  }
  async function tryNow() {
    if (dirty && !(await store())) return;
    const lane = draft.lanes[sel?.l ?? 0] || draft.lanes[0];
    const ok = await ctx.rules.run(draft.id, lane.id, true);
    flash = ok ? `✓ ${t('fe.tried')}` : t('fe.notTried');
    draw();
    setTimeout(() => { flash = ''; draw(); }, 2500);
  }
  async function drop() {
    if (!window.confirm(t('fe.deleteAsk', { name: draft.name }))) return;
    const ok = await ctx.rules.save({ flows: (ctx.rules.get()?.flows || []).filter((f) => f.id !== draft.id) });
    if (ok) { dirty = false; close(); }
  }
  function close() {
    if (dirty && !window.confirm(t('fe.leaveAsk'))) return;
    dirty = false;
    dlg?.close();
  }

  /** the editor for a routine: one of the list, a new one from a template ({ id: null, name, lanes }), or null: an empty new one */
  function open(flow) {
    if (!ctx.canEdit()) return;
    if (!dlg) {
      dlg = make('dialog', 'feDlg');
      dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
      dlg.addEventListener('close', () => { clearInterval(timer); draft = null; });
      document.body.append(dlg);
    }
    const base = flow ? JSON.parse(JSON.stringify(flow)) : { id: null, name: t('fl.newName'), on: true, lanes: [] };
    draft = { ...base, id: base.id || newId(), on: base.on !== false };
    dirty = !flow?.id; sel = draft.lanes.length ? { l: 0, i: 0 } : null; flash = ''; search = '';
    if (!dlg.open) dlg.showModal();
    draw();
    clearInterval(timer);
    timer = setInterval(() => {                      // the ticks of what ran: drawn again, not while a field is being typed in
      const typing = dlg.contains(document.activeElement) && document.activeElement.matches('input:not([type=checkbox]):not([type=radio]), textarea');
      if (dlg.open && sig() !== drawnSig && !typing) draw();
    }, 1000);
  }
  return { open, isOpen: () => !!dlg?.open, close: () => { dirty = false; dlg?.close(); } };
}
