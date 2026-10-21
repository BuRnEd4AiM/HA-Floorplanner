/* The page ☀ Heute of the tab bar (#481), the start page of a wall tablet: the time and date, the weather now and the next days, the events
 * of today and tomorrow (the calendars chosen in ⚙, all without a choice), the next waste collection (its own calendar), who is at home,
 * what in the house needs a look (a tap leads there), the power now and the newest notes of the pinboard (#483, a tap leads to the page
 * 👨‍👩‍👧 Familie). The rules are in today.js (tested); this file asks the add-on (api/forecast, api/agenda) and draws. */
import { wxIcon, weatherEntity, nextDays, agendaDays, people, houseRows, alarmPanel, agendaSpan } from './today.js';
import { isoLocal } from './energyhistory.js';
import { energyBalance } from './energycalc.js';

/** ctx: t, el (the page), lang(), settings(), states(), names() ({ entity: name }), layout(), summary() ({ open: [names], lights, low, offline }),
 *  act(key) (a tap on a row of "Im Haus": open | lights | alarm | low | offline | power; on the pinboard: family), pinboard (pinboardui.js),
 *  family() (the page 👨‍👩‍👧 Familie is in the bar: the pinboard card leads there and shows without notes too), board (pageboard.js: the
 *  order an admin chose, own cards, #484) */
export function initTodayPage(ctx) {
  const { t, el } = ctx;
  let forecast = { at: 0, entity: '', rows: [] }, agenda = { at: 0, events: [], waste: '' }, clock = 0, drawn = '';
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const lang = () => ctx.lang() || 'de';
  const card = (cls, title) => { const c = make('div', `tpCard ${cls}`); if (title) c.append(make('h3', 'peH', title)); return c; };
  const timeOf = (d) => new Intl.DateTimeFormat(lang(), { hour: '2-digit', minute: '2-digit' }).format(d);
  const fmtW = (w) => (Math.abs(w) >= 1000 ? `${(w / 1000).toLocaleString(lang(), { maximumFractionDigits: 1 })} kW` : `${Math.round(w)} W`);

  async function loadForecast(entity) {
    if (!entity || (forecast.entity === entity && Date.now() - forecast.at < 15 * 60000)) return;
    forecast = { at: Date.now(), entity, rows: forecast.entity === entity ? forecast.rows : [] };
    try {
      const r = await fetch(`api/forecast?entity=${encodeURIComponent(entity)}&type=daily`);
      if (r.ok) { forecast.rows = (await r.json()).forecast || []; drawn = ''; draw(); }
    } catch { /* the weather stays without forecast */ }
  }
  async function loadAgenda() {
    if (Date.now() - agenda.at < 5 * 60000) return;
    agenda.at = Date.now();
    const span = agendaSpan(new Date());
    try {
      const r = await fetch(`api/agenda?start=${encodeURIComponent(isoLocal(span.start))}&end=${encodeURIComponent(isoLocal(span.end))}`);
      if (r.ok) { const x = await r.json(); agenda = { at: agenda.at, events: x.events || [], waste: x.waste || '' }; drawn = ''; draw(); }
    } catch { /* no calendars */ }
  }

  function clockCard(now) {
    const c = card('tdClock');
    c.append(make('div', 'tdTime', timeOf(now)), make('div', 'tdDate', new Intl.DateTimeFormat(lang(), { weekday: 'long', day: 'numeric', month: 'long' }).format(now)));
    return c;
  }
  function weatherCard(entity, now) {
    const st = ctx.states()[entity], c = card('tdWeather');
    if (!st) return null;
    const head = make('div', 'tdWxNow');
    head.append(make('span', 'tdWxIcon', wxIcon(st.state)));
    const txt = make('div');
    const temp = st.wx?.t;
    txt.append(make('div', 'tdWxTemp', temp == null ? '–' : `${Math.round(temp)} ${st.wx?.tu || '°C'}`), make('div', 'tpSub', t(`wx.${st.state}`)));
    head.append(txt); c.append(head);
    const days = nextDays(forecast.entity === entity ? forecast.rows : [], now);
    if (days.length) {
      const row = make('div', 'tdDays');
      days.forEach((d, i) => {
        const b = make('div', 'tdDay');
        b.append(make('small', '', i === 0 ? t('pe.today') : new Intl.DateTimeFormat(lang(), { weekday: 'short' }).format(d.date)), make('span', 'tdDayIcon', wxIcon(d.c)),
          make('b', '', [d.hi, d.lo].filter((v) => v != null).map((v) => `${Math.round(v)}°`).join(' / ') || '–'));
        if (d.pp) b.append(make('small', 'tdRain', `💧 ${Math.round(d.pp)} %`));
        row.append(b);
      });
      c.append(row);
    }
    return c;
  }
  function agendaCard(days) {
    const c = card('tdAgenda', t('td.agenda'));
    const list = (items, head) => {
      if (!items.length) return;
      c.append(make('div', 'tdDayHead', head));
      items.forEach((ev) => {
        const r = make('div', 'tdRow');
        r.append(make('b', 'tdWhen', ev.allDay ? t('td.allDay') : timeOf(ev.time)), make('span', 'tdWhat', ev.title));
        c.append(r);
      });
    };
    list(days.today, t('pe.today'));
    list(days.tomorrow, t('td.tomorrow'));
    if (!days.today.length && !days.tomorrow.length) c.append(make('p', 'tpSub', t('td.noEvents')));
    return c;
  }
  function wasteCard(waste) {
    if (!waste.length) return null;
    const c = card('tdWaste', `🗑 ${t('td.waste')}`);
    waste.forEach((w, i) => {
      const when = typeof w.when === 'string' ? t(`td.${w.when}`) : new Intl.DateTimeFormat(lang(), { weekday: 'short', day: 'numeric', month: 'short' }).format(w.when);
      const r = make('div', `tdRow${i === 0 ? ' tdNext' : ''}`);
      r.append(make('span', 'tdWhat', w.title), make('b', 'tdWhen', when));
      c.append(r);
    });
    return c;
  }
  function peopleCard(list) {
    if (!list.length) return null;
    const c = card('tdPeople', t('td.people'));
    list.forEach((p) => {
      const r = make('div', 'tdRow');
      const ava = make('span', 'tdAva', (p.name || '?').slice(0, 1).toUpperCase());
      r.append(ava, make('span', 'tdWhat', p.name),
        make('span', `tpChip${p.home ? ' green' : ''}`, p.home ? `🏠 ${t('td.home')}` : p.where ? `📍 ${p.where}` : p.where === null ? '?' : `🚗 ${t('td.away')}`));
      c.append(r);
    });
    return c;
  }
  function houseCard(rows) {
    const c = card('tdHouse', t('td.house'));
    if (!rows.length) { c.append(make('p', 'tdAllOk', `✓ ${t('td.allOk')}`)); return c; }
    const icon = { open: '🪟', lights: '💡', alarm: '🛡', low: '🪫', offline: '⚠' };
    rows.forEach((r) => {
      const b = make('button', `tdRow tdAct${r.key === 'alarm' || r.key === 'offline' ? ' alert' : ''}`); b.type = 'button'; b.dataset.act = r.key;
      const st = r.key === 'alarm' ? (t(`dc.st.${r.names[0]}`) === `dc.st.${r.names[0]}` ? r.names[0] : t(`dc.st.${r.names[0]}`)) : '';   // the alarm's state as its card says it
      const what = make('span', 'tdWhat', t(`td.row.${r.key}`, { n: r.n, state: st }));
      if (r.key === 'open' && r.names.length) what.append(make('small', '', r.names.join(', ')));
      b.append(make('span', 'tdIcon', icon[r.key]), what, make('span', 'tdGo', '›'));
      b.addEventListener('click', () => ctx.act(r.key));
      c.append(b);
    });
    return c;
  }
  function pinCard() {
    if (!ctx.pinboard || (!ctx.pinboard.notes().length && !ctx.family())) return null;
    const c = card('tdPin', `📌 ${t('pb.title')}`);
    c.append(ctx.pinboard.list({ max: 4 }));
    if (ctx.family()) {
      c.classList.add('tdOpen'); c.tabIndex = 0; c.setAttribute('role', 'button'); c.title = t('pb.open');
      c.addEventListener('click', () => ctx.act('family'));
      c.addEventListener('keydown', (e) => { if (e.key === 'Enter') ctx.act('family'); });
    }
    return c;
  }
  function powerCard() {
    const bal = energyBalance(ctx.states(), ctx.layout());
    if (bal.prod == null && bal.load == null) return null;
    const c = card('tdPower', t('td.power'));
    const row = make('button', 'tdPowerRow'); row.type = 'button'; row.dataset.act = 'power';
    if (bal.prod != null) row.append(make('span', '', `☀️ ${fmtW(bal.prod)}`));
    if (bal.load != null) row.append(make('span', '', `🏠 ${fmtW(bal.load)}`));
    if (bal.battery?.level != null) row.append(make('span', '', `🔋 ${Math.round(bal.battery.level)} %`));
    if (bal.imp != null && bal.imp > 0) row.append(make('span', '', `⚡ ${fmtW(bal.imp)}`));
    row.addEventListener('click', () => ctx.act('power'));
    c.append(row);
    return c;
  }

  /** the cards of the page in their natural order (a card that has nothing to show is left out): [{ key, el, width }] */
  function cards(now, only = null) {
    const st = ctx.states(), wx = weatherEntity(ctx.settings(), st), names = ctx.names();
    const days = () => agendaDays(agenda.events, now, agenda.waste);
    const make1 = {
      clock: () => clockCard(now),
      weather: () => weatherCard(wx, now),
      pinboard: () => pinCard(),
      agenda: () => agendaCard(days()),
      waste: () => wasteCard(days().waste),
      people: () => peopleCard(people(st, names)),
      house: () => houseCard(houseRows({ ...ctx.summary(), alarm: alarmPanel(st, names) })),
      power: () => powerCard(),
    };
    loadForecast(wx); loadAgenda(); ctx.pinboard?.load();
    return (only ? [only] : Object.keys(make1)).map((key) => ({ key, el: make1[key]?.() || null, width: 1 }));
  }
  /** the page (again only when what it shows changed; the clock each minute) */
  function draw(force = false) {
    const now = new Date(), st = ctx.states(), wx = weatherEntity(ctx.settings(), st);
    const names = ctx.names(), who = people(st, names), sum = ctx.summary();
    const rows = houseRows({ ...sum, alarm: alarmPanel(st, names) });
    const bal = energyBalance(st, ctx.layout());
    const sig = JSON.stringify([timeOf(now), wx, st[wx]?.state, st[wx]?.wx?.t, forecast.rows.length, agenda.events.length, who, rows,
      Math.round((bal.prod || 0) / 50), Math.round((bal.load || 0) / 50), bal.battery?.level, ctx.pinboard?.rev(), ctx.family?.()]);
    if (!force && sig === drawn) return;
    drawn = sig;
    const grid = make('div', 'tdGrid');
    el.replaceChildren(grid);
    ctx.board.fill('today', grid, cards(now), { min: 340 });
  }
  return {
    render: () => { draw(true); clearInterval(clock); clock = setInterval(() => draw(false), 20000); },
    update: () => draw(false),
    has: () => true,
    reset: () => { clearInterval(clock); clock = 0; drawn = ''; },
    /** a card of this page for another page (an own card "Fertige Karte", #484), null when it has nothing to show */
    card: (key) => cards(new Date(), key)[0]?.el || null,
  };
}
