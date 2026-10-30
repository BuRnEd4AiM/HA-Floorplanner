/* Example pictures only (the owner, 2026-10-30, with a picture of 🔘 Knöpfe in the edit mode: "ich hätte gerne das man die dashboards so
 * machen kann das man die karte platzieren kann wo man will das sozusagen ein unsichtbares gitter im hintergrund ist wo den abstand und das
 * einrasten gewährt aber wenn ich will das eine karte unten rechts ist das ich die dann auch dort hin machen kann"): the page 🔘 Knöpfe of
 * the demo laid out on a fixed grid of 12 columns and rows of 40 px, each card at its own place with gaps, painted over the real page.
 * make_pictures.py injects it.
 *   mkFree.edit(true)   ✎ Bearbeiten: the grid shows as faint cells, "Haustür" is being dragged to the bottom right, its new place lights up
 *   mkFree.live()       the same page as everybody sees it: no grid, the cards where they were put */
(() => {
  const COLS = 12, ROW = 40, GAP = 14;
  // key: [column, width, row, height] in cells
  const AT = {
    c_wohnen: [1, 3, 1, 3], c_schlafen: [4, 3, 1, 3], c_heizung: [7, 2, 1, 4], c_kino: [11, 2, 1, 4],
    c_kueche: [1, 4, 4, 2], c_robo: [5, 2, 4, 2], c_nacht: [1, 6, 6, 3],
    c_fernseher: [1, 2, 9, 2], c_musik: [3, 2, 9, 2], c_lichtknopf: [5, 2, 9, 3],
    c_lichter: [7, 3, 6, 7], c_tuer: [10, 3, 11, 2],
  };
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const grid = () => document.querySelector('[data-page=p_knoepfe] .bdGrid');
  function css(extra = '') {
    const s = make('style');
    s.textContent = `
      [data-page=p_knoepfe] .bdGrid { grid-template-columns: repeat(${COLS}, minmax(0, 1fr)) !important; grid-auto-rows: ${ROW}px !important; gap: ${GAP}px !important;
        align-items: stretch !important; position: relative; }
      [data-page=p_knoepfe] .bdGrid > .bdItem { height: auto !important; min-height: 0 !important; overflow: hidden; z-index: 1; margin: 0 !important; }
      [data-page=p_knoepfe] .bdGrid > .bdItem .lcRows { overflow: hidden; }
      [data-page=p_knoepfe] .bdGrid > .bdAdd { display: none !important; }
      .mkCell { z-index: 0; border: 1px dashed color-mix(in srgb, var(--accent) 22%, transparent); border-radius: 8px; pointer-events: none; }
      .mkTarget { z-index: 0; border: 2px dashed var(--accent); border-radius: 16px; background: color-mix(in srgb, var(--accent) 22%, transparent); pointer-events: none; }
      .mkNote { position: fixed; right: 18px; top: 64px; z-index: 99; max-width: 360px; padding: 10px 14px; border-radius: 12px; background: #f5c542; color: #1b1300;
        font: 600 14px/1.4 system-ui, sans-serif; box-shadow: 0 6px 24px rgba(0,0,0,.4); }
      ${Object.entries(AT).map(([k, [c, w, r, h]]) => `[data-page=p_knoepfe] .bdGrid > .bdItem[data-key="${k}"] { grid-column: ${c} / span ${w} !important; grid-row: ${r} / span ${h} !important; }`).join('\n')}
      ${extra}`;
    document.head.append(s);
  }
  const note = (text) => { const n = make('div', 'mkNote', text); document.body.append(n); };
  function cells(rows) {
    const g = grid();
    for (let r = 1; r <= rows; r++) for (let c = 1; c <= COLS; c++) {
      const d = make('div', 'mkCell'); d.style.gridColumn = String(c); d.style.gridRow = String(r); g.prepend(d);
    }
  }
  const scrollTo = (sel) => { const el = document.querySelector(sel); el?.scrollIntoView({ block: 'start' }); document.querySelector('#tabPages')?.scrollBy(0, -10); };
  window.mkFree = {
    edit(drag) {
      css();
      cells(13);
      if (drag) {
        const t = make('div', 'mkTarget'); t.style.gridColumn = '10 / span 3'; t.style.gridRow = '11 / span 2'; grid().prepend(t);
        const door = document.querySelector('[data-page=p_knoepfe] .bdItem[data-key=c_tuer]');
        door.style.setProperty('grid-column', '10 / span 3', 'important'); door.style.setProperty('grid-row', '11 / span 2', 'important');
        door.classList.add('bdDragging'); door.style.transform = 'translate(-70px, -46px) rotate(-1.5deg)';
      }
      note('Beispielbild: beim Bearbeiten zeigt sich das Gitter (12 Spalten). Eine Karte rastet beim Loslassen dort ein, wo das blaue Feld leuchtet, auch ganz unten rechts. Lücken bleiben frei.');
      scrollTo('[data-page=p_knoepfe] .bdGrid');
    },
    live() {
      css();
      note('Beispielbild: so sieht die Seite danach aus. Das Gitter ist unsichtbar, die Karten bleiben genau dort, wo du sie hingesetzt hast.');
      scrollTo('[data-page=p_knoepfe] .bdGrid');
    },
  };
})();
