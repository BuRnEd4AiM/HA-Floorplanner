/* The cards of a page of the tab bar like a Home Assistant dashboard (#484): every page hands its cards with a key, the board puts them
 * in the order an admin chose, leaves out the hidden ones, adds the own cards (cardsui.js) and lays them out as a masonry grid (cards
 * of different heights close up). In the edit mode (✎ in the tab bar, editors only) every card has ⠿ to drag it, 👁 to hide it, an
 * own card ⚙ and 🗑, the corner ↘ to make it wider or narrower (#495), at the end "＋ Karte hinzufügen", at the top a strip with
 * ＋ Karte, ＋ Abschnitt, 🗂 Reiter, ↺ Wie am Anfang and ✓ Fertig. A hidden card is gone in the edit mode too: it stands in the row
 * "👁 Ausgeblendet" under the strip, a tap shows it again (#595, boardhidden.js). With sections (#495, sections.js, sectionsui.js) the cards in no section
 * stand above them and a card is dragged into a section and between them. Stored for everybody in settings.pageLayouts, or in an own
 * version of the page for some users (#507, settings.pageVariants: ctx.variants says which one, variantsui.js draws its strip under the
 * edit strip); the rules are in pagelayout.js, sections.js and pagevariants.js (tested). */
import { arrange, withOrder, keepUnseen, toggleHidden, dropCard, resetLayout, putCard, withSize, sizeOf, rowSpan } from './pagelayout.js';
import { groupEntries, fromScreen, withWidth, spanAt, newSectionId, addSection, editSection, dropSection, moveSection } from './sections.js';
import { initSectionsUi } from './sectionsui.js';
import { layoutIn, withLayoutIn } from './pagevariants.js';
import { cardName, hiddenRow } from './boardhidden.js';

const ROW = 8, GAP = 14;

/** ctx: t, settings(), canEdit(), save() (store the settings), cards (cardsui.js), pageName(page), redraw(page) (the page draws itself
 *  again), addCard(page) / editCard(page, card) (cardeditor.js), editTabs() (tabedit.js), editOwnPage(page) (an own page's name, icon),
 *  variants (variantsui.js, #507: shown(page, edit) the version of the page to show, bar(page) its strip in the edit mode, done(page)) */
export function initBoard(ctx) {
  const { t } = ctx;
  let editing = null;
  const shown = new Map();                           // page -> { box, keep: Map(key -> { sig, el }), edit, all: [every key there now, hidden too] }
  const ro = new WeakMap();                          // box -> its ResizeObserver
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (cls, text, on, title) => { const b = make('button', cls, text); b.type = 'button'; if (title) b.title = title; b.addEventListener('click', (e) => { e.stopPropagation(); on(e); }); return b; };
  /** the version of a page shown now (#507): the one edited in the edit mode, else the one of who is looking; '' = "Für alle" */
  const versionOf = (page) => ctx.variants?.shown(page, editing === page && ctx.canEdit()) || '';
  const layoutOf = (page) => layoutIn(ctx.settings(), page, versionOf(page));

  function setLayout(page, l) {
    Object.assign(ctx.settings(), withLayoutIn(ctx.settings(), page, versionOf(page), l));
    ctx.save();
    ctx.redraw(page);
  }
  /** an own card added or changed (cardeditor.js) */
  const saveCard = (page, card) => setLayout(page, putCard(layoutOf(page), card));
  /* sections (#495): moved, taken away, named */
  const withSections = (page, fn) => { const l = layoutOf(page); setLayout(page, { ...l, sections: fn(l.sections) }); };
  const secUi = initSectionsUi({ t, edit: {
    move: (page, id, by) => withSections(page, (l) => moveSection(l, id, by)),
    drop: (page, id) => withSections(page, (l) => dropSection(l, id)),
    save: (page, id, v) => withSections(page, (l) => editSection(l, id, v)),
  } });
  function newSection(page) {
    const l = layoutOf(page), id = newSectionId(l.sections.map((x) => x.id));
    withSections(page, (secs) => addSection(secs, id, t('sec.new', { n: secs.length + 1 })));
    const made = layoutOf(page).sections.find((x) => x.id === id);
    if (made) secUi.open(page, made);
  }

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
  function tools(page, key, own, sized) {
    const bar = make('div', 'bdTools');
    const grip = make('span', 'bdGrip', '⠿'); grip.title = t('bd.drag'); grip.setAttribute('role', 'button');
    grip.addEventListener('pointerdown', (e) => drag(e, page, grip.closest('.bdItem')));
    bar.append(grip);
    if (own) {
      bar.append(btn('bdTool', '⚙️', () => ctx.editCard(page, own), t('bd.cardSet')));
      bar.append(btn('bdTool', '🗑', () => { if (window.confirm(t('bd.delAsk'))) setLayout(page, dropCard(layoutOf(page), key)); }, t('bd.cardDel')));
    } else {
      if (sized) {                                   // a card that can be big or small (a thermostat, #495): ⤡ makes it small, ⤢ big again
        const small = sizeOf(layoutOf(page), key, sized) === 'small';
        const b = btn('bdTool', small ? '⤢' : '⤡', () => setLayout(page, withSize(layoutOf(page), key, small ? 'big' : 'small')), small ? t('bd.bigger') : t('bd.smaller'));
        b.dataset.act = 'size'; bar.append(b);
      }
      const hide = btn('bdTool', '👁', () => setLayout(page, toggleHidden(layoutOf(page), key)), t('bd.hide')); hide.dataset.act = 'hide';
      bar.append(hide);
    }
    return bar;
  }
  function item(page, entry, builtin, edit, same = null, widths = {}) {
    const el = same || (entry.own ? ctx.cards.render(entry.own) : builtin.el);
    el.classList.add('bdItem'); el.classList.toggle('bdEdit', edit);
    el.dataset.key = entry.key; el.dataset.w = String(entry.own ? entry.own.width : widths[entry.key] || builtin.width || 1);   // a width an admin dragged (#495)
    el.querySelectorAll(':scope > .bdTools, :scope > .bdTag, :scope > .bdResize').forEach((x) => x.remove());
    if (edit) {
      const corner = make('span', 'bdResize'); corner.title = t('bd.resize'); corner.setAttribute('role', 'button');
      corner.addEventListener('pointerdown', (e) => resize(e, page, el, entry.own));
      el.append(corner);
      el.append(tools(page, entry.key, entry.own, builtin?.sized));
      if (entry.own) el.append(make('span', 'bdTag own', t('bd.own')));
    }
    return el;
  }
  function strip(page) {
    const s = make('div', 'bdStrip');
    s.append(make('b', '', `✎ ${t('bd.editing', { page: ctx.pageName(page) })}`), make('span', 'bdSub', t('bd.help')));
    const add = btn('bdBtn', `＋ ${t('bd.addShort')}`, () => ctx.addCard(page)); add.dataset.act = 'add';
    const sec = btn('bdBtn', `＋ ${t('bd.addSection')}`, () => newSection(page)); sec.dataset.act = 'addSection';
    const tabs = btn('bdBtn', `🗂 ${t('bd.tabs')}`, () => ctx.editTabs()); tabs.dataset.act = 'tabs';
    s.append(add, sec, tabs);
    if (/^p_/.test(page)) { const own = btn('bdBtn', `⚙️ ${t('bd.page')}`, () => ctx.editOwnPage(page)); own.dataset.act = 'page'; s.append(own); }
    const reset = btn('bdBtn', `↺ ${t('bd.reset')}`, () => { if (window.confirm(t('bd.resetAsk'))) setLayout(page, resetLayout(layoutOf(page))); }); reset.dataset.act = 'reset';
    const done = btn('bdBtn primary', `✓ ${t('bd.done')}`, () => setEditing(null)); done.dataset.act = 'done';
    s.append(reset, done);
    return s;
  }

  /**
   * Put the cards of a page into box: items [{ key, el, width, name }] are the page's own cards in their natural order (a missing one is
   * not there now: no camera, no waste calendar ...; name: what the row "Ausgeblendet" calls it when the card has no heading, #595);
   * instead of el an item can bring { sig, make }: make() draws it (null: nothing to show),
   * only when its sig changed since the last fill of the same box; sized: the card can be big or small ('big' | 'small': its first
   * size, #495). min: the narrowest column in px. Draws the edit mode's strip at the top of the page.
   */
  function fill(page, box, items, { min = 300 } = {}) {
    const edit = editing === page && ctx.canEdit(), before = shown.get(page), kept = before?.box === box ? before.keep : new Map();
    const lay = layoutOf(page);
    /* a card of the page with a sig that has not changed keeps its element (made with `make` only when it is new or changed, #494) */
    const byKey = new Map();
    items.filter(Boolean).forEach((i) => {
      const old = i.sig !== undefined ? kept.get(i.key) : null;
      const el = old && old.sig === i.sig ? old.el : i.make ? i.make() : i.el;
      if (el) byKey.set(i.key, { ...i, el });
    });
    const all = arrange([...byKey.keys()], lay).filter((e) => e.own || byKey.has(e.key));
    const entries = all.filter((e) => !e.hidden);   // a hidden card is gone in the edit mode too, it is in the row "Ausgeblendet" (#595)
    const keep = new Map();
    const els = entries.map((e) => {
      const sig = e.own ? ctx.cards.sig(e.own) : byKey.get(e.key).sig, old = e.own ? kept.get(e.key) : null;
      const el = item(page, e, byKey.get(e.key), edit, old && old.sig === sig ? old.el : null, lay.widths);
      keep.set(e.key, { sig, el });
      return el;
    });
    all.forEach((e) => { if (e.hidden && !e.own) keep.set(e.key, { sig: byKey.get(e.key).sig, el: byKey.get(e.key).el }); });   // not made again while unchanged
    const add = edit ? btn('bdAdd', `＋ ${t('bd.add')}`, () => ctx.addCard(page)) : null;
    if (add) add.dataset.w = '1';
    const sec = box.closest('.tabPage');
    const showStrip = () => {
      sec?.querySelectorAll(':scope > .bdStrip, :scope > .pvBar, :scope > .bdHidden').forEach((x) => x.remove());
      /* under the strip the versions of the page (#507) and the hidden cards (#595) */
      if (edit && sec) sec.prepend(strip(page), ...(ctx.variants ? [ctx.variants.bar(page)] : []), hiddenOf(page, all.filter((e) => e.hidden), byKey));
    };
    shown.set(page, { box, keep, edit, all: all.map((e) => e.key) });
    if (lay.sections.length) {                       // with sections (#495): the cards in no section above, then the sections
      box.classList.remove('bdGrid'); box.classList.add('bdSecRoot');
      const g = groupEntries(entries, lay.sections), f = secUi.frame(page, box, lay.sections, edit, min);
      const lists = [[f.free, [...g.free.map((e) => keep.get(e.key).el), ...(add ? [add] : [])]], ...g.sections.map((x) => [f.grids.get(x.id), x.entries.map((e) => keep.get(e.key).el)])];
      lists.forEach(([grid, list]) => {
        const same = !f.fresh && !edit && !before?.edit && list.length === grid.children.length && list.every((x, i) => grid.children[i] === x);
        if (same) return;
        const gone = [...grid.children].filter((x) => !list.includes(x));
        place(grid, list); watch(grid, gone);
      });
      f.free.hidden = !f.free.children.length;
      if (f.fresh || edit || before?.edit) showStrip();
      return;
    }
    box.classList.remove('bdSecRoot'); box.classList.add('bdGrid');
    if (add) els.push(add);
    const gone = [...box.children].filter((x) => !els.includes(x));
    const same = !edit && !before?.edit && before?.box === box && box.style.getPropertyValue('--bdMin') === `${min}px` && els.length === box.children.length && els.every((x, i) => box.children[i] === x);
    if (same) return;                                // nothing new: no layout at all (a card that grows is measured by the observer)
    box.style.setProperty('--bdMin', `${min}px`);
    place(box, els);
    showStrip();
    watch(box, gone);
  }
  /** the row "👁 Ausgeblendet" (#595): the hidden cards there now by name, a tap shows one again */
  function hiddenOf(page, off, byKey) {
    const list = off.map((e) => ({ key: e.key, name: cardName(t, e.key, byKey.get(e.key), e.own) }));
    return hiddenRow({ t, list,
      show: (key) => { const l = layoutOf(page); if (l.hidden.includes(key)) setLayout(page, toggleHidden(l, key)); },
      showAll: () => { const keys = new Set(list.map((x) => x.key)), l = layoutOf(page); setLayout(page, { ...l, hidden: l.hidden.filter((k) => !keys.has(k)) }); } });
  }
  /** after a change of the states: own cards whose states changed are drawn again (the page itself draws only what it shows) */
  function refresh(page) {
    const s = shown.get(page);
    if (!s || !s.box.isConnected) return;
    const l = layoutOf(page);
    const touched = new Map();                       // grid -> the elements that left it
    l.cards.forEach((c) => {
      const was = s.keep.get(c.id), sig = ctx.cards.sig(c);
      if (!was || !was.el.isConnected || was.sig === sig) return;
      const el = item(page, { key: c.id, own: c }, null, s.edit, null, l.widths);
      s.keep.set(c.id, { sig, el });
      const grid = was.el.parentNode;
      was.el.replaceWith(el);
      touched.set(grid, [...(touched.get(grid) || []), was.el]);
    });
    touched.forEach((gone, grid) => watch(grid, gone));
  }

  /* ---- dragging a card: it follows the finger, the others make room (also in another section, #495); let go: the order is stored ---- */
  function drag(e, page, el) {
    if (!el || e.button > 0) return;
    e.preventDefault();
    const root = el.closest('.bdSecRoot') || el.parentNode, scroller = root.closest('#tabPages'), sectioned = root.classList.contains('bdSecRoot');
    const r0 = el.getBoundingClientRect(), off = { x: e.clientX - r0.left, y: e.clientY - r0.top };
    el.classList.add('bdDragging');
    e.target.setPointerCapture?.(e.pointerId);
    let last = '';
    const follow = (ev) => {
      el.style.transform = '';
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${ev.clientX - off.x - r.left}px, ${ev.clientY - off.y - r.top}px)`;
    };
    const move = (ev) => {
      follow(ev);
      if (scroller) { const r = scroller.getBoundingClientRect(); if (ev.clientY < r.top + 50) scroller.scrollBy(0, -12); else if (ev.clientY > r.bottom - 50) scroller.scrollBy(0, 12); }
      el.style.pointerEvents = 'none';
      const at = document.elementFromPoint(ev.clientX, ev.clientY);
      el.style.pointerEvents = '';
      const over = at?.closest('.bdItem'), grid = at?.closest('.bdGrid');
      const from = el.parentNode;
      if (over && over !== el && root.contains(over)) {
        const r = over.getBoundingClientRect(), after = ev.clientX > r.left + r.width / 2;
        const key = `${over.dataset.key}|${after}`;
        if (key === last) return;
        last = key;
        if (after) over.after(el); else over.before(el);
      } else if (sectioned && grid && root.contains(grid) && grid !== from && !over) {   // the empty part of another section: at its end
        const key = `grid|${grid.dataset.section || 'free'}`;
        if (key === last) return;
        last = key;
        grid.insertBefore(el, grid.querySelector(':scope > .bdAdd'));
      } else return;
      masonry(el.parentNode); if (from !== el.parentNode) masonry(from);
      follow(ev);
    };
    const up = () => {
      document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
      el.style.transform = ''; el.classList.remove('bdDragging');
      const keysOf = (grid) => [...grid.querySelectorAll(':scope > .bdItem')].map((x) => x.dataset.key);
      const l = layoutOf(page), before = shown.get(page)?.all || [], off = new Set(l.hidden);
      /* the hidden cards are not on the screen (#595): they keep their place in the order and in their section */
      if (!sectioned) { setLayout(page, withOrder(l, keepUnseen(before, keysOf(root)))); return; }
      const free = keysOf(root.querySelector('.bdFree')), secs = {};
      root.querySelectorAll('.bdSecGrid').forEach((g) => {
        const here = keysOf(g), was = l.sections.find((x) => x.id === g.dataset.section)?.keys || [];
        secs[g.dataset.section] = keepUnseen(was.filter((k) => off.has(k) || here.includes(k)), here);
      });
      setLayout(page, { ...withOrder(l, keepUnseen(before, [...free, ...Object.values(secs).flat()])), sections: fromScreen(l.sections, { free, sections: secs }) });
    };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
  }
  /* ---- the corner ↘ of a card in the edit mode: drag it to make the card wider or narrower (#495) ---- */
  function resize(e, page, el, own) {
    if (e.button > 0) return;
    e.preventDefault(); e.stopPropagation();
    const grid = el.parentNode, cols = columns(grid), colW = (grid.clientWidth - (cols - 1) * GAP) / cols, left = el.getBoundingClientRect().left;
    e.target.setPointerCapture?.(e.pointerId);
    el.classList.add('bdSizing');
    let span = Number(el.dataset.w) || 1;
    const move = (ev) => {
      const n = spanAt(ev.clientX - left, colW, GAP, cols);
      if (n === span) return;
      span = n; el.dataset.w = String(n); masonry(grid);
    };
    const up = () => {
      document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
      el.classList.remove('bdSizing');
      const w = span >= cols && cols < 4 ? cols : span;
      if (own) saveCard(page, { ...own, width: w });
      else { const l = layoutOf(page); setLayout(page, { ...l, widths: withWidth(l.widths, el.dataset.key, w) }); }
    };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
  }

  function setEditing(page) {
    const was = editing;
    editing = page && ctx.canEdit() ? page : null;
    if (was && was !== editing) ctx.variants?.done(was);          // the next edit mode starts with the version one sees (#507)
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
    /** the keys of the built-in cards of a page as last drawn (a new version "Leer" hides them, #507) */
    keys: (page) => (shown.get(page)?.all || []).filter((k) => !/^c_/.test(k)),
    /** the size an admin chose for a built-in card ('big' | 'small'), dflt when none (#495) */
    size: (page, key, dflt = 'big') => sizeOf(layoutOf(page), key, dflt),
  };
}
