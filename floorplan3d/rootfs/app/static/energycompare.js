/* "⚖ Vergleichen" on the page ⚡ Energie (#495, picture docs/ideen-4.9/2-strom-haeuser.jpg): every house side by side, each in its own
 * colour: a tile per house (used in the period, the power now) and the sum, one chart (today: a line per house through the hours; a week,
 * month or year: a bar per house and day / month), the power of each house now and what each cost. The numbers come from compareHouses in
 * energyhistory.js (tested); pageenergy.js asks Home Assistant and hands them here. Every card has a sig, so a new power reading only draws
 * the cards that show it (pageboard.js). */
import { compareMax, fmtAmount, elapsed } from './energyhistory.js';
import { energyBalance } from './energycalc.js';

/** ctx: t, lang(), states(), label(period, date, i) (the axis text of a bar), barName(period, date) (its name in the tooltip) */
export function initEnergyCompare(ctx) {
  const { t } = ctx;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const num = (v) => fmtAmount(v, ctx.lang() || 'de');
  const money = (v) => v.toLocaleString(ctx.lang() || 'de', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const watts = (w) => (Math.abs(w) >= 1000 ? `${(w / 1000).toLocaleString(ctx.lang() || 'de', { maximumFractionDigits: 1 })} kW` : `${Math.round(w)} W`);
  const swatch = (col) => { const i = make('i', 'peSwatch'); i.style.background = col; return i; };
  /** the power a house uses now (its own sensors, ⚡ Rechnung or the power devices of its plan), null when it has none */
  const loadOf = (layout) => (layout ? energyBalance(ctx.states(), layout).load : null);

  function tile(h, live) {
    const b = make('div', 'tpCard peTile pcTile'); b.dataset.house = h.id;
    const n = make('div', 'peTileName'); n.append(swatch(h.color), document.createTextNode(h.name));
    const v = make('div', 'peTileVal', h.empty ? '–' : num(h.total.use)); v.append(make('small', '', ' kWh'));
    b.append(n, v, make('div', 'peTileSub', h.empty ? t('pe.cmp.noMeters') : live != null ? t('pe.cmp.nowIs', { v: watts(live) }) : ''));
    return b;
  }
  function sumTile(list, lives) {
    const b = make('div', 'tpCard peTile pcTile');
    const use = list.filter((h) => !h.empty).reduce((s, h) => s + h.total.use, 0), live = lives.filter((w) => w != null);
    const v = make('div', 'peTileVal', num(use)); v.append(make('small', '', ' kWh'));
    b.append(make('div', 'peTileName', t('pe.cmp.sum')), v, make('div', 'peTileSub', live.length ? t('pe.cmp.nowIs', { v: watts(live.reduce((s, w) => s + w, 0)) }) : ''));
    return b;
  }
  /** today (a day): a line per house through the hours that began; else a bar per house in every group */
  function chart(p, list, now) {
    const W = 640, H = 220, pad = 34, top = 12, bottom = 22, cols = p.buckets.length, bw = (W - pad) / cols, max = compareMax(list);
    const y = (v) => H - bottom - (v / max) * (H - top - bottom);
    const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'peChart pcChart'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', t('pe.chartAria'));
    const add = (tag, attrs, text, to = svg) => { const n = document.createElementNS(ns, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); if (text != null) n.textContent = text; to.append(n); return n; };
    [0, max / 2, max].forEach((v) => { add('line', { x1: pad, x2: W, y1: y(v), y2: y(v), class: 'peGrid' }); add('text', { x: pad - 6, y: y(v) + 4, class: 'peAxis', 'text-anchor': 'end' }, num(v)); });
    const shown = list.filter((h) => !h.empty), live = now >= p.start && now < p.end, upto = live ? elapsed(p.buckets, now) : cols;
    if (p.kind === 'day') {
      const x = (i) => pad + (i + 0.5) * bw;
      shown.forEach((h, k) => {
        const pts = h.rows.slice(0, upto).map((r, i) => `${x(i).toFixed(1)},${y(r.use).toFixed(1)}`);
        if (!pts.length) return;
        if (k === 0 && pts.length > 1) add('path', { d: `M${pts.join(' L')} L${x(upto - 1).toFixed(1)},${H - bottom} L${x(0).toFixed(1)},${H - bottom} Z`, fill: h.color, 'fill-opacity': 0.12 });
        add('polyline', { points: pts.join(' '), fill: 'none', stroke: h.color, 'stroke-width': 2.5, 'stroke-linejoin': 'round', class: 'pcLine' }).dataset.house = h.id;
        const [lx, ly] = pts[pts.length - 1].split(',');
        add('circle', { cx: lx, cy: ly, r: 4, fill: h.color });
      });
    } else {
      const inner = bw * 0.78, w = shown.length ? inner / shown.length : inner;
      p.buckets.forEach((d, i) => {
        const g = add('g', {});
        add('title', {}, `${ctx.barName(p, d)}: ${shown.map((h) => `${h.name} ${num(h.rows[i].use)} kWh`).join(', ')}`, g);
        shown.forEach((h, k) => {
          const v = h.rows[i].use, x0 = pad + i * bw + (bw - inner) / 2 + k * w, hh = H - bottom - y(v);
          if (hh > 0.4) add('rect', { x: x0.toFixed(1), y: y(v).toFixed(1), width: Math.max(1, w - 1.5).toFixed(1), height: hh.toFixed(1), rx: Math.min(3, w / 3), fill: h.color }, null, g);
        });
      });
    }
    p.buckets.forEach((d, i) => { const lb = ctx.label(p, d, i); if (lb) add('text', { x: pad + (i + 0.5) * bw, y: H - 6, class: 'peAxis', 'text-anchor': 'middle' }, lb); });
    if (live && p.kind === 'day') {
      const xn = pad + (upto - 0.5) * bw;
      add('line', { x1: xn, x2: xn, y1: top - 4, y2: H - bottom, class: 'peNow' });
      add('text', { x: xn + 4, y: top + 6, class: 'peNowText' }, t('pe.now'));
    }
    return svg;
  }
  function legend(list) {
    const l = make('div', 'peLegend');
    list.filter((h) => !h.empty).forEach((h) => { const s = make('span'); s.append(swatch(h.color), document.createTextNode(h.name)); l.append(s); });
    l.append(make('span', 'tpSub', 'kWh'));
    return l;
  }
  function nowCard(list, lives) {
    const c = make('div', 'tpCard pcNow');
    c.append(make('h3', 'peH', t('pe.cmp.now')));
    const max = Math.max(1, ...lives.filter((w) => w != null));
    list.forEach((h, i) => {
      const r = make('div', 'pcRow'), bar = make('span', 'peTopBar'), fill = make('i');
      fill.style.width = `${lives[i] == null ? 0 : Math.round((lives[i] / max) * 100)}%`; fill.style.background = h.color; bar.append(fill);
      const n = make('span', 'pcName'); n.append(swatch(h.color), document.createTextNode(h.name));
      r.append(n, bar, make('b', '', lives[i] == null ? '–' : watts(lives[i])));
      c.append(r);
    });
    if (lives.every((w) => w == null)) c.append(make('p', 'tpSub', t('pe.cmp.nowNone')));
    return c;
  }
  function costCard(list) {
    const priced = list.filter((h) => h.cost && !h.empty);
    if (!priced.length) return null;
    const c = make('div', 'tpCard pcCost');
    c.append(make('h3', 'peH', t('pe.cost')));
    const max = Math.max(0.01, ...priced.map((h) => h.cost.net));
    priced.forEach((h) => {
      const r = make('div', 'pcRow'), bar = make('span', 'peTopBar'), fill = make('i');
      fill.style.width = `${Math.max(0, Math.round((h.cost.net / max) * 100))}%`; fill.style.background = h.color; bar.append(fill);
      const n = make('span', 'pcName'); n.append(swatch(h.color), document.createTextNode(h.name));
      r.append(n, bar, make('b', '', `${money(h.cost.net)} €`));
      c.append(r);
    });
    if (priced.length > 1) { const r = make('div', 'pcRow pcSum'); r.append(make('span', 'pcName', t('pe.cmp.sum')), make('span'), make('b', '', `${money(priced.reduce((s, h) => s + h.cost.net, 0))} €`)); c.append(r); }
    return c;
  }

  /**
   * The cards of the page in "Vergleichen" for board.fill: p (periodRange), list (compareHouses), layouts ({ house id: layout }) for the
   * power now, now (Date). [{ key, sig, make, width }]
   */
  function items(p, list, layouts, now) {
    const lives = list.map((h) => loadOf(layouts[h.id])), liveText = lives.map((w) => (w == null ? null : watts(w)));
    const base = [p.kind, +p.start, ctx.lang(), list.map((h) => [h.id, h.name, h.color, h.empty, Math.round(h.total.use * 1000)])];
    const tiles = { key: 'cmp:tiles', width: 4, sig: JSON.stringify([base, liveText]), make: () => {
      const row = make('div', 'peTiles'); list.forEach((h, i) => row.append(tile(h, lives[i]))); row.append(sumTile(list, lives)); return row;
    } };
    const chartCard = { key: 'cmp:chart', width: 3, sig: JSON.stringify([base, list.map((h) => h.rows.map((r) => Math.round(r.use * 1000))), p.kind === 'day' ? Math.floor(+now / 3600000) : 0]), make: () => {
      const c = make('div', 'tpCard peChartCard pcChartCard');
      c.append(make('h3', 'peH', t(p.kind === 'day' ? 'pe.cmp.chart.day' : 'pe.cmp.chart')), chart(p, list, now), legend(list));
      return c;
    } };
    const out = [tiles, chartCard, { key: 'cmp:now', width: 1, sig: JSON.stringify([base, liveText]), make: () => nowCard(list, lives) }];
    const costSig = JSON.stringify([base, list.map((h) => (h.cost ? Math.round(h.cost.net * 100) : null))]);
    if (list.some((h) => h.cost && !h.empty)) out.push({ key: 'cmp:cost', width: 2, sig: costSig, make: () => costCard(list) });
    return out;
  }
  return { items };
}
