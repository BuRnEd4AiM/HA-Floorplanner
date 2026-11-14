/* Room card (5.10.0, docs/ideen-5.10 idea 3 + 4): the pieces roompanel.js puts together. The chips with the room's values, the tabs, the big
 * buttons of the small card on phones and its grip, the scene buttons, and the rows of the lights: the row is filled as far as the lamp is
 * bright in its colour, a tap switches it, dragging sideways sets the brightness (sent when the finger lets go, like the card
 * "Lichtsteuerung", lightslider.js), a long press or 🎨 unfolds colours, effects and scenes. The decisions: roomcard.js (tested). */
import { rowLook, statusOf, pctAt, rowCalls, DRAG_PX } from './lightslider.js';
import { HOLD_MS } from './buttonlook.js';
import { sceneIcon, shortName, sheetMove } from './roomcard.js';

const LIGHT_ICON = { strip: '✨', ledring: '✨', nanoleaf: '🔷', ledpanel: '🔷', lamp: '💡', light: '💡' };

/** ctx: t, states(), callService(entity, service, data), live (initLiveControls: detailsButton, lightControls, sceneButtons, scenesWith, nameOf) */
export function initRoomCardUi(ctx) {
  const { t } = ctx;
  const pending = new Map();                       // lamp -> { pct, until }: a brightness sent, shown until the lamp says it
  let dragging = false;                            // a finger drags a light's row (the card is not drawn again meanwhile)
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const button = (cls, text, onClick, title = '') => {
    const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title;
    b.addEventListener('click', (ev) => { ev.stopPropagation(); onClick(ev); });
    return b;
  };
  const send = (calls) => calls.forEach(([e, service, data]) => ctx.callService(e, service, data || undefined));
  const word = (s) => (s.key === 'pct' ? `${s.pct} %` : t(`lc.${s.key}`));

  /** the head: the room's symbol, its name, "27,0 m² · 💡 3 von 5 an", × (close) */
  function head(icon, name, sub, onClose) {
    const h = make('div', 'rp-head');
    const ic = make('span', 'rpIco', icon); ic.setAttribute('aria-hidden', 'true');
    const tx = make('div', 'rpTitle'); tx.append(make('b', '', name), make('small', 'sub', sub));
    h.append(ic, tx);
    if (onClose) { const x = button('rp-x', '×', onClose, t('rp.close')); x.setAttribute('aria-label', t('rp.close')); h.append(x); }
    return h;
  }
  /** the values as chips; a tap opens their tab (onTab(key)) */
  function chips(list, onTab) {
    const box = make('div', 'rpChips');
    list.forEach((c) => {
      const b = button(`rpChip ${c.tone || ''}`.trim(), '', () => onTab(c.tab));
      b.dataset.k = c.key;
      b.append(make('i', '', c.icon), document.createTextNode(c.key === 'open' ? t('rp.nOpen', { n: c.n }) : c.text));
      box.append(b);
    });
    return box;
  }
  /** the tabs: icon, name, badge; a red dot when windows are open */
  function tabs(list, cur, onTab) {
    const bar = make('div', 'rpTabs'); bar.setAttribute('role', 'tablist');
    list.forEach((x) => {
      const b = button(`rpTab${x.key === cur ? ' on' : ''}${x.alert ? ' alarm' : ''}`, '', () => onTab(x.key));
      b.dataset.tab = x.key; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(x.key === cur));
      b.append(make('i', '', x.icon), make('span', '', t(`rp.tab.${x.key}`)), make('small', '', x.badge));
      bar.append(b);
    });
    return bar;
  }
  /** the big buttons of the small card (phones): [{ key, icon, label, sub, on }] */
  function quick(list, onTap) {
    const box = make('div', 'rpQuick');
    list.forEach((q) => {
      const b = button(`rpQ${q.on ? ' on' : ''}`, '', () => onTap(q.key));
      b.dataset.q = q.key;
      b.append(make('i', '', q.icon), make('b', '', q.label), make('small', '', q.sub));
      box.append(b);
    });
    return box;
  }
  /** the grip on top of the sheet: pulled up = everything, pushed down = small again / closed, a tap toggles (act(move)) */
  function grip(box, full, act) {
    const g = make('div', 'rpGrip'); g.setAttribute('role', 'button'); g.tabIndex = 0;
    g.setAttribute('aria-label', t(full ? 'rp.less' : 'rp.more')); g.title = g.getAttribute('aria-label');
    g.append(make('i'));
    let y0 = null, id = null;
    g.addEventListener('pointerdown', (ev) => { y0 = ev.clientY; id = ev.pointerId; try { g.setPointerCapture(id); } catch { /* made-up pointer (tests) */ } });
    g.addEventListener('pointermove', (ev) => {
      if (ev.pointerId !== id || y0 === null) return;
      const dy = Math.max(-60, Math.min(240, ev.clientY - y0));
      box.style.transform = dy > 0 ? `translateY(${dy}px)` : '';
    });
    const end = (ev) => {
      if (ev.pointerId !== id || y0 === null) return;
      const dy = ev.clientY - y0; y0 = null; id = null; box.style.transform = '';
      const m = sheetMove(dy, full);
      if (m) act(m);
    };
    g.addEventListener('pointerup', end);
    g.addEventListener('pointercancel', () => { y0 = null; id = null; box.style.transform = ''; });
    g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); act('toggle'); } });
    return g;
  }
  /** the scenes and scripts of the room as buttons with a symbol, once each (#750: no date of the last time) */
  function scenes(ids, roomName) {
    if (!ids.length) return null;
    const row = make('div', 'rpScenes');
    ids.forEach((id) => {
      const name = ctx.live.nameOf(id) || id, script = id.startsWith('script.');
      const b = button('rpScene', '', () => { ctx.callService(id, 'turn_on'); b.classList.add('ran'); setTimeout(() => b.classList.remove('ran'), 1400); }, name);
      b.dataset.e = id;
      b.append(make('i', '', sceneIcon(name, script)), make('span', '', shortName(name, roomName)));
      row.append(b);
    });
    return row;
  }

  /** what a lamp shows: a brightness sent a moment ago wins until the lamp reports it */
  function shownPct(e, look) {
    const p = pending.get(e);
    if (!p) return null;
    if (Date.now() > p.until || (p.pct === 0 ? look.kind === 'off' : look.kind === 'on' && Math.abs(look.pct - p.pct) <= 2)) { pending.delete(e); return null; }
    return p.pct;
  }
  /**
   * One light: d { entity, name, type }, opened (its colours are unfolded), onMore() (unfold / fold them). Returns the row and, when
   * unfolded, the colours below it ([row] or [row, ctl]).
   */
  function lightRow(d, opened, onMore) {
    const e = d.entity, st = ctx.states()[e], look = rowLook(e, st), sent = shownPct(e, look);
    const pct = sent ?? look.pct, usable = look.kind === 'on' || look.kind === 'off', on = sent !== null ? sent > 0 : look.kind === 'on';
    const row = make('div', `row rpLight${on ? ' on' : ''}${look.dim ? ' dim' : ''}${usable ? '' : ' na'}`);
    row.dataset.e = e; row.style.setProperty('--lc', look.rgb.join(', ')); row.style.setProperty('--pct', `${on ? (look.dim ? pct : 100) : 0}%`);
    row.tabIndex = usable ? 0 : -1;
    row.setAttribute('role', look.dim ? 'slider' : 'switch');
    const name = d.name || d.entity, val = make('span', 'v', word(statusOf(look, sent)));
    row.setAttribute('aria-label', name);
    if (look.dim) { row.setAttribute('aria-valuemin', '0'); row.setAttribute('aria-valuemax', '100'); row.setAttribute('aria-valuenow', String(on ? pct : 0)); }
    else row.setAttribute('aria-checked', String(on));
    row.append(make('span', 'rpFill'), make('i', 'rpIc', LIGHT_ICON[d.type] || '💡'), make('span', 'n', name), val);
    const sw = make('label', 'sw'); sw.title = t('live.toggle');
    const cb = make('input'); cb.type = 'checkbox'; cb.checked = on; cb.disabled = !usable; cb.setAttribute('aria-label', `${name}: ${t('live.toggle')}`);
    cb.addEventListener('change', () => { pending.delete(e); send(rowCalls([e], ctx.states(), { on: cb.checked })); });
    sw.append(cb, make('span'));
    const more = button(`rp-more${opened ? ' on' : ''}`, '🎨', onMore, t('rp.lightMore'));
    row.append(sw, more);
    const mi = ctx.live.detailsButton(e, true);
    if (mi) row.append(mi);
    presses(row, e, look, usable, onMore, (p) => {             // while dragging: the fill and the words follow the finger
      row.style.setProperty('--pct', `${p}%`); row.setAttribute('aria-valuenow', String(p)); val.textContent = word(statusOf(look, p));
      row.classList.toggle('on', p > 0);
    });
    if (!opened) return [row];
    const ctl = make('div', 'rp-ctl');
    ctl.append(ctx.live.lightControls([e]));
    const sc = ctx.live.sceneButtons(ctx.live.scenesWith([e]), 'live.sceneWith'); if (sc) ctl.append(sc);
    return [row, ctl];
  }
  /** a tap switches, a long press unfolds the colours, sideways sets the brightness (a lamp that dims); up and down scroll the card */
  function presses(el, e, look, usable, hold, follow) {
    let id = null, x0 = 0, y0 = 0, mode = null, timer = 0, rect = null, pct = 0;
    const stop = () => { clearTimeout(timer); timer = 0; };
    const own = (ev) => !ev.target.closest('button, label, input, select, a');   // the switch, 🎨 and ⓘ do their own thing
    el.addEventListener('pointerdown', (ev) => {
      if (ev.button > 0 || id !== null || !own(ev)) return;
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
        mode = 'drag'; dragging = true; el.classList.add('dragging');
        try { el.setPointerCapture(id); } catch { /* a pointer the page made up (tests) */ }
      }
      if (mode !== 'drag') return;
      pct = pctAt(ev.clientX, rect.left, rect.width);
      follow(pct);
    });
    const end = (ev, cancel) => {
      if (ev.pointerId !== id) return;
      id = null; stop();
      if (mode === 'drag') {
        dragging = false; el.classList.remove('dragging');
        if (!cancel) { pending.set(e, { pct, until: Date.now() + 4000 }); send(rowCalls([e], ctx.states(), { pct })); }
      } else if (mode === null && !cancel && usable) {          // a tap
        pending.delete(e);
        send(rowCalls([e], ctx.states(), { on: look.kind !== 'on' }));
      }
      mode = null;
    };
    el.addEventListener('pointerup', (ev) => end(ev, false));
    el.addEventListener('pointercancel', (ev) => end(ev, true));
    el.addEventListener('contextmenu', (ev) => ev.preventDefault());     // a long touch: no menu of the browser
    el.addEventListener('keydown', (ev) => {                              // ← → in steps of 10 %, Enter / space switch
      if (!usable || ev.target !== el) return;
      if (look.dim && (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight')) {
        ev.preventDefault();
        const p = Math.max(0, Math.min(100, (pending.get(e)?.pct ?? look.pct) + (ev.key === 'ArrowRight' ? 10 : -10)));
        pending.set(e, { pct: p, until: Date.now() + 4000 }); follow(p); send(rowCalls([e], ctx.states(), { pct: p }));
      } else if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); send(rowCalls([e], ctx.states(), { on: look.kind !== 'on' })); }
    });
  }
  /** the sensors of the room as small tiles: name, value, ⓘ */
  function values(list) {
    const box = make('div', 'rpVals');
    list.forEach((d) => {
      const v = make('div', `rpVal${d.tone ? ` ${d.tone}` : ''}`); v.dataset.e = d.entity;
      v.append(make('span', 'n', d.name), make('b', 'v', d.value));
      const mi = ctx.live.detailsButton(d.entity, true);
      if (mi) v.append(mi);
      box.append(v);
    });
    return box;
  }
  return { head, chips, tabs, quick, grip, scenes, lightRow, values, make, button, busy: () => dragging };
}
