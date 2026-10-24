/* The card "🔋 Ladestand" on the page ⚡ Energie (#515): the charge of every battery of the house (or of all houses) through the period
 * of the page, "Zusammen" (one chart, a line per battery) or "Einzeln" (a small chart each, with the band from the lowest to the highest
 * charge), a chip per battery to show it or leave it out, a finger or the mouse on the chart shows the values at that time. The choice
 * stays on this device (localStorage, the owner's wish: "jedes Gerät für sich"). The rules are in batterylevels.js (tested); pageenergy.js
 * asks api/energy/levels and hands the answer here. */
import { cleanPrefs, toggleBattery, shownBatteries, levelPoints, withLive, splitGaps, levelSummary, periodMs, PREFS_KEY } from './batterylevels.js';

/** ctx: t, lang(), states(), label(period, date, i) (the axis text of a bar of the page) */
export function initBatteryCard(ctx) {
  const { t } = ctx;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on) => { const b = make('button', cls, text); b.type = 'button'; b.addEventListener('click', (e) => { e.stopPropagation(); on(); }); return b; };
  const ns = 'http://www.w3.org/2000/svg';
  const pct = (v) => `${Math.round(v)} %`;
  let prefs = load();
  function load() { try { return cleanPrefs(JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')); } catch { return cleanPrefs({}); } }
  function store() { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* a private window: only for now */ } }
  /** the charge of a battery now (%), null when it is not known */
  const liveOf = (id) => { const v = parseFloat(ctx.states()?.[id]?.state); return Number.isFinite(v) ? v : null; };
  const fmt = (o) => new Intl.DateTimeFormat(ctx.lang() || 'de', o);
  /** the time under the finger, as fine as the period */
  function when(p, ms) {
    const d = new Date(ms), hm = { hour: '2-digit', minute: '2-digit' };
    if (p.kind === 'day') return fmt(hm).format(d);
    if (p.kind === 'week') return fmt({ weekday: 'short', ...hm }).format(d);
    if (p.kind === 'month') return fmt({ day: 'numeric', month: 'short', ...hm }).format(d);
    return fmt({ day: 'numeric', month: 'short' }).format(d);
  }
  /** a small line in the colour (and dashes) of a battery */
  function swatch(b) {
    const s = document.createElementNS(ns, 'svg'); s.setAttribute('viewBox', '0 0 18 8'); s.setAttribute('class', 'pbSwatch');
    const l = document.createElementNS(ns, 'line');
    Object.entries({ x1: 1, x2: 17, y1: 4, y2: 4, stroke: b.color, 'stroke-width': 3, 'stroke-linecap': 'round', ...(b.dash ? { 'stroke-dasharray': b.dash } : {}) }).forEach(([k, v]) => l.setAttribute(k, v));
    s.append(l);
    return s;
  }

  /** one chart: series [{ b, pts }], the band of the lowest and highest charge when `band` */
  function chart(p, series, now, { H = 200, band = false, period } = {}) {
    const W = 640, pad = 40, right = 8, top = 10, bottom = 22, a = +p.start, span = +p.end - a;
    const x = (ms) => pad + ((ms - a) / span) * (W - pad - right), y = (v) => H - bottom - (v / 100) * (H - top - bottom);
    const wrap = make('div', 'pbPlot'), svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'peChart pbChart'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', t('pe.bat.aria'));
    const add = (tag, attrs, text, to = svg) => { const n = document.createElementNS(ns, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); if (text != null) n.textContent = text; to.append(n); return n; };
    [0, 50, 100].forEach((v) => { add('line', { x1: pad, x2: W - right, y1: y(v), y2: y(v), class: 'peGrid' }); add('text', { x: pad - 6, y: y(v) + 4, class: 'peAxis', 'text-anchor': 'end' }, pct(v)); });
    p.buckets.forEach((d, i) => {
      const lb = ctx.label(p, d, i), next = +(p.buckets[i + 1] || p.end);
      if (lb) add('text', { x: x((+d + next) / 2), y: H - 6, class: 'peAxis', 'text-anchor': 'middle' }, lb);
    });
    const gap = Math.max(3 * periodMs(period), 45 * 60000), xy = (q, v) => `${x(q.t).toFixed(1)},${y(v).toFixed(1)}`;
    series.forEach(({ b, pts }) => splitGaps(pts, gap).forEach((seg) => {
      if (band && seg.some((q) => q.hi - q.lo > 0.5)) add('path', { d: `M${seg.map((q) => xy(q, q.hi)).join(' L')} L${[...seg].reverse().map((q) => xy(q, q.lo)).join(' L')} Z`, fill: b.color, 'fill-opacity': 0.16, class: 'pbBand' });
      if (seg.length === 1) add('circle', { cx: x(seg[0].t), cy: y(seg[0].v), r: 3, fill: b.color, class: 'pbLine pbDot' }).dataset.battery = b.id;   // one value only (just after midnight)
      else add('polyline', { points: seg.map((q) => xy(q, q.v)).join(' '), fill: 'none', stroke: b.color, 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round',
        ...(b.dash ? { 'stroke-dasharray': b.dash } : {}), class: 'pbLine' }).dataset.battery = b.id;
    }));
    if (+now >= a && +now < +p.end) {
      const xn = x(+now);
      add('line', { x1: xn, x2: xn, y1: top - 4, y2: H - bottom, class: 'peNow' });
      add('text', { x: Math.min(xn + 4, W - 30), y: top + 6, class: 'peNowText' }, t('pe.now'));
    }
    /* the values under the finger or the mouse */
    const cross = add('line', { x1: 0, x2: 0, y1: top, y2: H - bottom, class: 'pbCross' }), tip = make('div', 'pbTip');
    cross.style.display = 'none'; tip.hidden = true;
    const show = (e) => {
      const r = svg.getBoundingClientRect();
      if (!r.width) return;
      const vx = ((e.clientX - r.left) / r.width) * W, ms = a + ((vx - pad) / (W - pad - right)) * span;
      const rows = series.map(({ b, pts }) => {
        let best = null;
        pts.forEach((q) => { if (!best || Math.abs(q.t - ms) < Math.abs(best.t - ms)) best = q; });
        return best && Math.abs(best.t - ms) <= gap ? { b, q: best } : null;
      }).filter(Boolean);
      if (vx < pad || vx > W - right || !rows.length) { hide(); return; }
      cross.setAttribute('x1', vx); cross.setAttribute('x2', vx); cross.style.display = '';
      tip.replaceChildren(make('b', '', when(p, ms)));
      rows.forEach(({ b, q }) => { const r2 = make('div', 'pbTipRow'); r2.append(swatch(b), make('span', '', b.name), make('b', '', pct(q.v))); tip.append(r2); });
      tip.hidden = false;
      const left = (vx / W) * r.width, tw = tip.offsetWidth;          // beside the finger, never out of the card (a phone)
      tip.style.left = `${Math.round(Math.max(0, Math.min(r.width - tw, left > r.width / 2 ? left - tw - 10 : left + 10)))}px`;
    };
    const hide = () => { cross.style.display = 'none'; tip.hidden = true; };
    svg.addEventListener('pointermove', show); svg.addEventListener('pointerdown', show); svg.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hide(); });
    wrap.append(svg, tip);
    return wrap;
  }

  /** the card: p (periodRange), list (cardBatteries), data (the answer of api/energy/levels, null when it failed), period, now */
  function card(p, list, data, period, now) {
    const c = make('div', 'tpCard peChartCard pbCard'), body = make('div', 'pbBody');
    c.append(body);
    const draw = () => {
      prefs = load();
      const head = make('div', 'pbHead');
      head.append(make('h3', 'peH', `🔋 ${t('pe.bat.title')}`));
      if (list.length > 1) {
        const modes = make('div', 'peChips pbModes');
        [['together', t('pe.bat.together')], ['single', t('pe.bat.single')]].forEach(([m, txt]) => {
          const b = btn(`tpChip${prefs.mode === m ? ' on' : ''}`, txt, () => { prefs = { ...prefs, mode: m }; store(); draw(); });
          b.dataset.mode = m; modes.append(b);
        });
        head.append(modes);
      }
      const chips = make('div', 'pbChips');
      list.forEach((b) => {
        const off = prefs.hidden.includes(b.id), lv = liveOf(b.id);
        const ch = btn(`tpChip pbBat${off ? ' off' : ''}`, null, () => { prefs = toggleBattery(prefs, b.id); store(); draw(); });
        ch.dataset.battery = b.id; ch.title = t('pe.bat.toggle'); ch.setAttribute('aria-pressed', String(!off));
        ch.append(swatch(b), make('span', 'pbName', b.name));
        if (lv != null) ch.append(make('b', '', pct(lv)));
        chips.append(ch);
      });
      const out = [head, chips];
      const shown = shownBatteries(list, prefs);
      const series = shown.map((b) => ({ b, pts: withLive(levelPoints(data, b.id, p.start, p.end, period, now), liveOf(b.id), now, p.start, p.end) }));
      if (!data) out.push(make('p', 'tpSub pbNote', t('pe.bat.err')));
      else if (!shown.length) out.push(make('p', 'tpSub pbNote', t('pe.bat.none')));
      else if (!series.some((s) => s.pts.length)) out.push(make('p', 'tpSub pbNote', t('pe.bat.noData')));
      else if (prefs.mode === 'single' && list.length > 1) {
        series.forEach((s) => {
          const one = make('div', 'pbOne'), h = make('div', 'pbOneHead'), sum = levelSummary(s.pts);
          one.dataset.battery = s.b.id;
          h.append(swatch(s.b), make('b', 'pbName', s.b.name));
          if (sum) h.append(make('span', 'tpSub', t('pe.bat.range', { min: pct(sum.min), minAt: when(p, sum.minAt), max: pct(sum.max), maxAt: when(p, sum.maxAt) })));
          one.append(h, s.pts.length ? chart(p, [s], now, { H: 130, band: true, period }) : make('p', 'tpSub pbNote', t('pe.bat.noData')));
          out.push(one);
        });
      } else {
        out.push(chart(p, series, now, { band: series.length === 1, period }));
        if (series.length === 1) {
          const sum = levelSummary(series[0].pts);
          if (sum) out.push(make('p', 'tpSub pbRange', t('pe.bat.range', { min: pct(sum.min), minAt: when(p, sum.minAt), max: pct(sum.max), maxAt: when(p, sum.maxAt) })));
        }
      }
      if (list.length > 1) out.push(make('p', 'tpSub pbHint', t('pe.bat.hint')));
      body.replaceChildren(...out);
    };
    draw();
    return c;
  }

  /**
   * The card for board.fill (key 'battery'): p (periodRange), list (cardBatteries), data (api/energy/levels, with `at`: when it came),
   * period (levelPeriod), now. A new charge now draws it again (the chips show it), the same numbers keep it.
   */
  function item(p, list, data, period, now) {
    if (!list.length) return null;
    const live = list.map((b) => { const v = liveOf(b.id); return v == null ? null : Math.round(v); });
    const sig = JSON.stringify([p.kind, +p.start, ctx.lang(), period, list.map((b) => [b.id, b.name, b.color, b.dash]), data ? data.at || 1 : 0, live, Math.floor(+now / 300000)]);
    return { key: 'battery', width: 3, sig, make: () => card(p, list, data, period, now) };
  }
  return { item };
}
