/* Live channel (step 22 of the split, #137): the add-on pushes every state change the moment Home Assistant reports it (a wall switch, an
 * automation, a sensor). While it is up, the full list is only fetched once a minute to stay in step; while it is down (Home Assistant
 * restarting, no websocket through a proxy) the view polls every 4 seconds as before. Merging a pushed change and the fingerprint of a full
 * list are pure (unit test: tests/livechannel.test.mjs); initLiveChannel keeps the socket and the timers. */

export const POLL_MS = 4000, FULL_MS = 60000;

/** a pushed change { list, removed } merged into the entity list and the states, in place (they can be long and changes come often): the
 *  entity order kept, new ones at the end; returns { entities, states } (a new entity list only when some were removed) */
export function mergeLive(entities, states, { list = [], removed = [] }, toState) {
  list.forEach((e) => {
    states[e.entity_id] = toState(e);
    const i = entities.findIndex((x) => x.entity_id === e.entity_id);
    if (i >= 0) entities[i] = e; else entities.push(e);
  });
  removed.forEach((id) => { delete states[id]; });
  return { entities: removed.length ? entities.filter((x) => !removed.includes(x.entity_id)) : entities, states };
}

/** what of a full list decides whether the picture must be drawn again */
export const stateSig = (list) => JSON.stringify(list.map((e) => [e.entity_id, e.state, e.brightness, e.rgb, e.fxc, e.position]));

/** a poll is due: the channel is down, or the last full list is older than FULL_MS */
export const pollDue = (liveOk, lastFull, now) => !liveOk || now - lastFull > FULL_MS;

/** Home Assistant's areas ([{ id, name, entities }]) and the area of every entity: { areas, areaOf (entity_id -> area id) }; junk -> none */
export function areaIndex(list) {
  const areas = Array.isArray(list) ? list : [], areaOf = {};
  areas.forEach((x) => (x.entities || []).forEach((e) => { areaOf[e] = x.id; }));
  return { areas, areaOf };
}
/** the areas from the add-on (api/areas); none while it cannot be reached */
export async function fetchAreas() {
  try {
    const r = await fetch('api/areas');
    return areaIndex(r.ok ? await r.json() : []);
  } catch { return areaIndex([]); }
}

/** ctx: entities(), setEntities(list), states(), setStates(obj), toState(e), wake(), redraw() (states, room entities, entity panel),
 *  firstLoad() (async: areas, entity list, properties), paused() (security view: the recorded states are shown, live ones wait) */
export function initLiveChannel(ctx) {
  let liveOk = false, retry = 1000, lastFull = 0, raf = 0, sig = '';
  function connect() {
    if (window.__fpNoLive) return;                         // the single-file demo has no server to talk to
    let ws;
    try { const u = new URL('api/live', location.href); u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:'; ws = new WebSocket(u); } catch { return; }
    ws.onopen = () => { retry = 1000; };
    ws.onmessage = (m) => {
      let d;
      try { d = JSON.parse(m.data); } catch { return; }
      if (d.type === 'upstream') { const was = liveOk; liveOk = !!d.ok; if (liveOk && !was) poll(); }   // catch up on what changed before the channel was up
      else if (d.type === 'states') apply(d);
    };
    ws.onclose = () => { liveOk = false; setTimeout(connect, retry); retry = Math.min(30000, retry * 2); };
  }
  function apply(d) {
    if (!ctx.entities().length || ctx.paused?.()) return;   // the first full list is still on its way and brings these too; security view shows the past
    const m = mergeLive(ctx.entities(), ctx.states(), d, ctx.toState);
    ctx.setEntities(m.entities); ctx.setStates(m.states);
    ctx.wake();
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; ctx.redraw(); });
  }
  async function poll() {
    if (ctx.paused?.() && ctx.entities().length) return;
    try {
      const r = await fetch('api/entities');
      if (!r.ok) return;
      const list = await r.json();
      if (!Array.isArray(list)) return;
      const first = !ctx.entities().length, s = stateSig(list);
      if (s !== sig) { sig = s; ctx.wake(); }
      ctx.setEntities(list.sort((a, b) => a.name.localeCompare(b.name)));
      ctx.setStates(Object.fromEntries(list.map((e) => [e.entity_id, ctx.toState(e)])));
      lastFull = Date.now();
      if (first) await ctx.firstLoad();
      ctx.redraw();
    } catch { /* offline: ignore */ }
  }
  /** first full list, the channel, and the poll timer */
  function start() {
    poll();
    connect();
    setInterval(() => { if (pollDue(liveOk, lastFull, Date.now())) poll(); }, POLL_MS);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });   // a tablet or phone waking up: at once, not after the next timer (#323)
  }
  return { start, poll, ok: () => liveOk };
}
