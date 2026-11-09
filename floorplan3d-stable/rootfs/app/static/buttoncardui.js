/* The button card (#484; its look since #495, buttonlook.js has the rules): a symbol, the name, the state, the brightness as a bar and
 * since when, as a tile, round, a pill or only the symbol in four sizes, in its colour (or the lamp's) while on. A tap switches or starts
 * it (or opens the window with the controls, ctlwindow.js, a page or a light card as a window, #597), a long press opens the window or
 * Home Assistant's own one.
 * Also the part of the window "Karte einstellen" for a button (cardeditor.js). */
import { BTN_ICONS, BTN_COLORS, BTN_HEX, BTN_SHAPES, BTN_SIZES, BTN_SHOW, BTN_TAP, BTN_HOLD, HOLD_MS, cleanLook, buttonFace, agoOf } from './buttonlook.js';
import { routineIcon } from './routines.js';

/** ctx: t, states(), name(card) (its name), word(entity) (its state in words), tapService(entity), callService(entity, service, data),
 *  controls(entity) (the window with the controls), moreInfo(entity) (Home Assistant's own window: true when it opened), showPage(key),
 *  pages() ([{ key, name }]: the pages a tap can open), changed() (draw the page again), lightCards() ([{ id, name }]), openLights(id) (#597) */
export function initButtonCard(ctx) {
  const { t } = ctx;
  const flash = new Map();                           // card id -> 'ok' | 'bad' for a moment after a tap
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  async function run(c, what) {
    if (what === 'none') return;
    if (what === 'more') { ctx.controls(c.entity); return; }
    if (what === 'details') { if (!ctx.moreInfo(c.entity)) ctx.controls(c.entity); return; }      // outside Home Assistant: the window
    if (what === 'page') { ctx.showPage(c.page); return; }
    if (what === 'lights') { if (!ctx.openLights?.(c.card)) ctx.controls(c.entity); return; }   // a light card as a window (#597)
    const svc = ctx.tapService(c.entity);
    if (!svc) { ctx.controls(c.entity); return; }
    const ok = await ctx.callService(c.entity, svc);
    flash.set(c.id, ok ? 'ok' : 'bad'); ctx.changed();
    setTimeout(() => { flash.delete(c.id); ctx.changed(); }, 2000);
  }
  /** a tap does `tap`, a press of HOLD_MS or longer does `hold` (and the click after it nothing) */
  function presses(b, c, look) {
    let timer = 0, long = false;
    const stop = () => clearTimeout(timer);
    b.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return;
      long = false; stop();
      if (look.hold !== 'none') timer = setTimeout(() => { long = true; run(c, look.hold); }, HOLD_MS);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((n) => b.addEventListener(n, stop));
    b.addEventListener('contextmenu', (e) => { if (look.hold !== 'none') e.preventDefault(); });    // a long touch: no menu of the browser
    b.addEventListener('click', (e) => { e.stopPropagation(); if (long) { long = false; return; } run(c, look.tap); });
  }
  const KIND = /^(scene|script|button|input_button)\./;
  function stateLine(c, f) {
    if (f === 'ok') return `✓ ${t('rt.started')}`;
    if (f === 'bad') return t('rt.failed');
    if (KIND.test(c.entity)) return t(`rt.kind.${c.entity.split('.')[0]}`);
    const s = ctx.states()[c.entity];
    if (c.entity.startsWith('light.') && s?.state === 'on' && Number.isFinite(s.brightness)) return `${ctx.word(c.entity)} · ${Math.round(s.brightness)} %`;
    return ctx.word(c.entity);
  }
  /** the card into box (the card's frame: cardsui.js) */
  function render(c, box) {
    const look = cleanLook(c), f = flash.get(c.id), face = buttonFace(look, ctx.states()[c.entity]), name = ctx.name(c);
    box.classList.add('ocBare', 'obCard', `ob-${look.shape}`, `ob-${look.bsize}`);
    const b = make('button', `rtBtn obBtn${face.on ? ' on' : ''}${f ? ` ${f}` : ''}`); b.type = 'button'; b.dataset.act = 'tap';
    if (face.color) b.style.setProperty('--obc', face.color);
    b.append(make('span', 'rtIcon obIcon', look.icon || routineIcon(name, c.entity)));
    const txt = make('span', 'obText');
    if (look.show.includes('name')) txt.append(make('b', 'rtName obName', name));
    if (look.show.includes('state')) txt.append(make('small', 'rtSub obState', stateLine(c, f)));
    if (face.since) { const a = agoOf(face.since); txt.append(make('small', 'rtSub obSince', t(`ob.ago.${a.key}`, { n: a.n }))); }
    if (txt.childElementCount) b.append(txt);
    if (face.bar !== null) { const bar = make('span', 'obBar'); const i = make('i'); i.style.width = `${face.bar}%`; bar.append(i); b.append(bar); }
    b.title = `${name} · ${stateLine(c, f)}`; b.setAttribute('aria-label', name);
    presses(b, c, look);
    box.append(b);
  }
  /** what a button shows depends on, besides its entity's state: a tap a moment ago, the minute (since when) */
  const sig = (c) => [flash.get(c.id), cleanLook(c).show.includes('since') ? Math.floor(Date.now() / 60000) : 0];

  /**
   * The part of "Karte einstellen" for a button: symbol, colour when on, shape and size, what it shows, tap and long press. draft: the
   * card being set; ui: { field(label, ...nodes), seg(values, text, key), preview() }
   */
  function fields(draft, ui) {
    Object.assign(draft, { ...cleanLook(draft), ...draft, show: Array.isArray(draft.show) ? [...draft.show] : ['name', 'state'] });
    const chips = (values, text, cls, mark, pick) => {
      const row = make('div', `ceSeg ${cls}`);
      const paint = () => row.querySelectorAll('button').forEach((b) => b.classList.toggle('on', mark(b.dataset.v)));
      values.forEach((v) => {
        const b = make('button', '', text(v)); b.type = 'button'; b.dataset.v = v;
        b.addEventListener('click', () => { pick(v); paint(); ui.preview(); });
        row.append(b);
      });
      paint();
      return row;
    };
    ui.field(t('ob.icon'), chips(['', ...BTN_ICONS], (v) => v || t('ob.iconAuto'), 'obIcons', (v) => (draft.icon || '') === v, (v) => { draft.icon = v; }));
    const colors = chips(BTN_COLORS, (v) => (v === 'lamp' ? t('ob.lamp') : ''), 'obColors', (v) => draft.onColor === v, (v) => { draft.onColor = v; });
    colors.querySelectorAll('button').forEach((b) => {
      if (b.dataset.v !== 'lamp') { b.style.setProperty('--dot', BTN_HEX[b.dataset.v]); b.title = t(`ob.color.${b.dataset.v}`); b.setAttribute('aria-label', b.title); }
    });
    ui.field(t('ob.color'), colors);
    ui.field(t('ob.shape'), ui.seg(BTN_SHAPES, (v) => t(`ob.shape.${v}`), 'shape'), ui.seg(BTN_SIZES, (v) => v.toUpperCase(), 'bsize'));
    ui.field(t('ob.show'), chips(BTN_SHOW, (v) => t(`ob.show.${v}`), 'obShow', (v) => draft.show.includes(v),
      (v) => { draft.show = draft.show.includes(v) ? draft.show.filter((x) => x !== v) : [...draft.show, v]; }));
    const page = make('select', 'ceSelect'); page.dataset.act = 'obPage';
    page.append(...ctx.pages().map((p) => new Option(p.name, p.key)));
    page.value = draft.page || ctx.pages()[0]?.key || '';
    const showPage = () => { page.hidden = draft.tap !== 'page'; if (draft.tap === 'page') draft.page = page.value; };
    page.addEventListener('change', () => { draft.page = page.value; ui.preview(); });
    const cards = ctx.lightCards?.() || [], lc = make('select', 'ceSelect'); lc.dataset.act = 'obLights';   // a light card as a window (#597)
    lc.append(...(cards.length ? cards.map((x) => new Option(`🎚️ ${x.name || t('lc.title')}`, x.id)) : [new Option(t('lc.noCard'), '')]));
    lc.value = draft.card || cards[0]?.id || '';
    const showCard = () => { lc.hidden = draft.tap !== 'lights'; if (draft.tap === 'lights') draft.card = lc.value; };
    lc.addEventListener('change', () => { draft.card = lc.value; ui.preview(); });
    const tap = chips(BTN_TAP, (v) => t(`ob.tap.${v}`), 'obTap', (v) => draft.tap === v, (v) => { draft.tap = v; showPage(); showCard(); });
    showPage(); showCard();
    ui.field(t('ob.tap'), tap, page, lc);
    ui.field(t('ob.hold'), ui.seg(BTN_HOLD, (v) => t(`ob.hold.${v}`), 'hold'));
  }
  return { render, sig, fields };
}
