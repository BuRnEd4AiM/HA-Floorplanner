/* Warnings and the wall-tablet night mode (no THREE dependency, shared with the tests).
 *
 * Warnings need no setup: smoke, gas, carbon monoxide and water sensors (binary_sensor with that device class) that
 * report "on", an alarm panel that is triggered (or about to), and a window that is open while the weather entity
 * reports rain. Idea from NeonPlan 3D (MIT), https://github.com/Mastershort/neonplan3d
 */

export const ALERT_CLASSES = { smoke: 'smoke', gas: 'gas', carbon_monoxide: 'co', moisture: 'water' };
export const RAIN_STATES = new Set(['rainy', 'pouring', 'lightning-rainy', 'hail', 'snowy-rainy']);
const OPEN = new Set(['on', 'open', 'opening']);

/**
 * entities: [{ entity_id, name, state, dc }] as the add-on reports them
 * windows:  [{ entity, name }] window contacts placed in the plan
 * weatherId: the weather entity to use, '' = the first one there is
 * Returns [{ kind: 'smoke'|'gas'|'co'|'water'|'alarm'|'rain', entity, name }]
 */
export function findAlerts(entities, windows = [], weatherId = '') {
  const out = [];
  for (const e of entities || []) {
    const dom = e.entity_id.split('.')[0];
    if (dom === 'binary_sensor' && ALERT_CLASSES[e.dc] && e.state === 'on') out.push({ kind: ALERT_CLASSES[e.dc], entity: e.entity_id, name: e.name || e.entity_id });
    else if (dom === 'alarm_control_panel' && (e.state === 'triggered' || e.state === 'pending')) out.push({ kind: 'alarm', entity: e.entity_id, name: e.name || e.entity_id });
  }
  const w = (entities || []).find((e) => (weatherId ? e.entity_id === weatherId : e.entity_id.startsWith('weather.')));
  if (w && RAIN_STATES.has(w.state)) {
    const st = new Map((entities || []).map((e) => [e.entity_id, e.state]));
    const seen = new Set();
    windows.forEach((win) => {
      if (!win.entity || seen.has(win.entity) || !OPEN.has(st.get(win.entity))) return;
      seen.add(win.entity);
      out.push({ kind: 'rain', entity: win.entity, name: win.name || win.entity });
    });
  }
  return out;
}

/** minutes after midnight of "HH:MM" */
const mins = (s) => { const [h, m] = String(s || '').split(':').map(Number); return (h || 0) * 60 + (m || 0); };

/**
 * Is it night for the dimming? mode 'sun': the sun is below the horizon; mode 'time': between from and to
 * (also across midnight, e.g. 22:00 - 06:00); 'off': never.
 */
export function nightActive(mode, from, to, date, sunState) {
  if (mode === 'sun') return sunState === 'below_horizon';
  if (mode !== 'time') return false;
  const now = date.getHours() * 60 + date.getMinutes(), a = mins(from), b = mins(to);
  if (a === b) return false;
  return a < b ? now >= a && now < b : now >= a || now < b;
}

/** search: rank how well a text matches the query (0 = no match), so "küch" finds "Küche" before "Küchenlicht" */
export function matchScore(text, query) {
  const t = String(text || '').toLowerCase(), q = String(query || '').trim().toLowerCase();
  if (!q || !t) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80 - Math.min(30, t.length - q.length);
  if (t.split(/[\s._\-·]+/).some((w) => w.startsWith(q))) return 50;
  if (t.includes(q)) return 30;
  return 0;
}
