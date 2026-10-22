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
  /** all widths first, then all heights read at once, then the rows: the browser lays the page out twice, not once per card (#494) */
  function masonry(box) {
    const cols = columns(box), its = [...box.querySelectorAll(':scope > .bdItem, :scope > .bdAdd')];
    const set = (it, k, v) => { if (it.style[k] !== v) it.style[k] = v; };
    its.forEach((it) => { const w = Number(it.dataset.w) || 1; set(it, 'gridColumn', w >= 4 ? '1 / -1' : `span ${Math.min(cols, w)}`); });   // 4: the whole row, however many columns
    its.map((it) => rowSpan(it.getBoundingClientRect().height, ROW, GAP)).forEach((n, i) => set(its[i], 'gridRowEnd', `span ${n}`));
  }
  function watch(box, gone = []) {
    let obs = ro.get(box);
    if (!obs) { obs = new ResizeObserver(() => requestAnimationFrame(() => masonry(box))); ro.set(box, obs); obs.observe(box); }
    gone.forEach((it) => obs.unobserve(it));
    box.querySelectorAll(':scope > .bdItem, :scope > .bdAdd').forEach((it) => obs.observe(it));
    masonry(box);
  }
  /** the children of box become els, in this order; what is already in its place stays (no new layout for an unchanged page) */
  function place(box, els) {
    els.forEach((el, i) => { if (box.children[i] !== el) box.insertBefore(el, box.children[i] || null); });
    while (box.children.length > els.length) box.lastElementChild.remove();
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
  function item(page, entry, builtin, edit, same = null) {
    const el = same || (entry.own ? ctx.cards.render(entry.own) : builtin.el);
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
   * there now: no camera, no waste calendar ...); instead of el an item can bring { sig, make }: make() draws it (null: nothing to show),
   * only when its sig changed since the last fill of the same box. min: the narrowest column in px. Draws the edit mode's strip at the
   * top of the page.
   */
  function fill(page, box, items, { min = 300 } = {}) {
    const edit = editing === page && ctx.canEdit(), before = shown.get(page), kept = before?.box === box ? before.keep : new Map();
    /* a card of the page with a sig that has not changed keeps its element (made with `make` only when it is new or changed, #494) */
    const byKey = new Map();
    items.filter(Boolean).forEach((i) => {
      const old = i.sig !== undefined ? kept.get(i.key) : null;
      const el = old && old.sig === i.sig ? old.el : i.make ? i.make() : i.el;
      if (el) byKey.set(i.key, { ...i, el });
    });
    const entries = arrange([...byKey.keys()], layoutOf(page)).filter((e) => e.own || byKey.has(e.key)).filter((e) => edit || !e.hidden);
    box.classList.add('bdGrid');
    const keep = new Map();
    const els = entries.map((e) => {
      const sig = e.own ? ctx.cards.sig(e.own) : byKey.get(e.key).sig, old = e.own ? kept.get(e.key) : null;
      const el = item(page, e, byKey.get(e.key), edit, old && old.sig === sig ? old.el : null);
      keep.set(e.key, { sig, el });
      return el;
    });
    if (edit) { const a = btn('bdAdd', `＋ ${t('bd.add')}`, () => ctx.addCard(page)); a.dataset.w = '1'; els.push(a); }
    const gone = [...box.children].filter((x) => !els.includes(x));
    const same = !edit && !before?.edit && before?.box === box && box.style.getPropertyValue('--bdMin') === `${min}px` && els.length === box.children.length && els.every((x, i) => box.children[i] === x);
    shown.set(page, { box, keep, edit });
    if (same) return;                                // nothing new: no layout at all (a card that grows is measured by the observer)
    box.style.setProperty('--bdMin', `${min}px`);
    place(box, els);
    const sec = box.closest('.tabPage');
    sec?.querySelectorAll(':scope > .bdStrip').forEach((x) => x.remove());
    if (edit && sec) sec.prepend(strip(page));
    watch(box, gone);
  }
  /** after a change of the states: own cards whose states changed are drawn again (the page itself draws only what it shows) */
  function refresh(page) {
    const s = shown.get(page);
    if (!s || !s.box.isConnected) return;
    const l = layoutOf(page);
    const gone = [];
    l.cards.forEach((c) => {
      const was = s.keep.get(c.id), sig = ctx.cards.sig(c);
      if (!was || !was.el.isConnected || was.sig === sig) return;
      const el = item(page, { key: c.id, own: c, hidden: l.hidden.includes(c.id) }, null, s.edit);
      s.keep.set(c.id, { sig, el });
      was.el.replaceWith(el); gone.push(was.el);
    });
    if (gone.length) watch(s.box, gone);
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
