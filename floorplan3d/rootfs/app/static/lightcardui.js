/* The card "Lichtsteuerung" on the screen (#597, picture of the owner: the slider-button-card "Light Control"): a wide bar per lamp, light
 * group or switch, filled as far as it is bright in the lamp's colour (a white tone: warm or cold white, else a warm yellow), grey when
 * off, faded and not to be used when not available; on the left the symbol, the name and "75 %", on the right a switch. Dragging the bar
 * sideways shows the new brightness at once and sends it when the finger lets go (a Zigbee net is not flooded); up and down the page
 * scrolls. A tap switches, a long press opens Home Assistant's own window (outside Home Assistant the add-on's). A light group of Home
 * Assistant opens with ▸ to its lamps, and so does a bar with several lamps of its own (a long press opens it too, there is no one window
 * for them all). "Alle aus" in the head switches off what is on. As a window (popup) it opens from "💡 n Lichter an" on ☀ Heute or from
 * a button card. While a finger drags, the card is not drawn again (sig stays). The part of "Karte einstellen" for it is lightcardedit.js.
 * The rules are in lightslider.js (tested). */
import { lampsLook, rowCalls, statusOf, pctAt, DRAG_PX, rowLamps, rowKey, rowMembers, onRows } from './lightslider.js';
import { HOLD_MS } from './buttonlook.js';
import { lightCardFields } from './lightcardedit.js';

/** ctx: t, states(), nameOf(entity), entities() ([{ entity_id, name }]), callService(entity, service, data), moreInfo(entity) (Home
 *  Assistant's own window: true when it opened), controls(entity) (the add-on's window), changed() (draw the pages again) */
export function initLightCard(ctx) {
  const { t } = ctx;
  const opened = new Set();                          // "card|bar" opened to its lamps (bar: rowKey)
  const pending = new Map();                         // bar -> { pct, until }: a brightness sent, shown until the lamps say it
  let drag = null;                                   // { card, e (the bar), pct } while a finger drags a bar
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const st = (e) => ctx.states()[e];
  /** send the calls of a bar (lightslider.js rowCalls) */
  const send = (calls) => calls.forEach(([e, service, data]) => ctx.callService(e, service, data || undefined));
  const word = (s) => (s.key === 'pct' ? `${s.pct} %` : t(`lc.${s.key}`));
  /** what a lamp shows: a brightness sent a moment ago wins until the lamp reports it */
  function shownPct(e, look) {
    const p = pending.get(e);
    if (!p) return null;
    if (Date.now() > p.until || (p.pct === 0 ? look.kind === 'off' : look.kind === 'on' && Math.abs(look.pct - p.pct) <= 2)) { pending.delete(e); return null; }
    return p.pct;
  }

  function sw(key, lamps, look, name) {
    const lab = make('label', 'sw lcSw'); lab.title = t('live.toggle');
    const cb = make('input'); cb.type = 'checkbox'; cb.checked = look.kind === 'on'; cb.disabled = look.kind === 'na' || look.kind === 'missing';
    cb.setAttribute('aria-label', `${name}: ${t('live.toggle')}`);
    cb.addEventListener('change', () => { pending.delete(key); send(rowCalls(lamps, ctx.states(), { on: cb.checked })); });
    lab.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    lab.addEventListener('click', (ev) => ev.stopPropagation());
    lab.append(cb, make('span'));
    return lab;
  }
  /** one bar: c the card, r its row ({ e, more, name, icon }), sub: a lamp of a group or of a bar shown below it */
  function row(c, r, sub = false) {
    const e = r.e, lamps = sub ? [e] : rowLamps(r), key = sub ? e : rowKey(r), look = lampsLook(lamps, ctx.states());
    const held = drag?.card === c.id && drag.e === key ? drag.pct : null, sent = held === null ? shownPct(key, look) : null;
    const pct = held ?? sent ?? look.pct, usable = look.kind === 'on' || look.kind === 'off';
    const el = make('div', `lcRow lc-${look.kind}${look.dim ? ' dim' : ''}${sub ? ' sub' : ''}${lamps.length > 1 ? ' many' : ''}${held !== null ? ' dragging' : ''}`);
    el.dataset.e = key; el.style.setProperty('--lc', look.rgb.join(', ')); el.style.setProperty('--pct', `${pct}%`);
    el.tabIndex = usable ? 0 : -1;
    el.setAttribute('role', look.dim ? 'slider' : 'switch');
    const fill = make('span', 'lcFill');
    const icon = make('span', 'lcIcon', r.icon || (lamps.every((x) => x.startsWith('switch.')) ? '⏻' : '💡'));
    const name = r.name || `${ctx.nameOf(e) || e}${lamps.length > 1 ? ` +${lamps.length - 1}` : ''}`, state = make('span', 'lcState', word(statusOf(look, held ?? sent)));
    const txt = make('span', 'lcText'); txt.append(make('b', 'lcName', name), state);
    el.append(fill, icon, txt);
    el.setAttribute('aria-label', name);
    if (look.dim) { el.setAttribute('aria-valuemin', '0'); el.setAttribute('aria-valuemax', '100'); el.setAttribute('aria-valuenow', String(pct)); }
    else el.setAttribute('aria-checked', String(look.kind === 'on'));
    const members = sub ? [] : rowMembers(r, ctx.states()), openKey = `${c.id}|${key}`;
    const flip = () => { if (opened.has(openKey)) opened.delete(openKey); else opened.add(openKey); ctx.changed(); };
    if (members.length && c.expand) {
      const open = opened.has(openKey);
      const more = make('button', 'lcMore', open ? '▾' : '▸'); more.type = 'button'; more.dataset.act = 'lcGroup';
      more.title = t(open ? 'lc.close' : 'lc.open', { n: members.length }); more.setAttribute('aria-expanded', String(open)); more.setAttribute('aria-label', more.title);
      more.addEventListener('pointerdown', (ev) => ev.stopPropagation());
      more.addEventListener('click', (ev) => { ev.stopPropagation(); flip(); });
      el.append(more);
    }
    el.append(sw(key, lamps, look, name));
    const hold = lamps.length > 1 ? flip : () => { if (!ctx.moreInfo(e)) ctx.controls(e); };     // several lamps: a long press shows them
    presses(el, c, key, lamps, look, hold, (p) => {   // while dragging: the bar and the words follow the finger, nothing is drawn again
      el.style.setProperty('--pct', `${p}%`); el.setAttribute('aria-valuenow', String(p));
      state.textContent = word(statusOf(look, p));
    });
    return { el, members: c.expand || lamps.length > 1 ? members : [] };
  }
  /** a tap switches, a long press opens the window (hold), sideways drags the brightness (only a lamp that can dim, only when it can be
   *  used); key: the bar, lamps: what it switches */
  function presses(el, c, key, lamps, look, hold, follow) {
    const usable = look.kind === 'on' || look.kind === 'off';
    let id = null, x0 = 0, y0 = 0, mode = null, timer = 0, rect = null;
    const stop = () => { clearTimeout(timer); timer = 0; };
    el.addEventListener('pointerdown', (ev) => {
      if (ev.button > 0 || id !== null) return;
      id = ev.pointerId; x0 = ev.clientX; y0 = ev.clientY; mode = null; rect = el.getBoundingClientRect();
      stop(); timer = setTimeout(() => { mode = 'hold'; timer = 0; hold(); }, HOLD_MS);
    });
    el.addEventListener('pointermove', (ev) => {
      if (ev.pointerId !== id) return;
      const dx = ev.clientX - x0, dy = ev.clientY - y0;
      if (mode === null && Math.abs(dy) > DRAG_PX && Math.abs(dy) > Math.abs(dx)) { stop(); mode = 'scroll'; return; }
      if (mode === null && Math.abs(dx) > DRAG_PX) {
        stop();
        if (!usable || !look.dim) { mode = 'scroll'; return; }
        mode = 'drag'; el.classList.add('dragging');
        try { el.setPointerCapture(id); } catch { /* a pointer the page made up (tests) */ }
        drag = { card: c.id, e: key, pct: look.pct };
      }
      if (mode !== 'drag') return;
      drag.pct = pctAt(ev.clientX, rect.left, rect.width);
      follow(drag.pct);
    });
    const end = (ev, cancel) => {
      if (ev.pointerId !== id) return;
      id = null; stop();
      if (mode === 'drag') {
        const p = drag.pct; drag = null; el.classList.remove('dragging');
        if (!cancel) { pending.set(key, { pct: p, until: Date.now() + 4000 }); send(rowCalls(lamps, ctx.states(), { pct: p })); setTimeout(() => ctx.changed(), 4100); }
        ctx.changed();
      } else if (mode === null && !cancel && usable) {  // a tap
        pending.delete(key);
        send(rowCalls(lamps, ctx.states(), { on: look.kind !== 'on' }));
      }
      mode = null;
    };
    el.addEventListener('pointerup', (ev) => end(ev, false));
    el.addEventListener('pointercancel', (ev) => end(ev, true));
    el.addEventListener('contextmenu', (ev) => ev.preventDefault());   // a long touch: no menu of the browser
    el.addEventListener('keydown', (ev) => {                            // the keyboard: ← → in steps of 10 %, Enter / space switch
      if (!usable) return;
      if (look.dim && (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight')) {
        ev.preventDefault();
        const p = Math.max(0, Math.min(100, (pending.get(key)?.pct ?? look.pct) + (ev.key === 'ArrowRight' ? 10 : -10)));
        pending.set(key, { pct: p, until: Date.now() + 4000 }); follow(p); send(rowCalls(lamps, ctx.states(), { pct: p }));
      } else if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); send(rowCalls(lamps, ctx.states(), { on: look.kind !== 'on' })); }
    });
  }

  /** "Alle aus": the rows that are on go off */
  function allOff(c) {
    const on = onRows(c.rows, ctx.states());
    const off = make('button', 'lcAllOff', t('lc.allOff')); off.type = 'button'; off.dataset.act = 'lcAllOff'; off.disabled = !on.length;
    off.addEventListener('click', (ev) => { ev.stopPropagation(); pending.clear(); on.forEach((e) => ctx.callService(e, 'turn_off')); });
    return off;
  }
  /** the card into box (its frame: cardsui.js); in a window without its head line (the window has the title and "Alle aus") */
  function render(c, box, { inWindow = false } = {}) {
    box.classList.add('lcCard');
    if (!inWindow) {
      const head = make('div', 'lcHead');
      head.append(make('h3', 'peH ocHead lcTitle', `💡 ${c.name || t('lc.title')}`));
      if (c.allOff) head.append(allOff(c));
      box.append(head);
    }
    const list = make('div', 'lcRows');
    c.rows.forEach((r) => {
      const { el, members } = row(c, r);
      list.append(el);
      if (members.length && opened.has(`${c.id}|${rowKey(r)}`)) {
        const kids = make('div', 'lcKids');
        members.forEach((m) => kids.append(row(c, { e: m, name: '', icon: '' }, true).el));
        list.append(kids);
      }
    });
    box.append(list);
  }
  /** what the card shows depends on: its rows' states, their lamps' when opened, a brightness sent; nothing new while a finger drags */
  const sigs = new Map();                            // "card|where" -> its last sig (kept while a finger drags)
  function sig(c, extra = []) {
    const key = `${c.id}|${extra.join('|')}`;
    if (drag?.card === c.id && sigs.has(key)) return sigs.get(key);
    const one = (e) => { const s = st(e); return s ? [s.state, s.brightness, s.rgb, s.kel, s.dim] : null; };
    const sent = (k) => { const p = pending.get(k); if (p && Date.now() > p.until) { pending.delete(k); return null; } return p?.pct ?? null; };
    const groups = c.rows.map((r) => (opened.has(`${c.id}|${rowKey(r)}`) ? rowMembers(r, ctx.states()).map((m) => [m, one(m), sent(m)]) : c.expand ? rowMembers(r, ctx.states()).length : 0));
    const s = JSON.stringify([c, c.rows.map((r) => [rowLamps(r).map(one), sent(rowKey(r))]), groups, ...extra]);
    sigs.set(key, s);
    return s;
  }

  /* ---- the card as a window (popup): from "💡 n Lichter an" or a button card ---- */
  let dlg = null, shownCard = null, drawn = '';
  function openWindow(c) {
    if (!c) return false;
    if (!dlg) {
      dlg = make('dialog', 'ceDlg lcDlg');
      dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
      dlg.addEventListener('close', () => { shownCard = null; drawn = ''; });
      document.body.append(dlg);
    }
    shownCard = c; drawn = '';
    refresh();
    if (!dlg.open) dlg.showModal();
    return true;
  }
  /** the open window drawn again when something it shows changed */
  function refresh() {
    if (!dlg || !shownCard) return;
    const s = sig(shownCard, ['window', t('lc.title')]);
    if (s === drawn) return;
    drawn = s;
    const head = make('div', 'lcDlgHead');
    const close = make('button', 'lcClose', '✕'); close.type = 'button'; close.title = t('close'); close.setAttribute('aria-label', t('close'));
    close.addEventListener('click', () => dlg.close());
    head.append(close, make('h3', '', shownCard.name || t('lc.title')));
    if (shownCard.allOff) head.append(allOff(shownCard));
    const box = make('div', 'lcBox'); box.dataset.card = shownCard.id;
    render(shownCard, box, { inWindow: true });
    dlg.replaceChildren(head, box);
  }

  /** the part of "Karte einstellen" for a light card (lightcardedit.js) */
  const fields = (draft, ui) => lightCardFields({ t, states: ctx.states, nameOf: ctx.nameOf, entities: ctx.entities }, draft, ui);
  return { render, sig, fields, open: openWindow, refresh };
}
