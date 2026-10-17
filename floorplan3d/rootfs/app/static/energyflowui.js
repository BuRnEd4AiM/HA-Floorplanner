/* Energy flow as a picture (#420): live mode on wide screens, at the top right under the sky chips, a card with the sun, the grid, the house
 * and the battery and dots running along the lines between them, instead of the line of numbers (#energyPill, which stays on phones and
 * in edit mode). A tap does what a tap on that line does: the power cables in the house on / off. Redrawn only when a value changed; the
 * dots are a CSS animation, standing still in the "fast" performance mode. What flows where comes from energyflow.js (tested). */
import { energyFlows, flowTexts, dotSeconds } from './energyflow.js';
import { energyBalance } from './energycalc.js';

const COL = { solar: '#ff9800', grid: '#488fc2', home: '#4caf50', battery: '#f06292' };
const ICON = { solar: '☀️', grid: '⚡', home: '🏠', battery: '🔋' };
const AT = { solar: [150, 44], grid: [50, 142], home: [250, 142], battery: [150, 240] };   // the circles in the picture (300 wide)
/* the lines, drawn from -> to: the dots run that way */
const PATH = {
  'solar>home': 'M172 66 Q250 74 250 108', 'solar>grid': 'M128 66 Q50 74 50 108', 'solar>battery': 'M150 78 L150 206',
  'grid>home': 'M84 142 L216 142', 'grid>battery': 'M50 176 Q50 240 116 240', 'battery>home': 'M184 240 Q250 240 250 176',
  'battery>grid': 'M116 240 Q50 240 50 176',
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** the picture as SVG markup */
export function flowSvg(fl, tx) {
  const n = fl.nodes, top = n.solar ? 0 : 96, bottom = n.battery ? 300 : 200;
  const lines = fl.lines.map((l) => {
    const d = PATH[`${l.from}>${l.to}`], c = COL[l.from === 'grid' || l.to === 'grid' ? 'grid' : l.from];
    const dots = l.on ? `<path class="ef-dots" d="${d}" stroke="${c}" style="animation-duration:${dotSeconds(l.w)}s"/>` : '';
    return `<path class="ef-line" d="${d}" stroke="${c}"/>${dots}`;
  }).join('');
  const circles = Object.keys(n).map((k) => {
    const [x, y] = AT[k], s = tx[k];
    return `<g class="ef-node ef-${k}"><circle cx="${x}" cy="${y}" r="34" stroke="${COL[k]}"/>`
      + `<text x="${x}" y="${y - 8}" class="ef-icon">${ICON[k]}</text><text x="${x}" y="${y + 13}" class="ef-val">${esc(s.value)}</text>`
      + (k === 'solar' ? `<text x="${x + 42}" y="${y + 4}" class="ef-sub ef-side">${esc(s.sub)}</text>`   // beside the sun: below it runs the line to the battery
        : `<text x="${x}" y="${y + 52}" class="ef-sub">${esc(s.sub)}</text>`) + '</g>';
  }).join('');
  return `<svg viewBox="0 ${top} 300 ${bottom - top}" width="300" height="${bottom - top}" role="img">${lines}${circles}</svg>`;
}

/** ctx: $, t, settings(), states(), layout(), isLive(), low() (fast performance mode), toggleCables() (what a tap on the line of numbers does), commitSettings() */
export function initEnergyFlow(ctx) {
  const { $, t } = ctx;
  const card = $('#energyCard');
  let last = '';
  card.addEventListener('click', () => ctx.toggleCables());
  $('#flowToggle').addEventListener('click', () => { $('#setEnergyCard').checked = ctx.settings().energyCard === false; ctx.commitSettings(); });
  function update() {
    const on = ctx.settings().energyCard !== false;
    $('#flowToggle').classList.toggle('active', on);
    const fl = on && ctx.isLive() ? energyFlows(energyBalance(ctx.states(), ctx.layout())) : null;
    document.body.classList.toggle('flowcard', !!fl);              // the line of numbers steps aside on wide screens (style.css)
    card.hidden = !fl;
    if (!fl) { last = ''; return; }
    const html = `<div class="ef-title">${esc(t('flow.title'))}</div>${flowSvg(fl, flowTexts(fl, t))}`;
    if (html !== last) { card.innerHTML = html; last = html; }
    card.classList.toggle('still', !!ctx.low());
    card.title = t('flow.tip');
  }
  return { update };
}
