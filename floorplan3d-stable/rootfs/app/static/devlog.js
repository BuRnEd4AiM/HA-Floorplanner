/* 📜 Protokoll (the owner, 2026-10-28: "eine eigene Seite, wo alles quasi passiert … wo alle Geräte verbunden sind, wo man dann auch …
 * exportieren kann für eine Fehleranalyse … alle Geräte drin hat, die in den Plänen verwendet werden"; his choice from docs/ideen-4.40/:
 * picture 2 + 3, every device of the plans with who it was, a device's day on the side, export as text, .txt and .csv): what the page makes
 * of api/log (devlog.py): the filters, the rows, the numbers on top, a device's day, the report and the table. Pure (unit test:
 * tests/devlog.test.mjs); the page is pagelog.js. */

export const KINDS = ['all', 'light', 'openings', 'heating', 'covers', 'plugs', 'commands', 'errors'];
export const KIND_ICON = { all: '', light: '💡', openings: '🪟', heating: '🌡', covers: '🪟', plugs: '🔌', commands: '📤', errors: '⚠️' };
export const WHO = ['all', 'addon', 'auto', 'user', 'dev'];
const GONE = new Set(['unavailable', 'unknown']);
const OPENING_DC = new Set(['door', 'window', 'garage_door', 'opening']);
const PRESENCE_DC = new Set(['motion', 'occupancy', 'presence', 'moving']);
const ICON = { light: '💡', switch: '🔌', climate: '🌡️', water_heater: '🚿', cover: '🪟', binary_sensor: '📶', sensor: '📈', media_player: '📺', fan: '🌀',
  lock: '🔒', vacuum: '🧹', person: '👤', device_tracker: '📍', alarm_control_panel: '🛡', siren: '🚨', input_boolean: '🔘', valve: '🚰', humidifier: '💧' };
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const dom = (e) => String(e || '').split('.')[0];

/** "17:23:05" (ts in seconds) */
export function clock(ts) {
  const d = new Date(ts * 1000), p = (x) => String(x).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
/** "28.10.2026" */
export function dayText(ts) {
  const d = new Date(ts * 1000), p = (x) => String(x).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** the kind of a device for the filters: light, openings (a window's or door's contact), heating, covers, plugs, other. ctx.dc(e): its
 *  device class, ctx.openings: the contacts of the plan */
export function kindOf(e, ctx = {}) {
  const d = dom(e);
  if (d === 'light') return 'light';
  if (d === 'climate' || d === 'water_heater') return 'heating';
  if (d === 'cover') return 'covers';
  if (d === 'switch' || d === 'input_boolean') return 'plugs';
  if (d === 'binary_sensor' && (ctx.openings?.has?.(e) || OPENING_DC.has(ctx.dc?.(e)))) return 'openings';
  return 'other';
}
/** a fault: a command Home Assistant did not take, the connection lost, a device that stops reporting */
export const isError = (x) => (x.k === 'c' && !x.ok) || x.k === 'x' || (x.k === 's' && GONE.has(x.b?.state));
/** who an event is for the filter: addon, auto, user, dev (the device, Home Assistant itself, a gap), or '' (an error of the connection) */
export function whoKind(x) {
  if (x.k === 'c') return 'addon';
  if (x.k === 'x') return '';
  const k = x.w?.k;
  return k === 'addon' || k === 'auto' || k === 'user' ? k : 'dev';
}

/** the events that pass the filters (newest first): f = { kind, who, room, q }; ctx.name(e), ctx.roomOf(e), ctx.dc, ctx.openings */
export function filterEvents(events, f = {}, ctx = {}) {
  const q = String(f.q || '').trim().toLowerCase();
  const ents = (x) => (x.k === 'c' ? x.e || [] : x.e ? [x.e] : []);
  return [...(events || [])].reverse().filter((x) => {
    if (f.kind === 'commands' && x.k !== 'c') return false;
    if (f.kind === 'errors' && !isError(x)) return false;
    if (f.kind && !['all', 'commands', 'errors'].includes(f.kind) && !ents(x).some((e) => kindOf(e, ctx) === f.kind)) return false;
    if (f.who && f.who !== 'all' && whoKind(x) !== f.who) return false;
    if (f.room && !ents(x).some((e) => ctx.roomOf?.(e) === f.room)) return false;
    if (f.device && !ents(x).includes(f.device)) return false;
    if (q && !ents(x).some((e) => `${e} ${ctx.name?.(e) || ''} ${ctx.roomOf?.(e) || ''}`.toLowerCase().includes(q))
      && !`${x.n || ''} ${x.u || ''} ${x.w?.n || ''} ${x.err || ''}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

/** the numbers on top: { events (changes of devices), devices (that changed), commands, ok (taken), errors } */
export function tiles(events) {
  const list = events || [], s = list.filter((x) => x.k === 's'), c = list.filter((x) => x.k === 'c');
  return { events: s.length, devices: new Set(s.map((x) => x.e)).size, commands: c.length, ok: c.filter((x) => x.ok).length, errors: list.filter(isError).length };
}

/** a state in a word ("an", "offen", "heizen" …); dc: the device class (a window's contact on = offen) */
export function stateWord(e, state, t, dc) {
  if (state == null) return '–';
  const d = dom(e);
  if (d === 'binary_sensor' && (state === 'on' || state === 'off')) {
    if (OPENING_DC.has(dc)) return t(state === 'on' ? 'log.st.open' : 'log.st.closed');
    if (PRESENCE_DC.has(dc)) return t(state === 'on' ? 'log.st.detected' : 'log.st.clear');
  }
  if (d === 'climate' || d === 'water_heater') { const w = t(`fl.heat.${state}`); if (w !== `fl.heat.${state}`) return w; }
  const w = t(`log.st.${state}`);
  return w === `log.st.${state}` ? state : w;
}

/** what changed in words: "aus → an", "an 40 % → 80 %", "Soll 20° → 22°", "offen → zu" */
export function changeWords(x, t, deg, dc) {
  const a = x.a || {}, b = x.b || {};
  if (a.state === b.state && num(a.tt) != null && num(b.tt) != null && a.tt !== b.tt) return t('log.target', { a: deg(a.tt), b: deg(b.tt) });
  if (a.state === b.state && num(b.brightness) != null && a.brightness !== b.brightness) return `${stateWord(x.e, b.state, t, dc)} ${num(a.brightness) ?? 0} % → ${b.brightness} %`;
  if (a.state === b.state && num(b.position) != null && a.position !== b.position) return `${num(a.position) ?? '–'} % → ${b.position} %`;
  const to = stateWord(x.e, b.state, t, dc) + (num(b.brightness) != null && b.state === 'on' ? ` ${b.brightness} %` : '') + (num(b.tt) != null && b.tt !== a.tt ? ` · ${t('log.target1', { v: deg(b.tt) })}` : '');
  return x.a ? `${stateWord(x.e, a.state, t, dc)} → ${to}` : to;
}

/** a command in words: "an, 80 %", "runter", "Soll 21°", "aus" */
export function commandWords(x, t, deg) {
  const [d, s] = String(x.sv || '').split('.'), v = x.v || {};
  if (s === 'turn_on') return [t('fl.do.on'), num(v.brightness_pct) != null ? `${v.brightness_pct} %` : '', num(v.color_temp_kelvin) != null ? `${v.color_temp_kelvin} K` : ''].filter(Boolean).join(', ');
  if (s === 'turn_off') return t('fl.do.off');
  if (s === 'toggle') return t('fl.do.toggle');
  if (s === 'open_cover') return t('fl.cover.open');
  if (s === 'close_cover') return t('fl.cover.close');
  if (s === 'stop_cover') return t('log.stop');
  if (s === 'set_cover_position') return `${v.position ?? '–'} %`;
  if (s === 'set_temperature') return t('log.target1', { v: num(v.temperature) != null ? deg(v.temperature) : '–' });
  if (s === 'set_hvac_mode') return stateWord('climate.x', v.hvac_mode, t);
  if (s === 'set_value') return String(v.value ?? '–').replace('.', ',');
  if (s === 'select_option') return `„${v.option ?? ''}“`;
  if (d === 'scene' && s === 'apply') return t('log.sceneTry');
  if (d === 'scene' || d === 'script') return t('log.run');
  if (d === 'automation' && s === 'trigger') return t('log.run');
  if (s === 'lock' || s === 'unlock') return t(`log.st.${s}ed`);
  return s || x.sv || '';
}

/** who it was, as { k (a class for the colour: addon, auto, user, dev, err), text, sub } */
export function whoWords(x, t) {
  const src = (w) => {
    const n = w.n;
    if (w.src === 'heat') return `📋 ${n && t(`hr.why.${n}`) !== `hr.why.${n}` ? t(`hr.why.${n}`) : t('log.src.heat')}`;
    if (w.src === 'sensor') return `🌡 ${t('rs.log.sub').replace(/^🌡\s*/, '')}`;
    if (w.src === 'flow') return `▶ ${n ? `„${n}“` : t('log.src.flow')}`;
    if (w.src === 'scene') return `🎨 ${t('log.src.scene')}${n ? ` „${n}“` : ''}`;
    if (w.src === 'page') return `👆 ${n === 'wish' ? t('log.src.wish') : n || t('log.src.page')}`;
    if (w.src === 'garden') return `🌱 ${t('log.src.garden')}`;
    if (w.src === 'guard') return `🛡 ${t('log.src.guard')}`;
    return '';
  };
  if (x.k === 'x') return { k: 'err', text: `⚠️ ${t('log.who.err')}`, sub: x.err || '' };
  if (x.k === 'c') {
    const s = [src({ src: x.src, n: x.src === 'page' ? x.n || x.u : x.n }), x.src !== 'page' && x.u ? `${t('log.by')} ${x.u}` : ''].filter(Boolean).join(', ');
    return x.ok ? { k: 'addon', text: `🤖 ${t('log.who.addon')}`, sub: s } : { k: 'err', text: `⚠️ ${t('log.who.err')}`, sub: [s, x.err].filter(Boolean).join(': ') };
  }
  const w = x.w || { k: 'dev' };
  const ago = num(w.ago) != null ? (w.ago >= 90 ? t('log.agoMin', { n: Math.round(w.ago / 60) }) : t('log.ago', { n: w.ago })) : '';
  if (w.k === 'addon') return { k: 'addon', text: `🤖 ${t('log.who.addon')}`, sub: [src(w), ago].filter(Boolean).join(', ') };
  if (w.k === 'auto') return { k: 'auto', text: `⚙️ ${t('log.who.auto')}`, sub: w.n ? `„${w.n}“ ${t('log.inHa')}` : t('log.inHa') };
  if (w.k === 'user') return { k: 'user', text: `👤 ${w.n || t('log.who.user')}`, sub: t('log.inHa') };
  if (w.k === 'ha') return { k: 'dev', text: `🏠 ${t('log.who.ha')}`, sub: t('log.haSub') };
  if (w.k === 'off') return { k: 'err', text: `⚠️ ${t('log.who.off')}`, sub: t('log.offSub') };
  if (w.k === 'gap') return { k: 'dev', text: `❔ ${t('log.who.gap')}`, sub: t('log.gapSub') };
  if (['person', 'device_tracker'].includes(dom(x.e))) return { k: 'dev', text: `📍 ${t('log.who.place')}`, sub: t('log.placeSub') };
  if (['binary_sensor', 'sensor'].includes(dom(x.e))) return { k: 'dev', text: `📶 ${t('log.who.sensor')}`, sub: t('log.sensorSub') };
  return { k: 'dev', text: `✋ ${t('log.who.dev')}`, sub: t('log.devSub') };
}

/** one row of the table: { t, e (the device, the first one of a command), icon, dev, room, what, who: { k, text, sub }, err } */
export function rowOf(x, ctx) {
  const { t, deg } = ctx, name = (e) => ctx.name?.(e) || e;
  if (x.k === 'x') return { t: x.t, e: '', icon: '🔗', dev: t('log.link'), room: '', what: t('log.lost'), who: whoWords(x, t), err: true };
  if (x.k === 'c') {
    const ents = x.e || [], first = ents[0] || '';
    const dev = t('log.cmdTo', { name: ents.length > 1 ? `${name(first)} +${ents.length - 1}` : first ? name(first) : x.sv });
    return { t: x.t, e: first, icon: '📤', dev, room: first ? ctx.roomOf?.(first) || '' : '', what: `„${commandWords(x, t, deg)}“ ${x.ok ? `✓ ${t('log.taken')}` : `✗ ${t('log.notTaken')}`}`,
      who: whoWords(x, t), err: !x.ok };
  }
  const dc = ctx.openings?.has?.(x.e) ? 'window' : ctx.dc?.(x.e);            // a contact of the plan's windows and doors: open / shut
  return { t: x.t, e: x.e, icon: dc === 'window' ? '🪟' : ICON[dom(x.e)] || '•', dev: name(x.e), room: ctx.roomOf?.(x.e) || '', what: changeWords(x, t, deg, dc),
    who: whoWords(x, t), err: isError(x) };
}

/** is a state "on" for the bar of a device's day (on, open, heating, playing …) */
export const isOn = (s) => !!s && !['off', 'closed', 'idle', 'standby', 'paused', 'unavailable', 'unknown', 'not_home', 'locked', 'docked'].includes(s);

/** A device's day: { changes, addon (changes by the add-on), commands, ok, bar: [[from, to, on, gone]] (shares of the day 0…1, from the
 *  start of the day to now or its end) }. events: of that day (all of them); start, end: the day's midnights in seconds; now */
export function deviceDay(events, e, start, end, now) {
  const mine = (events || []).filter((x) => (x.k === 's' && x.e === e) || (x.k === 'c' && (x.e || []).includes(e)));
  const s = mine.filter((x) => x.k === 's'), c = mine.filter((x) => x.k === 'c');
  const stop = Math.min(end, now ?? end), span = Math.max(1, end - start), bar = [];
  let at = start, state = s[0]?.a?.state ?? null;
  s.forEach((x) => {
    if (x.t > at) bar.push([(at - start) / span, (Math.min(x.t, stop) - start) / span, isOn(state), GONE.has(state)]);
    at = Math.max(at, x.t); state = x.b?.state;
  });
  if (stop > at && state != null) bar.push([(at - start) / span, (stop - start) / span, isOn(state), GONE.has(state)]);
  return { changes: s.length, addon: s.filter((x) => x.w?.k === 'addon').length, commands: c.length, ok: c.filter((x) => x.ok).length,
    bar: bar.filter((b) => b[1] > b[0] && b[0] !== null) };
}

const csvCell = (v) => { const s = String(v ?? ''); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
/** the rows as a table for Excel (semicolons, with the entity ids) */
export function toCsv(events, ctx) {
  const { t } = ctx, head = [t('log.col.date'), t('log.col.time'), t('log.col.device'), t('log.col.entity'), t('log.col.room'), t('log.col.what'), t('log.col.who'), t('log.col.details')];
  const lines = [head.map(csvCell).join(';')];
  (events || []).forEach((x) => {
    const r = rowOf(x, ctx), ents = x.k === 'c' ? (x.e || []).join(' ') : x.e || '';
    lines.push([dayText(x.t), clock(x.t), r.dev, ents, r.room, r.what, r.who.text.replace(/^\S+\s/, ''), r.who.sub].map(csvCell).join(';'));
  });
  return `﻿${lines.join('\r\n')}\r\n`;
}

/** The report to paste into a chat or save: the head (version, when, which days, the filters, the numbers), then a line per event with
 *  the entity ids, newest first. meta: { version, now, from, to, filters (words), recording } */
export function report(events, ctx, meta = {}) {
  const { t } = ctx, n = tiles(events);
  const lines = [[`📜 ${t('tab.log')}`, `3D Floorplan ${meta.version || ''}`.trim(), `${dayText(meta.now)} ${clock(meta.now)}`].join(' · ')];
  if (meta.from) lines.push(`${t('log.rep.days')}: ${meta.from}${meta.to && meta.to !== meta.from ? ` – ${meta.to}` : ''}${meta.filters ? ` · ${meta.filters}` : ''}`);
  lines.push(t('log.rep.count', { n: n.events, d: n.devices, c: n.commands, ok: n.ok, err: n.errors }));
  if (meta.recording === false) lines.push(`⚠️ ${t('log.off')}`);
  lines.push('');
  if (!(events || []).length) lines.push(t('log.none'));
  let day = '';
  (events || []).forEach((x) => {
    const d = dayText(x.t);
    if (d !== day) { day = d; lines.push(`== ${d} ==`); }
    const r = rowOf(x, ctx), ents = x.k === 'c' ? (x.e || []).join(', ') : x.e || '';
    lines.push(`${clock(x.t)} ${r.icon} ${r.dev}${r.room ? ` (${r.room})` : ''}${ents ? ` [${ents}]` : ''}: ${r.what} — ${r.who.text}${r.who.sub ? `, ${r.who.sub}` : ''}`);
  });
  return lines.join('\n');
}
