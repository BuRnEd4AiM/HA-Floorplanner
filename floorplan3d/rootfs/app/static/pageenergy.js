/* The page ⚡ Energie of the tab bar (#481): today, a week, a month or a year of a house (or all houses together) from Home Assistant's
 * long-term statistics: used, from the sun, from the grid, fed in, made itself, what it cost, a bar per hour / day / month (made itself
 * and from the grid), the devices that used most, gas and water. The rules are in energyhistory.js (tested); this file asks the add-on
 * (api/energy/meters, api/energy/stats, api/layout of the other houses) and draws. */
import { KINDS, periodRange, isoLocal, houseMeters, mergeMeters, meterIds, hasMeters, bars, totals, cost, priceOf, topDevices, elapsed,
  fmtAmount, barMax, cleanMeters } from './energyhistory.js';

const OWN = '#cc7a00', GRID = '#488fc2';           // made itself (sun, battery) / from the grid: the colours of "Strom jetzt", checked for colour blindness
const ALL = '*';

/** ctx: t, el (the page), lang(), layout() (the house shown), houseId(), houses() ([{ id, name }]), changed() (the tab bar again: the page
 *  can have something now or not), board (pageboard.js, #484: keys tiles, chart, top, more) */
export function initEnergyPage(ctx) {
  const { t, el } = ctx;
  let ha = null, haErr = false, asking = null, askedAt = 0;   // Home Assistant's energy dashboard: { meters, devices, price }
  let kind = 'day', offset = 0, house = null, drawn = '', run = 0, forced = false;   // forced: a forced drawing overtaken by a newer one stays forced
  const layouts = new Map();                       // other houses: id -> layout (for their meters)
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on) => { const b = make('button', cls, text); b.type = 'button'; b.addEventListener('click', on); return b; };
  const lang = () => ctx.lang() || 'de';
  const num = (v) => fmtAmount(v, lang());

  /** Home Assistant's meters (once; again after a failure when the page opens) */
  function probe(force = false) {
    if (asking || (ha && !force)) return asking;
    askedAt = Date.now();
    asking = fetch('api/energy/meters').then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((x) => { ha = { meters: cleanMeters(x.meters), devices: Array.isArray(x.devices) ? x.devices : [], price: x.price || {} }; haErr = false; })
      .catch(() => { ha = { meters: cleanMeters({}), devices: [], price: {} }; haErr = true; })
      .finally(() => { asking = null; ctx.changed(); });
    return asking;
  }
  const houseLayout = (id) => (id === ctx.houseId() ? ctx.layout() : layouts.get(id));
  async function loadHouse(id) {
    if (houseLayout(id)) return houseLayout(id);
    try { const r = await fetch(`api/layout?house=${encodeURIComponent(id)}`); if (r.ok) layouts.set(id, await r.json()); } catch { /* left out */ }
    return houseLayout(id);
  }
  /** the meters, devices and price of what is chosen: one house or all of them */
  async function chosen() {
    const houses = ctx.houses();
    if (house === ALL && houses.length > 1) {
      const lays = await Promise.all(houses.map((h) => loadHouse(h.id)));
      const ms = lays.filter(Boolean).map((l) => houseMeters(l.energy, ha.meters));
      return { meters: mergeMeters(ms.map((m) => m.meters)), own: ms.every((m) => m.own), devices: ms.some((m) => !m.own) ? ha.devices : [],
        price: priceOf(lays.find(Boolean)?.energy, ha.price) };
    }
    const lay = (await loadHouse(house || ctx.houseId())) || ctx.layout(), hm = houseMeters(lay.energy, ha.meters);
    return { ...hm, devices: hm.own ? [] : ha.devices, price: priceOf(lay.energy, ha.price) };
  }

  /* ---- drawing ---- */
  function title(p) {
    const f = (o) => new Intl.DateTimeFormat(lang(), o);
    if (p.kind === 'day') return offset === 0 ? t('pe.today') : offset === -1 ? t('pe.yesterday') : f({ weekday: 'short', day: 'numeric', month: 'short' }).format(p.start);
    if (p.kind === 'week') { const last = new Date(+p.end - 1); return `${f({ day: 'numeric', month: 'short' }).format(p.start)} – ${f({ day: 'numeric', month: 'short', year: 'numeric' }).format(last)}`; }
    if (p.kind === 'month') return f({ month: 'long', year: 'numeric' }).format(p.start);
    return String(p.start.getFullYear());
  }
  function label(p, d, i) {
    if (p.kind === 'day') return i % 6 === 0 ? String(d.getHours()) : '';
    if (p.kind === 'week') return new Intl.DateTimeFormat(lang(), { weekday: 'short' }).format(d);
    if (p.kind === 'month') return [1, 8, 15, 22, 29].includes(d.getDate()) ? String(d.getDate()) : '';
    return new Intl.DateTimeFormat(lang(), { month: 'narrow' }).format(d);
  }
  function tile(name, value, unit, sub, color) {
    const b = make('div', 'tpCard peTile');
    const h = make('div', 'peTileName');
    if (color) { const i = make('i', 'peSwatch'); i.style.background = color; h.append(i); }
    h.append(document.createTextNode(name));
    const v = make('div', 'peTileVal', value); v.append(make('small', '', ` ${unit}`));
    b.append(h, v);
    if (sub) b.append(make('div', 'peTileSub', sub));
    return b;
  }
  /** the bars: made itself at the bottom, from the grid on top, a 2 px gap between them; the name of each bar and its values as a tooltip */
  function chart(p, rows, now) {
    const W = 640, H = 220, pad = 34, top = 12, bottom = 22, bw = (W - pad) / rows.length, max = barMax(rows);
    const y = (v) => H - bottom - (v / max) * (H - top - bottom);
    const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'peChart'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', t('pe.chartAria'));
    const add = (tag, attrs, text) => { const n = document.createElementNS(ns, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); if (text != null) n.textContent = text; svg.append(n); return n; };
    [0, max / 2, max].forEach((v) => {
      add('line', { x1: pad, x2: W, y1: y(v), y2: y(v), class: 'peGrid' });
      add('text', { x: pad - 6, y: y(v) + 4, class: 'peAxis', 'text-anchor': 'end' }, num(v));
    });
    rows.forEach((r, i) => {
      const x = pad + i * bw + Math.min(3, bw * 0.15), w = Math.max(1, bw - 2 * Math.min(3, bw * 0.15)), g = document.createElementNS(ns, 'g');
      const grid = Math.max(0, r.use - r.own), base = H - bottom;
      const tip = document.createElementNS(ns, 'title');
      tip.textContent = `${barName(p, p.buckets[i])}: ${num(r.use)} kWh (${t('pe.own')} ${num(r.own)}, ${t('pe.grid')} ${num(grid)})`;
      g.append(tip);
      const rect = (y0, y1, fill, round) => {
        const h = y0 - y1;
        if (h <= 0.4) return;
        const n = document.createElementNS(ns, 'path'), rr = round ? Math.min(4, w / 2, h) : 0;
        n.setAttribute('d', `M${x} ${y0} V${y1 + rr} q0 -${rr} ${rr} -${rr} h${w - 2 * rr} q${rr} 0 ${rr} ${rr} V${y0} Z`);
        n.setAttribute('fill', fill); g.append(n);
      };
      const yOwn = y(r.own);
      rect(base, yOwn, OWN, grid <= 0.0005);
      if (grid > 0.0005) rect(yOwn - (r.own > 0.0005 ? 2 : 0), y(r.own + grid) , GRID, true);
      if (!r.use) add('rect', { x, y: base - 2, width: w, height: 2, class: 'peEmpty' });
      svg.append(g);
      const lb = label(p, p.buckets[i], i);
      if (lb) add('text', { x: x + w / 2, y: H - 6, class: 'peAxis', 'text-anchor': 'middle' }, lb);
    });
    if (offset === 0 && now >= p.start && now < p.end) {
      const n = elapsed(p.buckets, now), x = pad + (n - 0.5) * bw;
      add('line', { x1: x, x2: x, y1: top - 4, y2: H - bottom, class: 'peNow' });
      add('text', { x: x + 4, y: top + 6, class: 'peNowText' }, t('pe.now'));
    }
    return svg;
  }
  const barName = (p, d) => (p.kind === 'day' ? `${d.getHours()}:00` : p.kind === 'year' ? new Intl.DateTimeFormat(lang(), { month: 'long' }).format(d)
    : new Intl.DateTimeFormat(lang(), { weekday: 'short', day: 'numeric', month: 'short' }).format(d));

  function head() {
    const h = make('div', 'tpHead');
    h.append(make('h2', '', `⚡ ${t('tab.energy')}`));
    const houses = ctx.houses();
    if (houses.length > 1) {
      const row = make('div', 'peChips');
      [...houses.map((x) => [x.id, x.name]), [ALL, t('pe.allHouses')]].forEach(([id, name]) => {
        const b = btn(`tpChip${(house || ctx.houseId()) === id ? ' on' : ''}`, name, () => { house = id; render(true); });
        b.dataset.house = id; row.append(b);
      });
      h.append(row);
    }
    const kinds = make('div', 'peChips peKinds');
    KINDS.forEach((k) => { const b = btn(`tpChip${kind === k ? ' on' : ''}`, t(`pe.kind.${k}`), () => { kind = k; offset = 0; render(true); }); b.dataset.kind = k; kinds.append(b); });
    h.append(kinds);
    return h;
  }
  function nav(p, note) {
    const row = make('div', 'peNav');
    const back = btn('tpChip', '‹', () => { offset--; render(true); }); back.title = t('pe.back'); back.dataset.nav = 'back';
    const fwd = btn('tpChip', '›', () => { offset = Math.min(0, offset + 1); render(true); }); fwd.title = t('pe.forward'); fwd.dataset.nav = 'fwd'; fwd.disabled = offset >= 0;
    row.append(back, make('b', 'pePeriod', title(p)), fwd);
    if (note) row.append(make('small', 'tpSub', note));
    return row;
  }
  function empty(text) {
    el.replaceChildren(head(), make('div', 'tpCard peEmptyCard', text));
  }

  async function render(force = false) {
    const me = ++run;
    if (force) forced = true;
    if (!ha || (haErr && force)) await probe(true);
    if (me !== run) return;
    const c = await chosen();
    if (me !== run) return;
    if (!hasMeters(c.meters)) { drawn = ''; empty(haErr ? t('pe.noHa') : t('pe.noMeters')); return; }
    const now = new Date(), p = periodRange(kind, offset, now), prev = periodRange(kind, offset - 1, now);
    const ids = meterIds(c.meters, c.devices);
    const sig = `${house}|${kind}|${offset}|${ids.join()}|${Math.floor(+now / 300000)}`;      // again at most every 5 minutes
    if (!forced && sig === drawn) return;
    let data;
    try {
      const r = await fetch('api/energy/stats', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, start: isoLocal(prev.start), end: isoLocal(p.end), period: p.period }) });
      if (!r.ok) throw new Error(String(r.status));
      data = await r.json();
    } catch { if (me === run) empty(t('pe.noHa')); return; }
    if (me !== run) return;
    drawn = sig; forced = false;
    const stats = data.stats || {}, units = data.units || {};
    const rows = bars(stats, c.meters, p.buckets, p.end), prevRows = bars(stats, c.meters, prev.buckets, prev.end);
    const cur = totals(rows), n = offset === 0 ? elapsed(p.buckets, now) : prevRows.length, before = totals(prevRows, n);
    const money = cost(cur, c.price);
    const out = [head(), nav(p, c.own ? t('pe.ownMeters') : t('pe.haMeters'))], items = [];
    const tiles = make('div', 'peTiles');
    const prevText = (v) => t(`${offset === 0 ? 'pe.prev' : 'pe.prevFull'}.${p.kind}`, { v: num(v) });   // the period before: so far, or whole
    tiles.append(tile(t('pe.used'), num(cur.use), 'kWh', prevText(before.use)));
    const m = c.meters;
    if (m.solar.length) tiles.append(tile(t('pe.solar'), num(cur.solar), 'kWh', m.to.length ? t('pe.solarOut', { v: num(cur.to) }) : '', OWN));
    if (m.from.length) tiles.append(tile(t('pe.fromGrid'), num(cur.from), 'kWh', m.to.length ? t('pe.fedIn', { v: num(cur.to) }) : '', GRID));
    if (cur.autarky != null && (m.solar.length || m.batOut.length)) tiles.append(tile(t('pe.autarky'), String(cur.autarky), '%', t('pe.autarkySub')));
    if (money) tiles.append(tile(t('pe.cost'), money.net.toLocaleString(lang(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }), '€',
      money.sell ? t('pe.costSub', { v: money.sell.toLocaleString(lang(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }) : ''));
    items.push({ key: 'tiles', el: tiles, width: 4 });
    const card = make('div', 'tpCard peChartCard');
    card.append(make('h3', 'peH', t(`pe.chart.${p.kind}`)), chart(p, rows, now));
    const legend = make('div', 'peLegend');
    [[OWN, t('pe.legendOwn')], [GRID, t('pe.legendGrid')]].forEach(([col, txt]) => { const s = make('span'); const i = make('i', 'peSwatch'); i.style.background = col; s.append(i, document.createTextNode(txt)); legend.append(s); });
    legend.append(make('span', 'tpSub', 'kWh'));
    card.append(legend);
    items.push({ key: 'chart', el: card, width: 3 });
    const top = topDevices(stats, c.devices, p.start, p.end);
    if (top.length) {
      const box = make('div', 'tpCard peTop');
      box.append(make('h3', 'peH', t('pe.top')));
      const max = top[0].kwh;
      top.forEach((d) => {
        const r = make('div', 'peTopRow');
        const bar = make('span', 'peTopBar'); const fill = make('i'); fill.style.width = `${Math.round((d.kwh / max) * 100)}%`; bar.append(fill);
        r.append(make('span', 'peTopName', d.name || d.id), bar, make('b', '', `${num(d.kwh)} kWh`));
        box.append(r);
      });
      items.push({ key: 'top', el: box, width: 1 });
    }
    const more = make('div', 'peTiles');
    [['gas', '🔥'], ['water', '💧']].forEach(([k, icon]) => {
      if (!m[k].length) return;
      const unit = units[m[k][0]] || (k === 'water' ? 'm³' : 'kWh');
      more.append(tile(`${icon} ${t(`pe.${k}`)}`, num(cur[k]), unit, prevText(before[k])));
    });
    if (more.childElementCount) items.push({ key: 'more', el: more, width: 4 });
    const grid = make('div', 'peBoard');
    el.replaceChildren(...out, grid);
    ctx.board.fill('energy', grid, items, { min: 280 });
  }
  return {
    render: () => render(true), update: () => render(false),
    has: () => {
      if (!ha || (haErr && Date.now() - askedAt > 300000)) probe(true);           // Home Assistant was not there: ask again every 5 minutes
      return hasMeters(houseMeters(ctx.layout().energy, ha?.meters).meters);
    },
    reset: () => { run++; drawn = ''; house = null; },
    probe,
  };
}
