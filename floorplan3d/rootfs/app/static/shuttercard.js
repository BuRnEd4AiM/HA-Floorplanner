/* Shutter card (#335): what a tap on the ball of a window's roller shutter opens in the live mode, like Home Assistant's own dialog of a
 * cover: how far it is open in big letters, a tall slider that shows the curtain (drag it or tap where it should go), up / stop / down
 * beside it and quick positions under it, all at once without another tap. Only the shutter, not the window's contact. The rules (the
 * position under the finger, what shows while the cover is on its way) are in shutters.js (unit tests). */
import { ACTIONS, ACTION_LABEL } from './livecontrols.js';
import { sliderPosition, shownPosition, shutterCardText, SHUTTER_PRESETS, PENDING_MS } from './shutters.js';

const REST = 22;   // px of the curtain that always show at the top of the slider (rolled up, like the rest of the curtain in 3D)

/** ctx: t, live (initLiveControls: callService, detailsButton), states(), rerender() (draws the open card anew) */
export function initShutterCard(ctx) {
  const { t, live } = ctx;
  let sliding = false;         // the slider is held: a state update does not draw the card anew under the finger
  let pending = null;          // a position just chosen: { e, pos, at }, shows until the cover answers (shownPosition)
  let drawn = '';              // what the card shows: it is drawn anew only when that changes, not at every state update of the house
  const el = (tag, cls, txt) => { const x = document.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; };
  /** send the cover to pos (svc: set_cover_position, or open_cover / close_cover for all the way) and show it there at once */
  function go(e, pos, svc = 'set_cover_position') {
    pending = { e, pos, at: Date.now() };
    live.callService(e, svc, svc === 'set_cover_position' ? { position: pos } : undefined);
    ctx.rerender();
    setTimeout(() => { if (!sliding) ctx.rerender(); }, PENDING_MS + 50);   // the cover did not answer: back to its own position
  }
  /** the card of cover e in box; name: the window's own name ('' for none). Drawn anew only when what it shows changed: the house's states
   *  change every few seconds (power, temperatures), and a card drawn anew under the finger would lose the tap */
  function render(box, e, name) {
    const st = ctx.states()[e], dom = e.split('.')[0];
    const pend = pending?.e === e ? pending : null, pos = dom === 'cover' ? shownPosition(st, pend, Date.now()) : null;
    if (pend && (pos !== pend.pos || st?.position === pend.pos)) pending = null;   // the cover is there, or it did not answer in time
    const key = JSON.stringify([e, name, st?.state, st?.position, pos, t('shutter.title'), !!live.detailsButton(e)]);
    if (key === drawn && box.querySelector('.shutterMain')) return;
    drawn = key;
    const focused = box.contains(document.activeElement) ? document.activeElement.id : '';   // the slider keeps the focus (keys)
    box.innerHTML = '';
    build(box, e, name, st, dom, pos);
    if (focused) document.getElementById(focused)?.focus();
  }
  function build(box, e, name, st, dom, pos) {
    const head = el('div', 'title', `🪟 ${t('shutter.title')}${name ? ` · ${name}` : ''}`), mi = live.detailsButton(e);
    if (mi) head.append(mi);
    const big = el('div', 'shutterBig', shutterCardText(st, pos, t));
    box.append(head, el('div', 'sub', e), big);
    const main = el('div', 'shutterMain');
    if (pos != null) main.append(slider(e, pos, big, st));
    const acts = dom === 'cover' ? [['open_cover', 'shutter.up', '▲', 100], ['stop_cover', 'live.stop', '■', null], ['close_cover', 'shutter.down', '▼', 0]]
      : (ACTIONS[dom] || []).map((a) => [a, ACTION_LABEL[a], '', null]);
    const row = el('div', 'actions shutterActs');
    acts.forEach(([a, k, icon, to]) => {
      const b = el('button', null, icon ? `${icon} ${t(k)}` : t(k));
      b.addEventListener('click', () => {
        if (to != null && pos != null) { go(e, to, a); return; }
        pending = null;
        live.callService(e, a);
      });
      row.append(b);
    });
    if (acts.length) main.append(row);
    box.append(main);
    if (pos != null) {
      const pr = el('div', 'actions shutterPresets');
      SHUTTER_PRESETS.forEach((p) => {
        const b = el('button', p === pos ? 'on' : null, `${p} %`);
        b.addEventListener('click', () => go(e, p));
        pr.append(b);
      });
      box.append(pr);
    }
  }
  /** the tall slider: the curtain comes down from the top as far as the cover is closed; drag it, tap where it should go, or use the keys */
  function slider(e, pos, big, st) {
    const s = el('div', 'shutterSlider'), cur = el('div', 'curtain');
    s.id = 'shutterPos'; s.tabIndex = 0; s.title = t('shutter.pos');
    s.setAttribute('role', 'slider'); s.setAttribute('aria-label', t('shutter.pos')); s.setAttribute('aria-valuemin', '0'); s.setAttribute('aria-valuemax', '100');
    cur.append(el('i', 'grip'));
    s.append(cur);
    let at = pos;
    const show = (p, text) => {
      at = p;
      cur.style.height = `calc(${REST}px + (100% - ${REST}px) * ${(100 - p) / 100})`;
      s.setAttribute('aria-valuenow', String(p)); s.setAttribute('aria-valuetext', text);
    };
    show(pos, shutterCardText(st, pos, t));
    const drag = (ev) => {
      const r = s.getBoundingClientRect(), p = sliderPosition(ev.clientY, r.top, r.height, REST), text = shutterCardText(null, p, t);
      show(p, text); big.textContent = text;
    };
    s.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      sliding = true; s.classList.add('drag');
      try { s.setPointerCapture(ev.pointerId); } catch { /* an old browser: the moves outside the slider are missed */ }
      drag(ev);
    });
    s.addEventListener('pointermove', (ev) => { if (sliding) drag(ev); });
    s.addEventListener('pointerup', (ev) => {
      if (!sliding) return;
      drag(ev);
      sliding = false; s.classList.remove('drag');
      go(e, at);
    });
    s.addEventListener('pointercancel', () => { sliding = false; drawn = ''; ctx.rerender(); });   // nothing sent: back to where it is
    s.addEventListener('keydown', (ev) => {
      const step = { ArrowUp: 10, ArrowRight: 10, PageUp: 25, ArrowDown: -10, ArrowLeft: -10, PageDown: -25 }[ev.key];
      if (step == null) return;
      ev.preventDefault(); ev.stopPropagation();          // the keys move the shutter, not a selected thing
      go(e, Math.min(100, Math.max(0, at + step)));
    });
    return s;
  }
  return { render, busy: () => sliding, reset: () => { sliding = false; drawn = ''; } };
}
