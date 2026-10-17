/* Energy flow as a picture (#420): out of the power of the house now (energyBalance in energycalc.js) which circles there are (sun, grid,
 * house, battery) and how many watts run along each line between them, like the energy distribution card of Home Assistant; the texts in
 * the circles. Pure (unit test: tests/energyflow.test.mjs); energyflowui.js draws the card. */
import { fmtWatts } from './powerlogic.js';
import { IDLE } from './energycalc.js';

/** the lines of the picture in the order they are drawn: [from, to] */
export const FLOW_LINES = [['solar', 'home'], ['solar', 'battery'], ['solar', 'grid'], ['grid', 'home'], ['grid', 'battery'], ['battery', 'home'], ['battery', 'grid']];

/**
 * The flows of the house now. bal: energyBalance(...). { nodes: { grid, home, solar?, battery? } (solar only with production, battery only
 * with a battery), lines: [{ from, to, w (watts, whole), on (enough to show it running) }] }; null without production and grid.
 * The sun feeds the house first, then the battery, the rest goes into the grid; the grid covers what is still missing, the battery what
 * it gives.
 */
export function energyFlows(bal) {
  if (!bal || (bal.prod === null && bal.grid === null)) return null;
  const sun = bal.prod ?? 0, imp = bal.imp ?? 0, exp = bal.exp ?? 0;
  const bf = bal.battery?.flow ?? 0, charge = Math.max(0, bf), discharge = Math.max(0, -bf);   // flow: plus = charging
  const w = {};
  w['solar>grid'] = Math.min(exp, sun);
  w['solar>battery'] = Math.min(charge, sun - w['solar>grid']);
  w['solar>home'] = Math.max(0, sun - w['solar>grid'] - w['solar>battery']);
  w['grid>battery'] = Math.max(0, Math.min(imp, charge - w['solar>battery']));
  w['grid>home'] = Math.max(0, imp - w['grid>battery']);
  w['battery>grid'] = Math.max(0, Math.min(discharge, exp - w['solar>grid']));
  w['battery>home'] = Math.max(0, discharge - w['battery>grid']);
  const nodes = { grid: { w: bal.grid }, home: { w: bal.load } };
  if (bal.prod !== null) nodes.solar = { w: bal.prod };
  if (bal.battery) nodes.battery = { w: bal.battery.flow, level: bal.battery.v, dir: bal.battery.dir ?? null };
  const lines = FLOW_LINES.filter(([a, b]) => nodes[a] && nodes[b])
    .map(([from, to]) => { const v = Math.round(w[`${from}>${to}`]); return { from, to, w: v, on: v >= IDLE }; });
  return { nodes, lines };
}

/** how long a dot takes along its line: faster with more power (seconds, 0.5 to 3) */
export const dotSeconds = (watts) => +Math.max(0.5, Math.min(3, 2.4 / (1 + Math.max(0, watts) / 1500))).toFixed(2);

/** the texts of the circles: { solar, grid, home, battery: { value, sub } } (only the circles there are) */
export function flowTexts(fl, t) {
  const out = {}, n = fl.nodes;
  if (n.solar) out.solar = { value: fmtWatts(n.solar.w ?? 0), sub: t('flow.solar') };
  const g = n.grid.w;
  out.grid = { value: g === null ? '–' : fmtWatts(g), sub: t(g === null || Math.abs(g) < IDLE ? 'flow.grid' : g > 0 ? 'flow.fromGrid' : 'flow.toGrid') };
  out.home = { value: n.home.w === null ? '–' : fmtWatts(n.home.w), sub: t('flow.home') };
  if (n.battery) {
    const b = n.battery, dir = b.dir ?? (b.w == null ? null : Math.abs(b.w) < IDLE ? 0 : Math.sign(b.w));
    const amount = b.w == null ? '' : fmtWatts(b.w);
    out.battery = { value: b.level == null ? (amount || '–') : `${Math.round(b.level)} %`,
      sub: dir > 0 ? t('flow.charging', { w: amount }).trim() : dir < 0 ? t('flow.discharging', { w: amount }).trim()
        : dir === 0 ? t('flow.idle', { w: amount }) : t('flow.noPower') };   // idle (e.g. holding its reserve) / its power unknown: say which
  }
  return out;
}
