/* "⤵ Von oben übernehmen" of the meters of the page ⚡ Energie (#501, the owner: "einen Knopf …, dass es von oben, was ich eingestellt habe,
 * nach unten auch übernommen wird"): the power sensors the power editor reads (W) per kind of meter, and the meters after the counters
 * (kWh) the add-on found for them were taken (counters.py looks for them, server.py can make one). Pure (unit test:
 * tests/energycounters.test.mjs); energycountersui.js draws the button and what it found. */
import { cleanMeters } from './energyhistory.js';

export const COUNTER_KINDS = ['from', 'to', 'solar', 'batIn', 'batOut'];

/**
 * The power sensors per kind of meter from what the power editor reads (energycalc.js energySources): { kinds: { from: [ids], to, solar,
 * batIn, batOut } (only those with one), signed: [ids] } — a sensor that measures both ways (grid or battery as one sensor, plus and
 * minus) stands for both of its kinds; only a counter of its own device can be taken for it, no new one made.
 */
export function powerSources(src) {
  const k = { from: [], to: [], solar: [], batIn: [], batOut: [] }, signed = new Set();
  const add = (kind, e) => { if (typeof e === 'string' && e && !k[kind].includes(e)) k[kind].push(e); };
  const g = src?.grid || {}, b = src?.battery || {};
  if (g.split) { add('from', g.imp); add('to', g.exp); } else (g.net || []).forEach((e) => { add('from', e); add('to', e); signed.add(e); });
  (src?.solar?.entities || []).forEach((e) => add('solar', e));
  if (b.split) { add('batIn', b.charge); add('batOut', b.discharge); } else (b.power || []).forEach((p) => { add('batIn', p?.e); add('batOut', p?.e); signed.add(p?.e); });
  return { kinds: Object.fromEntries(Object.entries(k).filter(([, v]) => v.length)), signed: [...signed].filter(Boolean) };
}

/** the question to the add-on: kinds -> "from=sensor.a&solar=sensor.b,sensor.c" */
export const counterQuery = (kinds) => new URLSearchParams(Object.entries(kinds || {}).map(([k, v]) => [k, v.join(',')])).toString();

/**
 * The meters after the found counters were taken: meters (layout.energy.meters), found ({ kind: [{ power, counter }] }, api/energy/counters)
 * -> { meters (cleanMeters), added: [{ kind, id }], had: [{ kind, id }] } — a counter already there is left as it is.
 */
export function takeCounters(meters, found) {
  const m = cleanMeters(meters), added = [], had = [];
  COUNTER_KINDS.forEach((kind) => (found?.[kind] || []).forEach((x) => {
    const id = x?.counter?.entity_id;
    if (typeof id !== 'string' || !/^sensor\.[a-z0-9_]+$/.test(id)) return;
    if (m[kind].includes(id)) { had.push({ kind, id }); return; }
    m[kind] = [...m[kind], id];
    added.push({ kind, id });
  }));
  return { meters: m, added, had };
}
