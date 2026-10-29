/* 🚗 The car and 🌱 the garden on the page 🧺 Haushalt (#533, picture docs/ideen-4.3/8-haushalt.jpg). The car: its charge as a big number
 * and a bar, "lädt mit 3,2 kW · voll um 17:30", the range, "☀ Nur mit Sonne laden". The garden: the rain of today and tomorrow, when it
 * last watered, the soil, "💧 10 min gießen" per zone (the add-on closes it again by itself: api/garden) and "■ Stopp". The rules are in
 * car.js and garden.js (tested); this file asks the add-on (api/garden, api/forecast) and draws the two cards for pagehousehold.js. */
import { findCar, hasCar, carView, solarCall } from './car.js';
import { findZones, findMoisture, hasGarden, gardenView } from './garden.js';
import { weatherId } from './sky.js';
import { fmtNum } from './i18n.js';

const TIMERS_MS = 30000, FORECAST_MS = 15 * 60000;

/** ctx: t, lang(), states(), entities() (Home Assistant's entities with their names), settings(), callService(entity, service, data),
 *  locked() (this user may not switch), redraw() (the page draws again) */
export function initOutdoorCards(ctx) {
  const { t } = ctx;
  let timers = { at: 0, map: {}, busy: false, note: '' }, wx = { at: 0, entity: '', rows: [], busy: false };
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on) => { const b = make('button', cls, text); b.type = 'button'; b.addEventListener('click', on); return b; };
  const time = (ms) => new Intl.DateTimeFormat(ctx.lang() || 'de', { hour: '2-digit', minute: '2-digit' }).format(new Date(ms));
  /** found again only when the entities or the choices in ⚙ changed (the page draws at every change of a state) */
  const memo = (fn, key) => { let k = null, v = null; return () => { const n = key(); if (n !== k) { k = n; v = fn(); } return v; }; };
  const found = memo(() => findCar(ctx.entities(), ctx.settings().car), () => `${ctx.entities().length}|${JSON.stringify(ctx.settings().car || {})}`);
  const zones = memo(() => findZones(ctx.entities(), ctx.settings().garden?.zones), () => `${ctx.entities().length}|${JSON.stringify(ctx.settings().garden || {})}`);
  const names = () => Object.fromEntries(ctx.entities().map((e) => [e.entity_id, e.name || e.entity_id]));

  /* ---- what the add-on says: the timers of the zones, the forecast ---- */
  async function loadTimers(force = false) {
    if (timers.busy || !hasGarden(zones()) || (!force && Date.now() - timers.at < TIMERS_MS)) return;
    timers.busy = true;
    try { const r = await fetch('api/garden'); if (r.ok) timers.map = (await r.json()).timers || {}; } catch { /* stays */ }
    timers.at = Date.now(); timers.busy = false; ctx.redraw();
  }
  async function loadForecast() {
    const entity = weatherId(ctx.states(), ctx.settings().weatherEntity);
    if (wx.busy || !entity || !hasGarden(zones()) || (wx.entity === entity && Date.now() - wx.at < FORECAST_MS)) return;
    wx.busy = true;
    try { const r = await fetch(`api/forecast?entity=${encodeURIComponent(entity)}&type=daily`); if (r.ok) wx.rows = (await r.json()).forecast || []; } catch { /* stays */ }
    wx = { ...wx, at: Date.now(), entity, busy: false }; ctx.redraw();
  }
  async function water(entity, minutes) {
    timers.note = '';
    try {
      const r = await fetch('api/garden/water', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(minutes ? { entity, minutes } : { entity, stop: true }) });
      const x = await r.json().catch(() => ({}));
      if (r.ok) timers.map = x.timers || {}; else timers.note = t('garden.failed');
    } catch { timers.note = t('garden.failed'); }
    timers.at = Date.now(); ctx.redraw();
  }

  /* ---- the cards ---- */
  function carCard() {
    const f = found();
    if (!hasCar(f)) return null;
    const v = carView(f, ctx.states(), Date.now()), c = make('div', `tpCard hhCard hhCar${v.charging ? ' hh-running' : ''}`);
    const top = make('div', 'hhTop'), txt = make('div', 'hhTxt'), line = [];
    txt.append(make('b', 'hhName', f.name || t('car.title')));
    if (v.charging) line.push(v.watts ? t('car.chargingKw', { kw: fmtNum(v.watts / 1000, 1, 1) }) : t('car.charging'));
    if (v.ends) line.push(t('car.fullAt', { at: time(v.ends) }));
    if (!v.charging) line.push(t('car.notCharging'));
    if (v.range != null) line.push(t('car.range', { n: v.range, unit: v.rangeUnit }));
    txt.append(make('div', 'tpSub', line.join(' · ')));
    top.append(make('span', 'hhIcon', '🚗'), txt);
    if (v.level != null) top.append(make('span', 'hhRight hhBig', `${v.level} %`));
    c.append(top);
    if (v.level != null) { const bar = make('div', 'hhBar hhCarBar'), fill = make('i'); fill.style.width = `${v.level}%`; bar.append(fill); c.append(bar); }
    if (v.solar && !ctx.locked()) {
      const b = btn(`bdBtn hhSolar${v.solar.on ? ' on' : ''}`, `☀ ${t('car.solar')}`, () => { const call = solarCall(v.solar, !v.solar.on); if (call) ctx.callService(...call); });
      b.dataset.act = 'solar'; b.setAttribute('aria-pressed', String(v.solar.on));
      c.append(b);
    }
    return c;
  }
  function gardenCard() {
    const zs = zones();
    if (!hasGarden(zs)) return null;
    loadTimers(); loadForecast();
    const now = Date.now(), nm = names(), minutes = ctx.settings().garden?.minutes || 10;
    const v = gardenView(zs, ctx.states(), { timers: timers.map, forecast: wx.rows, moisture: findMoisture(ctx.entities()), names: nm, now });
    const c = make('div', `tpCard hhCard hhGarden${v.running ? ' hh-running' : ''}`), top = make('div', 'hhTop'), txt = make('div', 'hhTxt'), line = [];
    txt.append(make('b', 'hhName', t('garden.title')));
    if (v.rain.today != null || v.rain.tomorrow != null) {
      line.push(v.rain.tomorrow != null ? t('garden.rainTomorrow', { mm: fmtNum(v.rain.tomorrow, 1) }) : t('garden.rainToday', { mm: fmtNum(v.rain.today, 1) }));
    }
    if (v.lastWater) line.push(t('garden.last', { at: time(v.lastWater) }));
    if (v.moisture != null) line.push(t('garden.soil', { n: v.moisture }));
    if (line.length) txt.append(make('div', 'tpSub', line.join(' · ')));
    top.append(make('span', 'hhIcon', '🌱'), txt);
    const run = v.zones.find((z) => z.on);
    top.append(make('span', 'hhRight', run ? (run.until ? t('garden.left', { n: Math.max(1, Math.ceil((run.until - now) / 60000)) }) : t('garden.runs')) : t('garden.off')));
    c.append(top);
    if (!ctx.locked()) {
      const row = make('div', 'hhBtns');
      v.zones.forEach((z) => {
        const label = z.on ? `■ ${zs.length > 1 ? `${z.name} ` : ''}${t('garden.stop')}` : `💧 ${zs.length > 1 ? `${z.name} · ` : ''}${t('garden.water', { n: minutes })}`;
        const b = btn(`bdBtn${z.on ? ' hhStop' : ' primary'}`, label, () => water(z.entity, z.on ? 0 : minutes));
        b.dataset.zone = z.entity; b.dataset.act = z.on ? 'stop' : 'water';
        row.append(b);
      });
      c.append(row);
    }
    if (timers.note) c.append(make('p', 'hhNote', timers.note));
    return c;
  }

  return {
    /** the cards for the page grid (keys car, garden) */
    items() {
      const out = [], car = carCard(), garden = gardenCard();
      if (car) out.push({ key: 'car', name: found().name || t('car.title'), el: car, width: 1 });
      if (garden) out.push({ key: 'garden', name: t('garden.title'), el: garden, width: 1 });
      return out;
    },
    /** is there anything to show (the page then exists without machines too) */
    has: () => hasCar(found()) || hasGarden(zones()),
    /** what the cards show depends on (the page draws again when it changed) */
    sig: () => { const st = ctx.states(), f = found(), z = zones(), ids = [...Object.values(f), ...z].filter((x) => typeof x === 'string' && x.includes('.'));
      return JSON.stringify([f, z, ids.map((id) => [st[id]?.state, st[id]?.lc]), timers.map, timers.note, wx.rows.length, ctx.locked(), Math.floor(Date.now() / 60000)]); },
    refresh: () => { timers.at = 0; loadTimers(true); },
  };
}
