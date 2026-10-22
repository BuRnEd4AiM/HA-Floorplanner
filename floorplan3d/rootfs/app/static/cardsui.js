/* Own cards on the pages of the tab bar (#484): draws one card of the twelve kinds of cards.js (button, switch, value, history, light,
 * thermostat, roller shutter, camera, several devices, room, text, a ready card of ☀ Heute). A history card asks the add-on for the
 * numbers (api/history, again after 5 minutes). Switching goes through live.callService like everywhere else. */
import { TYPE_ICON, COLOR_HEX, cardEntities, tapService, valueOf, chartPaths } from './cards.js';
import { routineIcon } from './routines.js';

const TOGGLE = new Set(['light', 'switch', 'input_boolean', 'fan', 'automation']);
const ON = new Set(['on', 'open', 'playing', 'heat', 'cool', 'heat_cool', 'auto', 'dry', 'fan_only', 'unlocked', 'home']);

/** ctx: t, lang(), states(), settings(), nameOf(entity), stateText(entity), callService(entity, service, data) (-> true when taken),
 *  camImage(entity) (an <img> renewed while shown), openCamera(entity), room(roomId) ({ name, floor, temp, lights, open, occupied } or
 *  null), openRoom(roomId), builtin(key) (a ready card of ☀ Heute, or null), changed() (a history arrived: draw the page again),
 *  thermo (thermostatui.js, #495) */
export function initCards(ctx) {
  const { t } = ctx;
  const history = new Map();                         // "entity|hours" -> { at, points, asking }
  const flash = new Map();                           // card id -> 'ok' | 'bad' for a moment after a tap
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on, title) => { const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', (e) => { e.stopPropagation(); on(e); }); return b; };
  const st = (e) => ctx.states()[e];
  const nm = (c, e = c.entity) => c.name || (c.type === 'room' ? ctx.room(c.room)?.name : null) || ctx.nameOf(e) || e || t(`ct.type.${c.type}`);
  /** a state in words: the texts the app has for it (open, closed, docked, armed …), on / off, else as Home Assistant says it */
  const word = (e) => {
    const s = st(e);
    if (!s) return '–';
    const k = String(s.state);
    for (const key of [`dc.st.${k}`, `state.${k}`]) { const x = t(key); if (x !== key) return x; }
    if (k === 'off') return t('ct.off');
    if (ON.has(k)) return t('ct.on');
    return ctx.stateText(e);
  };
  const shown = (e) => { const s = st(e); if (!s) return '–'; const v = valueOf(s, ctx.lang()); return v.num === null ? word(e) : `${v.v}${v.unit ? ` ${v.unit}` : ''}`; };
  const isOn = (e) => ON.has(st(e)?.state);
  const imperial = () => ctx.settings().units === 'imperial';
  const deg = (c) => (typeof c === 'number' ? `${(imperial() ? c * 9 / 5 + 32 : c).toLocaleString(ctx.lang(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}°` : '–');

  function head(c, e) {
    const h = make('h3', 'peH ocHead');
    h.append(make('span', 'ocIcon', TYPE_ICON[c.type]), document.createTextNode(` ${nm(c, e)}`));
    return h;
  }
  function sw(e) {
    const lab = make('label', 'sw'); lab.title = t('live.toggle');
    const cb = make('input'); cb.type = 'checkbox'; cb.checked = isOn(e);
    cb.addEventListener('change', () => ctx.callService(e, cb.checked ? 'turn_on' : 'turn_off'));
    lab.addEventListener('click', (ev) => ev.stopPropagation());
    lab.append(cb, make('span'));
    return lab;
  }
  async function tap(c) {
    const svc = tapService(c.entity);
    if (!svc) return;
    const ok = await ctx.callService(c.entity, svc);
    flash.set(c.id, ok ? 'ok' : 'bad'); ctx.changed();
    setTimeout(() => { flash.delete(c.id); ctx.changed(); }, 2000);
  }
  function loadHistory(c) {
    const key = `${c.entity}|${c.hours}`, h = history.get(key);
    if (h && (h.asking || Date.now() - h.at < 300000)) return h;
    const next = { at: Date.now(), points: h?.points || null, asking: true };
    history.set(key, next);
    fetch(`api/history?entity=${encodeURIComponent(c.entity)}&hours=${c.hours}`).then((r) => (r.ok ? r.json() : null))
      .then((x) => { next.points = Array.isArray(x?.points) ? x.points : next.points || []; }).catch(() => { next.points = next.points || []; })
      .finally(() => { next.asking = false; ctx.changed(); });
    return next;
  }
  function graph(c, box) {
    const h = loadHistory(c), s = st(c.entity), unit = s?.unit || '';
    const W = 300, H = 120, p = chartPaths(h.points || [], W, H, { l: 0, r: 0, t: 6, b: 6 });   // stretched to the card's width, the labels beside it
    const top = make('div', 'ocBig');
    top.append(make('b', '', shown(c.entity)));
    const fmt = (v) => valueOf({ state: String(v), unit }, ctx.lang()).v;
    if (p) top.append(make('small', 'tpSub', t('ct.minMax', { max: fmt(p.max), min: fmt(p.min) })));
    box.append(top);
    if (!p) { box.append(make('p', 'tpSub', h.points ? t('ct.noHistory') : t('tp.today.loading'))); return; }
    const col = COLOR_HEX[c.color] || COLOR_HEX.blue, ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('class', 'ocChart');
    const add = (tag, attrs) => { const n = document.createElementNS(ns, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); svg.append(n); return n; };
    const wrap = make('div', 'ocChartBox');
    p.ticks.forEach((v) => {
      add('line', { x1: 0, x2: W, y1: p.y(v), y2: p.y(v), class: 'ocGrid', 'vector-effect': 'non-scaling-stroke' });
      const lab = make('span', 'ocAxis', fmt(v)); lab.style.top = `${(p.y(v) / H) * 100}%`; wrap.append(lab);
    });
    add('path', { d: p.area, fill: col, 'fill-opacity': 0.18 });
    add('path', { d: p.line, fill: 'none', stroke: col, 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke' });
    wrap.prepend(svg);
    box.append(wrap);
  }
  function thermostat(c, box) {
    const { el } = ctx.thermo.render(c.entity, c.size || 'big');     // the circle like Home Assistant's (#495, thermostatui.js)
    if (el) box.append(el);
  }
  function light(c, box) {
    const e = c.entity, s = st(e), on = isOn(e);
    const row = make('div', 'ocLine');
    row.append(make('b', 'ocState', on ? (s?.brightness != null ? `${t('ct.on')} · ${Math.round(s.brightness)} %` : t('ct.on')) : t('ct.off')), sw(e));
    box.append(row);
    const r = make('input', 'ocRange'); r.type = 'range'; r.min = 1; r.max = 100; r.value = on ? Math.round(s?.brightness ?? 100) : 0;
    r.setAttribute('aria-label', t('ct.brightness'));
    if (Array.isArray(s?.rgb)) r.style.accentColor = `rgb(${s.rgb.join(',')})`;
    r.addEventListener('change', () => ctx.callService(e, 'turn_on', { brightness_pct: Number(r.value) }));
    r.addEventListener('click', (ev) => ev.stopPropagation());
    box.append(r);
  }
  function cover(c, box) {
    const e = c.entity, s = st(e);
    box.append(make('div', 'ocBig', s?.position != null ? `${Math.round(s.position)} %` : word(e)));
    const row = make('div', 'ocBtns');
    row.append(btn('', '▲', () => ctx.callService(e, 'open_cover'), t('ct.open')), btn('', '■', () => ctx.callService(e, 'stop_cover'), t('ct.stop')),
      btn('', '▼', () => ctx.callService(e, 'close_cover'), t('ct.close')));
    box.append(row);
  }
  function entities(c, box) {
    c.entities.forEach((e) => {
      const r = make('div', 'ocRow');
      r.append(make('span', 'tdWhat', ctx.nameOf(e) || e));
      r.append(TOGGLE.has(e.split('.')[0]) && st(e) ? sw(e) : make('b', '', shown(e)));
      box.append(r);
    });
  }
  function room(c, box) {
    const r = ctx.room(c.room);
    if (!r) { box.append(make('p', 'tpSub', t('ct.noRoom'))); return; }
    box.append(make('div', 'ocBig', deg(r.temp)));
    const tags = make('div', 'clTags');
    tags.append(make('span', 'tpChip', `💡 ${r.lights ? t('tile.on', { n: r.lights }) : t('tile.off')}`));
    if (r.open) tags.append(make('span', 'tpChip alert', `🪟 ${t('tile.open')}`));
    if (r.occupied) tags.append(make('span', 'tpChip green', '👤'));
    box.append(tags);
    box.classList.add('tdOpen'); box.addEventListener('click', () => ctx.openRoom(c.room));
  }

  /** one card as an element (a ready card of ☀ Heute: that card itself) */
  function render(c) {
    if (c.type === 'builtin') {
      const b = ctx.builtin(c.builtin);
      if (b) { b.classList.add('ocCard'); b.dataset.card = c.id; return b; }
    }
    const box = make('div', `tpCard ocCard oc-${c.type}`); box.dataset.card = c.id;
    if (!st(c.entity) && c.entity) { box.append(head(c), make('p', 'tpSub', t('ct.missing', { e: c.entity }))); return box; }
    if (c.type === 'button') {
      const f = flash.get(c.id);
      const b = btn(`rtBtn ocTap${f ? ` ${f}` : ''}`, null, () => tap(c));
      b.append(make('span', 'rtIcon', routineIcon(nm(c), c.entity)), make('b', 'rtName', nm(c)),
        make('small', 'rtSub', f === 'ok' ? `✓ ${t('rt.started')}` : f === 'bad' ? t('rt.failed') : /^(scene|script|button|input_button)\./.test(c.entity) ? t(`rt.kind.${c.entity.split('.')[0]}`) : word(c.entity)));
      box.classList.add('ocBare'); box.append(b);
      return box;
    }
    if (c.type !== 'text') box.append(head(c));
    if (c.type === 'switch') { const r = make('div', 'ocLine'); r.append(make('b', 'ocState', word(c.entity)), sw(c.entity)); box.append(r); }
    else if (c.type === 'value') { const v = make('div', 'ocBig ocValue', shown(c.entity)); v.style.color = c.color === 'blue' ? '' : COLOR_HEX[c.color]; box.append(v); }
    else if (c.type === 'graph') graph(c, box);
    else if (c.type === 'light') light(c, box);
    else if (c.type === 'thermostat') thermostat(c, box);
    else if (c.type === 'cover') cover(c, box);
    else if (c.type === 'camera') {
      const img = ctx.camImage(c.entity); img.classList.add('ocCam');
      box.append(img); box.classList.add('tdOpen'); box.addEventListener('click', () => ctx.openCamera(c.entity));
    } else if (c.type === 'entities') entities(c, box);
    else if (c.type === 'room') room(c, box);
    else if (c.type === 'text') { if (c.name) box.append(make('h3', 'ocTextHead', c.name)); if (c.text) box.append(make('p', 'ocText', c.text)); }
    else if (c.type === 'builtin') box.append(make('p', 'tpSub', t('ct.noBuiltin')));
    return box;
  }
  /** what a card shows depends on: the states of its entities, its history, a pending target, a tap (it draws again when this changed) */
  const sig = (c) => JSON.stringify([c, cardEntities(c).map((e) => { const s = st(e); return s ? [s.state, s.brightness, s.position, s.ct, s.tt, s.hvac, s.rgb, s.unit] : null; }),
    c.type === 'graph' ? history.get(`${c.entity}|${c.hours}`)?.points?.length ?? -1 : 0, c.type === 'thermostat' ? ctx.thermo.sig(c.entity) : 0, flash.get(c.id),
    c.type === 'room' ? ctx.room(c.room) : 0, c.type === 'builtin' ? Math.floor(Date.now() / 20000) : 0, imperial(), ctx.lang()]);   // a ready card: every 20 s
  return { render, sig };
}
