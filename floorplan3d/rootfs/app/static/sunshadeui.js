/* 🌡 Klima → ☀ Sonnenschutz (5.15.0, the owner's choice 2026-11-17, pictures docs/ideen-5.15/01, 02): roller shutters go down only
 * where the sun shines on their window. One card with the switch and the numbers (sun higher than, warm outside / in the room, how far
 * down, back up after, an open window stays up, only with sun), and the windows with a roller shutter: which way each looks, whether the
 * sun shines on it now or it is down (by the add-on, or turned by hand meanwhile), a switch per window to leave it out. The add-on runs it
 * (sunshade.py); the card saves a moment after the last change, like 📋 Heiz-Regeln. */
import { shutterState, stepLimit, dirOf, bearingNow, turnNorth, otherRules } from './sunshade.js';

const STATE_ICON = { sun: '☀', down: '▼', hand: '✋', shade: '☁', open: '🪟', cool: '❄', clouds: '☁', nopos: '⚠', skip: '–', none: '⚠', nodir: '?' };

/** ctx: t, rules (rulesstore.js: also the windows with a shutter and where the sun is now, sunWindows, sunPos), canEdit(), deg(v), houseId(),
 *  north() (which way the top of the plan shown looks, layout.north), setNorth(degrees) (saved with the plan, nothing is drawn anew),
 *  changed() (draw the page again) */
export function initSunShadeUi(ctx) {
  const { t } = ctx;
  let draft = null, timer = 0, saved = 0;
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on, title) => { const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', on); return b; };
  const cfg = () => draft || ctx.rules.get()?.sun || null;

  /** a change: kept at once, saved a moment after the last one */
  function change(fn) {
    const c = JSON.parse(JSON.stringify(cfg()));
    fn(c);
    draft = c;
    ctx.changed();
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const ok = await ctx.rules.save({ sun: draft });
      if (ok) { draft = null; saved = Date.now(); ctx.changed(); setTimeout(() => ctx.changed(), 2100); }
    }, 700);
  }
  function toggle(on, set, data) {
    const lab = make('label', 'sw'); lab.title = t('hr.onOff');
    const cb = make('input'); cb.type = 'checkbox'; cb.checked = !!on; cb.disabled = !ctx.canEdit();
    if (data) cb.dataset.sun = data;
    cb.addEventListener('change', () => { cb.blur(); set(cb.checked); });   // (the page is not drawn again while an input has the focus)
    lab.append(cb, make('span'));
    return lab;
  }
  function stepper(text, go, data) {
    const box = make('span', 'hrStep'); box.dataset.field = data;
    const minus = btn('', '−', () => go(-1), t('heat.minus')), plus = btn('', '+', () => go(1), t('heat.plus'));
    minus.disabled = plus.disabled = !ctx.canEdit();
    box.append(minus, make('b', '', text), plus);
    return box;
  }
  const kv = (label, el) => { const r = make('div', 'hrKv'); r.append(make('span', '', label), el); return r; };
  const num = (c, k, step, lo, hi, text) => stepper(text(c[k]), (d) => change((x) => { x[k] = Math.max(lo, Math.min(hi, c[k] + d * step)); }), k);
  const limit = (c, k) => stepper(c[k] == null ? t('ss.any') : ctx.deg(c[k]), (d) => change((x) => { x[k] = stepLimit(c[k], d * 0.5); }), k);

  function settings(c) {
    const card = make('div', `tpCard hrCard ssCard${c.on ? '' : ' off'}`); card.dataset.sun = 'card';
    const head = make('div', 'hrHead'), tx = make('div', '');
    tx.append(make('b', '', t('ss.title')), make('small', 'tpSub', t('ss.sub')));
    head.append(make('span', 'hrIc', '☀️'), tx, toggle(c.on, (v) => change((x) => { x.on = v; }), 'on'));
    card.append(head);
    const kvs = make('div', 'hrKvs');
    kvs.append(
      make('h4', 'ssH', t('ss.when')),
      kv(t('ss.elev'), num(c, 'elev', 5, 0, 60, (v) => `${v}°`)),
      kv(t('ss.out'), limit(c, 'out')),
      kv(t('ss.inside'), limit(c, 'inside')),
      kv(t('ss.clouds'), toggle(c.clouds, (v) => change((x) => { x.clouds = v; }), 'clouds')),
      kv(t('ss.open'), toggle(c.open, (v) => change((x) => { x.open = v; }), 'open')),
      make('h4', 'ssH', t('ss.how')),
      kv(t('ss.pos'), num(c, 'pos', 10, 0, 90, (v) => `${v} %`)),
      kv(t('ss.back'), num(c, 'back', 5, 5, 240, (v) => t('fl.min', { n: v }))),
      kv(t('ss.angle'), num(c, 'angle', 5, 30, 90, (v) => `${v}°`)),
    );
    card.append(kvs);
    return card;
  }

  function windows(c) {
    const data = ctx.rules.get(), list = data?.sunWindows || [], st = data?.status?.sun || {}, sun = data?.sunPos || null;
    const card = make('div', 'tpCard hrCard ssWins'); card.dataset.sun = 'windows';
    const h = make('div', 'hrHead'), tx = make('div', '');
    tx.append(make('b', '', t('ss.windows')), make('small', 'tpSub', sun ? t('ss.sunNow', { az: Math.round(sun.az), dir: t(`ss.dir.${dirOf(sun.az)}`), elev: Math.round(sun.elev) })
      : t('ss.noSun')));
    h.append(make('span', 'hrIc', '🪟'), tx);
    card.append(h);
    card.append(northRow());
    if (!list.length) { card.append(make('p', 'tpSub', t('ss.none'))); return card; }
    card.append(make('p', 'tpSub ssCalm', `🤝 ${t('ss.calm')}`));
    const kvs = make('div', 'hrKvs');
    list.forEach((w) => {
      const b = bearingNow(w, ctx.houseId(), ctx.north()), dir = dirOf(b), here = { ...w, bearing: b };
      const moved = b !== w.bearing;                                      // north turned on this page: the add-on has not looked yet
      const skipped = c.skip.includes(w.cover), s = shutterState(here, c, c.on && !moved ? st[w.cover] : null, sun, skipped);
      const row = make('div', `hrKv ssWin ss-${s.k}`); row.dataset.cover = w.cover; row.dataset.state = s.k;
      const name = make('span', '');
      name.append(make('b', '', w.name || w.cover), make('small', 'tpSub', dir ? t('ss.looks', { dir: t(`ss.dir.${dir}`) }) : w.cover));
      const chip = make('span', `tpChip ssChip ss-${s.k}`, `${STATE_ICON[s.k] || ''} ${t(`ss.st.${s.k}`, { pos: s.pos ?? '' })}`);
      const others = otherRules(data.flows, w.cover);
      if (others.length) { const o = make('small', 'tpSub ssOther', `▶ ${t('ss.others', { names: others.map((x) => `„${x}“`).join(', ') })}`); o.dataset.others = others.length; name.append(o); }
      row.append(name, chip, toggle(!skipped, (v) => change((x) => { x.skip = v ? x.skip.filter((e) => e !== w.cover) : [...x.skip, w.cover]; }), `win:${w.cover}`));
      kvs.append(row);
    });
    card.append(kvs);
    return card;
  }

  /** 🧭 where north is (the owner, 2026-11-17: "die Ausrichtung am Kompass anpassen ohne das Haus neu zu zeichnen"): a small compass
   *  whose N turns with − / +, the top of the plan is up */
  function northRow() {
    const n = ctx.north(), row = make('div', 'hrKv ssNorth'); row.dataset.sun = 'north';
    const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '-22 -22 44 44'); svg.setAttribute('class', 'ssRose');
    svg.innerHTML = `<circle r="20" class="ring"/><text x="0" y="-12" class="up">▲</text><g transform="rotate(${-n})"><path d="M0,-17 L5,0 L-5,0 Z" class="n"/>`
      + `<path d="M0,17 L5,0 L-5,0 Z" class="s"/><text x="0" y="-5" class="nl">N</text></g>`;
    const txt = make('span', '');
    txt.append(make('b', '', t('ss.north')), make('small', 'tpSub', t('ss.northNow', { dir: t(`ss.dir.${dirOf(n)}`), deg: n })));
    const go = (d) => { ctx.setNorth(turnNorth(ctx.north(), d)); ctx.changed(); setTimeout(() => ctx.rules.load(), 2500); };   // the add-on reads the saved plan again
    const box = make('span', 'hrStep ssTurn'); box.dataset.field = 'north';
    const parts = [['−45', -45], ['−5', -5], ['+5', 5], ['+45', 45]].map(([l, d]) => { const x = btn('', l, () => go(d), t('ss.northTip')); x.disabled = !ctx.canEdit() || !ctx.setNorth; x.dataset.turn = d; return x; });
    box.append(...parts);
    row.append(svg, txt, box);
    return row;
  }

  function view() {
    const box = make('div', 'hrView ssView');
    const data = ctx.rules.get(), c = cfg();
    if (!data || !c) { ctx.rules.load(); box.append(make('p', 'tpSub', t('ub.loading'))); return box; }
    if (!data.ha) box.append(make('p', 'tpSub hrNote', t('hr.noHa')));
    else if (!data.running && c.on) box.append(make('p', 'tpSub hrNote', t('hr.notRunning')));
    if (!ctx.canEdit()) box.append(make('p', 'tpSub hrNote', t('hr.readOnly')));
    if (saved && Date.now() - saved < 2000) box.append(make('p', 'hrSaved', `✓ ${t('hr.saved')}`));
    const grid = make('div', 'hrGrid');
    grid.append(settings(c), windows(c));
    box.append(grid);
    return box;
  }
  return {
    view,
    viewSig: () => JSON.stringify([cfg(), ctx.rules.get()?.sunWindows, ctx.rules.get()?.status?.sun, ctx.rules.get()?.running, saved && Date.now() - saved < 2000,
      ctx.canEdit(), ctx.rules.get()?.sunPos, ctx.north(), ctx.houseId()]),
    /** the log of ▶ Abläufe: a line of the sun rule */
    log: (x, name) => ({ icon: x.act === 'down' ? '▼' : x.act === 'up' ? '▲' : '✋', text: `${name} ${x.act === 'hand' ? t('ss.log.hand') : `${x.v} %`}`,
      sub: x.act === 'up' ? t(`ss.log.up.${x.why === 'open' ? 'open' : 'gone'}`) : x.act === 'down' ? t('ss.log.down') : t('ss.title') }),
  };
}
