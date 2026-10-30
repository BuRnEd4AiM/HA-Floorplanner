/* "Frei anordnen" on a page of the tab bar (the owner, 2026-10-30, pictures docs/ideen-4.48/): the cards on a grid of 12 columns where an
 * admin put them, gaps stay. In the edit mode the grid shows as faint cells; ⠿ drags a card to a cell (a blue field shows where it lands,
 * the cards it lands on make room below it), the corner ↘ makes it wider, narrower, higher or lower. A card lower than its content scrolls
 * (in the edit mode it is cut). A grid narrower than NARROW (a phone) shows the cards one under the other, top left to bottom right, and
 * nothing is dragged there. The rules are in freegrid.js (tested); pageboard.js hands the cards over (apply) and stores the places (save). */
import { ROW, GAP, NARROW, MAX_Y, arrangeFree, moveTo, sizeTo, readingOrder, colWidth, cellAt, spanOf, rowsFor, colsFor, fromScreen,
  packed, bottom } from './freegrid.js';

const EXTRA = 6;                                     // empty rows below the cards in the edit mode (room to put one lower)

/** ctx: save(page, places) (store the places of the cards shown, after a drag or a resize) */
export function initFreeGrid(ctx) {
  const boxes = new WeakMap();                       // box -> { page, edit, keys, stored, places, sizes: Map(key -> [w, h]) }
  let active = null;                                 // { box, places, target: [x, y, w, h] } while a card is dragged or sized
  const set = (el, k, v) => { if (el.style[k] !== v) el.style[k] = v; };
  const pad = (box) => { const s = getComputedStyle(box); return { l: parseFloat(s.paddingLeft) || 0, t: parseFloat(s.paddingTop) || 0, r: parseFloat(s.paddingRight) || 0 }; };
  const inner = (box) => { const p = pad(box); return Math.max(1, box.clientWidth - p.l - p.r); };
  const items = (box) => [...box.querySelectorAll(':scope > .bdItem, :scope > .bdAdd')];
  const narrow = (box) => inner(box) < NARROW;

  /** the size of a card that has no place yet: its width on the flowing grid, its height now (measured once in one row) */
  function sizeOf(st, el) {
    const key = el.dataset.key;
    if (st.sizes.has(key)) return st.sizes.get(key);
    const w = colsFor(el.dataset.w);
    set(el, 'gridColumn', `span ${w}`); set(el, 'gridRow', 'span 1');
    const size = [w, rowsFor(Math.max(el.scrollHeight, 60))];
    st.sizes.set(key, size);
    return size;
  }
  /** where everything goes now: the places of the cards shown (+ "＋ Karte" at the left below them in the edit mode) */
  function compute(box, st) {
    const els = new Map(items(box).filter((el) => el.classList.contains('bdItem')).map((el) => [el.dataset.key, el]));
    return arrangeFree(st.keys.filter((k) => els.has(k)), st.stored, (k) => sizeOf(st, els.get(k)));
  }
  /** the cards on their places (or one under the other on a phone), the faint grid and the blue field in the edit mode */
  function layout(box) {
    const st = boxes.get(box);
    if (!st || !box.isConnected) return;
    const small = narrow(box);
    box.classList.toggle('fgNarrow', small);
    box.classList.toggle('fgCells', st.edit && !small);
    if (!st.places) st.places = compute(box, st);
    const places = active?.box === box ? active.places : st.places;
    const order = readingOrder(places);
    const low = bottom(places);
    items(box).forEach((el) => {
      const p = el.classList.contains('bdAdd') ? [0, low, 3, 2] : places[el.dataset.key];
      if (!p) return;
      set(el, 'gridColumn', `${p[0] + 1} / span ${p[2]}`); set(el, 'gridRow', `${p[1] + 1} / span ${p[3]}`);
      set(el, 'order', String(el.classList.contains('bdAdd') ? order.length : order.indexOf(el.dataset.key)));
    });
    let target = box.querySelector(':scope > .fgTarget');
    if (active?.box === box && !small) {
      if (!target) { target = document.createElement('div'); target.className = 'fgTarget'; box.prepend(target); }
      const t = active.target;
      set(target, 'gridColumn', `${t[0] + 1} / span ${t[2]}`); set(target, 'gridRow', `${t[1] + 1} / span ${t[3]}`);
    } else target?.remove();
    const cw = colWidth(inner(box)), rows = low + (st.edit ? EXTRA + 2 : 0);
    if (box.style.getPropertyValue('--fgCol') !== `${cw}px`) box.style.setProperty('--fgCol', `${cw}px`);
    set(box, 'minHeight', st.edit && !small ? `${rows * (ROW + GAP) - GAP}px` : '');
  }

  /**
   * The cards of a page on the grid: box (its children are the cards, in the page's order, and "＋ Karte" in the edit mode), keys (the
   * cards shown, in the page's order), places (stored: freegrid.js cleanPlaces), moved: the children of box changed. Lays them out when
   * something changed (-> true; and again when the box changes size).
   */
  function apply(box, page, edit, keys, places, moved = true) {
    const was = boxes.get(box);
    const same = was && was.page === page && was.edit === edit && JSON.stringify([was.keys, was.stored]) === JSON.stringify([keys, places]);
    if (!same) boxes.set(box, { page, edit, keys, stored: places, places: null, sizes: was?.page === page ? was.sizes : new Map() });
    if (same && !moved) return false;
    layout(box);
    return true;
  }
  /** the places of the cards there now, to keep (with the stored places of cards not shown now: hidden ones keep theirs) */
  const keep = (st, places) => ({ ...st.stored, ...places });

  /* ---- dragging a card by ⠿ to another cell; the corner ↘ to another size ---- */
  function follow(el, ev, off) {
    el.style.transform = '';
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${ev.clientX - off.x - r.left}px, ${ev.clientY - off.y - r.top}px)`;
  }
  function track(box, el, cls, onMove, onUp) {
    const end = (ev) => {
      document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', end); document.removeEventListener('pointercancel', end);
      el.classList.remove(cls);
      onUp(ev.type === 'pointercancel');
    };
    el.classList.add(cls);
    document.addEventListener('pointermove', onMove); document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
  }
  /** ⠿ pressed on a card of a free page: true when this module drags it */
  function drag(e, el) {
    const box = el?.parentNode, st = box && boxes.get(box);
    if (!st || !st.edit || narrow(box) || e.button > 0) return false;
    e.preventDefault();
    e.target.setPointerCapture?.(e.pointerId);
    const start = st.places, key = el.dataset.key, r0 = el.getBoundingClientRect(), off = { x: e.clientX - r0.left, y: e.clientY - r0.top };
    const scroller = box.closest('#tabPages');
    active = { box, places: start, target: start[key] };
    let last = '';
    track(box, el, 'bdDragging', (ev) => {
      if (scroller) { const r = scroller.getBoundingClientRect(); if (ev.clientY < r.top + 50) scroller.scrollBy(0, -12); else if (ev.clientY > r.bottom - 50) scroller.scrollBy(0, 12); }
      const g = box.getBoundingClientRect(), p = pad(box), cw = colWidth(inner(box));
      const x = cellAt(ev.clientX - off.x - g.left - p.l, cw), y = Math.min(MAX_Y, Math.max(0, cellAt(ev.clientY - off.y - g.top - p.t, ROW)));
      if (`${x},${y}` !== last) {
        last = `${x},${y}`;
        active.places = moveTo(start, key, x, y); active.target = active.places[key];
        layout(box);
      }
      follow(el, ev, off);
    }, (cancel) => {
      el.style.transform = '';
      const places = active.places;
      active = null;
      if (cancel || JSON.stringify(places) === JSON.stringify(start)) { layout(box); return; }
      st.places = places; layout(box);
      ctx.save(st.page, keep(st, places));
    });
    return true;
  }
  /** the corner ↘ pressed on a card of a free page: true when this module sizes it */
  function resize(e, el) {
    const box = el?.parentNode, st = box && boxes.get(box);
    if (!st || !st.edit || narrow(box) || e.button > 0) return false;
    e.preventDefault(); e.stopPropagation();
    e.target.setPointerCapture?.(e.pointerId);
    const start = st.places, key = el.dataset.key, r0 = el.getBoundingClientRect();
    active = { box, places: start, target: start[key] };
    let last = '';
    track(box, el, 'bdSizing', (ev) => {
      const cw = colWidth(inner(box)), w = spanOf(ev.clientX - r0.left, cw), h = spanOf(ev.clientY - r0.top, ROW);
      if (`${w},${h}` === last) return;
      last = `${w},${h}`;
      active.places = sizeTo(start, key, w, h); active.target = active.places[key];
      layout(box);
    }, (cancel) => {
      const places = active.places;
      active = null;
      if (cancel || JSON.stringify(places) === JSON.stringify(start)) { layout(box); return; }
      st.places = places; layout(box);
      ctx.save(st.page, keep(st, places));
    });
    return true;
  }

  /**
   * "Frei anordnen" switched on: the places from where the cards of box stand now (in their sections too), so nothing jumps; on a phone
   * (all one under the other) side by side in the page's order instead, as wide as on the flowing grid
   */
  function measure(box) {
    const els = [...box.querySelectorAll('.bdItem')];
    if (narrow(box)) return packed(els.map((el) => ({ key: el.dataset.key, w: colsFor(el.dataset.w), h: rowsFor(el.getBoundingClientRect().height) })));
    const g = box.getBoundingClientRect(), p = pad(box);
    return fromScreen(els.map((el) => {
      const r = el.getBoundingClientRect();
      return { key: el.dataset.key, left: r.left - g.left - p.l, top: r.top - g.top - p.t, width: r.width, height: r.height };
    }), inner(box));
  }
  /** a box that is no grid of a free page any more */
  function leave(box) {
    if (!boxes.has(box)) return;
    boxes.delete(box);
    box.classList.remove('fgGrid', 'fgNarrow', 'fgCells');
    box.style.minHeight = ''; box.style.removeProperty('--fgCol');
    box.querySelector(':scope > .fgTarget')?.remove();
    items(box).forEach((el) => { el.style.gridRow = ''; el.style.order = ''; el.style.gridColumn = ''; });
  }
  return { apply, layout, drag, resize, measure, leave };
}
