/* Security (Sicherheit): playing back a recorded day. The add-on writes one file per day (timeline.py): a snapshot of all states,
 * then one line per change. This part is pure (no DOM, no three.js; unit test: tests/timeline.test.mjs): the states at any moment,
 * the list of events (what switched), jumping from event to event, the bars of the time line. timelineui.js shows it. */

/** playback speeds (times real time) */
export const SPEEDS = [1, 10, 60, 300, 900, 3600];

/** the lines of a day file -> { start, end, frames } sorted by time; a frame is { t, snap } or { t, id, s } */
export function parseDay(day) {
  const frames = (Array.isArray(day?.lines) ? day.lines : [])
    .filter((l) => l && typeof l.t === 'number' && ((l.snap && typeof l.snap === 'object') || (typeof l.e === 'string' && l.s && typeof l.s === 'object')))
    .map((l) => (l.snap ? { t: l.t, snap: l.snap } : { t: l.t, id: l.e, s: l.s }))
    .sort((a, b) => a.t - b.t);
  const start = typeof day?.start === 'number' ? day.start : frames[0]?.t ?? 0;
  let end = typeof day?.end === 'number' ? day.end : (frames.at(-1)?.t ?? start) + 1;
  if (typeof day?.now === 'number' && day.now > start && day.now < end) end = day.now;     // today: the line ends now
  return { start, end, frames };
}

/** a player that knows the states at any moment: seek(t) -> { states, idx } (states: entity_id -> recorded state).
 *  Going forward only applies what happened since the last seek; going back starts again from the nearest checkpoint. */
export function makePlayer(frames, every = 400) {
  const checks = [];                                       // { idx, states } before frame idx
  let states = {};
  frames.forEach((f, i) => {
    if (i % every === 0) checks.push({ idx: i, states: { ...states } });
    if (f.snap) states = { ...states, ...f.snap }; else states[f.id] = f.s;
  });
  let cur = { idx: 0, states: {} }, curT = -Infinity;
  function seek(t) {
    if (t < curT) {
      const c = [...checks].reverse().find((x) => x.idx === 0 || frames[x.idx - 1].t <= t) || { idx: 0, states: {} };
      cur = { idx: c.idx, states: { ...c.states } };
    } else cur = { idx: cur.idx, states: { ...cur.states } };
    while (cur.idx < frames.length && frames[cur.idx].t <= t) {
      const f = frames[cur.idx++];
      if (f.snap) Object.assign(cur.states, f.snap); else cur.states[f.id] = f.s;
    }
    curT = t;
    return { states: cur.states, idx: cur.idx };
  }
  return { seek };
}

/** what counts as a visible event: the state itself changed (on/off, open/closed, home/away, a sensor value), not only the brightness of a lamp
 *  that stays on. Returns [{ t, id, from, to, s }] in time order; the snapshots are not events (but tell the state before). */
export function eventList(frames) {
  const last = {}, out = [];
  frames.forEach((f) => {
    if (f.snap) { Object.entries(f.snap).forEach(([id, s]) => { last[id] = s?.state; }); return; }
    const to = f.s?.state, from = last[f.id];
    last[f.id] = to;
    if (to !== from && !/^sensor\./.test(f.id)) out.push({ t: f.t, id: f.id, from: from ?? null, to, s: f.s });
  });
  return out;
}

/** the event after / before the moment t (strictly), or null */
export const nextEvent = (events, t) => events.find((e) => e.t > t + 0.05) || null;
export const prevEvent = (events, t) => [...events].reverse().find((e) => e.t < t - 0.05) || null;

/** the events closest to t: the last `before` before it (or at it) and the next `after`, oldest first */
export function eventsAround(events, t, before = 4, after = 4) {
  const i = events.findIndex((e) => e.t > t);
  const k = i < 0 ? events.length : i;
  return events.slice(Math.max(0, k - before), k + after);
}

/** how many events fall into each of n equal slices of the day (for the little bars over the slider) */
export function buckets(events, start, end, n) {
  const out = new Array(Math.max(1, n)).fill(0), span = Math.max(1, end - start);
  events.forEach((e) => {
    const i = Math.floor(((e.t - start) / span) * out.length);
    if (i >= 0 && i < out.length) out[i]++;
  });
  return out;
}

/** the playback moves on by dt real seconds at a speed: the new moment, never past the end; done when it got there */
export function advance(t, dt, speed, end) {
  const n = t + dt * speed;
  return n >= end ? { t: end, done: true } : { t: n, done: false };
}

/** "on" for every kind of switch: a light, a door contact, a person at home ... (the things that make an event "switched on") */
const ON = new Set(['on', 'open', 'opening', 'home', 'unlocked', 'playing', 'heat', 'cool', 'heat_cool', 'auto', 'triggered', 'cleaning']);
export const isOnState = (s) => ON.has(s);

/** what kind of event: 'on' (switched on / opened / came home), 'off', or 'other' (unavailable, a new value) */
export function eventKind(e) {
  if (isOnState(e.to)) return 'on';
  if (e.to === 'off' || e.to === 'closed' || e.to === 'closing' || e.to === 'not_home' || e.to === 'locked' || e.to === 'idle' || e.to === 'paused' || e.to === 'standby' || e.to === 'docked') return 'off';
  return 'other';
}

/** the fields the recorder keeps (KEEP in timeline.py); the rest of an entity (name, effect list ...) comes from the live list */
export const RECORDED = ['state', 'unit', 'brightness', 'position', 'rgb', 'dc', 'ct', 'ch', 'hvac', 'tt', 'fxc', 'since'];

/** the add-on's entity list as it was at that moment: every recorded entity with its recorded fields (a field not recorded was empty),
 *  the others as they are now; recorded entities that no longer exist are added with their id as name */
export function replayEntities(live, rec) {
  const seen = new Set();
  const out = (Array.isArray(live) ? live : []).map((e) => {
    const s = rec[e.entity_id];
    if (!s) return e;
    seen.add(e.entity_id);
    const x = { ...e };
    RECORDED.forEach((k) => { x[k] = s[k] ?? null; });
    return x;
  });
  Object.entries(rec).forEach(([id, s]) => {
    if (seen.has(id)) return;
    const x = { entity_id: id, name: id, domain: id.split('.')[0] };
    RECORDED.forEach((k) => { x[k] = s[k] ?? null; });
    out.push(x);
  });
  return out;
}

/** "HH:MM:SS" of an epoch second in the browser's time */
export function clock(t, withSeconds = true) {
  const d = new Date(t * 1000), p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}${withSeconds ? `:${p(d.getSeconds())}` : ''}`;
}

/** the days offered in the picker: the add-on's list (newest first), each with whether it is today */
export function dayChoices(days, todayIso) {
  return (Array.isArray(days) ? days : []).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d?.day || '')).map((d) => ({ day: d.day, size: d.size || 0, today: d.day === todayIso }));
}

/** today as YYYY-MM-DD in the browser's time */
export function todayIso(now = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/* ---- Zoom of the time line: the slider shows a window of the day (24 h … 10 min), the events in it as icons ---- */

/** the window sizes offered (seconds) */
export const ZOOMS = [86400, 43200, 21600, 10800, 3600, 1800, 600];

/** "24 h", "3 h", "30 min" */
export const zoomLabel = (s) => (s >= 3600 ? `${s / 3600} h` : `${s / 60} min`);

/** the window that shows the moment t: the one before when t is still well inside it (so the slider does not jump while it is dragged),
 *  else a new one with t near the side it came from; always inside lo..hi (the day). win: { from, to } or null */
export function follow(win, t, span, lo, hi) {
  const range = Math.max(1, hi - lo);
  if (span >= range) return { from: lo, to: hi };
  const edge = span * 0.03;
  if (win && Math.abs(win.to - win.from - span) < 1e-6 && t >= win.from + edge && t <= win.to - edge) return win;
  let from = !win || t > win.to - edge ? t - span * 0.2 : t - span * 0.8;     // moving on: t near the left edge; going back: near the right
  if (win && t > win.from && t < win.to && Math.abs(win.to - win.from - span) >= 1e-6) from = t - span / 2;   // a new zoom: centred
  from = Math.min(Math.max(from, lo), hi - span);
  return { from, to: from + span };
}

/** the icon of an event: what kind of thing switched (a light, a door, a person …) */
export function eventIcon(e) {
  const dom = (e.id || '').split('.')[0], dc = e.s?.dc;
  if (dom === 'binary_sensor') {
    if (/door|garage/.test(dc || '')) return '🚪';
    if (dc === 'window' || dc === 'opening') return '🪟';
    if (/motion|occupancy|presence/.test(dc || '')) return '🏃';
    if (dc === 'smoke' || dc === 'heat') return '🔥';
    if (dc === 'gas' || dc === 'carbon_monoxide') return '⚠️';
    if (dc === 'moisture') return '💧';
    return '🔔';
  }
  if (dom === 'lock') return e.to === 'unlocked' ? '🔓' : '🔒';
  return { light: '💡', switch: '🔌', cover: '↕️', person: '👤', device_tracker: '👤', climate: '🌡️', fan: '🌀', media_player: '📺', input_boolean: '🔘',
    alarm_control_panel: '🚨', siren: '🚨', vacuum: '🧹', humidifier: '💦', water_heater: '♨️', valve: '🚰' }[dom] || '•';
}

/** the icons on the time line: events in the window; an event closer than one icon width (span / n) to the icon before joins it (with a count),
 *  so icons never overlap. Returns [{ t (first event), pct (0..100 from the left), icon (the most common), count, kind ('on' | 'off' | 'other'
 *  of the first), events }] */
export function markers(events, from, to, n) {
  const span = Math.max(1e-6, to - from), gap = span / Math.max(1, n), out = [];
  events.forEach((e) => {
    if (e.t < from || e.t > to) return;
    const g = out.at(-1);
    if (g && e.t - g.t < gap) g.events.push(e); else out.push({ t: e.t, events: [e] });
  });
  return out.map(({ t, events: list }) => {
    const n2 = {}; list.forEach((e) => { const i = eventIcon(e); n2[i] = (n2[i] || 0) + 1; });
    const icon = Object.keys(n2).sort((a, b) => n2[b] - n2[a])[0];
    return { t, pct: ((t - from) / span) * 100, icon, count: list.length, kind: eventKind(list[0]), events: list };
  });
}

/** the steps the labels under the time line may use (seconds): round clock times */
const TICK_STEPS = [60, 120, 300, 600, 900, 1800, 3600, 7200, 10800, 21600];

/** the labels under the time line: round clock times (every 1, 2, 5 … minutes or hours, counted from midnight `origin`), about `n` of them */
export function tickTimes(from, to, origin = 0, n = 6) {
  const step = TICK_STEPS.find((x) => x >= (to - from) / n) || TICK_STEPS.at(-1), out = [];
  for (let x = origin + Math.ceil((from - origin) / step) * step; x <= to + 1e-6; x += step) out.push(x);
  return out;
}
