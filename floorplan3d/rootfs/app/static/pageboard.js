/* The cards of a page of the tab bar like a Home Assistant dashboard (#484): every page hands its cards with a key, the board puts them
 * in the order an admin chose, leaves out the hidden ones, adds the own cards (cardsui.js) and lays them out as a masonry grid (cards
 * of different heights close up). In the edit mode (✎ in the tab bar, editors only) every card has ⠿ to drag it, 👁 to hide it, an
 * own card ⚙ and 🗑, at the end "＋ Karte hinzufügen", at the top a strip with ＋ Karte, 🗂 Reiter, ↺ Wie am Anfang and ✓ Fertig.
 * Stored for everybody in settings.pageLayouts; the rules are in pagelayout.js (tested). */
import { arrange, withOrder, toggleHidden, dropCard, resetLayout, putCard, cleanLayout, rowSpan } from './pagelayout.js';

const ROW = 8, GAP = 14;

/** ctx: t, settings(), canEdit(), save() (store the settings), cards (cardsui.js), pageName(page), redraw(page) (the page draws itself
 *  again), addCard(page) / editCard(page, card) (cardeditor.js), editTabs() (tabedit.js), editOwnPage(page) (an own page's name, icon) */
export function initBoard(ctx) {
  const { t } = ctx;
  let editing = null;
  const shown = new Map();                           // page -> { box, own: Map(card id -> sig) }
  const ro = new WeakMap();                          // box -> its ResizeObserver
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on, title) => { const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', (e) => { e.stopPropagation(); on(e); }); return b; };
  const layoutOf = (page) => cleanLayout((ctx.settings().pageLayouts || {})[page]);

  function setLayout(page, l) {
    const all = { ...(ctx.settings().pageLayouts || {}) };
    if (l.order.length || l.hidden.length || l.cards.length) all[page] = cleanLayout(l); else delete all[page];
    ctx.settings().pageLayouts = all;
    ctx.save();
    ctx.redraw(page);
  }
  /** an own card added or changed (cardeditor.js) */
  const saveCard = (page, card) => setLayout(page, putCard(layoutOf(page), card));

  /* ---- the masonry grid: columns from the CSS grid, each card as many 8 px rows as it is high ---- */
  function columns(box) {
    const cols = getComputedStyle(box).gridTemplateColumns.split(' ').filter(Boolean).length;
    return Math.max(1, cols || 1);
  }
  function masonry(box) {
    const cols = columns(box);
    box.querySelectorAll(':scope > .bdItem, :scope > .bdAdd').forEach((it) => {
      const w = Number(it.dataset.w) || 1;
      it.style.gridColumn = w >= 4 ? '1 / -1' : `span ${Math.min(cols, w)}`;                 // 4: the whole row, however many columns
      it.style.gridRowEnd = `span ${rowSpan(it.getBoundingClientRect().height, ROW, GAP)}`;
    });
  }
  function watch(box) {
    let obs = ro.get(box);
    if (!obs) { obs = new ResizeObserver(() => requestAnimationFrame(() => masonry(box))); ro.set(box, obs); obs.observe(box); }
    box.querySelectorAll(':scope > .bdItem, :scope > .bdAdd').forEach((it) => obs.observe(it));
    masonry(box);
  }

  /* ---- a card in the grid, with its tools in the edit mode ---- */
  function tools(page, key, own, hidden) {
    const bar = make('div', 'bdTools');
    const grip = make('span', 'bdGrip', '⠿'); grip.title = t('bd.drag'); grip.setAttribute('role', 'button');
    grip.addEventListener('pointerdown', (e) => drag(e, page, grip.closest('.bdItem')));
    bar.append(grip);
    if (own) {
      bar.append(btn('bdTool', '⚙️', () => ctx.editCard(page, own), t('bd.cardSet')));
      bar.append(btn('bdTool', '🗑', () => { if (window.confirm(t('bd.delAsk'))) setLayout(page, dropCard(layoutOf(page), key)); }, t('bd.cardDel')));
    } else bar.append(btn(`bdTool${hidden ? ' off' : ''}`, '👁', () => setLayout(page, toggleHidden(layoutOf(page), key)), hidden ? t('bd.show') : t('bd.hide')));
    return bar;
  }
  function item(page, entry, builtin, edit) {
    const el = entry.own ? ctx.cards.render(entry.own) : builtin.el;
    el.classList.add('bdItem'); el.classList.toggle('bdEdit', edit); el.classList.toggle('bdOff', edit && entry.hidden);
    el.dataset.key = entry.key; el.dataset.w = String(entry.own ? entry.own.width : builtin.width || 1);
    el.querySelectorAll(':scope > .bdTools, :scope > .bdTag').forEach((x) => x.remove());
    if (edit) {
      el.append(tools(page, entry.key, entry.own, entry.hidden));
      if (entry.hidden) el.append(make('span', 'bdTag', t('bd.hidden')));
      else if (entry.own) el.append(make('span', 'bdTag own', t('bd.own')));
    }
    return el;
  }
  function strip(page) {
    const s = make('div', 'bdStrip');
    s.append(make('b', '', `✎ ${t('bd.editing', { page: ctx.pageName(page) })}`), make('span', 'bdSub', t('bd.help')));
    const add = btn('bdBtn', `＋ ${t('bd.addShort')}`, () => ctx.addCard(page)); add.dataset.act = 'add';
    const tabs = btn('bdBtn', `🗂 ${t('bd.tabs')}`, () => ctx.editTabs()); tabs.dataset.act = 'tabs';
    s.append(add, tabs);
    if (/^p_/.test(page)) { const own = btn('bdBtn', `⚙️ ${t('bd.page')}`, () => ctx.editOwnPage(page)); own.dataset.act = 'page'; s.append(own); }
    const reset = btn('bdBtn', `↺ ${t('bd.reset')}`, () => { if (window.confirm(t('bd.resetAsk'))) setLayout(page, resetLayout(layoutOf(page))); }); reset.dataset.act = 'reset';
    const done = btn('bdBtn primary', `✓ ${t('bd.done')}`, () => setEditing(null)); done.dataset.act = 'done';
    s.append(reset, done);
    return s;
  }

  /**
   * Put the cards of a page into box: items [{ key, el, width }] are the page's own cards in their natural order (a missing one is not
   * there now: no camera, no waste calendar ...); min: the narrowest column in px. Draws the edit mode's strip at the top of the page.
   */
  function fill(page, box, items, { min = 300 } = {}) {
    const edit = editing === page && ctx.canEdit();
    const byKey = new Map(items.filter((i) => i && i.el).map((i) => [i.key, i]));
    const entries = arrange([...byKey.keys()], layoutOf(page)).filter((e) => e.own || byKey.has(e.key)).filter((e) => edit || !e.hidden);
    box.classList.add('bdGrid'); box.style.setProperty('--bdMin', `${min}px`);
    const own = new Map();
    const els = entries.map((e) => { if (e.own) own.set(e.own.id, ctx.cards.sig(e.own)); return item(page, e, byKey.get(e.key), edit); });
    if (edit) { const a = btn('bdAdd', `＋ ${t('bd.add')}`, () => ctx.addCard(page)); a.dataset.w = '1'; els.push(a); }
    box.replaceChildren(...els);
    const sec = box.closest('.tabPage');
    sec?.querySelectorAll(':scope > .bdStrip').forEach((x) => x.remove());
    if (edit && sec) sec.prepend(strip(page));
    shown.set(page, { box, own, edit });
    watch(box);
  }
  /** after a change of the states: own cards whose states changed are drawn again (the page itself draws only what it shows) */
  function refresh(page) {
    const s = shown.get(page);
    if (!s || !s.box.isConnected) return;
    const l = layoutOf(page);
    let changed = false;
    l.cards.forEach((c) => {
      const old = s.box.querySelector(`:scope > [data-key="${c.id}"]`);
      const sig = ctx.cards.sig(c);
      if (!old || s.own.get(c.id) === sig) return;
      s.own.set(c.id, sig);
      const el = item(page, { key: c.id, own: c, hidden: l.hidden.includes(c.id) }, null, s.edit);
      old.replaceWith(el); changed = true;
    });
    if (changed) watch(s.box);
  }

  /* ---- dragging a card: it follows the finger, the others make room; let go: the order is stored ---- */
  function drag(e, page, el) {
    if (!el || e.button > 0) return;
    e.preventDefault();
    const box = el.parentNode, scroller = box.closest('#tabPages');
    const b0 = box.getBoundingClientRect(), off = { x: e.clientX - b0.left - el.offsetLeft, y: e.clientY - b0.top - el.offsetTop };
    el.classList.add('bdDragging');
    e.target.setPointerCapture?.(e.pointerId);
    let last = '';
    const follow = (ev) => {
      const b = box.getBoundingClientRect();
      el.style.transform = `translate(${ev.clientX - b.left - off.x - el.offsetLeft}px, ${ev.clientY - b.top - off.y - el.offsetTop}px)`;
    };
    const move = (ev) => {
      follow(ev);
      if (scroller) { const r = scroller.getBoundingClientRect(); if (ev.clientY < r.top + 50) scroller.scrollBy(0, -12); else if (ev.clientY > r.bottom - 50) scroller.scrollBy(0, 12); }
      el.style.pointerEvents = 'none';
      const over = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.bdItem');
      el.style.pointerEvents = '';
      if (!over || over === el || over.parentNode !== box) return;
      const r = over.getBoundingClientRect(), after = ev.clientX > r.left + r.width / 2;
      const key = `${over.dataset.key}|${after}`;
      if (key === last) return;
      last = key;
      if (after) over.after(el); else over.before(el);
      masonry(box); follow(ev);
    };
    const up = () => {
      document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
      el.style.transform = ''; el.classList.remove('bdDragging');
      const keys = [...box.querySelectorAll(':scope > .bdItem')].map((x) => x.dataset.key);
      setLayout(page, withOrder(layoutOf(page), keys));
    };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
  }

  function setEditing(page) {
    const was = editing;
    editing = page && ctx.canEdit() ? page : null;
    document.body.classList.toggle('bdEditing', !!editing);
    if (was && was !== editing) ctx.redraw(was);
    if (editing) ctx.redraw(editing);
    ctx.changed?.();
  }
  return {
    fill, refresh, saveCard, setEditing,
    editing: () => editing,
    toggle: (page) => setEditing(editing === page ? null : page),
    layout: layoutOf,
  };
}
