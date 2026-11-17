/* 📡 Funk-Karte (5.17.0, the owner's choice 2026-11-17, docs/ideen-5.15 picture 3): how well every device of the plan hears its sender,
 * from the signal entity of its device (renames.signal_of on the server: Zigbee2MQTT's linkquality, ZHA's rssi / lqi, the WiFi signal of
 * ESPHome, Shelly, Tasmota). What a value means (good, middle, weak) and the list of the plan are pure (unit test: tests/radiomap.test.mjs);
 * radioui.js draws them. */

/** what a signal state says: { v, unit ('dBm' | 'lqi' | '%'), q ('good' | 'mid' | 'bad'), text } or null (unknown, unavailable) */
export function signalOf(st, eid = '') {
  if (!st) return null;
  const v = Number.parseFloat(st.state);
  if (!Number.isFinite(v)) return null;
  const u = String(st.unit || '').toLowerCase();
  const unit = u === 'dbm' || u === 'db' ? 'dBm' : u === 'lqi' || /link_?quality|_lqi$/.test(eid) ? 'lqi' : u === '%' ? '%' : v < 0 ? 'dBm' : v > 100 ? 'lqi' : /_rssi$/.test(eid) ? 'dBm' : 'lqi';
  let q;
  if (unit === 'dBm') q = v >= -67 ? 'good' : v >= -80 ? 'mid' : 'bad';
  else if (unit === '%') q = v >= 60 ? 'good' : v >= 30 ? 'mid' : 'bad';
  else q = v >= 110 ? 'good' : v >= 50 ? 'mid' : 'bad';
  const n = Math.round(v);
  return { v, unit, q, text: unit === 'dBm' ? `${n} dBm` : unit === '%' ? `${n} %` : `LQI ${n}` };
}

/** the order of the qualities, worst first */
export const RANK = { bad: 0, mid: 1, good: 2 };

/** every device and window / door contact of the plan with a signal: [{ id, kind ('device' | 'opening'), floor, name, entity, sig, ...signalOf }],
 *  the weakest first. layout: the building shown; of: { entity: its signal entity }; openings(f): the openings of floor f with their walls */
export function radioRows(layout, states, of, openings = (f) => (f.walls || []).flatMap((w) => w.openings || [])) {
  const rows = [], seen = new Set();
  (layout?.floors || []).forEach((f, fi) => {
    const take = (id, kind, name, entity) => {
      const sig = of?.[entity];
      if (!sig || seen.has(`${id}`)) return;
      const s = signalOf(states?.[sig], sig);
      if (!s) return;
      seen.add(`${id}`);
      rows.push({ id, kind, floor: fi, floorName: f.name || '', name: name || entity, entity, sig, ...s });
    };
    (f.devices || []).forEach((d) => { if (d.entity) take(d.id, 'device', d.name, d.entity); });
    openings(f).forEach((o) => { if (o.entity) take(o.id, 'opening', o.name, o.entity); });
  });
  return rows.sort((a, b) => RANK[a.q] - RANK[b.q] || (a.unit === b.unit ? a.v - b.v : 0));
}

/** how many of each: { good, mid, bad } */
export function counts(rows) {
  const out = { good: 0, mid: 0, bad: 0 };
  rows.forEach((r) => { out[r.q] += 1; });
  return out;
}
