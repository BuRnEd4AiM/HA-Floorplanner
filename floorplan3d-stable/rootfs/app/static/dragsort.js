/* Rows of a list put in order by dragging their handle ⠿ (#597: the tiles of the scene bar, the rows of a light card): the row follows the
 * finger or the mouse, the others make room, let go: the new order. Only up and down; the rest of the row keeps its taps and its fields. */

/** the children of `list` with a data-key are dragged by their `handle` (a selector); done(keys) gets the keys in the new order */
export function sortable(list, handle, done) {
  list.addEventListener('pointerdown', (e) => {
    const grip = e.target.closest(handle), row = grip?.closest('[data-key]');
    if (!row || row.parentNode !== list || e.button > 0) return;
    e.preventDefault();
    const y0 = e.clientY, before = [...list.children].map((x) => x.dataset.key).join('|');
    let last = y0;
    row.classList.add('dsDragging');
    const move = (ev) => {                            // on the document: the row moves in the list, its handle would lose a captured pointer
      if (ev.pointerId !== e.pointerId) return;
      last = ev.clientY; row.style.transform = '';
      const others = [...list.children].filter((x) => x !== row && x.dataset.key);
      const next = others.find((x) => { const r = x.getBoundingClientRect(); return ev.clientY < r.top + r.height / 2; });
      if (next ? next.previousElementSibling !== row : list.lastElementChild !== row) {
        if (next) list.insertBefore(row, next); else list.append(row);
      }
      const r = row.getBoundingClientRect();
      row.style.transform = `translateY(${Math.max(-r.height, Math.min(r.height, last - (r.top + r.height / 2)))}px)`;
    };
    const up = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
      row.classList.remove('dsDragging'); row.style.transform = '';
      const keys = [...list.children].map((x) => x.dataset.key).filter(Boolean);
      if (keys.join('|') !== before) done(keys);
    };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
  });
}
