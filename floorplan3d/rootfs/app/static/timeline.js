/* Time travel (Zeitreise): playing back a recorded day. The add-on writes one file per day (timeline.py): a snapshot of all states,
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
