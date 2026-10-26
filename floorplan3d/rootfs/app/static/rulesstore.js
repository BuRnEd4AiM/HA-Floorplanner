/* The add-on's own heating rules and routines on the page (#546): one copy of api/rules for every page that shows them (🌡 Klima, ▶
 * Abläufe, the room labels and tiles, "Wird benutzt"). The add-on pushes what the rules do now over the live channel ({type: "rules",
 * rooms, lanes}): it is taken at once, the log is fetched again a little later. Saving, 🚀 boost, "Trotzdem heizen", a routine's button
 * and "Jetzt ausprobieren" go through here too. */

/** ctx: changed() (a page shows the rules: draw it again) */
export function initRulesStore(ctx) {
  let data = null, loading = null, again = 0;
  async function load() {
    if (loading) return loading;
    loading = (async () => {
      try {
        const r = await fetch('api/rules');
        if (r.ok) { data = await r.json(); ctx.changed(); }
      } catch { /* no answer: the pages show what they had */ }
      loading = null;
      return data;
    })();
    return loading;
  }
  /** what the add-on pushed: the rooms and lanes now, the log a moment later */
  function pushed(d) {
    if (!data) { load(); return; }
    data = { ...data, status: { rooms: d.rooms || {}, lanes: d.lanes || {} }, now: Math.round(Date.now() / 1000) };
    ctx.changed();
    clearTimeout(again);
    again = setTimeout(load, 1500);
  }
  async function send(method, url, body) {
    try {
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      return r.ok ? await r.json().catch(() => ({})) : null;
    } catch { return null; }
  }
  /** the heating rules ({heat}) or the routines ({flows}) saved; true when the add-on took them */
  async function save(part) {
    const r = await send('PUT', 'api/rules', part);
    if (r) { data = r; ctx.changed(); }
    return !!r;
  }
  const later = () => { clearTimeout(again); again = setTimeout(load, 1200); };
  return {
    load, pushed, save,
    get: () => data,
    status: (key) => data?.status?.rooms?.[key] || null,
    lane: (key) => data?.status?.lanes?.[key] || null,
    room: async (key, act) => { const ok = !!(await send('POST', 'api/rules/room', { room: key, act })); later(); return ok; },
    run: async (flow, lane, test = false) => { const ok = !!(await send('POST', 'api/rules/run', { flow, lane, test })); later(); return ok; },
  };
}
