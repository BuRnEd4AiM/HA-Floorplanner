/* The pages of the add-on's own heating rules and routines (#546): what a block of a routine says, the routine "in Worten", what an
 * automation of Home Assistant does in words, when something ran ("vor 12 Min", "gestern 23:05"), two rules that set the same thermostat,
 * the blocks of a day of the schedule and how a tap or a drag changes them, where the blocks of a routine stand on its canvas, and the
 * ready-made routines of "Aus Vorlage". Pure (unit test: tests/rules.test.mjs); heatrulesui.js, heatplanui.js, usedbyui.js,
 * routinesown.js and flowedit.js draw. The engines themselves run in the add-on (heatrules.py, flows.py). */

export const LEVELS = ['night', 'eco', 'comfort'];
export const LEVEL_ICON = { night: '💤', eco: '🌙', comfort: '☀️' };
export const LEVEL_COLOR = { night: '#2e5f8f', eco: '#3fa9f5', comfort: '#ff8c32' };
export const TRIGGERS = ['state', 'num', 'time', 'sun', 'presence', 'button'];
export const CONDS = ['if_time', 'if_days', 'if_home', 'if_state', 'if_num', 'if_outside', 'if_sun'];
export const WAITS = ['hold', 'wait'];
export const ACTIONS = ['switch', 'heat', 'cover', 'run', 'notify', 'restore'];
export const groupOf = (k) => (TRIGGERS.includes(k) ? 'when' : CONDS.includes(k) ? 'and' : WAITS.includes(k) ? 'wait' : 'then');

/** the key of a room for the rules: "<house>/<room id>" */
export const roomKey = (house, room) => `${house}/${room}`;

/** a new id for a routine: f_ and some letters */
export const newId = (rand = Math.random) => `f_${Math.floor(rand() * 36 ** 8).toString(36).padStart(8, '0')}`;

const pad = (n) => String(n).padStart(2, '0');
export const hhmm = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
export const minutes = (s) => { const m = /^(\d{1,2}):(\d{2})$/.exec(s || ''); return m ? Math.min(1439, +m[1] * 60 + +m[2]) : null; };

/** a duration in seconds as text: 30 s, 2 Min, 1 Std, 1 Std 30 Min */
export function duration(s, t) {
  if (s < 60) return t('fl.sec', { n: s });
  const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
  if (!h) return t('fl.min', { n: m });
  return m ? `${t('fl.hour', { n: h })} ${t('fl.min', { n: m })}` : t('fl.hour', { n: h });
}

/** weekdays (0 = Monday) as text: every day, Mo–Fr, Sa–So, or the short names */
export function daysText(days, lang, t) {
  const d = [...new Set(days || [])].sort((a, b) => a - b);
  if (!d.length || d.length === 7) return t('fl.everyDay');
  const name = (i) => { try { return new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(new Date(2026, 9, 26 + i)).replace('.', ''); } catch { return String(i); } };
  const run = d.every((x, i) => i === 0 || x === d[i - 1] + 1);
  return run && d.length > 2 ? `${name(d[0])}–${name(d[d.length - 1])}` : d.map(name).join(', ');
}

/** when something ran, as text: gerade eben, vor 12 Min, heute 06:00, gestern 23:05, vor 4 Tagen; '' without a time */
export function ago(ts, now, t) {
  if (!ts) return '';
  const s = Math.max(0, now - ts);
  if (s < 60) return t('fl.justNow');
  if (s < 3600) return t('fl.agoMin', { n: Math.floor(s / 60) });
  const d = new Date(ts * 1000), n = new Date(now * 1000), at = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(n) - day(d)) / 86400000);
  if (diff === 0) return t('fl.today', { at });
  if (diff === 1) return t('fl.yesterday', { at });
  return t('fl.agoDays', { n: diff });
}

const ICONS = [[/fenster|window/, '🪟'], [/tuer|tür|door|tor\b|gate/, '🚪'], [/bewegung|motion|praesenz|presence|occupancy/, '🏃'], [/rauch|smoke/, '🔥'], [/wasser|water|leak/, '💧']];
/** an icon for a device by its domain and name */
export function entIcon(e, states = {}) {
  const dom = (e || '').split('.')[0], dc = states[e]?.dc;
  if (dc === 'window') return '🪟';
  if (dc === 'door' || dc === 'garage_door') return '🚪';
  if (dc === 'motion' || dc === 'occupancy' || dc === 'presence') return '🏃';
  for (const [re, ic] of ICONS) if (re.test(e)) return ic;
  return { light: '💡', switch: '🔌', climate: '🔥', cover: '🪟', person: '👤', sensor: '🌡', fan: '🌀', media_player: '📺', scene: '🎬', script: '📜' }[dom] || '🔘';
}

/** the names of some devices: the first one, "+2" for the others */
export function namesText(ents, nameOf) {
  const list = (ents || []).filter(Boolean);
  if (!list.length) return '';
  return list.length > 1 ? `${nameOf(list[0]) || list[0]} +${list.length - 1}` : nameOf(list[0]) || list[0];
}

const deg = (v) => `${String(v).replace('.', ',')}°`;

/** what a block says: { icon, text, sub }. ctx: t, lang, nameOf(entity), states */
export function blockWords(b, ctx) {
  const { t } = ctx, nm = (ents) => namesText(ents, ctx.nameOf), one = (e) => (e ? ctx.nameOf(e) || e : '');
  const same = (k) => t(`fl.same.${k}`);
  switch (b.k) {
    case 'state': return { icon: entIcon(b.ents[0], ctx.states), text: t(`fl.b.state.${b.to}`, { name: nm(b.ents) }), sub: b.ents.length > 1 ? b.ents.map(one).slice(1, 4).join(', ') : '' };
    case 'num': return { icon: '🌡', text: t(`fl.b.num.${b.op}`, { name: one(b.ent), v: b.v }), sub: '' };
    case 'time': return { icon: '🕐', text: b.at, sub: daysText(b.days, ctx.lang, t) };
    case 'sun': return { icon: b.ev === 'set' ? '🌇' : '🌅', text: t(`fl.b.sun.${b.ev}`), sub: b.off ? t(b.off > 0 ? 'fl.after' : 'fl.before', { d: duration(Math.abs(b.off) * 60, t) }) : '' };
    case 'presence': return { icon: b.ev === 'all_away' ? '🚶' : b.ev === 'first_home' ? '🏠' : '👤', text: t(`fl.b.presence.${b.ev}`, { who: b.who ? one(b.who) : t('fl.somebody') }), sub: '' };
    case 'button': return { icon: '🔘', text: t('fl.b.button'), sub: '' };
    case 'if_time': return { icon: '🕐', text: t('fl.b.ifTime', { from: b.from, to: b.to }), sub: '' };
    case 'if_days': return { icon: '📅', text: daysText(b.days, ctx.lang, t), sub: '' };
    case 'if_home': return { icon: '🏠', text: b.who === 'nobody' ? t('fl.b.nobody') : b.who ? t('fl.b.isHome', { who: one(b.who) }) : t('fl.b.somebodyHome'), sub: '' };
    case 'if_state': return { icon: entIcon(b.ent, ctx.states), text: t('fl.b.ifState', { name: one(b.ent), is: t(`fl.is.${b.is}`) === `fl.is.${b.is}` ? b.is : t(`fl.is.${b.is}`) }), sub: '' };
    case 'if_num': return { icon: '🌡', text: t(`fl.b.num.${b.op}`, { name: one(b.ent), v: b.v }), sub: '' };
    case 'if_outside': return { icon: '🌡', text: t(`fl.b.outside.${b.op}`, { v: deg(b.v) }), sub: '' };
    case 'if_sun': return { icon: b.is === 'dark' ? '🌙' : '☀️', text: t(`fl.b.sun.${b.is}`), sub: '' };
    case 'hold': return { icon: '⏱', text: t('fl.b.hold'), sub: duration(b.s, t) };
    case 'wait': return { icon: '⏱', text: t('fl.b.wait'), sub: duration(b.s, t) };
    case 'switch': return { icon: b.ents[0]?.startsWith('light.') || b.same ? '💡' : entIcon(b.ents[0], ctx.states), text: b.same ? same('switch') : nm(b.ents), sub: t(`fl.do.${b.do}`) + (b.pct ? ` · ${b.pct} %` : '') };
    case 'heat': return { icon: '🔥', text: b.same ? same('heat') : nm(b.ents), sub: b.do === 'temp' ? deg(b.v) : t(`fl.heat.${b.do}`) };
    case 'cover': return { icon: '🪟', text: b.same ? same('cover') : nm(b.ents), sub: b.do === 'pos' ? `${b.v} %` : t(`fl.cover.${b.do}`) };
    case 'run': return { icon: b.ent.startsWith('scene.') ? '🎬' : '📜', text: one(b.ent), sub: t('fl.start') };
    case 'notify': return { icon: '🔔', text: t('fl.b.notify'), sub: `„${b.text}“` };
    case 'restore': return { icon: '↩', text: t('fl.b.restore'), sub: b.same ? same('restore') : b.ents.length ? nm(b.ents) : t('fl.everything') };
    default: return { icon: '?', text: b.k, sub: '' };
  }
}

/** a lane in words: "Wenn …, und es 2 Min so bleibt, nur wenn …: dann …, …" */
export function laneWords(lane, ctx) {
  const { t } = ctx, parts = [], acts = [];
  const w = (b) => { const x = blockWords(b, ctx); return x.sub && !['time'].includes(b.k) ? `${x.text} (${x.sub})` : x.text + (b.k === 'time' && x.sub !== t('fl.everyDay') ? ` (${x.sub})` : ''); };
  (lane.blocks || []).forEach((b, i) => {
    const g = groupOf(b.k);
    if (i === 0) parts.push(`${t('fl.w.when')} ${w(b)}`);
    else if (g === 'and') parts.push(`${t('fl.w.onlyIf')} ${w(b)}`);
    else if (g === 'wait') {
      if (acts.length) { parts.push(`${t('fl.w.then')} ${acts.join(', ')}`); acts.length = 0; }
      parts.push(b.k === 'hold' ? t('fl.w.hold', { d: duration(b.s, t) }) : t('fl.w.wait', { d: duration(b.s, t) }));
    } else acts.push(w(b));
  });
  if (acts.length) parts.push(`${t('fl.w.then')} ${acts.join(', ')}`);
  return parts.join(' · ');
}

/** what an automation of Home Assistant does, in words (its summary from api/automations or api/related): "06:00 → Heizung 22°" */
export function sumWords(sum, ctx) {
  if (!sum) return '';
  const { t } = ctx, nm = (ents) => namesText(ents, ctx.nameOf);
  const when = (sum.when || []).map((x) => {
    if (x.k === 'time') return x.at.join(', ') || t('fl.s.time');
    if (x.k === 'state') return x.to ? `${nm(x.ents)} → ${t(`fl.is.${x.to}`) === `fl.is.${x.to}` ? x.to : t(`fl.is.${x.to}`)}` : nm(x.ents);
    if (x.k === 'num') return `${nm(x.ents)} ${x.above != null ? `> ${x.above}` : ''}${x.below != null ? ` < ${x.below}` : ''}`.trim();
    if (x.k === 'sun') return t(`fl.b.sun.${x.ev === 'sunrise' ? 'rise' : 'set'}`);
    if (x.k === 'zone') return `${nm(x.ents)} ${t(`fl.s.zone.${x.ev}`)}`;
    return t(`fl.s.${x.k}`);
  });
  const what = (sum.do || []).map((x) => {
    if (x.k === 'call') {
      const [dom, svc] = x.svc.split('.'), who = nm(x.ents);
      if (dom === 'notify') return t('fl.b.notify');
      if (x.temperature != null) return `${who} ${deg(x.temperature)}`;
      if (x.hvac_mode) return `${who} ${t(`fl.heat.${x.hvac_mode}`) === `fl.heat.${x.hvac_mode}` ? x.hvac_mode : t(`fl.heat.${x.hvac_mode}`)}`;
      if (x.position != null) return `${who} ${x.position} %`;
      const word = { turn_on: t('fl.do.on'), turn_off: t('fl.do.off'), toggle: t('fl.do.toggle'), open_cover: t('fl.cover.open'), close_cover: t('fl.cover.close') }[svc];
      return `${who || x.svc} ${word || (who ? svc : '')}${x.brightness_pct ? ` ${x.brightness_pct} %` : ''}`.trim();
    }
    if (x.k === 'scene') return `🎬 ${nm(x.ents)}`;
    return t(`fl.s.${x.k}`);
  });
  const more = sum.more ? ` ${t('fl.s.more', { n: sum.more })}` : '';
  return `${when.join(', ') || '…'}${sum.checks ? ` (${t('fl.s.checks', { n: sum.checks })})` : ''} → ${what.join(', ') || '…'}${more}`;
}

/** an automation of Home Assistant that sets the same thermostat as one of the add-on's own heating rules (not the window rule, which
 *  only pauses): the rows (entities) that collide; rows: api/related rows, own: its own uses */
export function clashes(entity, rows, own) {
  const ours = (own || []).filter((o) => o.kind === 'heat' && o.rule !== 'window');
  if (!ours.length || !entity.startsWith('climate.')) return [];
  return (rows || []).filter((r) => r.kind === 'automation' && r.on && (r.sum?.do || []).some((x) => x.k === 'call' && x.svc.startsWith('climate.') && x.ents.includes(entity)))
    .map((r) => r.entity);
}

/* ---- the schedule ---- */
/** the blocks of one day: [{ from, to, level, i (index of its point, -1 for the part before the first point) }]; prev: the level the day
 *  starts with (the last of the days before) */
export function dayBlocks(day, prev) {
  const pts = day || [], out = [];
  if (!pts.length) return prev ? [{ from: 0, to: 1440, level: prev, i: -1 }] : [];
  if (pts[0][0] > 0 && prev) out.push({ from: 0, to: pts[0][0], level: prev, i: -1 });
  pts.forEach(([m, lv], i) => out.push({ from: m, to: i + 1 < pts.length ? pts[i + 1][0] : 1440, level: lv, i }));
  return out;
}

/** the level a day starts with: the last point of the days before (Monday after Sunday) */
export function dayStart(days, d) {
  for (let back = 1; back <= 7; back++) {
    const day = days[(d - back + 7) % 7] || [];
    if (day.length) return day[day.length - 1][1];
  }
  return null;
}

/** the level now and when it changes: { level, until (minute today or null), next (level after) } */
export function planNow(plan, date) {
  const days = plan?.days || [], wd = (date.getDay() + 6) % 7, m = date.getHours() * 60 + date.getMinutes();
  const blocks = dayBlocks(days[wd], dayStart(days, wd));
  const at = blocks.findIndex((b) => b.from <= m && m < b.to);
  if (at < 0) return { level: null, until: null, next: null };
  const nextB = blocks[at + 1];
  return { level: blocks[at].level, until: nextB ? nextB.from : null, next: nextB ? nextB.level : null };
}

const sorted = (pts) => [...pts].sort((a, b) => a[0] - b[0]).filter((p, i, a) => i === 0 || p[0] !== a[i - 1][0]);
/** a tap on a block: the next level (night → eco → comfort → night); the part before the first point gets a point of its own at 0:00 */
export function cycleBlock(day, block) {
  const next = LEVELS[(LEVELS.indexOf(block.level) + 1) % LEVELS.length];
  const pts = (day || []).map((p) => [...p]);
  if (block.i < 0) return sorted([[0, next], ...pts]);
  pts[block.i][1] = next;
  return pts;
}

/** the start of block i moved to minute m (on 15 minutes, between its neighbours) */
export function moveStart(day, i, m, step = 15) {
  const pts = day.map((p) => [...p]);
  if (i <= 0 && pts[0]?.[0] === 0) return pts;                   // the start of the day stays
  const lo = i > 0 ? pts[i - 1][0] + step : step, hi = i + 1 < pts.length ? pts[i + 1][0] - step : 1440 - step;
  pts[i][0] = Math.max(lo, Math.min(hi, Math.round(m / step) * step));
  return pts;
}

/** a block cut in two in its middle (the second half the next level), or the block taken away (its time goes to the one before) */
export function splitBlock(day, block, step = 15) {
  const mid = Math.round((block.from + block.to) / 2 / step) * step;
  if (mid <= block.from || mid >= block.to) return day;
  const next = LEVELS[(LEVELS.indexOf(block.level) + 1) % LEVELS.length];
  return sorted([...(day || []).map((p) => [...p]), [mid, next]]);
}
export const removeBlock = (day, block) => (block.i < 0 ? day : day.filter((_, j) => j !== block.i));

/** a schedule to start with: Monday to Friday warm in the morning and the evening, the weekend all day */
export function defaultPlan() {
  const work = [[0, 'night'], [360, 'comfort'], [480, 'eco'], [930, 'comfort'], [1350, 'night']], home = [[0, 'night'], [480, 'comfort'], [1350, 'night']];
  return { days: [work, work, work, work, work, home, home].map((d) => d.map((p) => [...p])) };
}

/* ---- the canvas of a routine ---- */
/** where the blocks of a lane stand: actions that follow each other stand in one column (they run at once), everything else one column
 *  further; { pos: [[x, y] per block], edges: [[from, to]], w, h } */
export function laneLayout(lane, { W = 196, H = 84, gx = 46, gy = 18 } = {}) {
  const cols = [];
  (lane.blocks || []).forEach((b, i) => {
    const last = cols[cols.length - 1];
    if (groupOf(b.k) === 'then' && last && groupOf(lane.blocks[last[0]].k) === 'then') last.push(i);
    else cols.push([i]);
  });
  const pos = [], edges = [];
  cols.forEach((col, c) => {
    col.forEach((i, r) => { pos[i] = [c * (W + gx), r * (H + gy)]; });
    if (c > 0) col.forEach((i) => edges.push([cols[c - 1][0], i]));
  });
  const rows = Math.max(1, ...cols.map((c) => c.length));
  return { pos, edges, w: cols.length * (W + gx) - gx, h: rows * (H + gy) - gy, cols };
}

/** is a block complete (a device chosen where one is needed); a routine is saved only when all are */
export function blockReady(b) {
  if (['state'].includes(b.k)) return (b.ents || []).length > 0;
  if (['num', 'if_state', 'if_num'].includes(b.k)) return !!b.ent && (b.k === 'if_state' || typeof b.v === 'number');
  if (['switch', 'heat', 'cover'].includes(b.k)) return b.same || (b.ents || []).length > 0;
  if (b.k === 'run') return !!b.ent;
  if (b.k === 'notify') return !!(b.text || '').trim();
  return true;
}
export const flowReady = (f) => (f.lanes || []).length > 0 && f.lanes.every((l) => l.blocks.length > 0 && TRIGGERS.includes(l.blocks[0].k) && l.blocks.every(blockReady));

/** a new block of kind k with sensible values */
export function newBlock(k) {
  const d = {
    state: { ents: [], to: 'open' }, num: { ent: '', op: 'above', v: 25 }, time: { at: '07:00', days: [] }, sun: { ev: 'set', off: 0 },
    presence: { ev: 'arrive', who: '' }, button: {}, if_time: { from: '22:00', to: '06:00' }, if_days: { days: [0, 1, 2, 3, 4] },
    if_home: { who: '' }, if_state: { ent: '', is: 'on' }, if_num: { ent: '', op: 'above', v: 25 }, if_outside: { op: 'below', v: 15 },
    if_sun: { is: 'dark' }, hold: { s: 120 }, wait: { s: 60 }, switch: { ents: [], same: false, do: 'on' }, heat: { ents: [], same: true, do: 'off' },
    cover: { ents: [], same: false, do: 'close' }, run: { ent: '' }, notify: { text: '' }, restore: { ents: [], same: true },
  }[k];
  return d ? { k, ...JSON.parse(JSON.stringify(d)) } : null;
}

/** the ready-made routines of "Aus Vorlage", with the devices of the house guessed (states: slim states, names) */
export function templates(states, t) {
  const ids = Object.keys(states || {});
  const windows = ids.filter((e) => e.startsWith('binary_sensor.') && (states[e]?.dc === 'window' || /fenster|window/.test(e))).slice(0, 20);
  const doors = ids.filter((e) => e.startsWith('binary_sensor.') && (states[e]?.dc === 'door' || /haustuer|haustür|front_?door|eingang/.test(e))).slice(0, 4);
  const motion = ids.filter((e) => e.startsWith('binary_sensor.') && (['motion', 'occupancy', 'presence'].includes(states[e]?.dc) || /bewegung|motion|praesenz|presence|occupancy/.test(e))).slice(0, 4);
  const lights = ids.filter((e) => e.startsWith('light.')), covers = ids.filter((e) => e.startsWith('cover.') && states[e]?.dc !== 'garage' && !/garage/.test(e));
  const lane = (blocks, id = 'l1') => ({ id, blocks });
  return [
    { key: 'window', icon: '🪟', name: t('fl.tpl.window'), lanes: [
      lane([{ k: 'state', ents: windows, to: 'open' }, { k: 'hold', s: 120 }, { k: 'heat', ents: [], same: true, do: 'off' }]),
      lane([{ k: 'state', ents: windows, to: 'closed' }, { k: 'restore', ents: [], same: true }], 'l2')] },
    { key: 'motion', icon: '🏃', name: t('fl.tpl.motion'), lanes: [
      lane([{ k: 'state', ents: motion.slice(0, 1), to: 'on' }, { k: 'if_sun', is: 'dark' }, { k: 'switch', ents: lights.slice(0, 1), same: false, do: 'on', pct: 30 }, { k: 'wait', s: 120 },
        { k: 'switch', ents: lights.slice(0, 1), same: false, do: 'off' }])] },
    { key: 'sunset', icon: '🌇', name: t('fl.tpl.sunset'), lanes: [lane([{ k: 'sun', ev: 'set', off: 0 }, { k: 'cover', ents: covers.slice(0, 20), same: false, do: 'close' }])] },
    { key: 'morning', icon: '🌅', name: t('fl.tpl.morning'), lanes: [lane([{ k: 'time', at: '07:00', days: [0, 1, 2, 3, 4] }, { k: 'cover', ents: covers.slice(0, 20), same: false, do: 'open' }])] },
    { key: 'away', icon: '🚶', name: t('fl.tpl.away'), lanes: [lane([{ k: 'presence', ev: 'all_away', who: '' }, { k: 'switch', ents: lights.slice(0, 20), same: false, do: 'off' }])] },
    { key: 'door', icon: '🚪', name: t('fl.tpl.door'), lanes: [lane([{ k: 'state', ents: doors.slice(0, 1), to: 'open' }, { k: 'hold', s: 300 }, { k: 'notify', text: t('fl.tpl.doorText') }])] },
  ];
}

/* ---- what a room's heating does now (the status of api/rules) ---- */
/** a room's line: { icon, text, tone } or null; s: status of the room, now (seconds), deg(v): a temperature as text */
export function roomLine(s, now, t, deg) {
  if (!s) return null;
  if (s.why === 'window') return { icon: '⏸️', tone: 'pause', text: t('hr.line.window', { n: Math.max(1, Math.round((now - (s.since || now)) / 60)), v: s.back != null ? deg(s.back) : '–' }) };
  if (s.waiting) return { icon: '🪟', tone: 'warn', text: t('hr.line.waiting') };
  if (s.skip) return { icon: '🔥', tone: '', text: t('hr.line.skip') };
  if (s.why === 'boost') { const d = new Date((s.until || now) * 1000); return { icon: '🚀', tone: 'boost', text: t('hr.line.boost', { at: hhmm(d.getHours() * 60 + d.getMinutes()) }) }; }
  if (!s.why) return null;
  return { icon: { holiday: '✈️', summer: '☀️', away: '🚶', schedule: LEVEL_ICON[s.level] || '📅', night: '🌙' }[s.why] || '📋', tone: '',
    text: t(`hr.line.${s.why}`, { v: s.temp != null ? deg(s.temp) : '', level: s.level ? t(`hr.level.${s.level}`) : '' }) };
}

/** the short mark of a room's label and tile in the house: "⏸️ pausiert" while the window rule paused its heating, "🚀 Boost"; '' else */
export function roomMark(s, t) {
  if (s?.why === 'window') return `⏸️ ${t('hr.mark.window')}`;
  if (s?.why === 'boost') return `🚀 ${t('hr.boost')}`;
  return '';
}

/* ---- own routines as automations of Home Assistant (#548, haflows.py) ---- */
/** the id of a lane's automation in Home Assistant (f_abc, l1 -> fp3d_abc_l1) */
export const autoId = (fid, lid) => `fp3d_${String(fid).slice(2)}_${lid}`;
/** an automation or scene the add-on made (the only ones it changes) */
export const ours = (cid) => typeof cid === 'string' && /^fp3d_[a-z0-9_]{1,80}$/.test(cid);

/** what a routine does now: { running, last (seconds), lanes: [{ lane, entity (its automation, or null) }] }; one in Home Assistant
 *  from its automations' states (cid, run, at), one of the add-on from laneOf(key) (rulesstore.lane) */
export function flowLive(flow, states, laneOf) {
  if (flow.ha) {
    const byCid = new Map(Object.entries(states || {}).filter(([, s]) => s?.cid).map(([e, s]) => [s.cid, e]));
    const lanes = flow.lanes.map((l) => ({ lane: l, entity: byCid.get(autoId(flow.id, l.id)) || null }));
    const sts = lanes.map((x) => (x.entity ? states[x.entity] : null)).filter(Boolean);
    return { running: sts.some((s) => (s.run || 0) > 0), last: Math.max(0, ...sts.map((s) => s.at || 0)), lanes };
  }
  const ls = flow.lanes.map((l) => ({ lane: l, s: laneOf(`${flow.id}/${l.id}`) || {} }));
  return { running: ls.some((x) => x.s.running), last: Math.max(0, ...ls.map((x) => x.s.end || x.s.t0 || 0)), lanes: ls.map((x) => ({ lane: x.lane, entity: null })) };
}

/** Home Assistant's page of an automation (base: Home Assistant's address for the browser, '' when the page runs inside it) */
export const haEditUrl = (base, cid) => `${base || ''}/config/automation/edit/${encodeURIComponent(cid)}`;

/** what saving a routine in Home Assistant came to (haSync of api/rules for one routine): { kind: ok | warn | bad | ask, text }; ask:
 *  it was changed in Home Assistant and the page asks before it overwrites it */
export function syncWords(res, t) {
  if (!res) return null;
  if (res.conflict) return { kind: 'ask', text: t('fe.ha.conflict') };
  if (res.error) return { kind: 'bad', text: res.error === 'nohass' ? t('fe.ha.nohass') : t('fe.ha.error', { why: res.error }) };
  const hard = (res.problems || []).filter((p) => !p.soft);
  if (hard.length || !res.ok) return { kind: 'bad', text: t('fe.ha.cannot', { why: hard.map((p) => t(`fe.ha.why.${p.why}`)).join(' · ') || '?' }) };
  if (res.missing) return { kind: 'bad', text: t('fe.ha.missing') };
  const soft = (res.problems || []).filter((p) => p.soft);
  if (soft.length) return { kind: 'warn', text: `${t('fe.ha.saved')} · ${soft.map((p) => t(`fe.ha.why.${p.why}`)).join(' · ')}` };
  return { kind: 'ok', text: t('fe.ha.saved') };
}
