/* The card "Lichtsteuerung" on the screen (#597, picture of the owner: the slider-button-card "Light Control"): a wide bar per lamp, light
 * group or switch, filled as far as it is bright in the lamp's colour (a white tone: warm or cold white, else a warm yellow), grey when
 * off, faded and not to be used when not available; on the left the symbol, the name and "75 %", on the right a switch. Dragging the bar
 * sideways shows the new brightness at once and sends it when the finger lets go (a Zigbee net is not flooded); up and down the page
 * scrolls. A tap switches, a long press opens Home Assistant's own window (outside Home Assistant the add-on's). A light group of Home
 * Assistant opens with ▸ to its lamps. "Alle aus" in the head switches off what is on. As a window (popup) it opens from "💡 n Lichter an"
 * on ☀ Heute or from a button card. While a finger drags, the card is not drawn again (sig stays). Also the part of "Karte einstellen" for
 * it (cardeditor.js). The rules are in lightslider.js (tested). */
import { rowLook, statusOf, pctAt, dragCall, DRAG_PX, membersOf, onRows, cleanRows, fitsRow, MAX_ROWS } from './lightslider.js';
import { HOLD_MS, BTN_ICONS } from './buttonlook.js';
import { sortable } from './dragsort.js';

const ICONS = [...new Set(['💡', '🛋', '🛏', '🍳', '🚪', '🛁', '📺', '🖥', '🌙', '✨', '🔆', '🏮', '🕯', '🌳', '⏻', ...BTN_ICONS])];
const SHOW = 40;

/** ctx: t, states(), nameOf(entity), entities() ([{ entity_id, name }]), callService(entity, service, data), moreInfo(entity) (Home
 *  Assistant's own window: true when it opened), controls(entity) (the add-on's window), changed() (draw the pages again) */
export function initLightCard(ctx) {
  const { t } = ctx;
  const opened = new Set();                          // "card|group" opened to its lamps
  const pending = new Map();                         // entity -> { pct, until }: a brightness sent, shown until the lamp says it
  let drag = null;                                   // { card, e, pct, sig } while a finger drags a bar
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const st = (e) => ctx.states()[e];
  const word = (s) => (s.key === 'pct' ? `${s.pct} %` : t(`lc.${s.key}`));
  /** what a lamp shows: a brightness sent a moment ago wins until the lamp reports it */
  function shownPct(e, look) {
    const p = pending.get(e);
    if (!p) return null;
    if (Date.now() > p.until || (p.pct === 0 ? look.kind === 'off' : look.kind === 'on' && Math.abs(look.pct - p.pct) <= 2)) { pending.delete(e); return null; }
    return p.pct;
  }

  function sw(e, look) {
    const lab = make('label', 'sw lcSw'); lab.title = t('live.toggle');
    const cb = make('input'); cb.type = 'checkbox'; cb.checked = look.kind === 'on'; cb.disabled = look.kind === 'na' || look.kind === 'missing';
    cb.setAttribute('aria-label', `${ctx.nameOf(e) || e}: ${t('live.toggle')}`);
    cb.addEventListener('change', () => { pending.delete(e); ctx.callService(e, cb.checked ? 'turn_on' : 'turn_off'); });
    lab.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    lab.addEventListener('click', (ev) => ev.stopPropagation());
    lab.append(cb, make('span'));
    return lab;
  }
  /** one bar: c the card, r its row ({ e, name, icon }), sub: a lamp of a group shown below it */
  function row(c, r, sub = false) {
    const e = r.e, look = rowLook(e, st(e)), held = drag?.card === c.id && drag.e === e ? drag.pct : null, sent = held === null ? shownPct(e, look) : null;
    const pct = held ?? sent ?? look.pct, usable = look.kind === 'on' || look.kind === 'off';
    const el = make('div', `lcRow lc-${look.kind}${look.dim ? ' dim' : ''}${sub ? ' sub' : ''}${held !== null ? ' dragging' : ''}`);
    el.dataset.e = e; el.style.setProperty('--lc', look.rgb.join(', ')); el.style.setProperty('--pct', `${pct}%`);
    el.tabIndex = usable ? 0 : -1;
    el.setAttribute('role', look.dim ? 'slider' : 'switch');
    const fill = make('span', 'lcFill');
    const icon = make('span', 'lcIcon', r.icon || (e.startsWith('switch.') ? '⏻' : '💡'));
    const name = r.name || ctx.nameOf(e) || e, state = make('span', 'lcState', word(statusOf(look, held ?? sent)));
    const txt = make('span', 'lcText'); txt.append(make('b', 'lcName', name), state);
    el.append(fill, icon, txt);
    el.setAttribute('aria-label', name);
    if (look.dim) { el.setAttribute('aria-valuemin', '0'); el.setAttribute('aria-valuemax', '100'); el.setAttribute('aria-valuenow', String(pct)); }
    else el.setAttribute('aria-checked', String(look.kind === 'on'));
    const members = c.expand && !sub ? membersOf(e, st(e)) : [];
    if (members.length) {
      const key = `${c.id}|${e}`, open = opened.has(key);
      const more = make('button', 'lcMore', open ? '▾' : '▸'); more.type = 'button'; more.dataset.act = 'lcGroup';
      more.title = t(open ? 'lc.close' : 'lc.open', { n: members.length }); more.setAttribute('aria-expanded', String(open)); more.setAttribute('aria-label', more.title);
      more.addEventListener('pointerdown', (ev) => ev.stopPropagation());
      more.addEventListener('click', (ev) => { ev.stopPropagation(); if (open) opened.delete(key); else opened.add(key); ctx.changed(); });
      el.append(more);
    }
    el.append(sw(e, look));
    presses(el, c, e, look, (p) => {                  // while dragging: the bar and the words follow the finger, nothing is drawn again
      el.style.setProperty('--pct', `${p}%`); el.setAttribute('aria-valuenow', String(p));
      state.textContent = word(statusOf(look, p));
    });
    return { el, members };
  }
  /** a tap switches, a long press opens the window, sideways drags the brightness (only a lamp that can dim, only when it can be used) */
  function presses(el, c, e, look, follow) {
    const usable = look.kind === 'on' || look.kind === 'off';
    let id = null, x0 = 0, y0 = 0, mode = null, timer = 0, rect = null;
    const stop = () => { clearTimeout(timer); timer = 0; };
    el.addEventListener('pointerdown', (ev) => {
      if (ev.button > 0 || id !== null) return;
      id = ev.pointerId; x0 = ev.clientX; y0 = ev.clientY; mode = null; rect = el.getBoundingClientRect();
      stop(); timer = setTimeout(() => { mode = 'hold'; timer = 0; if (!ctx.moreInfo(e)) ctx.controls(e); }, HOLD_MS);
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
        drag = { card: c.id, e, pct: look.pct };
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
        if (!cancel) { const call = dragCall(p); pending.set(e, { pct: p, until: Date.now() + 4000 }); ctx.callService(e, call.service, call.data || undefined); setTimeout(() => ctx.changed(), 4100); }
        ctx.changed();
      } else if (mode === null && !cancel && usable) {  // a tap
        pending.delete(e);
        ctx.callService(e, look.kind === 'on' ? 'turn_off' : 'turn_on');
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
        const p = Math.max(0, Math.min(100, (pending.get(e)?.pct ?? look.pct) + (ev.key === 'ArrowRight' ? 10 : -10))), call = dragCall(p);
        pending.set(e, { pct: p, until: Date.now() + 4000 }); follow(p); ctx.callService(e, call.service, call.data || undefined);
      } else if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ctx.callService(e, look.kind === 'on' ? 'turn_off' : 'turn_on'); }
    });
  }

  /** "Alle aus": the rows that are on go off */
  function allOff(c) {
    const on = onRows(c.rows, ctx.states());
    const off = make('button', 'lcAllOff', t('lc.allOff')); off.type = 'button'; off.dataset.act = 'lcAllOff'; off.disabled = !on.length;
    off.addEventListener('click', (ev) => { ev.stopPropagation(); on.forEach((e) => { pending.delete(e); ctx.callService(e, 'turn_off'); }); });
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
      if (members.length && opened.has(`${c.id}|${r.e}`)) {
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
    const sent = (e) => { const p = pending.get(e); if (p && Date.now() > p.until) { pending.delete(e); return null; } return p?.pct ?? null; };
    const groups = c.rows.map((r) => (opened.has(`${c.id}|${r.e}`) ? membersOf(r.e, st(r.e)).map((m) => [m, one(m), sent(m)]) : c.expand ? membersOf(r.e, st(r.e)).length : 0));
    const s = JSON.stringify([c, c.rows.map((r) => [one(r.e), sent(r.e)]), groups, ...extra]);
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

  /**
   * The part of "Karte einstellen" for a light card: the rows (⠿ symbol name ✕, a search for lamps, groups and switches), "Alle aus",
   * groups to open, in the grid or as a window (and then from "💡 n Lichter an"). draft: the card being set; ui: { field(label, ...nodes), preview() }
   */
  function fields(draft, ui) {
    draft.rows = cleanRows(draft.rows);
    const rows = make('div', 'sbRows lcEdRows');
    const draw = () => {
      rows.replaceChildren(...draft.rows.map((r) => {
        const el = make('div', 'sbRow'); el.dataset.key = r.e;
        const grip = make('span', 'dsGrip', '⠿'); grip.title = t('bd.drag');
        const icon = make('select', 'sbIconSel'); icon.setAttribute('aria-label', t('ob.icon'));
        icon.append(new Option(`${r.e.startsWith('switch.') ? '⏻' : '💡'} ${t('ob.iconAuto')}`, ''), ...[...new Set([...(r.icon && !ICONS.includes(r.icon) ? [r.icon] : []), ...ICONS])].map((x) => new Option(x, x)));
        icon.value = r.icon;
        icon.addEventListener('change', () => { draft.rows = draft.rows.map((x) => (x.e === r.e ? { ...x, icon: icon.value } : x)); ui.preview(); });
        const name = make('input', 'ceInput sbNameIn'); name.value = r.name; name.maxLength = 30; name.placeholder = ctx.nameOf(r.e) || r.e; name.setAttribute('aria-label', t('ce.name'));
        name.addEventListener('input', () => { draft.rows = draft.rows.map((x) => (x.e === r.e ? { ...x, name: name.value } : x)); ui.preview(); });
        const del = make('button', 'sbDel', '✕'); del.type = 'button'; del.title = t('sb.remove'); del.setAttribute('aria-label', del.title);
        del.addEventListener('click', () => { draft.rows = draft.rows.filter((x) => x.e !== r.e); draw(); found(); ui.preview(); });
        const group = membersOf(r.e, st(r.e)).length ? make('small', 'lcGroupTag', `▸ ${t('lc.group', { n: membersOf(r.e, st(r.e)).length })}`) : null;
        el.append(grip, icon, name, del, ...(group ? [group] : []), make('small', 'sbId', r.e));
        return el;
      }));
      if (!draft.rows.length) rows.append(make('p', 'tpSub', t('lc.empty')));
    };
    sortable(rows, '.dsGrip', (keys) => { const by = new Map(draft.rows.map((x) => [x.e, x])); draft.rows = keys.map((k) => by.get(k)).filter(Boolean); ui.preview(); });
    const q = make('input', 'ceSearch'); q.type = 'search'; q.placeholder = t('lc.search'); q.setAttribute('aria-label', t('lc.search'));
    const list = make('div', 'ceList');
    function found() {
      const words = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean), have = new Set(draft.rows.map((x) => x.e));
      const all = ctx.entities().filter((e) => fitsRow(e.entity_id) && !have.has(e.entity_id))
        .filter((e) => words.every((w) => `${e.name || ''} ${e.entity_id}`.toLowerCase().includes(w)))
        .sort((a, b) => Number(membersOf(b.entity_id, st(b.entity_id)).length > 0) - Number(membersOf(a.entity_id, st(a.entity_id)).length > 0)
          || (a.name || a.entity_id).localeCompare(b.name || b.entity_id));
      list.replaceChildren(...all.slice(0, SHOW).map((e) => {
        const n = membersOf(e.entity_id, st(e.entity_id)).length;
        const b = make('button', 'ceItem'); b.type = 'button'; b.dataset.entity = e.entity_id; b.disabled = draft.rows.length >= MAX_ROWS;
        b.append(make('span', 'ceTick', '＋'), make('span', 'ceName', `${e.entity_id.startsWith('switch.') ? '⏻' : n ? '💡💡' : '💡'} ${e.name || e.entity_id}`),
          make('small', '', n ? `${t('lc.group', { n })} · ${e.entity_id}` : e.entity_id));
        b.addEventListener('click', () => { draft.rows = [...draft.rows, { e: e.entity_id, name: '', icon: '' }]; draw(); found(); ui.preview(); });
        return b;
      }));
      if (!all.length) list.append(make('p', 'tpSub', t('ce.none')));
    }
    q.addEventListener('input', found);
    draw(); found();
    ui.field(t('lc.rows', { n: MAX_ROWS }), rows);
    ui.field(t('lc.add'), q, list);
    const check = (key, label, then) => {
      const lab = make('label', 'sbOn'); const cb = make('input'); cb.type = 'checkbox'; cb.checked = !!draft[key]; cb.dataset.act = `lc-${key}`;
      cb.addEventListener('change', () => { draft[key] = cb.checked; then?.(); ui.preview(); });
      lab.append(cb, make('span', '', label));
      return lab;
    };
    ui.field(t('lc.options'), check('allOff', t('lc.optAllOff')), check('expand', t('lc.optExpand')));
    const hook = check('hook', t('lc.optHook')), hint = make('p', 'tpSub', t('lc.popupHint'));
    const showHook = () => { hook.hidden = !draft.popup; hint.hidden = !draft.popup; };
    const seg = make('div', 'ceSeg');
    [false, true].forEach((v) => {
      const b = make('button', draft.popup === v ? 'on' : '', t(v ? 'lc.asWindow' : 'lc.inGrid')); b.type = 'button'; b.dataset.popup = String(v);
      b.addEventListener('click', () => { draft.popup = v; seg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); showHook(); ui.preview(); });
      seg.append(b);
    });
    draft.popup = draft.popup === true;
    showHook();
    ui.field(t('lc.display'), seg, hook, hint);
  }
  return { render, sig, fields, open: openWindow, refresh };
}
