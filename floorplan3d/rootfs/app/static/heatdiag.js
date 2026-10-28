/* 🌡 Klima → 🩺 Protokoll (#579, the owner: "nicht immer erkannt, dass … ein Fenster oder eine Tür offen ist … manchmal … von selbst
 * gedreht … er selbst und er weiß es irgendwie nicht … ein Log …, wo man auslesen kann, was gerade wen steuert … praktisch für dich, dass
 * du so Fehler … auswerten kannst"): what the page makes of api/rules/trace (heatlog.py): every room as the add-on sees it (who controls
 * it now, its thermostats and who changed them last, its windows and doors and whether the window rule counts them), the journal as lines,
 * and the whole as a text to copy into a chat. Pure (unit test: tests/heatdiag.test.mjs); the page is heatdiagui.js. */
import { roomLine, hhmm } from './rules.js';

const OPEN = new Set(['on', 'open', 'opening']);
const USES = ['window', 'outer', 'counted', 'inner'];
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** why the window rule does not count a contact of room key (as heatlog.why_not): inner, off, doors, skip, noclimate; null: it counts.
 *  rooms: { key: room of api/rules/trace }; window: the rule's settings */
export function whyNot(key, use, rooms, window) {
  if (use === 'inner') return 'inner';
  if (!window?.on) return 'off';
  if (use === 'outer' && window.doors === false) return 'doors';             // a door with "Zählt für die Heizung" (counted) counts anyway
  if ((window.skip || []).includes(key)) return 'skip';
  if (!(rooms[key]?.climates || []).length) return 'noclimate';
  return null;
}

/** a contact's state in a word: open, closed, gone (unavailable), unknown, none (not in Home Assistant) */
export function contactState(st) {
  if (!st) return 'none';
  if (OPEN.has(st.s)) return 'open';
  if (st.s === 'unavailable') return 'gone';
  if (st.s === 'unknown') return 'unknown';
  return 'closed';
}

/** "17:23:05", on another day "27.10. 17:23:05" (ts in seconds, now the day to compare with) */
export function clock(ts, now) {
  const d = new Date(ts * 1000), n = new Date(now * 1000), p = (x) => String(x).padStart(2, '0');
  const time = `${hhmm(d.getHours() * 60 + d.getMinutes())}:${p(d.getSeconds())}`;
  return d.toDateString() === n.toDateString() ? time : `${p(d.getDate())}.${p(d.getMonth() + 1)}. ${time}`;
}

/** "28.10.2026 18:40:12" */
export function stamp(ts) {
  const d = new Date(ts * 1000), p = (x) => String(x).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** a thermostat's mode in a word */
function modeWord(m, t) {
  if (m == null) return '–';
  if (m === 'unavailable') return t('hd.s.gone');
  if (m === 'unknown') return t('hd.s.unknown');
  const w = t(`fl.heat.${m}`);
  return w === `fl.heat.${m}` ? m : w;
}

/** who changed a thermostat (an entry "climate" of the journal) in words */
export function byWords(x, t) {
  if (x.by === 'addon') {
    if (num(x.ago) == null) return t('hd.by.addon');
    return x.ago >= 90 ? t('hd.by.addonMin', { n: Math.round(x.ago / 60) }) : t('hd.by.addonAgo', { n: x.ago });
  }
  if (x.by === 'auto') return t('hd.by.auto');
  if (x.by === 'user') return x.who ? t('hd.by.user', { who: x.who }) : t('hd.by.userAnon');
  return t('hd.by.device');
}

/** what a room's rules do, from an entry "room" of the journal (no times of its own: shorter than roomLine) */
export function roomWords(s, t, deg) {
  const v = num(s.temp) != null ? deg(s.temp) : '', level = s.level ? t(`hr.level.${s.level}`) : '';
  let out;
  if (s.why === 'window') out = s.stuck ? `⚠️ ${t('hd.r.stuck')}` : `⏸️ ${t('hd.r.window')}`;
  else if (s.waiting) out = `🪟 ${t('hd.r.waiting')}`;
  else if (s.skip) out = `🔥 ${t('hr.line.skip')}`;
  else if (s.why === 'boost') out = `🚀 ${t('hr.boost')}`;
  else if (s.why === 'schedule' && s.hand) { const d = new Date(s.hand * 1000); out = `✋ ${t('hr.line.hand', { at: hhmm(d.getHours() * 60 + d.getMinutes()), level, v })}`; }
  else if (s.why) out = t(`hr.line.${s.why}`, { v, level });
  else out = t('hd.r.none');
  return num(s.sent) != null && s.why !== 'window' ? `${out} · ⏳ ${t('hd.sent', { v: deg(s.sent) })}` : out;
}

/** who controls a room now (its status of api/rules): { icon, text }; no status: no thermostat (climates: it has some, the add-on
 *  does not control them: unavailable, or they cannot heat) */
export function nowWords(s, now, t, deg, climates = false) {
  if (!s) return climates ? { icon: '⚠️', text: t('hd.noStatus') } : { icon: '–', text: t('hd.noClimate') };
  const line = roomLine(s, now, t, deg);
  const w = line ? { icon: line.icon, text: line.text } : { icon: '·', text: t('hd.nobody') };
  if (num(s.sent) != null && s.why !== 'window') w.text += ` · ⏳ ${t('hd.sent', { v: deg(s.sent) })}`;
  return w;
}

/** the rooms as the add-on sees them, with what each does now. diag: api/rules/trace; rules: api/rules (heat, status); ctx: t, deg,
 *  name(entity), now, house (only its rooms; none: all). [{ key, name, now: {icon, text}, climates: [{ e, name, text, sensor, last }],
 *  contacts: [{ e, name, use, state, why }] }] */
export function roomViews(diag, rules, ctx) {
  const { t, deg } = ctx, byKey = Object.fromEntries((diag?.rooms || []).map((r) => [r.key, r])), st = diag?.states || {};
  const window = rules?.heat?.window || {}, status = rules?.status || {};
  const lastOf = (e) => [...(diag?.trace || [])].reverse().find((x) => x.k === 'climate' && x.ent === e) || null;
  const many = new Set((diag?.rooms || []).map((r) => r.house)).size > 1;
  return (diag?.rooms || []).filter((r) => !ctx.house || r.house === ctx.house).map((r) => {
    const climates = r.climates.map((e) => {
      const s = st[e], parts = [s ? modeWord(s.s, t) : t('hd.s.none')];
      if (s && num(s.t) != null) parts.push(t('hd.th.target', { v: deg(s.t) }));
      if (s && num(s.c) != null) parts.push(t('hd.th.meas', { v: deg(s.c) }));
      const rs = status.sensors?.[e], room = num(rs?.v) != null ? deg(rs.v) : '–';
      let sensor = null;
      if (rs?.way === 'shift') sensor = t('hd.th.shift', { v: room, wish: num(rs.wish) != null ? deg(rs.wish) : '–', set: num(rs.set) != null ? deg(rs.set) : '–' });
      else if (rs?.way === 'cal') sensor = t('hd.th.cal', { v: room, off: num(rs.off) != null ? deg(rs.off) : num(rs.sent) != null ? deg(rs.sent) : '–' });
      else if (rs) sensor = t('hd.th.show', { v: room });
      const last = lastOf(e);
      return { e, name: ctx.name(e), text: parts.join(' · '), sensor, last: last ? t('hd.th.last', { at: clock(last.t, ctx.now), by: byWords(last, t) }) : null };
    });
    const contacts = [];
    USES.forEach((use) => (r[use === 'window' ? 'windows' : use] || []).forEach((e) => {   // counted: a door with "Zählt für die Heizung"
      contacts.push({ e, name: ctx.name(e), use, state: contactState(st[e]), why: whyNot(r.key, use, byKey, window) });
    }));
    return { key: r.key, name: many && diag.houses?.[r.house] ? `${r.name} (${diag.houses[r.house]})` : r.name, now: nowWords(r.climates.length ? status.rooms?.[r.key] || null : null, ctx.now, t, deg, r.climates.length > 0),
      climates, contacts };
  });
}

/** what a contact is for the window rule: "Fenster · zählt für die Fenster-Regel" */
export const contactSub = (c, t) => `${t(`hd.use.${c.use}`)} · ${c.why ? t(`hd.not.${c.why}`) : t('hd.counts')}`;
/** a contact in words: "Fenster WZ: offen · Fenster · zählt für die Fenster-Regel" */
export const contactWords = (c, t) => `${c.name}: ${t(`hd.s.${c.state}`)} · ${contactSub(c, t)}`;

/** what the value of a call or a rule is in words */
function valueWords(x, t, deg) {
  if (x.act === 'off' || x.v === 'off') return t('fl.heat.off');
  if (num(x.v) != null) return x.svc === 'set_value' ? String(x.v).replace('.', ',') : deg(x.v);
  return x.v == null ? '' : modeWord(x.v, t);
}

/** The journal as lines, newest first: [{ t, icon, text, sub, room, tone }]. A rule's decision gets the answer of Home Assistant to its
 *  call (✓ / ✗), a target of a rule for a thermostat with a sensor that moves it becomes a wish. ctx: t, deg, name(entity),
 *  roomName(key), now, sensorLog(entry) (roomsensors.sensorLog: { icon, text, sub }), room (only its lines) */
export function journalRows(trace, ctx) {
  const { t, deg } = ctx, list = trace || [], used = new Set(), out = [];
  const rn = (k) => (k ? ctx.roomName(k) : '');
  list.forEach((x, i) => {
    if (used.has(i)) return;
    let row = null;
    if (x.k === 'start') row = { icon: '▶', text: t('hd.e.start', { v: x.v || '' }).trim(), sub: '', rooms: [] };
    else if (x.k === 'link' && x.on) row = { icon: '🔗', text: t('hd.e.on'), sub: '', rooms: [] };
    else if (x.k === 'link') row = { icon: '⚠️', text: t('hd.e.off'), sub: [x.err || '', x.n > 1 ? t('hd.e.times', { n: x.n, at: clock(x.t2 || x.t, ctx.now) }) : ''].filter(Boolean).join(' · '), rooms: [], tone: 'warn' };
    else if (x.k === 'contact') {
      const state = contactState({ s: x.s }), where = x.rooms || [], first = where[0] || [], multi = where.length > 1;
      row = { icon: state === 'open' ? '🪟' : state === 'closed' ? '✅' : '❓', text: `${rn(first[0])}: ${ctx.name(x.ent)} ${t(`hd.s.${state}`)}`,
        sub: [t(`hd.use.${first[1] || 'window'}`), ...where.map((y) => `${multi ? `${rn(y[0])}: ` : ''}${y[2] ? t(`hd.not.${y[2]}`) : t('hd.counts')}`)].join(' · '),
        rooms: where.map((y) => y[0]), tone: state === 'open' && where.some((y) => !y[2]) ? 'open' : '' };
    } else if (x.k === 'climate') {
      const what = [x.mode ? t('hd.e.mode', { a: modeWord(x.mode[0], t), b: modeWord(x.mode[1], t) }) : '', x.temp ? t('hd.e.temp', { a: num(x.temp[0]) != null ? deg(x.temp[0]) : '–', b: num(x.temp[1]) != null ? deg(x.temp[1]) : '–' }) : '']
        .filter(Boolean).join(' · ');
      row = { icon: x.by === 'addon' ? '🤖' : x.by === 'device' ? '✋' : x.by === 'user' ? '👤' : '⚙️', text: `${rn(x.room)}: ${ctx.name(x.ent)} ${what}`, sub: byWords(x, t), rooms: [x.room], tone: x.by === 'addon' ? '' : 'other' };
    } else if (x.k === 'room') {
      row = { icon: '🏠', text: `${rn(x.room)}: ${roomWords(x, t, deg)}`, sub: x.first ? t('hd.e.first') : '', rooms: [x.room] };
    } else if (x.k === 'rule') {
      const j = list.findIndex((y, k) => k > i && !used.has(k) && y.k === 'call' && y.ent === x.ent && y.t - x.t <= 2 && y.src === 'heat'
        && (y.v === x.v || (x.act === 'off' && (y.v === 'off' || num(y.v) != null))));
      if (j >= 0) used.add(j);
      const subs = [x.again ? t('hd.again') : '', j >= 0 ? (list[j].ok ? `✓ ${t('hd.ok')}` : `✗ ${t('hd.fail')}`) : x.act === 'temp' ? t('hd.wish') : ''];
      row = { icon: '📋', text: `${rn(x.room)}: ${t(`hr.why.${x.why}`)} → ${ctx.name(x.ent)} ${valueWords(x, t, deg)}`, sub: subs.filter(Boolean).join(' · '),
        rooms: [x.room], tone: j >= 0 && !list[j].ok ? 'warn' : '' };
    } else if (x.k === 'call') {
      row = { icon: x.src === 'sensor' ? '🌡' : '📤', text: t('hd.e.call', { name: ctx.name(x.ent), v: valueWords(x, t, deg) }),
        sub: [x.src === 'sensor' ? t('rs.log.sub') : '', x.ok ? `✓ ${t('hd.ok')}` : `✗ ${t('hd.fail')}`].filter(Boolean).join(' · '), rooms: [ctx.roomOf?.(x.ent) || ''], tone: x.ok ? '' : 'warn' };
    } else if (x.k === 'sensor' && ctx.sensorLog) {
      const w = ctx.sensorLog(x);
      row = { icon: w.icon, text: w.text, sub: w.sub, rooms: [ctx.roomOf?.(x.ent) || ''] };
    }
    if (row) out.push({ t: x.t, tone: '', ...row });
  });
  return out.filter((r) => !ctx.room || r.rooms.includes(ctx.room) || !r.rooms.length).reverse();
}

/** contacts of windows and doors in the plan (floors of the house shown) that the add-on puts in no room (a garage door does not matter
 *  for the heating) */
export function loneContacts(floors, diag) {
  const known = new Set((diag?.rooms || []).flatMap((r) => [...r.windows, ...r.outer, ...(r.counted || []), ...r.inner]));
  const out = [];
  (floors || []).forEach((f) => [...(f.walls || []), ...(f.dormerWalls || [])].forEach((w) => (w.openings || []).forEach((o) => {
    if (o.type === 'door' && o.style === 'garage') return;
    [o.entity, ...(o.paneEntities || [])].filter(Boolean).forEach((e) => { if (!known.has(e) && !out.includes(e)) out.push(e); });
  })));
  return out;
}

/** the head of the view and the report: the connection and the settings that decide (lines) */
export function headLines(diag, rules, ctx) {
  const { t } = ctx, h = rules?.heat || {}, out = [];
  if (!diag?.ha) out.push(t('hd.noHa'));
  else if (diag.running) out.push(`🔗 ${t('hd.link.on', { at: diag.since ? clock(diag.since, ctx.now) : '–' })}`);
  else if (rules?.active) out.push(`⚠️ ${t('hd.link.off')}`);
  else out.push(t('hd.link.idle'));
  const yes = (v) => t(v ? 'hd.yes' : 'hd.no'), on = (v) => t(v ? 'hd.on' : 'hd.off');
  if (h.window) {
    out.push(`🪟 ${t('hd.cfg.window', { on: on(h.window.on), n: h.window.delay, doors: yes(h.window.doors !== false) })}`);
    if ((h.window.skip || []).length) out.push(`   ${t('hd.cfg.skip', { rooms: h.window.skip.map((k) => ctx.roomName(k)).join(', ') })}`);
  }
  if (h.schedule) out.push(`📅 ${t('hd.cfg.plan', { on: on(h.schedule.on), hand: h.schedule.hand ? t('fl.min', { n: h.schedule.hand }) : t('hr.plan.handNext') })}`);
  return out;
}

/** The whole as text to paste into a chat: the head, every room now (with the entity ids) and the journal, newest first (max lines of it,
 *  0: all). ctx: as roomViews and journalRows, plus version, lone (loneContacts) */
export function report(diag, rules, ctx, max = 150) {
  const { t } = ctx, lines = [[`🩺 ${t('hd.title')}`, `3D Floorplan ${ctx.version || ''}`.trim(), stamp(ctx.now)].join(' · ')];
  lines.push(...headLines(diag, rules, ctx));
  if ((diag?.loose || []).length) lines.push(`⚠️ ${t('hd.loose', { list: diag.loose.map((e) => `${ctx.name(e)} (${e})`).join(', ') })}`);
  if ((ctx.lone || []).length) lines.push(`⚠️ ${t('hd.lone', { list: ctx.lone.map((e) => `${ctx.name(e)} (${e})`).join(', ') })}`);
  roomViews(diag, rules, { ...ctx, house: null }).forEach((r) => {
    lines.push('', `== ${r.name} (${r.key}) ==`, `${t('hd.now')}: ${r.now.icon} ${r.now.text}`);
    r.climates.forEach((c) => {
      lines.push(`🌡️ ${c.name} (${c.e}): ${c.text}`);
      if (c.sensor) lines.push(`   ${c.sensor}`);
      if (c.last) lines.push(`   ${c.last}`);
    });
    r.contacts.forEach((c) => lines.push(`${c.use === 'window' ? '🪟' : '🚪'} ${c.name} (${c.e}): ${t(`hd.s.${c.state}`)} · ${contactSub(c, t)}`));
    if (!r.contacts.length) lines.push(t('hd.noContacts'));
  });
  const rows = journalRows(diag?.trace, { ...ctx, room: null });
  lines.push('', `== ${t('hd.log')} ==`);
  if (!rows.length) lines.push(t('hd.empty'));
  (max ? rows.slice(0, max) : rows).forEach((r) => lines.push(`${clock(r.t, ctx.now)} ${r.icon} ${r.text}${r.sub ? ` — ${r.sub}` : ''}`));
  return lines.join('\n');
}
